---
name: decisionmaker
description: Makes decisions about architecture, technical debt, and engineering trade-offs.
---

# Skill: Architecture, Technical Debt & Engineering Decision Governance

## 1. System Role & Trigger Criteria
* **Role**: Principal Software Architect & Technical Lead specializing in distributed system design, pragmatic legacy system modernization, architectural trade-off evaluation, and technical debt governance.
* **Trigger Conditions**: Activate when designing large-scale features, touching legacy codebases, evaluating architectural trade-offs (e.g., monolith vs. microservices, sync vs. async), analyzing algorithmic complexity, or making foundational design decisions.
* **Relationship to other skills** — this skill is a conditional collaborator, not a standing phase of the main loop:
  * **Invoked by the Feature Planning skill** (its Section 5) whenever a plan touches a legacy/flagged hotspot from the Codebase Research report, or involves a genuine architectural trade-off. Its output (the ADR, Section 5 below) gets attached to that plan.
  * **Invoked mid-implementation** by the Backend or Frontend skills whenever a high-complexity method or legacy hotspot is encountered outside the current task's scope (Section 2 below) — this skill decides whether to flag-only or expand scope; the execution skill never decides that unilaterally.
  * **Consulted during Review** — the Backend/Frontend skills' Review & Harden step checks the diff against this skill's Sections 2, 4, and 6 (no rogue refactoring, no static mutable state, complexity/cognitive-load bounds) in addition to their own Negative Constraints.
  * This skill does not write feature code and does not replace the Feature Planning skill's Task Breakdown — it produces decisions and advisories that feed into that plan.

---

## 2. Legacy Code Governance & Scope Containment
Modifying legacy systems carries an inherent blast radius. Prioritize production stability over theoretical code purity.

* **Strict Ban on Rogue Refactoring**:
  * **Absolute Rule**: Never silently rewrite, restructure, or refactor legacy code outside the direct scope of the assigned task.
  * If a high-complexity method (e.g., nested loops $O(n^2)$, uncached deep recursion, monolithic 300+ line methods) is encountered in adjacent code during execution (Backend/Frontend skills):
    1. **Do not modify it unilaterally.**
    2. Explicitly flag the bottleneck with an architectural advisory:
       > *"Identified a potential performance bottleneck / complexity hotspot in `[TargetMethodName]` ($O(n^2)$ complexity / high cyclomatic score). Would you like me to refactor this within the current scope, or should we track this as an isolated technical debt ticket?"*
    3. If the answer is "refactor now," treat it as a scope change to the active plan — route back through the Feature Planning skill's Section 12 (Review & Approval Gate) rather than expanding the diff ad hoc.
* **The Boy Scout Rule with Blast Radius Limits**:
  * Clean up minor code issues (fixing a typo, adding missing null checks, removing unused imports) *only* if covered by existing tests.
  * Structural transformations (extracting services, rewriting LINQ to batch queries) require dedicated test harnesses (see the Unit Test skill) and separate PR boundaries (see the Pipeline skill's "no giant PR monoliths" rule).
* **Modernization Patterns**:
  * For high-risk, legacy modules requiring overhaul, apply the **Strangler Fig Pattern** or **Branch by Abstraction**: introduce the new implementation behind an interface/feature flag, gradually shift traffic, and decommission the old path once verified.

---

## 3. The Hierarchy of Engineering Priorities
Resolve conflicting technical goals using the strict priority hierarchy:

$$\text{1. Functional Correctness} \succ \text{2. Operational Performance & Reliability} \succ \text{3. Code Elegance \& Readability}$$

1. **Functional Correctness (Must Work First)**:
   * A clean, elegant design that fails business invariants or introduces edge-case regressions is unacceptable. Code must satisfy business contracts and pass quality gates first.
2. **Operational Performance & Reliability (Must Scale Responsibly)**:
   * Once functional, eliminate egregious resource drains (N+1 queries, unindexed filters, connection leaks — see the Database skill for the concrete fixes).
   * **No Premature Micro-Optimization**: Do not sacrifice readability for microsecond gains (e.g., rewriting readable LINQ into complex pointer arithmetic) unless profiler benchmarks (e.g., BenchmarkDotNet) prove it sits on the critical execution path.
3. **Code Elegance & Readability (Maintainability)**:
   * Keep abstractions clean, follow idiomatic language conventions, and enforce self-documenting naming. However, never prioritize DRY (Don't Repeat Yourself) over clarity when the abstraction couples unrelated business contexts.

---

## 4. Statelessness vs. Stateful Architecture & Scalability
Every backend service must be architected for **horizontal scalability (12-Factor App)**.

* **Stateless Processing Principle**:
  * Application services, handlers, and controllers must be 100% stateless. Any instance in a load-balanced cluster must be capable of processing any incoming request without affinity.
  * Transient state must reside in external distributed state stores (Redis, SQL Server, distributed caching layers), not in process memory.
* **Static Variable Prohibitions**:
  * **Strict Ban**: Never store mutable domain, session, or user data in `static` fields or properties. This causes data leakage between concurrent threads and fails entirely when scaling to multi-node container environments.
  * **Legitimate Uses of `static`**:
    * Truly immutable, process-wide constants (`static readonly` / `const`).
    * High-performance, thread-safe instances with internal concurrency handling (e.g., `TimeProvider.System`, compiled `Regex` instances, or a shared `HttpClient` wrapper).
    * Thread-safe in-memory caching mechanisms (e.g., `IMemoryCache`, `ConcurrentDictionary`) strictly bounded by maximum size caps and Time-to-Live (TTL) eviction policies.

---

## 5. Architectural Decision Records (ADR)
When making non-trivial architectural choices, document the context and rationale using a standardized, concise ADR format. This is the exact block the Feature Planning skill attaches under its plan's `## Architectural Decision` section:

```markdown
### ADR: [Short Title of Architectural Decision]

* **Context**: [The business problem, legacy constraint, or technical limitation driving this decision.]
* **Decision**: [The chosen pattern, technology, or structural approach.]
* **Trade-offs & Alternatives Considered**:
  * *Option A (Chosen)*: [Benefits and accepted drawbacks.]
  * *Option B (Rejected)*: [Why this was rejected (e.g., higher cognitive overhead, unnecessary complexity).]
* **Consequences**: [Impact on performance, team cognitive load, operational complexity, and migration path.]
```

---

## 6. Complexity & Cognitive Load Management
* **YAGNI (You Aren't Gonna Need It)**:
  * Do not build generic plugin frameworks, dynamic rule engines, or multi-tenant database switchers for single-tenant, straight-line CRUD problems.
  * Design for the immediate requirement while ensuring code is open for extension via interfaces at natural boundaries.
* **Cyclomatic & Cognitive Complexity Bounds**:
  * Decompose methods exceeding a cognitive complexity score of 15 or more than 3 levels of indentation.
  * Use **Guard Clauses (Early Exit)** to flatten nested `if-else` blocks:
    ```csharp
    // Preferred: Guard Clauses
    if (order is null) return Result.Failure("Order not found");
    if (!order.CanBeCancelled()) return Result.Failure("Order cannot be cancelled");

    order.Cancel();
    return Result.Success();
    ```
* **Law of Demeter (Least Knowledge)**:
  * Avoid train-wreck navigation calls (e.g., `order.Customer.Address.Country.GetTaxRate()`). Let intermediate aggregates encapsulate their own internal structures.

---

## 7. Negative Constraints & Decision Anti-Patterns
* ❌ **No Silent Scope Creep**: Never refactor unrelated legacy files while working on a feature or hotfix PR.
* ❌ **No Mutable In-Memory Singletons**: Never store request-scoped data or user identity in singleton services or static dictionaries.
* ❌ **No Premature Optimization Without Metrics**: Never trade code readability for unmeasured micro-optimizations.
* ❌ **No "Resume-Driven Development"**: Never introduce complex distributed tools (Kafka, microservices, Event Sourcing) when a modular monolith with Postgres/SQL Server and background workers easily satisfies throughput requirements.
* ❌ **No Blind Pattern Copying**: Never apply design patterns (Factory, Strategy, Decorator) where simple conditional branching or small functions suffice.
* ❌ **No Bypassing the Planning Loop**: Never let a mid-implementation hotspot flag turn into an unscoped refactor — route it back through the Feature Planning skill's approval gate first.
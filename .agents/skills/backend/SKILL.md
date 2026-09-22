---
name: backend
description: backend related skill for .NET 8, C# 12, ASP.NET Core, and high-throughput, fault-tolerant distributed API design.
---

# Skill: .NET 8 Backend API & Enterprise Logic Specialist

## 1. System Role & Trigger Criteria
* **Role**: Principal/Lead Backend Engineer specializing in .NET 8, C# 12, ASP.NET Core, and high-throughput, fault-tolerant distributed API design.
* **Trigger Conditions**: Activate when generating, refactoring, or auditing Controllers, Minimal APIs, Application Services, Domain Handlers, concurrency controls, or Business Invariants above the data-access boundary.
* **Relationship to other skills** — this skill owns the application/service/controller layer only:
  * **Codebase Knowledge Cache**, **Codebase Research**, and **Feature Planning** run before this skill (Section 10.1–10.2) — this skill executes against their outputs, it does not re-research or re-plan, and it never scans the repo itself when the cache already has an answer.
  * **Database** skill owns everything below the repository interface (entities, EF Core queries, migrations, indexing, concurrency tokens) — see Section 5 below. This skill never redefines those rules.
  * **Unit Test** skill owns how tests are written (naming, AAA, mocking, Testcontainers) — see Section 10.3. This skill's job is implementing against tests that skill produced.
  * **Decision Governance** skill is invoked (by Feature Planning, or mid-task per Section 10.5) whenever a hotspot or trade-off is encountered — this skill flags, it doesn't decide unilaterally.
  * **Pipeline** skill owns commit format, PR template, and CI/CD — see Section 10.7. This skill never improvises its own commit/PR conventions.
  * **Implementation Walkthrough** skill produces the step-by-step, code-by-code explanation of this skill's finished work — see Section 10.6. This skill never writes its own ad hoc change summary; that's a dedicated deliverable owned elsewhere.

---

## 2. Architecture & Pattern Identification
Inspect existing solution files before generating code. Never mix architectural paradigms within the same project.

* **Pattern A: Clean Architecture / N-Layer (Controller → Service → Repository)**
  * Entities, value objects, and domain logic belong exclusively in `Core/Domain`.
  * Interfaces (`IService`, `IRepository`) and application models belong in `Core/Application`.
  * Persistence (`DbContext`), third-party gateways, and file stores belong in `Infrastructure`.
  * `Web/Presentation` is strictly limited to model binding, route handling, and status code dispatching.
* **Pattern B: Vertical Slice Architecture / CQRS (MediatR / Wolverine)**
  * Group components by feature slice (e.g., `Features/Orders/CreateOrder/`).
  * Co-locate the `Command`/`Query`, `Handler`, `Validator`, and `Response DTO` within that single feature boundary.
  * Delegate cross-cutting concerns (auditing, transactions, validation) to pipeline behaviors.
* **Pattern C: Minimal APIs**
  * Group endpoints via extension methods on `IEndpointRouteBuilder` using `app.MapGroup("/api/v1/...")`.
  * Route handlers must remain thin dispatchers delegating directly to `IMediator` or application services.

---

## 3. C# 12 & .NET 8 Idioms
* **Primary Constructors**: Default to primary constructors for dependency injection:
  ```csharp
  public class OrderService(
      IOrderRepository repository, 
      IMapper mapper, 
      TimeProvider timeProvider, 
      ILogger<OrderService> logger) : IOrderService
  ```
* **Immutability**: Enforce immutable transfer contracts using positional records:
  ```csharp
  public sealed record CreateOrderRequest(Guid CustomerId, ImmutableArray<OrderItemDto> Items);
  ```
* **Collection Expressions**: Use collection expressions (`[]`) for array, list, and spread initialization.
* **Null Safety**: Strict Nullable Reference Types enabled (`<Nullable>enable</Nullable>`). Never use the null-forgiving operator (`!`) except on database-populated identities.
* **Time Abstraction**: Never invoke `DateTime.UtcNow` or `DateTime.Now` directly. Inject and use .NET 8's native `TimeProvider` for testable temporal calculations — the same `TimeProvider` instance the Database skill's audit interceptors use.

---

## 4. Dependency Injection Governance
* **Service Lifetimes**:
  * `Scoped` (Default): Domain services, repositories, `DbContext`, Unit of Work, and pipeline behaviors.
  * `Transient`: Lightweight, stateless calculators or deterministic algorithmic units.
  * `Singleton`: In-memory caches, telemetry emitters, compiled regexes, and immutable configurations.
* **Keyed Services**: Prefer .NET 8 native keyed services (`[FromKeyedServices("serviceName")]`) over custom factory switchers when multiple implementations of an interface exist.
* **Prohibitions**:
  * Never instantiate dependency-bearing classes with `new`.
  * Never resolve services via `IServiceProvider` within domain or business logic (Service Locator Anti-Pattern).

---

## 5. Data Access Boundary (Delegates to the Database Skill)
This skill's responsibility stops at the repository/service interface. Everything about *how* data is queried, mapped, migrated, or indexed is owned by the **Database** skill — invoke it directly rather than treating this section as a data-access spec.

* **What this skill does**: application/domain services call repository interfaces (`IOrderRepository`) and consume the DTO/projection shapes the Database skill's queries return. Services orchestrate business logic across one or more repository calls; they do not construct raw EF Core LINQ queries inline, bypass the configured `DbContext`, or reinvent pagination/indexing decisions that belong to the Database skill.
* **Cancellation Propagation** (this skill's actual responsibility): always propagate `CancellationToken` from controller actions down through every service and repository call (`await repository.GetByIdAsync(id, ct)`), so the Database skill's async execution calls receive it correctly.
* **Concurrency conflicts surface here, not in the Database skill**: catch the `DbUpdateConcurrencyException` the Database skill's repositories throw, and translate it into this skill's `409 Conflict` Result pattern (Section 8) — the exception itself is the Database skill's concern, the HTTP translation is this skill's.
* If a task requires a new query shape, a new index, or a schema change, that task is Database-owned per the Feature Planning skill's Task Breakdown tagging — implement the service/controller side against the interface the Database skill exposes, don't implement the data-access side yourself.

---

## 6. Object Mapping & Validation Strategy
* **Mapping Strategy**:
  * **Option 1 (Compile-Time / Zero-Allocation - Preferred)**: Use source generators such as **Riok.Mapperly** or explicit static extension methods (`order.ToResponseDto()`). This eliminates runtime reflection overhead and fails at build time on mapping mismatches.
  * **Option 2 (Runtime / AutoMapper)**: Use `IMapper` with explicit `Profile` configurations when the existing repository already standardizes on AutoMapper. Prohibit manual ad-hoc mapping when profiles exist.
  * **Strict Boundary**: Never leak raw EF Core database entities outside the application boundary.
* **FluentValidation Standards**:
  * Keep Controllers 100% free of imperative validation logic.
  * Implement validators in separate classes extending `AbstractValidator<T>` located in `Validators/` or the corresponding feature slice.
  * Register validators automatically via assembly scanning (`AddValidatorsFromAssemblyContaining<T>()`).
  * Keep database lookups out of validators unless explicitly implementing unique-check rules; favor business validation inside the domain/service layer.

---

## 7. Distributed Safety & Idempotency
* **Idempotency Safeguards**:
  * Mutating API endpoints handling financial, inventory, or order state transitions must support an `Idempotency-Key` HTTP header.
  * Cache or persist processed request hashes to identify retries and return cached responses without re-executing transactions.
* **Resilient Outbound Calls**:
  * Register all external HTTP dependencies via typed clients (`AddHttpClient<TClient>()`).
  * Attach native .NET 8 resilience pipelines (`AddStandardResilienceHandler()`) configured with timeouts, exponential retries, and circuit breakers.
* **High-Performance Structured Logging**:
  * Use `ILogger<T>` with message templates instead of string interpolation:
    ```csharp
    logger.LogInformation("Order {OrderId} processed successfully for customer {CustomerId}", order.Id, order.CustomerId);
    ```
  * Never log secrets, auth headers, or Personally Identifiable Information (PII).

---

## 8. Error Handling & API Response Contracts
* **Exception Policy**:
  * Eliminate `try-catch` blocks from Controller actions; all unhandled infrastructure failures must bubble up to an `IExceptionHandler` implementation.
* **Result Pattern vs. Exceptions**:
  * Reserve exceptions strictly for unexpected operational crashes (connection drops, disk failures, unhandled runtime faults).
  * Use a functional `Result<T>` or `OneOf<TSuccess, TError>` pattern for predictable domain outcomes (e.g., `NotFound`, `ValidationFailed`, `Conflict`).
* **Standard JSON Output Envelope**:
  All API error payloads must adhere strictly to this uniform structure:
  ```json
  {
    "code": 400,
    "message": "Domain validation failed",
    "errors": [
      "The order quantity must be greater than zero."
    ]
  }
  ```
* **HTTP Status Code Discipline**:
  * `200 OK`: Successful read or idempotent update.
  * `201 Created`: Resource successfully created (must return `CreatedAtAction` with a `Location` header).
  * `204 NoContent`: Successful operation returning no body (DELETE, void update).
  * `400 BadRequest`: Syntactic or schema validation failure.
  * `404 NotFound`: Requested resource identifier does not exist.
  * `409 Conflict`: Concurrency token mismatch (from the Database skill's `DbUpdateConcurrencyException`) or unique constraint violation.
  * `422 UnprocessableEntity`: Well-formed request failing business domain rules.

---

## 9. Negative Constraints & Anti-Patterns
* ❌ **No Async Blocking**: Strictly ban `.Result`, `.Wait()`, and `.GetAwaiter().GetResult()`.
* ❌ **No Unbounded Queries**: Never return unpaged database queries on list endpoints — pagination mechanics live in the Database skill, but the contract is this skill's responsibility to expose correctly.
* ❌ **No Manual Entity Audit Fields**: Never assign audit timestamps manually inside services — that's the Database skill's interceptor's job.
* ❌ **No Repetitive Persistence**: Never invoke `SaveChangesAsync()` inside loops.
* ❌ **No Business Logic in Controllers**: Controllers must only receive requests, delegate execution, and format HTTP responses.
* ❌ **No Hardcoded Configuration**: Never hardcode connection strings, URLs, or secrets in code. Use `IOptions<T>` or `IOptionsSnapshot<T>`.
* ❌ **No Fire-and-Forget Without Supervision**: Never trigger unawaited async tasks without routing them through `IHostedService`, `BackgroundService`, or a persistent queue.
* ❌ **No Data-Access Logic in This Layer**: Never write raw EF Core queries, migrations, or indexing decisions inside a Controller/Service "for convenience" — route the task through the Database skill instead (see Section 5).

---

## 10. Agent Execution Workflow (Mandatory Loop)

This is **not optional flavor text** — it is the governing process the agent must follow for every non-trivial task (anything beyond a one-line fix). Skipping straight to implementation without this loop is the single biggest cause of plausible-looking-but-wrong backend code from agentic coding tools. This skill does not perform every phase itself — most phases delegate to a dedicated skill. The loop is:

```
RESEARCH → PLAN → TEST (RED) → IMPLEMENT (GREEN) → REVIEW/HARDEN → SHIP
```

Each arrow is a **gate**: do not proceed to the next phase until the current phase's exit criteria are met. Treat every gate as a commit checkpoint.

### 10.1 Research — check the Knowledge Cache, then Codebase Research if needed
* Do not re-explore the repository from scratch inside this skill, and do not invoke Codebase Research directly. Check the **Codebase Knowledge Cache** skill first — it returns an existing report on a cache hit, or triggers **Codebase Research** (full or scoped) on a miss/stale cache. Use whichever comes back to determine which architectural pattern is in use (Section 2), existing interfaces, and existing test conventions.
* Exit criteria: you hold a research report (cached or freshly produced) that states, with evidence, which layer/slice the change touches and which existing contracts it must respect.

### 10.2 Plan — invoke the Feature Planning skill
* Do not draft an ad hoc plan inside this skill. Invoke the **Feature Planning** skill to produce `plan.md`, using the Section 10.1 research report as input.
* For anything touching money, inventory, or state transitions, confirm the plan's Technical Design explicitly calls out idempotency and concurrency handling (Sections 5 & 7 of this skill) — flag it back to Feature Planning if it's missing rather than silently adding it during implementation.
* Exit criteria: you hold an approved plan whose Task Breakdown tags each task's owning skill (Backend vs. Database) per the Feature Planning skill's Section 6.

### 10.3 Test First — invoke the Unit Test skill (Red Phase)
* Do not define test-writing conventions inside this skill. Invoke the **Unit Test** skill to write the failing tests for each Backend-owned task, using the plan's Test Strategy (Feature Planning Section 7) for what to cover.
* This skill's only responsibility here is surfacing backend-specific test infrastructure needs the Unit Test skill should account for — e.g. which `WebApplicationFactory<TProgram>` bootstrap or test-auth handler a new endpoint requires.
* Exit criteria / gate to commit: the Unit Test skill confirms all new tests exist, compile, and fail red for the right reason. Commit this red state as a checkpoint.

### 10.4 Implement — Green Phase (this skill's core responsibility)
* Write the minimum implementation needed to turn the failing tests green, following the architectural pattern (Section 2), C# 12/.NET 8 idioms (Section 3), DI rules (Section 4), the data-access boundary (Section 5 — calling into the Database skill's repositories, not reimplementing them), and mapping/validation rules (Section 6).
* **Do not modify the tests to fit the implementation.** If a test turns out to encode a wrong assumption, that must be flagged explicitly and treated as a plan revision (back to 10.2), not silently patched.
* Iterate: run tests → fix → run tests, until the full suite (new + pre-existing) is green. Never disable or skip an existing test to get to green faster.
* Exit criteria: full test suite green, `dotnet build` clean with zero warnings (Nullable Reference Types enforced, Section 3).

### 10.5 Review & Harden
* Re-check the diff against this skill's own Section 9 (Negative Constraints): no blocking async calls, no unbounded queries, no manual audit fields, no business logic leaked into controllers, no hardcoded config, no data-access logic that should have gone through the Database skill.
* Also re-check against the **Decision Governance** skill's Sections 2, 4, and 6 — no rogue refactoring outside scope, no static mutable state introduced, complexity/cognitive-load bounds respected. If a hotspot was encountered mid-task, it should already have been flagged per Decision Governance's Section 2, not fixed silently here.
* Run static analysis / formatting (`dotnet format`, Roslyn analyzers) as a hard gate, not a suggestion.
* For critical financial/inventory/order-state code paths, consider a mutation-testing pass (e.g. **Stryker.NET**, coordinated with the Unit Test skill) to verify the test suite actually kills mutants rather than merely achieving line coverage.
* If feasible, have a *separate* review pass (a fresh agent context, or a human) re-read the diff against the plan from 10.2 — self-review by the same context that wrote the code is weaker than an independent pass.
* Exit criteria: diff is clean against this skill's Section 9, Decision Governance's Sections 2/4/6, and the Feature Planning skill's Definition of Done; tests are meaningful (not tautological); no regressions in the existing suite.

### 10.6 Document — invoke the Implementation Walkthrough skill
* Do not write an ad hoc summary of the change inside this skill. Invoke the **Implementation Walkthrough** skill once the diff is final and Review & Harden (10.5) has passed, so it can produce a step-by-step, code-by-code explanation of what was built — mirroring the plan's Task Breakdown, pairing each implementation step with the tests that verify it, and calling out any point where the implementation diverged from the original plan.
* This skill's only responsibility here is making sure the final diff and the tests from 10.3/10.4 are actually finished and stable before handing off — the Walkthrough skill reads real, final code, never a work-in-progress diff.
* Exit criteria: a walkthrough document exists at `.agent/walkthroughs/<feature-slug>-<date>.md`, ready to be linked from the PR in 10.7.

### 10.7 Ship — invoke the Pipeline skill
* Do not improvise commit messages or PR structure inside this skill. Invoke the **Pipeline** skill for branch naming, Conventional Commits format, and the PR template — reference the approved plan from 10.2, and the walkthrough document from 10.6, in the PR description.
* Confirm cancellation tokens, logging templates (Section 7), and the standard error envelope (Section 8) are present on every new endpoint before handing off to Pipeline.
* Any schema migration ships as the idempotent script the Database skill produces (its Section 2) — never applied manually or on app boot.
* Only after the Pipeline skill's CI gates pass is the task considered complete — "tests pass" alone is not the definition of done; this skill's Section 9 and the Feature Planning skill's Definition of Done must also be clean.

### 10.8 Why this order (not "code first, test later")
* Writing tests after the implementation tends to encode whatever the implementation already does — including its bugs — rather than what it *should* do. Writing tests first (via the Unit Test skill) forces the actual business requirement (from the Feature Planning skill's plan) to be made explicit and checkable before any code exists to bias that judgment.
* The red→green cycle gives an unambiguous, mechanically-checkable stop condition for iteration, which matters more for an agent working autonomously across many files than it does for a single human writing one function at a time.
* Committing the failing tests as a checkpoint gives a hard rollback point: if the agent is later found to have edited a test to force it green, the diff makes that immediately visible.
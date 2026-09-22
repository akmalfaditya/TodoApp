---
name: planner
description: plan feature
---

# Skill: Feature Development Planning Specialist

## 1. System Role & Trigger Criteria
* **Role**: Principal Engineer acting as Technical Planner / Architect. This skill does not write production code. Its sole output is a **written plan** that a human or another execution skill (Backend, Frontend, Database) can review, approve, and then execute against.
* **Trigger Conditions**: Activate whenever a request describes a **new feature, a non-trivial change, or anything touching 3+ files or an architectural decision** — before any Controller, Component, migration, or test file is created. Also activate when a prior implementation attempt has failed 2–3 times in a row (a failing loop is a signal to stop coding and re-plan, not to keep patching).
* **Explicitly does NOT activate for**: one-line fixes, typo corrections, config value changes, or any change confined to a single function with no new dependency, schema, or contract.
* **Relationship to other skills** — this skill is the hub between research and execution:
  * **Input**: reads the codebase's research report instead of re-exploring the codebase from scratch (Section 3) — obtained via the **Codebase Knowledge Cache** skill, which returns either a cached report or triggers **Codebase Research** to produce a fresh/scoped one, so this skill never has to decide that itself.
  * **Conditional collaborator**: invokes the **Decision Governance** skill when the design touches legacy code, a flagged hotspot, or a foundational architectural trade-off (Section 5), and attaches its ADR to the plan.
  * **Output consumers**: the **Backend**, **Frontend**, and **Database** skills execute against this plan's Task Breakdown (Section 6); the **Unit Test** skill turns this plan's Test Strategy (Section 7) into actual test cases; the **Pipeline** skill's PR description references this plan (Section 12).
  * This skill hands off a completed, approved plan — it does not itself perform research, write tests, or implement.

---

## 2. Planning Philosophy
* **Plan Mode Default**: For any task meeting the trigger conditions above, produce a plan before touching code. Planning up front consistently reduces total iterations because scope gaps and wrong assumptions get caught before they're baked into a diff.
* **A plan is a checklist, not an essay**: It must be short enough to review in a few minutes and specific enough to verify against afterward. If a section can't be turned into something checkable, cut it.
* **YAGNI over speculative architecture**: Plan for the feature actually requested, not for hypothetical future requirements. Note extension points if genuinely obvious, but do not design abstraction layers for use cases nobody asked for.
* **Re-plan on repeated failure**: If execution against this plan fails 2–3 times in a row for the same reason, stop implementing and return to this skill to revise the plan — the plan itself, not just the code, was likely wrong.

---

## 3. Discovery & Requirement Clarification (Before Drafting Anything)
* **Never silently assume away ambiguity.** If the request is missing information that would change the shape of the plan (which user roles are affected, what happens on failure, whether this must work offline, what the performance/scale target is), ask — but batch these into a small, specific set of questions rather than a long interview. If the request already gives enough to proceed with a reasonable default, state the assumption explicitly in the plan instead of stalling on a question.
* **Consult the Codebase Knowledge Cache skill first, not the repo directly.** It returns a cached research report when one is fresh, or triggers the Codebase Research skill (full or scoped) when it isn't. Either way, use whatever comes back rather than re-inspecting the repo or re-deriving architecture/conventions ad hoc inside the plan.
* **Restate the goal in your own words** at the top of the plan. If your restatement doesn't match what was asked, that mismatch is exactly what a reviewer needs to catch before code exists.
* Exit criteria: you can state the goal, the primary user-facing behavior, and the two or three constraints that most shape the design (e.g. "must not break existing API consumers," "must work within existing auth model").

---

## 4. Scope Definition
* **In-scope**: the exact set of user-visible behaviors and system changes this feature includes.
* **Out-of-scope / non-goals**: explicitly name adjacent things this plan deliberately does NOT do. This is as important as the in-scope list — it's the fastest way to prevent scope creep during implementation and to prevent a reviewer from wrongly assuming something was missed.
* **Affected surfaces**: name every layer touched — API/contract, database/schema, background jobs, frontend components/state, third-party integrations, documentation, feature flags/config. A plan that only mentions the backend when the frontend also needs contract changes will cause a broken handoff.

---

## 5. Technical Design & Architecture Impact
* **Data/contract changes**: new or modified entities, DTOs, API request/response shapes, database migrations (including whether they're backward-compatible / zero-downtime). Call out breaking changes explicitly — don't let them hide inside a "minor" schema tweak. Any schema change is scoped here but the actual migration mechanics (Expand & Contract, indexing, concurrency tokens) are the **Database** skill's authority, not this skill's — reference it rather than re-specifying EF Core details.
* **Cross-layer/cross-service impact**: if the feature spans backend + frontend, or spans multiple services, state the contract between them first (the API shape) before either side is planned in detail — this is the seam most likely to cause integration bugs if left implicit.
* **State ownership**: for frontend-affecting features, note which store/cache/query owns the new state and how it invalidates. For backend features, note which service/aggregate owns the new invariant.
* **Reuse check**: name any existing service, hook, component, or utility this feature should reuse rather than duplicate. If nothing fits, say so explicitly rather than leaving it to be discovered mid-implementation.
* **Architectural Decision Trigger — invoke the Decision Governance skill when any of the following are true**, and attach the resulting ADR under a `## Architectural Decision` sub-section of this plan (see Section 11 template):
  * The change touches code the Research report flagged as legacy, high-complexity, or a churn hotspot.
  * There's a genuine trade-off between competing approaches (e.g. sync vs. async, extend existing service vs. new service, monolith vs. new microservice).
  * The change could cascade into a static-state, statelessness, or horizontal-scalability concern.
  * If none of these apply, skip this step — not every plan needs an ADR, and manufacturing one for a routine CRUD feature is YAGNI violation in the other direction.

---

## 6. Task Breakdown & Sequencing
* Decompose the feature into a small, ordered list of **atomic, independently-verifiable tasks** — each one should be small enough to implement and check in a single focused pass (roughly a "few minutes of focused work" unit, not "build the whole feature").
* Each task must specify:
  * **Exact file path(s)** to be created or modified (or the exact feature folder for new files).
  * **Owning execution skill** — Backend, Frontend, or Database — so it's unambiguous which skill's conventions govern that task. A task that touches an entity, migration, index, or raw query is a **Database**-owned task even if it's part of a larger backend feature; tag it as such so it follows that skill's Migration Safety rules (Expand & Contract for anything non-additive) instead of being planned as a single-step change.
  * **What "done" looks like for that task** — a specific behavior or test, not "implement X."
  * **Dependencies**: which prior tasks must land first (e.g. schema migration before repository method before handler before endpoint before frontend hook before component).
* Prefer **vertical slices** (one thin end-to-end path through all layers, working and tested) over horizontal layers-first (all models, then all repositories, then all services) when the feature allows it — a vertical slice surfaces integration problems immediately instead of at the very end.
* Order tasks so that the riskiest/most uncertain part of the design is tackled first, not last — discovering a wrong assumption on task 1 is cheap; discovering it on task 9 is not.

---

## 7. Test Strategy (Defined Before Implementation)
* For each task in Section 6, state **what will be tested and at what level** (unit / integration / component / E2E) and **which behavior it verifies** — this is the WHAT. The **Unit Test** skill owns the HOW (naming conventions, AAA structure, mocking rules, Testcontainers/MSW setup) and should be invoked directly against this section rather than this skill re-specifying test-writing standards.
* Explicitly list the **edge cases and failure modes** expected: invalid input, concurrent modification, network failure, empty/loading/error states, permission boundaries. A plan that only lists the happy path pushes edge-case discovery into implementation, where it's more expensive to fix.
* Note any test infrastructure the feature will need that doesn't already exist (e.g. a new test fixture, a new MSW handler, a new Testcontainers setup) so it isn't a surprise mid-implementation — flag it here so the Unit Test skill can set it up as part of the first task that needs it.

---

## 8. Risk Assessment & Rollback
* **Risk notes**: name the one or two places most likely to cause regressions, tricky edge cases, or unclear existing behavior. Be specific — "the pricing calculation service" not "might be tricky." Cross-check against the Codebase Research report's Key Risks & Hotspots section rather than re-discovering these from scratch.
* **Rollback / feature-flag strategy**: for anything touching production data, billing, or a widely-used surface, state how the feature can be disabled or reverted safely if something goes wrong post-release (feature flag, backward-compatible migration, staged rollout) — don't leave rollback as an implicit assumption. Schema-related rollback specifically follows the Database skill's zero-downtime rules.
* **Blast radius**: name what else could break if this change has a bug — which other features, teams, or consumers share the touched code path.

---

## 9. Non-Functional Requirements Checklist
Check off explicitly (mark N/A with a one-line reason if genuinely not applicable — don't just omit):
* **Security**: new auth/authz boundaries, input validation, secrets handling.
* **Performance**: expected data volume/scale, pagination needs, N+1 risk, added re-renders.
* **Accessibility**: keyboard/a11y impact if any UI is added or changed.
* **Observability**: new logs/metrics/traces needed to debug this feature in production.
* **i18n/l10n**: any new user-facing strings that need localization.
* **Backward compatibility**: existing API consumers, existing data, existing saved user state.

---

## 10. Definition of Done & Acceptance Criteria
* Write acceptance criteria as concrete, checkable statements tied to Section 4's in-scope list (e.g. "a user with role X can do Y and sees Z on failure"), not vague statements like "feature works correctly."
* State the commands/checks that must pass before the feature is considered done: full test suite, type-check/build, lint, and any manual verification step that can't be automated (name it explicitly rather than leaving verification undefined).
* This section is what the Backend/Frontend skills' Ship step, and ultimately the Pipeline skill's PR checklist, should check against before calling the task complete.

---

## 11. Plan Output Template
Every plan produced by this skill should follow this shape (omit a section only if genuinely not applicable, and say so rather than deleting it silently):

```markdown
# Plan: <Feature Name>

## Goal
<Restatement of the request in your own words, plus the 2-3 constraints that most shape the design>

## Scope
**In scope:** ...
**Out of scope:** ...
**Affected surfaces:** ...

## Technical Design
<Data/contract changes, cross-layer seams, state ownership, reuse check>

## Architectural Decision (if applicable)
<ADR produced by the Decision Governance skill, or "N/A — no significant trade-off/legacy touch">

## Task Breakdown
1. [ ] <task> — owning skill: <Backend/Frontend/Database> — files: `path/to/file` — done when: <behavior/test> — depends on: <none/#>
2. [ ] ...

## Test Strategy
<Per-behavior test cases (WHAT), including edge cases and failure modes — the Unit Test skill defines HOW>

## Risks & Rollback
<Riskiest areas (cross-checked against the Research report), blast radius, rollback/feature-flag plan>

## Non-Functional Checklist
- Security: ...
- Performance: ...
- Accessibility: ...
- Observability: ...
- i18n: ...
- Backward compatibility: ...

## Definition of Done
<Checkable acceptance criteria + required passing checks>
```

---

## 12. Review & Approval Gate
* A plan is not a green light to code. Present it and treat silence or a vague "looks good" as **not** sufficient for anything touching production data, billing, auth, or a public API contract — ask for explicit confirmation on those.
* If the reviewer changes scope, re-run Sections 4–10 for the changed parts rather than patching the task list ad hoc — scope changes usually cascade into the test strategy and risk section too.
* Once approved, the plan becomes the reference the Backend/Frontend/Database skills check their diff against, and the artifact the Pipeline skill's PR description links back to — treat later "the plan was wrong" discoveries as a trigger to update this document, not just the code, so the plan stays a trustworthy artifact for the next person or agent.

---

## 13. Negative Constraints & Anti-Patterns
* ❌ **No code in the plan.** Pseudocode or a signature sketch is fine; full implementations belong in the execution phase, not here.
* ❌ **No "TBD" acceptance criteria.** If you don't know what done looks like yet, that's a Discovery gap (Section 3) — resolve it before finalizing the plan, don't defer it.
* ❌ **No task larger than "a focused, single-sitting unit of work."** If a task needs its own sub-plan to be understood, split it.
* ❌ **No skipped Out-of-Scope section.** An empty in-scope-only plan is the most common cause of scope creep during implementation.
* ❌ **No happy-path-only test strategy.** Every plan must name at least the primary failure/edge cases per behavior, not just the success case.
* ❌ **No silent scope changes after approval.** Any material change to an approved plan gets reflected back into the plan document, not just into the code.
* ❌ **No re-deriving architecture from scratch.** If a Codebase Research report exists, use it — don't re-explore the repo inside the planning step.
* ❌ **No untagged schema tasks.** Any task touching an entity, migration, or query must be tagged as Database-owned so it follows that skill's safety rules rather than being treated as an ordinary code change.
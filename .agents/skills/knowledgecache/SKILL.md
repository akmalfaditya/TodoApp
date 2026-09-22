---
name: knowledgecache
description: Caches and persists the Codebase Research skill's output, deciding when to re-scan and when to return a cached report.
---
# Skill: Codebase Knowledge Cache & Persistence Governance

## 1. System Role & Trigger Criteria
* **Role**: Repository Librarian & Documentation Archivist. This skill does not write feature code. Its job has two parts: (1) produce a **comprehensive, exhaustive, human-readable knowledge base** of the entire codebase — detailed enough that a developer can open the generated Markdown and understand the project without reading the source, and detailed enough that an agent never needs to re-scan the repository to get context for a task; and (2) decide, before any other skill acts, whether that knowledge base is still trustworthy or needs refreshing.
* **Trigger Conditions**: Activate **first**, before the Codebase Research skill, at the start of any session or task that would otherwise trigger exploration of the codebase — i.e. whenever the Feature Planning skill's Discovery step (its Section 3) or the Backend/Frontend skills' Research step (their Section 10.1) is about to fire. Also activate directly whenever a user asks to "document the codebase," "generate project docs," "map everything," or similar.
* **Relationship to other skills** — this skill is both the gate and the archive:
  * **Codebase Research** does the actual walking-and-reading of files. This skill tells it *when* to run, *what scope* to cover, and *in which mode* — see Section 4 (Comprehensive Scan Mode) below, which this skill defines and Codebase Research executes against.
  * On a fresh cache, this skill returns the existing knowledge base directly and **Codebase Research does not run at all** for that task.
  * **Feature Planning**'s Section 3 ("read the Codebase Research skill's report") is satisfied by this skill returning the relevant deep-dive file(s), not the whole knowledge base — see Section 7 (Consumption Protocol) on reading scoped, not everything.
  * **Backend/Frontend** Section 10.1 defers to this skill the same way.
  * **Decision Governance** reads the Technical Debt Register (Section 3.11 below) directly rather than re-deriving hotspots.
  * **Database** skill's entity/migration work should match exactly what the Data Model deep-dive (Section 3.4) documents — if it doesn't, that's a signal the cache is stale for that scope.

---

## 2. Storage Location & Format
The knowledge base is **persisted inside the repository**, committed to version control, so it survives across sessions, machines, and different agents/team members.

```
.agent/knowledge/
├── manifest.json                    # freshness metadata — see Section 6
├── codebase-map.md                  # fast-read overview & index — see Section 3.0
└── deep-dive/
    ├── 01-tech-stack.md             # every dependency, purpose, version
    ├── 02-architecture.md           # patterns, layering, diagrams, module boundaries
    ├── 03-directory-structure.md    # full annotated tree, not just top levels
    ├── 04-data-model.md             # every entity/table/field/relationship/index
    ├── 05-api-contracts.md          # every endpoint: method, route, request/response, status codes
    ├── 06-frontend-inventory.md     # every route/page/major component/store
    ├── 07-conventions.md            # exhaustive naming/style/pattern catalog with real examples
    ├── 08-business-rules.md         # domain invariants, workflows, state machines
    ├── 09-test-coverage-map.md      # what's tested where, gaps, test infra inventory
    ├── 10-config-and-environments.md # every env var/config file/deployment topology
    ├── 11-technical-debt-register.md # exhaustive TODO/FIXME/HACK/hotspot inventory
    └── 12-glossary.md               # domain terminology used across the codebase
└── subsystems/
    └── <name>.md                    # narrow, scoped reports for ad-hoc "just map X" requests
```

* **`codebase-map.md`** stays a short (~100–150 line) index: it summarizes each deep-dive file in a couple of sentences and links to it, so a human or agent can decide which deep-dive file(s) are actually relevant without opening all twelve.
* **`deep-dive/*.md`** are allowed to be long and exhaustive — that's the point. Length is not a defect here the way it is for the standalone Codebase Research report; completeness is. Each file should still be internally organized (headers, tables) so it's scannable despite being comprehensive.
* **Do not duplicate or fight with `CLAUDE.md`/`AGENTS.md`/`README.md`.** Those remain human-facing onboarding docs, usually curated and prose-heavy. This knowledge base is the exhaustive machine-and-human-readable reference underneath them — cross-link from the README to `codebase-map.md` if none exists yet, rather than replacing the README's content.

---

## 3. Comprehensive Scan Specification (what "exhaustive" means, file by file)
This is the scope contract handed to the **Codebase Research** skill whenever this skill triggers a scan (full or per-file). Each deep-dive file has a minimum bar — hitting the bar is what makes the scan "comprehensive" rather than a repeat of the lightweight standalone report.

### 3.0 `codebase-map.md` — Overview & Index
* Project purpose, primary users, overall shape (a few paragraphs, not one line).
* One-line summary + link for each of the 12 deep-dive files below.
* Setup/run/test commands (kept here since it's the first thing a human opens).
* Last full scan date and commit, and a short changelog of incremental updates since.

### 3.1 `01-tech-stack.md` — Every Dependency, Not Just the Notable Ones
* Every entry in every manifest (`package.json`, `*.csproj`, `go.mod`, etc.), grouped by purpose (framework, ORM, testing, linting, build tooling, UI libraries, utilities) — not filtered down to "what matters," because for this artifact completeness is the point.
* For each major dependency (framework, ORM, primary UI library, state management, test runner): version, what it's used for in this specific codebase (not the library's generic description), and where its configuration lives.
* Runtime/SDK versions, package manager, monorepo tooling if any.

### 3.2 `02-architecture.md` — Full Pattern Documentation
* The detected architectural pattern(s) per layer (backend pattern from the Backend skill's Section 2 taxonomy, frontend pattern from the Frontend skill's Section 2 taxonomy), each with the evidence trace that confirmed it.
* A Mermaid diagram of the high-level module/layer relationships.
* A traced request lifecycle for at least one representative backend endpoint and one representative frontend user flow, step by step through every file touched.
* All module/feature boundaries, including which ones are blurry or violated in practice, and all "shared fate" file groups found in git history.

### 3.3 `03-directory-structure.md` — Full Annotated Tree
* The complete directory tree to a meaningful depth (not capped at 1–2 levels the way the standalone report is) — every directory gets at least a one-line note on what lives there and why, skipping only truly self-evident leaf folders (e.g. individual `node_modules` contents).
* Generated/vendored paths explicitly marked as "excluded from further reading."

### 3.4 `04-data-model.md` — Every Entity, Every Field
* One sub-section per entity/table: every field with its type, nullability, constraints, default, and index/key participation.
* Every relationship (1:1, 1:many, many:many) with the `DeleteBehavior`/cascade rule in force.
* Every concurrency token, soft-delete/global-filter, and audit-field pattern in use, per the Database skill's Sections 3, 6, and 7.
* A Mermaid ER diagram covering the core aggregates at minimum.

### 3.5 `05-api-contracts.md` — Every Endpoint
* One entry per route: HTTP method, path, auth requirement, request shape, every possible response shape (success and error) with status codes, and idempotency behavior if applicable — mirroring the Backend skill's Section 8 conventions.
* Grouped by feature/resource, with a summary table at the top (method, path, one-line purpose) so it's skimmable before diving into full contracts.

### 3.6 `06-frontend-inventory.md` — Every Route, Every Major Component
* Every route/page with the components it renders and the data it depends on.
* Every component above trivial size: its props interface, the state it owns vs. reads from a store, and which API calls it triggers (directly or via a hook).
* Every store/slice/context: what state it holds and who reads/writes it.

### 3.7 `07-conventions.md` — Exhaustive, Example-Backed
* Every convention detectable with confidence (naming, file layout, error handling shape, DI/state patterns), each backed by at least one real file path as evidence — not restated from the Backend/Frontend skills' generic rules, but what this specific codebase actually does, including any deviations from those skills' defaults.
* Anything documented as "legacy" or "don't touch," with the file paths involved.

### 3.8 `08-business-rules.md` — Domain Logic, Not Just Code Structure
* Per feature/domain: the business invariants enforced in code (validation rules, state machines, workflow steps), described in plain language with a pointer to the enforcing file/method — this is what lets a developer understand *why* the code is shaped the way it is, not just *how*.

### 3.9 `09-test-coverage-map.md` — What's Tested and What Isn't
* Per feature/module: which layers have tests (unit/integration/component/E2E), which test files, and which behaviors are visibly untested — cross-referenced against the Unit Test skill's conventions (Section 2) to flag any deviation.
* Test infrastructure inventory: what fixtures, factories, Testcontainers/MSW setups already exist and where.

### 3.10 `10-config-and-environments.md` — Every Config Surface
* Every environment variable and config key referenced in code, what it controls, and which environment files declare it (names only — never capture actual secret values).
* Deployment topology as far as it's visible from the repo (Dockerfiles, compose files, CI/CD environment stages) — cross-referenced with the Pipeline skill's Section 5 stage structure.

### 3.11 `11-technical-debt-register.md` — Exhaustive, Ranked
* Every `TODO`/`FIXME`/`HACK` found, with file:line and surrounding context, not a sample.
* Every churn hotspot from git history, ranked by change frequency, with a one-line note on why it's likely hot (core business logic vs. recurring bug source vs. unclear).
* Every skipped/disabled test found.
* This file is what the **Decision Governance** skill reads directly when deciding whether a task's target area needs an ADR before touching it.

### 3.12 `12-glossary.md` — Domain Language
* Every domain-specific term used repeatedly in code/comments/tests (entity names, status enums, business acronyms) with a plain-language definition, so someone unfamiliar with the business domain isn't blocked by jargon while reading the other 11 files.

---

## 4. Comprehensive Scan Mode — Instruction to the Codebase Research Skill
When this skill triggers a scan, it hands the Codebase Research skill an explicit mode flag:

* **`mode: comprehensive`** (used for first-time cache creation, or an explicit user request to "document everything"): the Codebase Research skill's own Section 9 anti-patterns around length ("~100 lines," "don't list every dependency") **do not apply** — those constraints govern its standalone quick-report use case, not this one. In comprehensive mode, it works through Sections 3.1–3.12 above as its actual deliverable spec, producing the full `deep-dive/` file set. Breadth-first reconnaissance (its own Section 3/Phase 1) still happens first, but depth follows immediately after for every file listed above rather than being left as a follow-up.
* **`mode: scoped, target: <file-or-subsystem>`** (used for incremental refresh — see Section 5): only the named deep-dive file(s), or a `subsystems/<name>.md`, get regenerated; everything else is left untouched.
* **Grounding discipline still applies, more so.** Exhaustiveness is not license to fill gaps with plausible-sounding filler — every entity field, every endpoint, every convention claim must trace to a file actually opened. An exhaustive document with confidently wrong details is worse than a shorter one, because its apparent completeness makes people trust it more. Anything not confidently determined goes into a `## Could Not Confirm` block at the bottom of the relevant deep-dive file, not smoothed over.

---

## 5. Freshness Check Protocol (run before deciding to scan)
Before letting the Codebase Research skill run, work through this in order:

1. **Does `.agent/knowledge/manifest.json` exist?** If not → cache miss entirely. Trigger a full comprehensive scan (Section 4, `mode: comprehensive`) and create the whole knowledge base (Section 8).
2. **Compare `manifest.json`'s `last_full_scan_commit` to current HEAD.**
   * **Identical** → the whole knowledge base is fresh. Return the requested file(s) directly. **No scan runs.**
   * **Different** → proceed to step 3.
3. **Per-file staleness, not just whole-repo staleness.** Use `manifest.json`'s per-file hashes/commit markers (Section 6) to determine which specific `deep-dive/*.md` files are affected by the diff between the last scan and HEAD:
   * A change to `package.json`/`*.csproj` → `01-tech-stack.md` stale, others unaffected.
   * A change under `Core/Domain` or an entity file → `04-data-model.md` and possibly `08-business-rules.md` stale.
   * A change to a Controller/endpoint → `05-api-contracts.md` stale.
   * A change under `src/features/*` or components → `06-frontend-inventory.md` stale.
   * New `TODO`/`FIXME` or a test file skipped → `11-technical-debt-register.md` stale (this one also has a time-based staleness rule below since churn ranking degrades gradually even without direct edits).
   * A structural/renaming-heavy diff, or a change touching many unrelated areas → treat as broad; refresh `02-architecture.md` and `03-directory-structure.md` at minimum, and re-evaluate whether a full re-scan is warranted.
4. **Time/drift-based staleness**: even with no direct hits, refresh `11-technical-debt-register.md` (churn ranking) and `codebase-map.md`'s changelog if the last scan is more than ~30 days or ~50 commits old — these two drift even when nothing they directly reference changed.
5. **Explicit user override**: "re-scan," "re-map," "refresh," or "regenerate the docs" always triggers a full comprehensive re-scan regardless of what the diff says.

---

## 6. Manifest Schema
```json
{
  "last_full_scan_commit": "<git sha>",
  "last_full_scan_at": "<ISO 8601 timestamp>",
  "files": {
    "codebase-map.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/01-tech-stack.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/02-architecture.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/03-directory-structure.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/04-data-model.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/05-api-contracts.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/06-frontend-inventory.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/07-conventions.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/08-business-rules.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/09-test-coverage-map.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/10-config-and-environments.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/11-technical-debt-register.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" },
    "deep-dive/12-glossary.md": { "last_updated_commit": "<sha>", "last_updated_at": "<timestamp>" }
  },
  "subsystems": {
    "auth": { "last_updated_commit": "<sha>", "report_path": ".agent/knowledge/subsystems/auth.md" }
  },
  "key_manifest_hashes": {
    "package.json": "<sha256>",
    "*.csproj": "<sha256>"
  }
}
```
* Per-file granularity is what makes Section 5's targeted refresh possible — the whole point is to never regenerate all twelve files when a diff only touches one domain.

---

## 7. Consumption Protocol for Downstream Skills (don't load everything, every time)
* **Start from `codebase-map.md`**, not the deep-dive folder directly — its index tells you which deep-dive file(s) are actually relevant to the current task.
* **Load only the deep-dive file(s) the task needs.** A Backend task touching an endpoint needs `05-api-contracts.md` and probably `04-data-model.md`; it does not need `06-frontend-inventory.md`. Loading all twelve files for every task defeats the purpose of splitting them.
* **Feature Planning** (Section 3, Discovery): read `codebase-map.md` plus whichever deep-dive files match the feature's Affected Surfaces (its Section 4).
* **Backend / Frontend** (Section 10.1): same targeted-read pattern.
* **Decision Governance**: reads `11-technical-debt-register.md` directly.
* **Database** skill: cross-checks its own entity work against `04-data-model.md` and flags this skill if they've diverged.
* A human developer, by contrast, is welcome to open any or all of the deep-dive files directly — the exhaustiveness is explicitly for their benefit too, not just the agent's.
* Treat every deep-dive file's `## Could Not Confirm` block as still open — a fresh-looking cache doesn't mean every original unknown got resolved.

---

## 8. First-Time / Full Knowledge Base Creation
1. Trigger the Codebase Research skill in `mode: comprehensive` (Section 4) covering Sections 3.0–3.12.
2. Write each output to its corresponding path under `.agent/knowledge/` (Section 2).
3. Create `manifest.json` with `last_full_scan_commit` set to current HEAD and every file's `last_updated_commit` set to the same.
4. Tell the user, once, that the knowledge base now exists at `.agent/knowledge/`, that they can open `codebase-map.md` as the entry point, and that future tasks will reuse it instead of re-scanning unless the repo changes meaningfully.

---

## 9. Incremental Update Protocol
* When Section 5 identifies specific stale files, trigger the Codebase Research skill in `mode: scoped, target: <file>` for just those files.
* After any update, update that file's entry in `manifest.json` and append one line to `codebase-map.md`'s changelog block (e.g. `- 2026-09-09: refreshed 04-data-model.md and 05-api-contracts.md after adding Refund entity (commit a1b2c3)`).
* **Never regenerate all twelve files because one was stale.** That is precisely the repeated-full-scan cost this skill exists to eliminate.

---

## 10. Invalidation Triggers (force a full comprehensive re-scan regardless of cache state)
* No `manifest.json`, or it fails to parse.
* The user explicitly asks to re-scan/re-map/refresh/regenerate the docs.
* A dependency manifest changes in a way suggesting a framework/major-version migration.
* Git history shows broad structural change (mass renames/moves, a new top-level architecture pattern).
* More than roughly half of the tracked deep-dive files are independently flagged stale by Section 5 at the same time — at that point a coordinated full refresh is cheaper and more consistent than twelve separate scoped patches.

---

## 11. Negative Constraints & Anti-Patterns
* ❌ **No trusting existence over freshness**, and no trusting whole-repo freshness when only per-file freshness was actually checked — always run Section 5's per-file comparison.
* ❌ **No fabricating content to appear exhaustive.** Every field, endpoint, and rule listed must be grounded in an inspected file; anything uncertain goes to `## Could Not Confirm`, never smoothed into confident prose.
* ❌ **No full re-scan when a per-file scoped one would do**, and no per-file scoped patching when the diff is broad enough that a coordinated full refresh is actually cheaper (Section 10's last bullet).
* ❌ **No silent overwrite of `CLAUDE.md`/`AGENTS.md`/`README.md`.** Cross-link, don't replace.
* ❌ **No loading the entire `deep-dive/` folder for every task.** Downstream skills read `codebase-map.md` first and pull only the relevant file(s) (Section 7) — comprehensive storage does not mean comprehensive context-loading per task.
* ❌ **No skipping the explicit-refresh override.**
* ❌ **No treating a scoped/subsystem cache as satisfying a broader task's needs**, or vice versa — match the cache's actual scope to what the task requires.
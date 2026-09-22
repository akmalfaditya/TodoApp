---
name: codebase-research
description: research and map an unfamiliar codebase, producing a structured Markdown report that documents its architecture, conventions, and risks for downstream planning and execution skills.
---
# Skill: Codebase Research & Architecture Mapping Specialist

## 1. System Role & Trigger Criteria
* **Role**: Staff Engineer acting as a Code Archaeologist / Onboarding Guide. This skill does not write or modify production code. Its sole output is a **structured research report in Markdown** that documents what an unfamiliar (or unfamiliar-to-the-agent) codebase actually is and how it actually works — grounded in what was found, not assumed.
* **Trigger Conditions**: Activate when: (a) entering a repository for the first time in a session, (b) a user explicitly asks to "understand," "explore," "map," "onboard me to," or "document" a codebase, (c) a downstream skill's Research phase needs a grounded architectural picture before proceeding — this includes the **Feature Planning** skill's Discovery step, and the **Backend**/**Frontend** execution skills' Research step. **In all three cases, this skill only actually runs a scan if the Codebase Knowledge Cache skill reports a cache miss or stale cache** — check there first rather than scanning unconditionally on every task.
* **Relationship to other skills** (this skill sits upstream of the execution skills, but downstream of the Knowledge Cache gate):
  * The **Codebase Knowledge Cache** skill decides *whether* this skill needs to run at all, and whether a full or scoped scan is needed. This skill should never be invoked "just in case" — trust that gate.
  * Once a scan does run, its output must be written to `.agent/knowledge/codebase-map.md` (or the relevant `subsystems/<name>.md` file) per the Knowledge Cache skill's Section 2, not left only in the current session's context — otherwise the next task pays the same scanning cost again.
  * Its Markdown report is the artifact the **Feature Planning** skill reads before drafting a plan (Feature Planning Section 3 — Discovery).
  * When it surfaces a legacy/high-complexity hotspot (Section 6 below), that finding is what triggers the **Decision Governance** skill during planning — this skill flags, Decision Governance decides.
  * Backend/Frontend execution skills should read an existing report rather than re-scanning the repo themselves; if no report exists or it's stale for the relevant subsystem, invoke this skill first.
* **Respect existing docs**: if `CLAUDE.md`, `AGENTS.md`, `README.md`, or a prior research report already exists, read it first. Enhance and reconcile against it — call out explicitly what's new, what's confirmed, and what's now stale — never silently overwrite or ignore it.

---

## 2. Exploration Philosophy
* **Breadth first, then depth.** Get a fast, cheap signal across the whole repo before reading any single file deeply. Reading every file top-to-bottom is slow and burns context for no proportional benefit — most of what matters is visible from manifests, directory shape, and a handful of representative files.
* **Explore in parallel where possible.** Structure, conventions, and entry points are independent questions — investigate them as separate parallel passes rather than one long sequential crawl, then merge findings.
* **Ground every claim in something you actually opened.** Every statement in the report should be traceable to a file, path, or command you inspected — not inferred from the framework's typical conventions or from training-data familiarity with "how this kind of project usually looks."
* **Flag unknowns instead of guessing.** If a convention can't be confidently detected (e.g. which test runner is actually wired into CI, or why two similar-looking modules coexist), say so explicitly in the Open Questions section. A wrong confident answer is worse than an honest "could not determine."
* **Stay scannable.** The report should be readable in a couple of minutes by a human, or ingestible in one pass by another agent. Depth belongs in the code itself and in follow-up deep-dives — not in an exhaustive report nobody finishes reading.

---

## 3. Phase 1 — Reconnaissance (Fast Signals)
Gather raw signals before reading implementation code. Typical checks, run as parallel passes where the tooling allows:
* **Package manifests**: `package.json`, `*.csproj`/`*.sln`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `pom.xml`/`build.gradle`, `Gemfile`, `composer.json`, `pubspec.yaml` — identify language(s), runtime version(s), and top-level dependencies that actually shape how code should be written (frameworks, ORMs, state libraries, test runners), not the full dependency tree.
* **Framework fingerprinting**: identify the web framework, ORM/data layer, frontend framework/bundler, and test framework actually in use — not assumed from the language alone.
* **Top-level directory snapshot**: map the first 1–2 levels of the tree, noting which directories hold source, tests, infra/config, docs, and generated/vendored code (to be excluded from further reading).
* **Config & tooling**: linter/formatter config, CI pipeline definitions (these are also what the **Pipeline** skill will later need to touch), environment/config file patterns (`.env.example`, `appsettings.*.json`), containerization (`Dockerfile`, `docker-compose.yml`).
* **Test layout**: where tests live relative to source (co-located vs mirrored tree), naming convention, and what test commands CI actually runs (read the CI config, don't assume from `package.json` scripts alone — they can drift). This feeds the **Unit Test** skill's Section 2 (Test Architecture & Conventions).
* **Entry points**: the process start files (`Program.cs`, `main.ts`, `index.ts`, `app.py`, etc.) and the top of the request lifecycle (routing setup, middleware pipeline registration).
* Exit criteria: you can name the language/runtime, primary framework(s), architectural style candidate, and test stack — each backed by a specific file you looked at — before moving to Phase 2.

---

## 4. Phase 2 — Architecture & Pattern Mapping
* **Identify the architectural pattern actually in use** (Clean/N-Layer, Vertical Slice/CQRS, Feature-Driven frontend, Layer-Driven frontend, MVC, etc.) by tracing one real request or component end-to-end — don't infer it purely from directory names, since naming and actual structure can disagree.
* **Trace a representative request/data lifecycle**: pick one real endpoint or one real user-facing component and follow it from entry point through to persistence/response (backend) or from render through to network/state (frontend). This single trace usually reveals the true layering faster than reading every file.
* **Module/feature boundaries**: what the natural seams are, and which boundaries are already blurry or violated in practice (worth flagging even though this skill doesn't fix them).
* **Identify "shared fate" groups**: files or modules that in practice always change together (visible from git history or from tight coupling) — these are implicit contracts even if nothing declares them explicitly, and are valuable for a planner to know about.

---

## 5. Phase 3 — Convention & Contract Mining
Extract the conventions a subsequent execution skill would need in order to write code that fits in, without re-deriving them from scratch each time:
* Naming conventions (files, components, classes, branches, commit messages if a pattern is visible — cross-check against the **Pipeline** skill's Conventional Commits rules to see if the repo already follows them).
* State management / DI patterns actually used (not just what a library's docs recommend).
* Error-handling and API response shape conventions already established.
* Existing test conventions (what a typical test file looks like, what's mocked vs real, what fixtures already exist) — hand this directly to the **Unit Test** skill rather than having it re-detect the same thing.
* Anything explicitly documented as "don't touch" or "legacy, being phased out" — these matter more than ordinary conventions because violating them silently causes the most damage, and are exactly what should be flagged for **Decision Governance** during planning.

---

## 6. Phase 4 — Risk & Hotspot Identification
* **Churn hotspots**: files that change unusually often (via git log/blame if available) are disproportionately likely to be either core business logic or a recurring source of bugs — worth flagging either way.
* **Debt markers**: `TODO`, `FIXME`, `HACK` comments, disabled/skipped tests, and any explicitly documented known issues.
* **Fragile seams**: areas where the Phase 2 trace revealed tight coupling, missing tests, or unclear ownership — these are the parts a future plan should treat with extra caution (see the Feature Planning skill's Risk Assessment section, and route genuinely risky ones through the Decision Governance skill).

---

## 7. Output Contract — Research Report Template
Every research pass should produce a report in this shape. Omit a section only if genuinely not applicable, and say so rather than deleting it silently. Target roughly 100 lines or fewer for the core report — push exhaustive detail into an optional appendix rather than bloating the main body.

```markdown
# Codebase Research: <Repo/Project Name>

## Overview
<1-3 sentences: what this system does, for whom, and its overall shape>

## Tech Stack
- Language/runtime: ...
- Primary framework(s): ...
- Data layer: ...
- Test stack: ...
- Notable libraries that shape how code should be written: ...

## Architecture
<Detected pattern (e.g. Clean Architecture, Vertical Slice/CQRS, Feature-Driven frontend) and
the evidence for it — the specific request/component trace that confirmed it>

## Directory Map
<Annotated top 1-2 levels — only directories that need explanation, skip the obvious ones>

## Entry Points & Request/Data Lifecycle
<Where execution starts, and the traced path for one representative request or component>

## Conventions
- Naming: ...
- State/DI patterns: ...
- Error handling / response shape: ...
- Testing conventions: ...

## Key Risks & Hotspots
- <Churn hotspots, fragile seams, debt markers, "shared fate" groups — flag any that likely need
  the Decision Governance skill before a plan touches them>

## Setup / Run / Test Commands
- Install: ...
- Run locally: ...
- Test: ...
- Lint/format: ...

## Open Questions / Unknowns
- <Anything that could not be confidently determined — flagged explicitly, not guessed>

## Recommended Next Steps
- <For a human ramping up, or for the downstream Feature Planning skill about to scope a feature>
```

---

## 8. Audience Adaptation
* **For a human developer onboarding**: keep the prose readable, prioritize the "how do I run this and where do I start" information near the top.
* **For a downstream agent/skill (Feature Planning, Decision Governance, Backend, Frontend, Database)**: prioritize the Architecture, Conventions, and Risk sections — those are what actually change how a subsequent plan or diff should be written. The exact commands matter less to another agent than the architectural ground truth does.
* Adjust depth, not accuracy — a shorter report for a narrow question (e.g. "map just the authentication flow") is fine as long as everything in it is still grounded in files actually inspected, with scope of the narrower pass stated at the top.
* **Scoped update mode**: when the Knowledge Cache skill hands this skill an existing report plus a specific diff/subsystem scope (rather than asking for a scan from zero), only re-run Phases 1–4 against that scope and patch the relevant section(s) of the existing report — don't regenerate the whole document when only one section is actually stale.
* **Comprehensive mode**: when the Knowledge Cache skill invokes this skill with `mode: comprehensive` (its Section 4), this skill's own Section 9 anti-patterns about length and dependency-listing are **suspended** — that guidance governs the standalone, narrow-query use case (e.g. "map just the auth flow" for a quick human answer), not the exhaustive knowledge-base deliverable. In comprehensive mode, follow the Knowledge Cache skill's Section 3 file-by-file specification instead: every dependency (not curated), every entity field, every endpoint, every convention with evidence — depth and completeness are the deliverable, not a violation of Section 9.

---

## 9. Negative Constraints & Anti-Patterns
*(These govern the standalone, narrow-query use case of this skill. When invoked by the Knowledge Cache skill in `mode: comprehensive`, its Section 3 specification takes precedence over the length/dependency-listing constraints below — see Section 8's "Comprehensive mode" note.)*
* ❌ **No copying the README.** The point of this report is structural insight the README doesn't already give — restating it wastes the reader's time.
* ❌ **No listing every dependency.** Only surface the ones that materially shape how code should be written; a full `package.json` dump belongs in the file itself, not the report.
* ❌ **No describing the obvious.** `src/` does not need an explanation. Spend words on what's non-obvious or surprising.
* ❌ **No guessing dressed up as fact.** "Uses Redux" when you only saw a `store/` folder and didn't confirm it is a hallucination risk — verify or move it to Open Questions.
* ❌ **No silent overwrite of existing onboarding docs.** If `CLAUDE.md`/`AGENTS.md`/a prior report exists, reconcile against it and call out deltas.
* ❌ **No report over ~100 lines for the core body.** If the codebase is large enough to need more, split into a top-level overview report plus targeted sub-reports (e.g. "Auth Subsystem Deep Dive") rather than one sprawling document.
* ❌ **No architecture claims without a traced example.** Naming a pattern from directory names alone, without following at least one real request/component through it, is exactly the kind of claim that turns out wrong.
* ❌ **No re-deriving what a downstream skill already owns.** Don't write detailed test-writing standards here — that's the Unit Test skill's job; this report only records what conventions currently exist.
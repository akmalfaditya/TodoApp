---
name: walkthrough
description: implementation walkthrough and developer learning documentation skill — produces a step-by-step, code-by-code explanation of what was actually built after a feature passes review, so developers can learn from what the agent did.
---

# Skill: Implementation Walkthrough & Developer Learning Documentation Specialist

## 1. System Role & Trigger Criteria
* **Role**: Mentor Engineer / Technical Writer. This skill does not implement, review, or judge correctness of code — that already happened in the owning layer skill's Review & Harden step. Its sole output is a **step-by-step, code-by-code explanation** of what was actually built, written so a developer reading it afterward understands not just *what* changed but *why*, and could apply the same reasoning themselves next time.
* **Trigger Conditions**: Activate automatically once a feature/task set passes **Review & Harden** (the Backend skill's Section 10.5, the Frontend skill's Section 10.5, or the equivalent point in a Database-only change) — and always **before** the Pipeline skill's Ship step. Never generate this while the diff is still in flux; a walkthrough written against code that keeps changing is wrong by the time anyone reads it.
* **Skip when**: the change was small enough that Feature Planning itself did not trigger (one-line fixes, typo corrections, config value changes — see the Planning skill's own non-trigger criteria). There is nothing meaningfully "step by step" to explain about a one-line diff.
* **Relationship to other skills** — this sits between Review and Ship, reading everyone else's output:
  * **Feature Planning**'s `plan.md` (Task Breakdown Section 6, Technical Design Section 5, and Architectural Decision section if present) is the backbone — this skill's steps mirror the plan's tasks, in the same order they were actually implemented.
  * **Backend**, **Frontend**, and **Database** skills supply the actual code — every snippet in the walkthrough is copied from their real diffs/final files, never reconstructed from the plan alone.
  * **Unit Test** skill's test files are read directly so each implementation step can be paired with what verifies it.
  * **Decision Governance**'s ADR (if one was produced) gets surfaced inline at the step where the decision mattered, not just cited as a link.
  * **Pipeline** skill links this document from the PR description (its Section 4 template) so a human reviewer sees it without having to go looking.

---

## 2. Storage Location & Format
* Persisted at `.agent/walkthroughs/<feature-slug>-<YYYY-MM-DD>.md`, committed to the repository — same persistence principle as the Knowledge Cache skill, so the document remains readable long after the PR merges and the original conversation is gone.
* One file per feature/plan, not per task and not per commit — the whole point is a single coherent narrative a developer can read start to finish in one sitting.
* Filename slug should match the plan's feature name and the branch name the Pipeline skill created, so the three artifacts (plan, branch, walkthrough) are trivially cross-referenceable.

---

## 3. Content Requirements — What Makes This "Step by Step, Code by Code"
Structure the document as one section per task from the plan's Task Breakdown, **in the order they were actually implemented** (which, per the Planning skill's Section 6, is usually riskiest-first within a vertical slice — preserve that order, don't re-sort by layer).

Each step/section must include, in this order:
1. **Goal** — the task's purpose restated in one sentence, pulled from the plan.
2. **The actual code** — real snippets copied from the diff or final files (not paraphrased pseudocode), with just enough surrounding context (the containing method/component, relevant imports) to be readable without needing the whole file open.
3. **What it does** — a plain-language walk-through of the snippet, written for someone who did not watch it get built.
4. **Why it's built this way** — connect the code to a specific, named rule from the owning skill it followed (e.g. *"uses a primary constructor per the Backend skill's Section 3"*, *"returns `Result<T>` instead of throwing, per Section 8's exception policy, because a missing order is an expected outcome here, not a crash"*, *"the endpoint checks `Idempotency-Key` per Section 7 because this mutates order state"*). This is the single most important line in each step — it's what turns a diff summary into a lesson about the underlying rule, not just this one instance of it.
5. **The test(s) written for this step** — shown alongside the implementation, with a one-line note on which specific behavior or edge case each test locks in, and which test-writing convention it followed (Unit Test skill's naming/AAA rules).
6. **Any decision point encountered here** — a flagged hotspot, an ADR produced, a plan revision, a place the implementation diverged from what was originally planned — explained at the exact step it happened, not swept into a separate appendix.

After all steps, close with:
* **Key Takeaways** (3–6 bullets) — the transferable lessons a developer should walk away with (a pattern applied, a pitfall avoided, a convention reinforced). Not a changelog restatement of what files changed.
* **How to Extend This** (optional, when there's an obvious next increment) — e.g. *"to add a second refund method, follow the same strategy interface introduced in Step 3."*

---

## 4. Writing Style
* Write for a mid-level developer who is new to **this specific feature and this specific codebase's conventions**, not new to programming in general — assume language/framework competence, not prior context on what was just built.
* Explain the "why" before or alongside the "what" — never show a code snippet before the reader knows what problem it's solving.
* Use the codebase's real file paths and real symbol names throughout. Never invent illustrative names that don't match the actual diff — a reader should be able to open the referenced file and find exactly what the walkthrough describes.
* Keep prose tight around each snippet: a paragraph explaining ten lines of code should rarely run past four or five sentences. Let the code carry density; the prose should carry judgment (the "why"), not restate syntax the reader can already see.

---

## 5. Grounding & Accuracy
* Every snippet must be copied from the actual, final diff/files — never reconstructed from memory of the plan or from what "should" have been written.
* If a task's implementation diverged from the original plan (a wrong assumption caught mid-build, a scope adjustment, a test that revealed a missing edge case), **say so explicitly** and explain what changed and why. Presenting the final code as if it matched the plan from the first attempt hides exactly the kind of judgment call a developer benefits most from seeing.
* If something in the diff can't be confidently explained (an unfamiliar pattern inherited from elsewhere in the codebase, a workaround whose original motivation isn't visible in this diff), say so rather than inventing a plausible-sounding rationale — an incorrect "why" is worse than an honest "the reason for this isn't clear from this change alone."

---

## 6. Negative Constraints & Anti-Patterns
* ❌ **No generating before Review & Harden passes.** An in-progress diff produces a walkthrough that's stale before it's finished.
* ❌ **No paraphrasing code into pseudocode.** Real snippets only — a developer needs to cross-reference the actual files, not a summary of them.
* ❌ **No restating the plan's Task Breakdown verbatim as the explanation.** The plan says what to build; this document explains what was actually built, including any divergence from the plan.
* ❌ **No omitting the test explanation.** A walkthrough that shows implementation but not verification teaches only half the lesson.
* ❌ **No skipping this step for "small but planned" changes.** If Feature Planning triggered for it, this skill triggers for it too — smaller changes are often where the clearest, most reusable lessons live, and they're the cheapest to document well.
* ❌ **No fabricated rationale.** Every "why it's built this way" claim must trace to an actual rule in an owning skill or an actual decision made during implementation — not an assumption about what a good engineer would have thought.
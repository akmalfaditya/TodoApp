---
name: pipeline
description: pipeline specialist
---
# Skill: DevOps, Git Governance & CI/CD Pipeline Specialist

## 1. System Role & Trigger Criteria
* **Role**: Principal DevOps Engineer & Release Architect specializing in Git version control governance, trunk-based/feature-branch workflows, automated CI/CD pipelines (GitHub Actions, Azure DevOps), containerization, and automated quality gates.
* **Trigger Conditions**: Activate when creating branches, crafting commits, authoring Pull Requests (PRs), designing/modifying CI/CD pipelines (`.github/workflows/`, `azure-pipelines.yml`), troubleshooting runner errors, or configuring deployment automation.
* **Relationship to other skills** — this skill is the **single authority for the Ship phase**:
  * The **Backend** skill's Section 10.6 and the **Frontend** skill's Section 10.6 both invoke this skill for branch naming, commit format, and PR structure rather than improvising their own — if either ever describes a different commit/PR convention, this skill's rules win.
  * **PR Test Evidence** (Section 4 below) is populated from the **Unit Test** skill's suite output — this skill runs and reports it, it doesn't define what "good test evidence" looks like.
  * **PR description** references the approved plan produced by the **Feature Planning** skill (its Section 11 template) — "Why" and "How" sections should point back to that plan rather than being reconstructed from the diff alone.
  * **Migration deployment**: the idempotent SQL script the **Database** skill produces (its Section 2) is what this skill's CD stage executes — this skill owns *when/how* it runs in the pipeline, Database owns *what* the script contains.
  * A hotspot flagged by the **Decision Governance** skill mid-task (its Section 2) should already be resolved or explicitly deferred before a PR reaches this skill's review gate — this skill's PR checklist assumes that conversation already happened.
  * **PR description** also links the **Implementation Walkthrough** skill's step-by-step document (see Section 4's template) — this skill surfaces it for the reviewer, it doesn't write the walkthrough itself.

---

## 2. Branching Strategy & Git Hygiene
Enforce disciplined branching naming and history hygiene. Prohibit uncontrolled branch sprawl and direct pushes to protected refs.

* **Branch Naming Conventions**:
  * **Features**: `feature/<short-kebab-case-description>` (e.g., `feature/order-idempotency-key`, `feature/user-auth-jwt`).
  * **Bug Fixes**: `bugfix/<issue-number-or-ticket>` or `bugfix/<issue-number>-<short-description>` (e.g., `bugfix/ISSUE-402`, `bugfix/1042-fix-negative-stock`).
  * **Hotfixes (Production Incidents)**: `hotfix/<incident-id>-<short-desc>` (e.g., `hotfix/INC-991-db-pool-exhaustion`).
  * **Chores / Maintenance**: `chore/<dependency-or-tooling>` (e.g., `chore/dotnet8-sdk-upgrade`, `chore/eslint-v9`).
* **Trunk & Protection Guardrails**:
  * Direct pushes to `main`, `master`, `production`, or release stabilization branches are strictly forbidden.
  * All production code must land via reviewed, automated-check-passing Pull Requests.
  * Maintain linear commit history using **Squash and Merge** or **Rebase and Merge** to keep the trunk bisectable and clean.

---

## 3. Conventional Commits Specification
Every commit must follow the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/) format to enable automated changelogs, semantic versioning, and fast git inspection.

* **Format**: `<type>[optional scope]: <imperative-description>`
* **Primary Types**:
  * `feat`: Introduces a new feature or public API capability (e.g., `feat(order): add idempotency header middleware`).
  * `fix`: Patches a software bug or addresses unexpected behavior (e.g., `fix(stock): prevent negative allocation during high concurrency`).
  * `perf`: Code modification improving execution speed or lowering memory usage without API change.
  * `refactor`: Structural code cleanup that neither fixes a bug nor introduces a new feature. If this touches legacy code beyond the current task's scope, confirm the **Decision Governance** skill's advisory (its Section 2) was already surfaced and approved before this commit exists.
  * `test`: Adding missing unit/integration tests or updating test fixtures — produced by the **Unit Test** skill.
  * `chore`: Maintenance tasks, dependency bumps, or tool configurations (e.g., `chore(deps): update EntityFrameworkCore to 8.0.8`).
  * `ci`: Modifications to CI/CD workflows, build runner images, or pipeline configurations.
* **Syntax Rules**:
  * Use the **imperative, present tense** in the summary ("add", not "added" or "adds"; "fix", not "fixed").
  * Do not capitalize the first letter after the colon.
  * Do not place a period (`.`) at the end of the commit subject line.
  * Indicate breaking changes using `!` before the colon (e.g., `feat(api)!: remove v1 legacy order endpoint`) and document details in the commit footer.

---

## 4. Pull Request (PR) Protocol & Template Governance
Every Pull Request must be self-contained, reviewable (aim for under 400 lines of net change), and strictly structured using the standardized engineering template.

### Mandatory PR Markdown Template
```markdown
## What
[Provide a clear, concise bulleted summary of what code, schemas, or configs changed.]

## Why
[Explain the underlying business rationale, defect cause, or link directly to the issue/Jira ticket
(e.g., Closes #123 / PROJ-456). Reference the Feature Planning skill's plan.md Goal section rather
than re-explaining the rationale from scratch.]

## How
[Outline the technical approach, architectural pattern used, and any trade-offs considered — pull this
directly from the plan's Technical Design section and, if produced, the Decision Governance skill's ADR.]

## Test Evidence
[Attach terminal output logs of passing unit/integration suites produced by the Unit Test skill,
code coverage reports, or screenshots/screen recordings verifying UI behavior and clean API responses.]

## How It Works — Step by Step
[Link to the Implementation Walkthrough skill's document at `.agent/walkthroughs/<feature-slug>-<date>.md`
— a code-by-code explanation of what was built and why, for reviewers and future maintainers.]

---
### Checklist
- [ ] Code adheres to project style standards and passes static analyzers.
- [ ] Unit/Integration tests added or updated (per the Unit Test skill).
- [ ] No secrets, tokens, or credentials checked into repository.
- [ ] Database migrations tested for backward compatibility (if applicable — per the Database skill's
      Expand & Contract rules).
- [ ] Any hotspot/legacy-refactor flag raised during implementation was resolved via the Decision
      Governance skill, not silently expanded in scope.
- [ ] Implementation Walkthrough document generated and linked above.
```

---

## 5. CI/CD Pipeline Engineering (GitHub Actions / Azure Pipelines)
* **Pipeline Structure & Stage Gates**:
  1. **Lint & Static Code Analysis**: Run linters (`dotnet format --verify-no-changes`, `csharpier`, `eslint`) before compilation.
  2. **Security & Vulnerability Scanning**: Run automated secret detection (e.g., Gitleaks) and dependency vulnerability audits (`dotnet list package --vulnerable`, `npm audit`).
  3. **Build Stage**: Strict compilation with warnings treated as errors (`TreatWarningsAsErrors=true`).
  4. **Automated Test Stage**: Execute the unit and integration tests the **Unit Test** skill produced, with coverage reporting (publish TRX or JUnit test result artifacts) — this is the evidence Section 4's PR template requires.
  5. **Package / Containerization**: Multi-stage Docker build utilizing layer caching (`docker/build-push-action` or Azure ACR cache).
  6. **Migration Deployment (if applicable)**: Execute the idempotent migration script the **Database** skill generated (its Section 2) as a decoupled, pre-deploy step — never via `Database.Migrate()` inside the application container.
* **Caching Discipline**:
  * Cache NuGet packages (`~/.nuget/packages`) and npm/yarn caches using hash-based cache keys (`${{ hashFiles('**/packages.lock.json') }}` or `hashFiles('**/*.csproj')`).
  * Never cache volatile build outputs (`bin/`, `obj/`, `dist/`).
* **Environment Separation**:
  * Decouple CI builds from CD deployments. CI runs on all PRs; CD runs only on release tagging or trunk merges to target environments (Dev -> Staging -> Production).

---

## 6. Pipeline Failure Triage & Root-Cause Protocol
* **Strict "Do Not Push and Pray" Rule**:
  * **Absolute Ban**: Never push blind, empty, or speculative "fix pipeline" commits without inspecting build logs.
  * When a pipeline fails in GitHub Actions or Azure DevOps:
    1. **Download and Isolate Raw Logs**: Read the specific step that exited with a non-zero code. Expand the exact stack trace or compiler warning.
    2. **Classify the Failure**:
       * *Code / Test Breakage*: Reproduce locally using the identical command flags (`dotnet test -c Release`, `npm run build`). If the failure is a genuinely wrong test (not a wrong implementation), route the fix back through the **Unit Test** skill rather than patching it inline in the pipeline config.
       * *Environment / Runner Issue*: Check runner OS updates, missing environment variables, or tool version mismatches (e.g., mismatch between global.json and runner SDK).
       * *Transient Network / Infrastructure*: Timeout during external package restore or rate-limiting. Only retry the failed job once if verified to be an external transient fault.
       * *Permission / IAM*: Missing secrets or expired service principal tokens.
    3. **Formulate a Deterministic Fix**: Address the validated root cause locally, run verification scripts, and push a single targeted commit.

---

## 7. Security, Secrets & Artifact Integrity
* **Zero Secrets in Git**:
  * Never commit `.env`, appsettings files containing raw credentials, certificates, or private tokens.
  * Use environment-specific Secret Managers (Azure Key Vault, GitHub Secrets, HashiCorp Vault) injected at deployment or runtime.
* **Container Security**:
  * Build non-root container images for application runtimes:
    ```dockerfile
    # .NET 8 non-root user
    USER $APP_UID
    ```
  * Scan container images using Trivy or Grype inside the pipeline before publishing to a container registry.

---

## 8. Negative Constraints & Anti-Patterns
* ❌ **No Force Pushing on Shared Branches**: Never run `git push --force` on trunk or shared remote branches. Use `--force-with-lease` exclusively on personal feature branches when rebasing.
* ❌ **No Blind Pipeline Retries**: Never repeatedly click "Re-run all jobs" without diagnosing the failing step's execution log.
* ❌ **No Secret Injection via Build Args**: Never pass production passwords or long-lived API keys as Docker `ARG` during image builds.
* ❌ **No Missing PR Context**: Never submit PRs with empty descriptions, single-word summaries, or missing test evidence.
* ❌ **No Ignored Broken Pipelines**: Never merge a PR or deploy downstream when any pipeline status check is failing or reported as unstable.
* ❌ **No Giant PR Monoliths**: Avoid submitting PRs spanning multiple unrelated functional domains or exceeding hundreds of lines without prior architectural breakdown — if a PR is growing because of an in-flight Decision Governance-flagged refactor, split it into its own PR.
* ❌ **No Reinventing Commit/PR Conventions Elsewhere**: If a layer skill (Backend, Frontend, Database) proposes its own commit message or PR structure, this skill's Sections 2–4 take precedence.
* ❌ **No Shipping Without a Walkthrough on a Planned Feature**: If Feature Planning triggered for this change, a PR reaching this skill without a linked Implementation Walkthrough document is incomplete — send it back rather than merging with that box unchecked.
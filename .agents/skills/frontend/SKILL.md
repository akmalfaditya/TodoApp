---
name: frontend  
description: frontend related skill for React 18+, TypeScript, Tailwind CSS, Zustand/Redux Toolkit, and high-performance, accessible UI design.
---
# Skill: React & TypeScript UI/State Engineering Specialist

## 1. System Role & Trigger Criteria
* **Role**: Principal Frontend Engineer & UI/UX Architect specializing in React 18+, TypeScript, scalable state architecture, component modularity, web accessibility (a11y), and high-performance UI rendering.
* **Trigger Conditions**: Activate when scaffolding, refactoring, or optimizing React components, pages, custom hooks, API integration layers, form controls, or client/server state stores.
* **Relationship to other skills** — this skill owns the component/state/UI layer only:
  * **Codebase Knowledge Cache**, **Codebase Research**, and **Feature Planning** run before this skill (Section 10.1–10.2) — this skill executes against their outputs, it does not re-research or re-plan, and it never scans the repo itself when the cache already has an answer.
  * **Unit Test** skill owns how tests are written (RTL query priority, MSW setup, a11y assertions) — see Section 10.3. This skill's job is implementing against tests that skill produced.
  * **Decision Governance** skill is invoked (by Feature Planning, or mid-task per Section 10.5) whenever a hotspot or trade-off is encountered — this skill flags, it doesn't decide unilaterally.
  * **Pipeline** skill owns commit format, PR template, and CI/CD — see Section 10.7. This skill never improvises its own commit/PR conventions.
  * **Implementation Walkthrough** skill produces the step-by-step, code-by-code explanation of this skill's finished work — see Section 10.6. This skill never writes its own ad hoc change summary; that's a dedicated deliverable owned elsewhere.
  * If the feature has a backend contract, the API shape is agreed in the Feature Planning skill's Technical Design (its Section 5) *before* this skill builds against it — this skill does not invent request/response shapes unilaterally when a real backend contract is in play.

---

## 2. Architecture & Pattern Identification
Before generating code, inspect directory layout and existing state conventions. Never introduce conflicting paradigms into an established codebase.

* **Pattern A: Feature-Driven / Domain-Based Architecture (Recommended)**
  * Place domain-specific logic under `src/features/<feature-name>/`:
    * `components/`: UI components exclusive to this feature.
    * `hooks/`: Domain-specific hooks and query wrappers.
    * `services/` or `api/`: Endpoint definitions and request/response typings.
    * `types/`: Domain-specific interfaces and DTOs.
  * Shared primitives belong exclusively in `src/components/common/` or `src/components/ui/`.
* **Pattern B: Layer-Driven Architecture**
  * Colocate globally by technical responsibility (`src/pages/`, `src/components/`, `src/hooks/`, `src/services/`, `src/store/`).
* **Core Rule**: Adhere strictly to the existing file naming format (PascalCase for components `OrderCard.tsx`, camelCase for hooks and utilities `useOrderDetails.ts`).

---

## 3. TypeScript & Component Standards
* **Pure Functional Components**:
  * Write only Functional Components utilizing standard hooks. Class components are prohibited.
  * Use explicit parameter typing rather than legacy `React.FC`:
    ```typescript
    interface UserProfileCardProps {
      readonly userId: string;
      readonly isExpanded?: boolean;
      readonly onSelect: (userId: string) => void;
    }

    export const UserProfileCard = ({
      userId,
      isExpanded = false,
      onSelect,
    }: UserProfileCardProps) => {
      // implementation
    };
    ```
* **Strict Type Safety**:
  * Declare component props interfaces immediately above the component declaration in the same file (export if reused).
  * Strictly ban `any`. Use `unknown` with type guards or generic type constraints (`T`) when types are ambiguous.
  * Model asynchronous UI states using **Discriminated Unions** instead of disparate boolean flags:
    ```typescript
    type AsyncState<T> =
      | { status: 'idle'; data: null; error: null }
      | { status: 'loading'; data: null; error: null }
      | { status: 'success'; data: T; error: null }
      | { status: 'error'; data: null; error: string };
    ```
* **State vs. Derived Calculation**:
  * Never synchronize state via `useEffect` for derived values. Compute derived state inline during render, using `useMemo` only when computations are demonstrably expensive:
    ```typescript
    // Anti-pattern: useState + useEffect to sync fullName from firstName and lastName
    // Correct pattern:
    const fullName = `${firstName}${lastName}`;
    ```

---

## 4. API Integration & Server Communication
* **Centralized Axios Instance**:
  * All network requests must use the pre-configured instance located at `src/utils/axios.ts` (or `src/services/axios.ts`).
  * Never invoke raw `fetch()` or instantiate new `axios.create()` instances.
* **Strict Request & Response Typing**:
  * Every API method must explicitly type both request payloads and response contracts, matching the API shape agreed in the Feature Planning skill's Technical Design when a real backend contract exists:
    ```typescript
    import api from '@/utils/axios';

    export interface OrderSummaryResponse {
      id: string;
      orderNumber: string;
      totalAmount: number;
      status: 'Pending' | 'Shipped' | 'Delivered';
    }

    export interface CreateOrderPayload {
      customerId: string;
      itemIds: string[];
    }

    export const orderApi = {
      getById: async (id: string, signal?: AbortSignal): Promise<OrderSummaryResponse> => {
        const { data } = await api.get<OrderSummaryResponse>(`/orders/${id}`, { signal });
        return data;
      },
      create: async (payload: CreateOrderPayload): Promise<OrderSummaryResponse> => {
        const { data } = await api.post<OrderSummaryResponse>('/orders', payload);
        return data;
      },
    };
    ```
* **Hook Encapsulation & Request Cancellation**:
  * Never trigger raw API calls directly inside presentation components. Abstract them within custom hooks or TanStack Query mutations/queries.
  * Always wire `AbortSignal` to prevent memory leaks and state updates on unmounted components.

---

## 5. Client State Management Architecture
Follow the repository's active state management paradigm without mixing global libraries.

* **Zustand Discipline**:
  * Keep stores small, atomic, and domain-focused.
  * **Selective Subscriptions**: Never extract an entire store (`const store = useOrderStore()`). Always pass an explicit selector to avoid unnecessary rerenders across siblings:
    ```typescript
    const activeOrderId = useOrderStore((state) => state.activeOrderId);
    const setActiveOrder = useOrderStore((state) => state.setActiveOrder);
    ```
* **Redux Toolkit (RTK) Discipline**:
  * Colocate actions, reducers, and initial state inside `createSlice`.
  * Use typed hooks exclusively (`useAppDispatch`, `useAppSelector`).
  * Avoid placing non-serializable objects (class instances, functions, promises) in the Redux store.
* **React Context Discipline**:
  * Context should be reserved for low-velocity, truly global state (theme, authentication, locale).
  * Split state and dispatch contexts to prevent consumers that only trigger actions from rerendering on data changes:
    ```typescript
    const AuthStateContext = createContext<AuthState undefined |>(undefined);
    const AuthDispatchContext = createContext<AuthDispatch undefined |>(undefined);
    ```

---

## 6. Styling & UI Design System
* **Tailwind CSS Rules**:
  * Use utility classes directly in `className`.
  * Use `clsx` and `tailwind-merge` (often aliased as `cn(...)`) when computing conditional classes:
    ```typescript
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors',
        isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    />
    ```
  * Avoid arbitrarily nesting `@apply` statements inside raw CSS files unless abstracting shared base components.
* **CSS Modules Rules**:
  * Co-locate module files directly beside the component: `ComponentName.module.css`.
  * Use camelCase class names inside CSS modules to enable clean dot-notation property access (`styles.headerContainer`).
* **Inline Style Ban**:
  * Prohibit inline styles (`style={{ ... }}`) for static design tokens.
  * Reserve inline styles strictly for dynamic, runtime-computed values (e.g., drag-and-drop translations, dynamic CSS variables, raw z-indexes based on stacking calculations).

---

## 7. Performance & Accessibility (a11y)
* **Re-render Optimization**:
  * Apply `useCallback` on event handlers passed to memoized children (`React.memo`).
  * Avoid creating object or array literals directly within JSX props if the child component is wrapped in `React.memo`.
  * For lists exceeding 100 items, apply DOM virtualization (e.g., `@tanstack/react-virtual`).
* **Accessibility Fundamentals (a11y)**:
  * Use semantic HTML elements (`<main>`, `<nav>`, `<article>`, `<button>`, `<fieldset>`) instead of clickable `<div>` wrappers.
  * Ensure custom interactive elements include proper `aria-*` tags, keyboard navigation handling (`onKeyDown` with `Enter` and `Space`), and visible `:focus-visible` outlines.
  * Provide descriptive `alt` text for images and `aria-label` for icon-only buttons.

---

## 8. Form Handling & Validation
* For forms with three or more fields, use controlled form libraries (e.g., `react-hook-form`) combined with schema validation (`zod` or `yup`).
* Never execute inline validation logic inside component render cycles; isolate schema definitions outside the component body to avoid re-compilation per render:
  ```typescript
  const orderFormSchema = z.object({
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    notes: z.string().max(200).optional(),
  });
  ```

---

## 9. Negative Constraints & Anti-Patterns
* ❌ **No `any` Type**: Never use `any`. Use `unknown`, generics, or index signatures.
* ❌ **No Ad-Hoc Fetch**: Never write `fetch(...)` or instantiate new Axios instances outside `src/utils/axios.ts`.
* ❌ **No Missing Dependency Arrays**: Never omit variables used inside `useEffect`, `useMemo`, or `useCallback` from the dependency array. Do not use `eslint-disable-next-line react-hooks/exhaustive-deps` without documenting the architectural justification.
* ❌ **No Inline Styles for Layout**: Never use `style={{ margin: 10, display: 'flex' }}`. Always use Tailwind utilities or CSS Modules.
* ❌ **No Unselected Store Reads**: Never invoke a state hook without a granular selector when using Zustand or Redux.
* ❌ **No Direct State Mutation**: Never mutate array or object states directly (e.g., `state.items.push(item)`). Always use immutable update patterns.
* ❌ **No Clickable Non-Interactive Tags**: Never place `onClick` listeners on `<div>` or `<span>` elements without appropriate `role="button"`, `tabIndex={0}`, and keyboard listeners.
* ❌ **No Unilateral API Contract Invention**: Never define a request/response shape that diverges from the API contract agreed in the Feature Planning skill's Technical Design — flag a mismatch back to Planning rather than quietly adapting to what the backend happens to return.

---

## 10. Agent Execution Workflow (Mandatory Loop)

This governs *how* the agent works, not just what the output should look like. Without an explicit workflow, agentic coding tools consistently skip the "Red" phase of testing — writing implementation and tests simultaneously, or worse, generating tests after the fact that merely confirm whatever the component already does. This skill does not perform every phase itself — most phases delegate to a dedicated skill. The mandatory loop is:

```
RESEARCH → PLAN → TEST (RED) → IMPLEMENT (GREEN) → REVIEW/HARDEN → SHIP
```

Treat every arrow as a gate. Do not move to the next phase until the current one's exit criteria are met, and commit at each gate as a checkpoint.

### 10.1 Research — check the Knowledge Cache, then Codebase Research if needed
* Do not re-inspect the repository from scratch inside this skill, and do not invoke Codebase Research directly. Check the **Codebase Knowledge Cache** skill first — it returns an existing report on a cache hit, or triggers **Codebase Research** (full or scoped) on a miss/stale cache. Use whichever comes back to determine whether the codebase is Feature-Driven or Layer-Driven (Section 2), the state management paradigm in use (Section 5), and the existing API layer conventions (Section 4).
* Exit criteria: you hold a research report (cached or freshly produced) confirming which feature folder/layer the change lives in and which state store/API pattern it must plug into.

### 10.2 Plan — invoke the Feature Planning skill
* Do not draft an ad hoc plan inside this skill. Invoke the **Feature Planning** skill to produce `plan.md`: component/hook name(s), props interface, the discriminated-union states involved (Section 3), store selectors/query hooks touched, and API calls with request/response types — matching whatever contract Planning's Technical Design agreed with the backend side.
* Confirm the plan explicitly lists the interaction and accessibility behaviors the component must support (keyboard nav, aria roles, focus handling — Section 7); flag it back to Feature Planning if missing rather than inventing them ad hoc during implementation.
* Exit criteria: you hold an approved plan whose Test Strategy (Feature Planning Section 7) is detailed enough that a test file's contents are predictable from it.

### 10.3 Test First — invoke the Unit Test skill (Red Phase)
* Do not define test-writing conventions inside this skill. Invoke the **Unit Test** skill to write the failing tests, using the plan's Test Strategy for what to cover: RTL component tests (query by role/label, not test-id), each branch of the discriminated union (Section 3), MSW-mocked API calls, `renderHook` for non-trivial hooks, and an automated a11y assertion for new interactive components.
* This skill's only responsibility here is surfacing frontend-specific test infrastructure needs the Unit Test skill should account for — e.g. a new MSW handler shape, or a provider wrapper a component needs in its test render.
* Exit criteria / commit checkpoint: the Unit Test skill confirms all new tests exist, compile, and are red for the right reason. Commit this red state as a checkpoint.

### 10.4 Implement — Green Phase (this skill's core responsibility)
* Write the minimum component/hook code needed to satisfy the tests, following Sections 2–8 (architecture placement, typing rules, API/state discipline, styling rules, a11y fundamentals).
* Do not edit the tests to fit the implementation. If a test encodes a wrong assumption from planning, treat that as a plan revision (back to 10.2), flagged explicitly, not a silent edit.
* Iterate — run tests, fix, run again — until the full suite (new + pre-existing) is green, `tsc --noEmit` is clean, and ESLint passes with zero suppressed rules beyond documented exceptions (Section 9).
* Exit criteria: full test suite green, no type errors, no new lint suppressions without justification.

### 10.5 Review & Harden
* Re-check the diff against this skill's own Section 9 (Negative Constraints): no `any`, no ad-hoc fetch calls, no missing dependency arrays, no inline layout styles, no unselected store reads, no direct state mutation, no non-interactive clickable tags, no unilateral API contract drift.
* Also re-check against the **Decision Governance** skill's Sections 2, 4, and 6 — no rogue refactoring outside scope, no static/module-level mutable state introduced, complexity/cognitive-load bounds respected in complex hooks/components.
* Confirm rerender behavior for anything wrapped in `React.memo` — check that no new inline object/array/function literals were introduced into memoized children's props without `useCallback`/`useMemo` justification (Section 7).
* For components crossing a real user flow (checkout, auth, multi-step forms), consider whether a Playwright/Cypress E2E test is warranted in addition to the component-level tests — coordinate with the Unit Test skill on this.
* Where feasible, get an independent review pass (fresh agent context or a human) comparing the diff against the 10.2 plan — the same context that wrote the code tends to repeat its own blind spots in review.
* Exit criteria: diff is clean against this skill's Section 9, Decision Governance's Sections 2/4/6, tests assert genuine user-visible behavior (not tautological renders), a11y checks pass.

### 10.6 Document — invoke the Implementation Walkthrough skill
* Do not write an ad hoc summary of the change inside this skill. Invoke the **Implementation Walkthrough** skill once the diff is final and Review & Harden (10.5) has passed, so it can produce a step-by-step, code-by-code explanation of what was built — mirroring the plan's Task Breakdown, pairing each component/hook with the RTL tests that verify it, and calling out any point where the implementation diverged from the original plan (e.g. an a11y requirement discovered mid-build, an API contract mismatch flagged back to Planning).
* This skill's only responsibility here is making sure the final diff and the tests from 10.3/10.4 are actually finished and stable before handing off — the Walkthrough skill reads real, final code, never a work-in-progress diff.
* Exit criteria: a walkthrough document exists at `.agent/walkthroughs/<feature-slug>-<date>.md`, ready to be linked from the PR in 10.7.

### 10.7 Ship — invoke the Pipeline skill
* Do not improvise commit messages or PR structure inside this skill. Invoke the **Pipeline** skill for branch naming, Conventional Commits format, and the PR template — reference the approved plan from 10.2, and the walkthrough document from 10.6, in the PR description.
* Confirm loading/error/empty states are all handled and tested (Section 3's discriminated union should have no untested branch) before handing off to Pipeline.
* Only after the Pipeline skill's CI gates pass is the task considered complete — "tests pass" alone isn't the definition of done; this skill's Section 9 and the a11y/behavior checks from 10.5 must also be clean.

### 10.8 Why this order (not "code first, test later")
* A component built first and tested after tends to get tests that describe whatever it already renders — including its bugs — rather than what the user actually needs it to do. Writing tests from the 10.2 plan (via the Unit Test skill) forces the required behavior to be explicit before implementation bias can creep in.
* Querying by role/label instead of test-id, and asserting on rendered output instead of internal state, means tests stay valid across refactors — a refactor that doesn't change user-visible behavior shouldn't break the test suite.
* Committing the failing (red) tests first gives an inspectable checkpoint: if a test is later changed to force it green instead of fixing the implementation, that's visible directly in the diff.
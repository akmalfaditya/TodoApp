# 09 — Test Coverage Map & Test Infrastructure

This document maps all automated tests across the backend and frontend solutions, identifies tested versus untested behaviors, and catalogs testing infrastructure.

---

## 1. Test Suite Summary Matrix

| Subsystem / Layer | Test Framework | Test Files | Total Tests | Pass Rate |
|---|---|---|---|---|
| **Backend Unit Tests** | xUnit (`net8.0`) | 5 test classes | **20** | 100% Passed (0 Failed) |
| **Frontend Unit & Component** | Vitest + React Testing Library | 8 test files | **34** | 100% Passed (0 Failed) |
| **Total Automated Tests** | — | **13 test files** | **54** | **100% Passed** |

---

## 2. Backend Test Coverage (`backend/tests/TodoApp.UnitTests/`)

All tests run via `dotnet test backend/TodoApp.sln`.

### 2.1 Test Classes & Coverage Detail

1. **`AdminValidatorTests.cs`** (`backend/tests/TodoApp.UnitTests/Admin/`):
   - **Target**: `UpdateUserRoleRequestDtoValidator`
   - **Covered**: Valid roles (`Admin`, `User`), empty role string, unsupported arbitrary roles (`SuperAdmin`, `Moderator`).
   - **Tests**: 3 test executions (1 Fact + 1 Theory with 2 inline datasets).
2. **`ServiceResultTests.cs`** (`backend/tests/TodoApp.UnitTests/Common/`):
   - **Target**: `ServiceResult<T>` and non-generic `ServiceResult`
   - **Covered**: Success state, `NotFound`, `Forbidden`, `ValidationFailure` with error list collection, non-generic success/failure constructors, role constants and `ApplicationUser` defaults.
   - **Tests**: 6 Fact tests.
3. **`TodoItemTests.cs`** (`backend/tests/TodoApp.UnitTests/Domain/`):
   - **Target**: `TodoItem` entity and custom domain exceptions.
   - **Covered**: Default property initialization (`Guid.Empty`, `Medium` priority, `false` completion), `NotFoundException` formatting, `ForbiddenException` default message, `ValidationAppException` error dictionary retention.
   - **Tests**: 2 Fact tests.
4. **`ExceptionHandlingMiddlewareTests.cs`** (`backend/tests/TodoApp.UnitTests/Middleware/`):
   - **Target**: `ExceptionHandlingMiddleware`
   - **Covered**: Happy path pass-through to next delegate; `NotFoundException` mapping to 404; `ForbiddenException` mapping to 403; `ValidationAppException` mapping to 400 with error details; unexpected `Exception` mapping to 500 without leaking stack traces or internal exception messages.
   - **Tests**: 5 Fact tests.
5. **`TodoValidatorTests.cs`** (`backend/tests/TodoApp.UnitTests/Todos/`):
   - **Target**: `CreateTodoRequestDtoValidator`
   - **Covered**: Empty title rejection; past due date rejection; valid task payload acceptance.
   - **Tests**: 3 Fact tests.

### 2.2 Backend Test Infrastructure
* **Mock Logger**: `NullLogger<T>.Instance` from `Microsoft.Extensions.Logging.Abstractions`.
* **In-Memory HTTP Context**: `DefaultHttpContext` with `MemoryStream` response bodies for middleware evaluation.

---

## 3. Frontend Test Coverage (`frontend/src/**/__tests__/`)

All tests run via `npm test` (`vitest run`).

### 3.1 Test Suites & Coverage Detail

1. **`authStore.test.ts`** (`frontend/src/stores/__tests__/`):
   - **Covered**: Initial state nullness; `setAuth` with token and user object; `logout` clearing session; `isAdmin` selector returning correct boolean.
   - **Tests**: 4 tests.
2. **`todosApi.test.ts`** (`frontend/src/features/todos/__tests__/`):
   - **Covered**: `fetchTodos` calling `GET /todos`; `fetchTodoById` calling `GET /todos/{id}`; `createTodo` calling `POST /todos`; `updateTodo` calling `PUT /todos/{id}`; `deleteTodo` calling `DELETE /todos/{id}`; `toggleComplete` calling `PATCH /todos/{id}/complete`.
   - **Tests**: 6 tests.
3. **`auth.test.ts`** (`frontend/src/features/auth/__tests__/`):
   - **Covered**: `login` calling `POST /auth/login`; `register` calling `POST /auth/register`; verifying request interceptor attaches Bearer token.
   - **Tests**: 3 tests.
4. **`adminApi.test.ts`** (`frontend/src/features/admin/__tests__/`):
   - **Covered**: `fetchUsers` calling `GET /admin/users`; `updateUserRole` calling `PUT /admin/users/{id}/role`; `toggleLockUser` calling `PATCH /admin/users/{id}/toggle-lock`; `deleteUser` calling `DELETE /admin/users/{id}`.
   - **Tests**: 4 tests.
5. **`todoUiStore.test.ts`** (`frontend/src/features/todos/__tests__/`):
   - **Covered**: Default filter/sort state; `setFilter`; `setSortBy`; `toggleSortOrder` (`asc` $\leftrightarrow$ `desc`); `setSearchQuery`.
   - **Tests**: 4 tests.
6. **`UserTable.test.tsx`** (`frontend/src/features/admin/__tests__/`):
   - **Covered**: Tabular rendering of users, role badges, and status; **Self-Protection Guard assertion** (verifies active admin row displays `"Anda"`, `"Tidak dapat diubah"`, and has no action buttons); action button triggers for other users.
   - **Tests**: 3 tests.
7. **`TodoList.test.tsx`** (`frontend/src/features/todos/__tests__/`):
   - **Covered**: Rendering tasks with priority badges; empty state rendering when no tasks exist; verifying owner tag is hidden for standard users; verifying owner tag is visible when logged in as Admin.
   - **Tests**: 4 tests.
8. **`Routing.test.tsx`** (`frontend/src/routes/__tests__/`):
   - **Covered**: Unauthenticated visit to `/` redirects to `/login`; unauthenticated visit to `/admin/users` redirects to `/login`; authenticated `User` renders `TodosPage` and navbar; authenticated `User` visiting `/admin/users` is redirected to `/`; authenticated `Admin` renders `AdminUsersPage` and sees `"Kelola User"` link; 404 page for unknown routes.
   - **Tests**: 6 tests.

### 3.2 Frontend Test Infrastructure
* **Environment**: `jsdom` configured in `frontend/vitest.config.ts`.
* **Mock Provider**: Custom `renderWithClient` helper wrapping rendered JSX in isolated `QueryClientProvider` with `retry: false`.
* **Router Harness**: `createMemoryRouter` from `react-router-dom` to test navigation paths in memory without browser history.

---

## 4. Untested Behaviors & Gap Analysis

The following behaviors are currently verified manually or via integration, but lack dedicated automated tests:
1. **Database Migrations Execution**: No automated integration test currently spins up a blank SQLite database and tests running EF Core migrations from scratch in CI.
2. **Axios 401 Auto-Logout**: While the Bearer injection is unit-tested in `auth.test.ts`, the response interceptor redirecting to `/login` on HTTP 401 relies on `window.location.href` which is currently not asserted in an automated test.
3. **Optimistic Rollback in UI**: While the logic in `useTodos.ts` implements rollback context, there is currently no component test simulating network failure to assert that the checkbox reverts visually.


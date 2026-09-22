# 07 — Repository Conventions & Implementation Patterns

This document details the coding standards, naming conventions, architectural design patterns, and error handling contracts actively enforced across the TodoApp codebase, backed by specific file evidence.

---

## 1. Backend Conventions (.NET 8)

### 1.1 File Naming & Organization
* **Entity Classes**: Singular PascalCase (`TodoItem.cs`, `BaseEntity.cs`) in `TodoApp.Domain/Entities/`.
* **Repository Interfaces & Classes**: Prefixed with `I`, singular entity name + `Repository` (`ITodoRepository.cs`, `TodoRepository.cs`).
* **Service Interfaces & Classes**: Feature or domain name + `Service` (`ITodoService.cs`, `TodoService.cs`, `IAuthService.cs`, `AuthService.cs`).
* **Data Transfer Objects (DTOs)**: Suffix `Dto` with explicit intent (`CreateTodoRequestDto.cs`, `TodoResponseDto.cs`, `UpdateTodoRequestDto.cs`).
* **Validators**: DTO name + `Validator` (`CreateTodoRequestDtoValidator.cs`, `UpdateUserRoleRequestDtoValidator.cs`).
* **Configurations**: Entity name + `Configuration` (`TodoItemConfiguration.cs`) implementing `IEntityTypeConfiguration<T>`.

### 1.2 The Service Result Pattern
* **Rule**: Services never throw exceptions for predictable business validation or permission failures. Instead, they return `ServiceResult<T>` with an explicit `ServiceErrorType`.
* **Evidence**:
  - `backend/src/TodoApp.Application/Common/Models/ServiceResult.cs`
  - `backend/src/TodoApp.Application/Features/Todos/TodoService.cs`:
    ```csharp
    if (!isAdmin && item.OwnerId != userId)
    {
        return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses ke todo ini.");
    }
    ```
* **Controller Translation**: All controllers inherit from `ApiControllerBase` which translates `ServiceResult<T>` to corresponding HTTP status codes:
  - `ServiceResult.Success()` $\rightarrow$ `HTTP 200 OK` or `201 Created` / `204 NoContent`
  - `ServiceErrorType.NotFound` $\rightarrow$ `HTTP 404 NotFound` (`{ error: string }`)
  - `ServiceErrorType.Forbidden` $\rightarrow$ `HTTP 403 Forbidden` (`{ error: string }`)
  - `ServiceErrorType.Validation` $\rightarrow$ `HTTP 400 BadRequest` (`{ errors: string[] }`)
  - `ServiceErrorType.Unauthorized` $\rightarrow$ `HTTP 401 Unauthorized` (`{ error: string }`)

### 1.3 Exception Handling Convention
* **Unhandled Exceptions**: Caught exclusively at the top of the HTTP pipeline by `ExceptionHandlingMiddleware` (`backend/src/TodoApp.Api/Middleware/ExceptionHandlingMiddleware.cs`).
* **Safety Rule**: Unexpected exceptions log the full error internally via `ILogger` but return a generic string `"Terjadi kesalahan pada server"` with status `500` to prevent leaking stack traces or database schema details to clients.

### 1.4 Dependency Injection & Assembly Scanning
* **Clean Extension Methods**: Features and infrastructure register dependencies through centralized extension methods:
  - `AddApplicationServices()` in `backend/src/TodoApp.Application/Common/Extensions/ServiceCollectionExtensions.cs`:
    - Automatically scans Application assembly for all AutoMapper profiles.
    - Automatically scans Application assembly for all FluentValidation validators (`AddValidatorsFromAssembly`).
  - `AddInfrastructure(IConfiguration)` in `backend/src/TodoApp.Infrastructure/DependencyInjection.cs`:
    - Registers `ApplicationDbContext`, generic repositories, identity services, and JWT generators.

---

## 2. Frontend Conventions (React 19 + TypeScript)

### 2.1 File & Directory Naming
* **Components**: PascalCase matching component name (`TodoItem.tsx`, `UserTable.tsx`, `AppLayout.tsx`).
* **Custom Hooks**: camelCase prefixed with `use` (`useTodos.ts`, `useAuth.ts`, `useAdminUsers.ts`).
* **Zustand Stores**: camelCase suffixed with `Store` (`authStore.ts`, `todoUiStore.ts`).
* **API Modules**: Lowercase `api.ts` colocated inside feature directory (`src/features/todos/api.ts`).
* **Types**: Lowercase named after domain (`types/todo.ts`, `types/auth.ts`, `types/admin.ts`).
* **Tests**: Mirrored in `__tests__/` subfolders matching target name (`TodoList.test.tsx`, `todosApi.test.ts`).

### 2.2 Component Structure & Typing
* **Functional Components**: Strongly typed with `React.FC<PropsInterface>` or function declaration with typed props.
* **Prop Interfaces**: Explicitly exported from the component file (`export interface TodoItemProps`).
* **Controlled Inputs**: All form fields maintain state in React and handle change events explicitly (`onChange={(e) => setTitle(e.target.value)}`).

### 2.3 State Classification Convention
* **Never use `useEffect` for data fetching**: Remote data is fetched and cached exclusively with TanStack Query (`useQuery`, `useMutation`).
* **Derive state rather than duplicating**: Sorting and filtering in `TodoList.tsx` use `useMemo` calculated over the server `todos` and client `todoUiStore` state, avoiding duplicate state synchronization bugs.
* **Optimistic UI with Rollback**: Mutations updating list items (`useToggleComplete`, `useCreateTodo`, `useDeleteTodo`) perform `cancelQueries`, save previous data snapshot in context, mutate cache immediately, roll back on `onError`, and invalidate queries on `onSettled`.

### 2.4 Axios Interceptor Convention
* **No Manual Headers**: Individual API functions never construct `headers: { Authorization: ... }`. The request interceptor in `src/api/client.ts` automatically reads `useAuthStore.getState().token`.
* **Centralized 401 Handling**: The response interceptor in `src/api/client.ts` intercepts `401 Unauthorized`, invokes `useAuthStore.getState().logout()`, and redirects browser to `/login`.

---

## 3. Legacy / Non-Standard Patterns & Notes

* **`TodoApp.Domain` Package Isolation**: The Domain layer intentionally contains **no NuGet packages** whatsoever. Do NOT add packages (even EF Core annotations) to `TodoApp.Domain.csproj`.
* **`ApplicationUser` Location**: `ApplicationUser` is intentionally located in `TodoApp.Application/Identity/` rather than `Domain`, because it inherits from `Microsoft.AspNetCore.Identity.IdentityUser`. This allows `IAuthService` and `IJwtTokenService` to operate cleanly without breaking Domain purity.
* **Test Isolation**: `frontend/vitest.config.ts` is intentionally separated from `frontend/vite.config.ts` so that `tsc -b` (used in `npm run build`) evaluates standard Vite configuration without type conflicts with Vitest globals.


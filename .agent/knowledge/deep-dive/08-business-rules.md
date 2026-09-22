# 08 — Business Invariants & Domain Rules

This document details all business rules, authorization invariants, domain constraints, and workflow state transitions enforced across the TodoApp application, with explicit pointers to enforcing files and methods.

---

## 1. Authentication & Identity Invariants

### 1.1 Password Requirements
* **Enforced In**: `backend/src/TodoApp.Api/Program.cs` (`builder.Services.AddIdentity(...)`)
* **Rules**:
  1. Minimum length of **8 characters** (`RequiredLength = 8`).
  2. Must contain at least one uppercase letter (`RequireUppercase = true`).
  3. Must contain at least one lowercase letter (`RequireLowercase = true`).
  4. Must contain at least one digit (`RequireDigit = true`).
  5. Non-alphanumeric special characters are permitted but not required (`RequireNonAlphanumeric = false`).
  6. Email address must be unique across all registered users (`RequireUniqueEmail = true`).

### 1.2 User Registration Rules
* **Enforced In**: `backend/src/TodoApp.Infrastructure/Services/AuthService.cs` (`RegisterAsync`) and `RegisterRequestDtoValidator.cs`
* **Rules**:
  1. `FullName` is required and cannot be empty or whitespace.
  2. `Email` must conform to valid email syntax.
  3. `Password` and `ConfirmPassword` must match identically.
  4. Newly registered users are automatically assigned the role `User` (`Roles.User`). They cannot self-assign `Admin`.
  5. Account creation sets `CreatedAt = DateTime.UtcNow`.

### 1.3 Account Lockout Enforcement
* **Enforced In**: `backend/src/TodoApp.Infrastructure/Services/AuthService.cs` (`LoginAsync`)
* **Rule**: During login, if an account has an active lockout (`user.LockoutEnd > DateTimeOffset.UtcNow`), the login is rejected with status `403 Forbidden` and message `"Akun Anda telah dikunci oleh administrator."`, even if the password provided is correct.

---

## 2. Todo Ownership & Resource Authorization Rules

### 2.1 Multi-Tenant User Isolation
* **Enforced In**: `backend/src/TodoApp.Application/Features/Todos/TodoService.cs`
* **Rules**:
  1. **Listing Tasks (`GetAllForUserAsync`)**:
     - When called by a standard user (`isAdmin == false`), the service invokes `_todoRepository.GetByOwnerIdAsync(userId)`, returning only tasks where `OwnerId == currentUserId`.
     - When called by an administrator (`isAdmin == true`), the service invokes `_todoRepository.GetAllAsync()`, returning all tasks in the system.
  2. **Viewing Single Task (`GetByIdAsync`)**:
     - If `!isAdmin && item.OwnerId != userId`, access is denied: returns `ServiceResult.Forbidden("Anda tidak memiliki akses ke todo ini.")`.
  3. **Updating Task (`UpdateAsync`)**:
     - If `!isAdmin && item.OwnerId != userId`, modification is blocked: returns `ServiceResult.Forbidden("Anda tidak memiliki akses untuk mengubah todo ini.")`.
  4. **Deleting Task (`DeleteAsync`)**:
     - If `!isAdmin && item.OwnerId != userId`, deletion is blocked: returns `ServiceResult.Forbidden("Anda tidak memiliki akses untuk menghapus todo ini.")`.
  5. **Toggling Completion (`ToggleCompleteAsync`)**:
     - If `!isAdmin && item.OwnerId != userId`, toggle is blocked: returns `ServiceResult.Forbidden("Anda tidak memiliki akses ke todo ini.")`.

### 2.2 Task Creation Invariants
* **Enforced In**: `backend/src/TodoApp.Api/Controllers/TodosController.cs` (`Create`) and `CreateTodoRequestDtoValidator.cs`
* **Rules**:
  1. `OwnerId` is never trusted from the HTTP request body. It is extracted directly from the authenticated JWT token claim (`sub` / `ClaimTypes.NameIdentifier`).
  2. `Title` is mandatory, cannot be whitespace, and has a maximum length of 200 characters.
  3. `Description` is optional, with a maximum length of 2000 characters.
  4. `Priority` must be one of three valid enum values: `Low`, `Medium`, or `High`.
  5. `DueDate` (if provided) must not be in the past at creation time (`RuleFor(x => x.DueDate).GreaterThan(DateTime.UtcNow)`).
  6. Newly created tasks are always initialized with `IsCompleted = false`.

### 2.3 Task State Transitions
* **Transition**: `isCompleted` toggles between `false` and `true`.
* **Side Effect**: Every state toggle or property update updates `UpdatedAt = DateTime.UtcNow`.

---

## 3. Administrator Self-Protection Guards

To prevent accidental system lockout, corruption, or orphaned resources, the administrative subsystem enforces **Self-Protection Guards** at both backend service and frontend UI layers.

### 3.1 Role Modification Safeguard
* **Enforced In**: `backend/src/TodoApp.Infrastructure/Services/AdminUserService.cs` (`UpdateUserRoleAsync`) and `frontend/src/features/admin/components/UserTable.tsx`
* **Rule**: An administrator cannot change their own role:
  ```csharp
  if (id == currentAdminId)
  {
      return ServiceResult.Failure("Tidak bisa mengubah role akun sendiri");
  }
  ```
* **Frontend Reflection**: The active administrator's row renders an `"Anda"` badge and `"Tidak dapat diubah"` label instead of the role dropdown.

### 3.2 Self-Lockout Safeguard
* **Enforced In**: `backend/src/TodoApp.Infrastructure/Services/AdminUserService.cs` (`ToggleLockUserAsync`) and `frontend/src/features/admin/components/UserTable.tsx`
* **Rule**: An administrator cannot lock their own account:
  ```csharp
  if (id == currentAdminId)
  {
      return ServiceResult.Failure("Tidak bisa mengunci akun sendiri");
  }
  ```

### 3.3 Self-Deletion Safeguard
* **Enforced In**: `backend/src/TodoApp.Infrastructure/Services/AdminUserService.cs` (`DeleteUserAsync`) and `frontend/src/features/admin/components/UserTable.tsx`
* **Rule**: An administrator cannot delete their own account:
  ```csharp
  if (id == currentAdminId)
  {
      return ServiceResult.Failure("Tidak bisa menghapus akun sendiri");
  }
  ```


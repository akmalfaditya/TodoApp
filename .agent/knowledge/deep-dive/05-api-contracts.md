# 05 — API Contracts & Endpoint Catalog

This document provides the complete REST API specification for TodoApp, including HTTP methods, URL routes, authentication requirements, request payloads, response schemas, error responses, and idempotency characteristics.

---

## 1. Summary Catalog

| Method | Endpoint | Access / Role | Idempotent | Description |
|---|---|---|---|---|
| `GET` | `/health` | Anonymous | Yes | System liveness probe returning `{ status: "healthy" }`. |
| `POST` | `/api/auth/register` | Anonymous | No | Register a new user account with default `User` role. |
| `POST` | `/api/auth/login` | Anonymous | No | Authenticate user credentials and issue a JWT token. |
| `GET` | `/api/auth/me` | Authenticated (`User`, `Admin`) | Yes | Return current authenticated user's ID, email, and roles. |
| `GET` | `/api/todos` | Authenticated (`User`, `Admin`) | Yes | Get tasks. Users get own tasks; Admins get all tasks. |
| `GET` | `/api/todos/{id}` | Authenticated (`User`, `Admin`) | Yes | Get single task detail by GUID. |
| `POST` | `/api/todos` | Authenticated (`User`, `Admin`) | No | Create a new task (ownerId derived from token). |
| `PUT` | `/api/todos/{id}` | Authenticated (`User`, `Admin`) | Yes | Update all editable fields of a task. |
| `DELETE` | `/api/todos/{id}` | Authenticated (`User`, `Admin`) | Yes | Delete a task. Users can only delete their own. |
| `PATCH` | `/api/todos/{id}/complete`| Authenticated (`User`, `Admin`)| No | Toggle the `isCompleted` boolean flag of a task. |
| `GET` | `/api/admin/users` | Admin-only | Yes | List all registered users, their roles, and lock status. |
| `GET` | `/api/admin/users/{id}` | Admin-only | Yes | Get detailed profile of a single user. |
| `PUT` | `/api/admin/users/{id}/role` | Admin-only | Yes | Change user's role (`Admin` $\leftrightarrow$ `User`). |
| `PATCH` | `/api/admin/users/{id}/toggle-lock` | Admin-only | No | Lock or unlock user's ability to authenticate. |
| `DELETE` | `/api/admin/users/{id}` | Admin-only | Yes | Permanently delete user and cascade-delete their tasks. |

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 POST `/api/auth/register`
* **Access**: Public / Anonymous
* **Request Body**:
  ```json
  {
    "fullName": "Alice Wonder",
    "email": "alice@example.com",
    "password": "Password@123",
    "confirmPassword": "Password@123"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "id": "7b79a5c8-1a52-4c28-971f-0e24176461f3",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAtUtc": "2026-09-22T04:15:00Z",
    "email": "alice@example.com",
    "fullName": "Alice Wonder",
    "roles": ["User"]
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Validation failure (e.g. passwords don't match, invalid email, weak password, or email already registered):
    ```json
    { "error": "Email sudah terdaftar." }
    ```

---

### 2.2 POST `/api/auth/login`
* **Access**: Public / Anonymous
* **Request Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "Password@123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "id": "7b79a5c8-1a52-4c28-971f-0e24176461f3",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAtUtc": "2026-09-22T04:15:00Z",
    "email": "alice@example.com",
    "fullName": "Alice Wonder",
    "roles": ["User"]
  }
  ```
* **Error Responses**:
  - `400 Bad Request`: Incorrect password or non-existent email:
    ```json
    { "error": "Email atau password salah" }
    ```
  - `403 Forbidden`: Account is locked by an administrator:
    ```json
    { "error": "Akun Anda telah dikunci oleh administrator." }
    ```

---

### 2.3 GET `/api/auth/me`
* **Access**: Authenticated (`User` or `Admin`)
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "id": "7b79a5c8-1a52-4c28-971f-0e24176461f3",
    "email": "alice@example.com",
    "fullName": "Alice Wonder",
    "roles": ["User"]
  }
  ```

---

## 3. Todo Management Endpoints (`/api/todos`)

### 3.1 GET `/api/todos`
* **Access**: Authenticated (`User` or `Admin`)
* **Behavior**:
  - Regular `User`: returns only todos where `OwnerId == currentUserId`.
  - `Admin`: returns all todos across all users.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "c356e72b-4e6f-45b6-b52f-124619b02221",
      "title": "Setup local development environment",
      "description": "Clone repository and run migrations.",
      "isCompleted": true,
      "priority": "High",
      "dueDate": "2026-09-20T10:00:00Z",
      "ownerId": "john-user-guid",
      "createdAt": "2026-09-12T03:00:00Z",
      "updatedAt": "2026-09-19T08:30:00Z"
    }
  ]
  ```

---

### 3.2 GET `/api/todos/{id:guid}`
* **Access**: Authenticated (`User` or `Admin`)
* **Success Response (200 OK)**: Single `TodoResponseDto` object.
* **Error Responses**:
  - `404 Not Found`: Task with given GUID does not exist.
  - `403 Forbidden`: Regular user attempted to access another user's task.

---

### 3.3 POST `/api/todos`
* **Access**: Authenticated (`User` or `Admin`)
* **Security Note**: `ownerId` is extracted directly from the authenticated JWT token (`sub` / `NameIdentifier` claim), preventing impersonation.
* **Request Body**:
  ```json
  {
    "title": "Buy groceries",
    "description": "Milk, eggs, and bread",
    "priority": "Medium",
    "dueDate": "2026-09-25T18:00:00Z"
  }
  ```
* **Success Response (201 Created)**: Created `TodoResponseDto` object.
* **Error Responses**:
  - `400 Bad Request`: FluentValidation failure (empty title, invalid priority string, or due date in the past).

---

### 3.4 PUT `/api/todos/{id:guid}`
* **Access**: Authenticated (`User` or `Admin`)
* **Request Body**:
  ```json
  {
    "title": "Buy groceries and drinks",
    "description": "Milk, eggs, bread, and mineral water",
    "priority": "High",
    "dueDate": "2026-09-25T20:00:00Z",
    "isCompleted": false
  }
  ```
* **Success Response (200 OK)**: Updated `TodoResponseDto` object.
* **Error Responses**:
  - `403 Forbidden`: Regular user tried to update someone else's task.
  - `404 Not Found`: Task not found.

---

### 3.5 DELETE `/api/todos/{id:guid}`
* **Access**: Authenticated (`User` or `Admin`)
* **Success Response (204 No Content)**: Empty body.
* **Error Responses**:
  - `403 Forbidden`: Regular user tried to delete someone else's task.
  - `404 Not Found`: Task not found.

---

### 3.6 PATCH `/api/todos/{id:guid}/complete`
* **Access**: Authenticated (`User` or `Admin`)
* **Behavior**: Inverts `isCompleted` (`true` $\rightarrow$ `false`, `false` $\rightarrow$ `true`) and updates `UpdatedAt` to `DateTime.UtcNow`.
* **Success Response (200 OK)**: Updated `TodoResponseDto` object.

---

## 4. Administrative Endpoints (`/api/admin/users`)

All endpoints in this group require the `Admin` role (`[Authorize(Roles = Roles.Admin)]`). Non-admins receive `HTTP 403 Forbidden`.

### 4.1 GET `/api/admin/users`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "admin-guid-1",
      "email": "admin@todoapp.local",
      "fullName": "System Administrator",
      "roles": ["Admin", "User"],
      "isLocked": false,
      "createdAt": "2026-08-22T03:15:00Z"
    },
    {
      "id": "john-guid-2",
      "email": "john.doe@todoapp.local",
      "fullName": "John Doe",
      "roles": ["User"],
      "isLocked": false,
      "createdAt": "2026-09-08T03:15:00Z"
    }
  ]
  ```

---

### 4.2 PUT `/api/admin/users/{id}/role`
* **Self-Protection Guard**: Admin cannot modify their own role. Returns `400 Bad Request` with `{ error: "Tidak bisa mengubah role akun sendiri" }`.
* **Request Body**:
  ```json
  { "role": "Admin" }
  ```
* **Success Response (200 OK)**: Empty body.

---

### 4.3 PATCH `/api/admin/users/{id}/toggle-lock`
* **Self-Protection Guard**: Admin cannot lock their own account. Returns `400 Bad Request` with `{ error: "Tidak bisa mengunci akun sendiri" }`.
* **Behavior**: Toggles `LockoutEnd` between `null` (unlocked) and 100 years in future (locked).
* **Success Response (200 OK)**: Empty body.

---

### 4.4 DELETE `/api/admin/users/{id}`
* **Self-Protection Guard**: Admin cannot delete their own account. Returns `400 Bad Request` with `{ error: "Tidak bisa menghapus akun sendiri" }`.
* **Behavior**: Deletes user and triggers cascade delete on `TodoItems`.
* **Success Response (204 No Content)**: Empty body.


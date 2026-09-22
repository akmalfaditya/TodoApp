# 06 — Frontend Inventory & Component Catalog

This document details every route, layout, page, major UI component, custom hook, and state management store in the frontend application.

---

## 1. Route & Page Registry

All routes are declared in `frontend/src/routes/AppRouter.tsx` using `createBrowserRouter`.

| Path | Layout | Page Component | Access Rule | Data Dependencies |
|---|---|---|---|---|
| `/login` | `AuthLayout` | `LoginPage` | Public / Anonymous | None |
| `/register` | `AuthLayout` | `RegisterPage` | Public / Anonymous | None |
| `/` | `AppLayout` | `TodosPage` | Authenticated (`User`, `Admin`) | `useTodosQuery` (`['todos']`), `useTodoUiStore` |
| `/admin/users` | `AppLayout` | `AdminUsersPage` | Authenticated + Role `Admin` | `useUsersQuery` (`['admin-users']`) |
| `*` | None | `NotFoundPage` | Public / Catch-all | None |

---

## 2. Layout Shells

### 2.1 `AppLayout` (`frontend/src/components/layout/AppLayout.tsx`)
* **Role**: Primary layout shell for authenticated users.
* **Elements**:
  - **Top Navbar**: Displays brand logo, desktop navigation links (`Todos`, and `Kelola User` if `isAdmin`), user display name with role badge (purple for Admin, blue for User), and Logout button.
  - **Mobile Navigation Bar**: Bottom/secondary bar visible on small screens (`sm:hidden`).
  - **Main Content**: Renders active route component via `<Outlet />`.
  - **Footer**: Application copyright and version text.
* **Stores Read**: `useAuthStore` (`user`, `isAdmin`, `logout`).

### 2.2 `AuthLayout` (`frontend/src/components/layout/AuthLayout.tsx`)
* **Role**: Centered shell layout for unauthenticated flows (`LoginPage`, `RegisterPage`).
* **Elements**: Centered card container with logo header.

---

## 3. Major UI Components Catalog

### 3.1 `TodoList` (`frontend/src/features/todos/components/TodoList.tsx`)
* **Props**: `{ onEdit: (todo: Todo) => void }`
* **Local State**: None.
* **Stores Read**:
  - `useTodosQuery` (Server state: `todos`, `isLoading`, `isError`, `error`, `refetch`).
  - `useTodoUiStore` (Client state: `filter`, `sortBy`, `sortOrder`, `searchQuery`).
* **Computed State**: `processedTodos` via `useMemo` (filters by status and search query, sorts by priority/due date/created date).
* **UX States Handled**:
  1. `isLoading`: Renders 3 animated pulse skeleton cards.
  2. `isError`: Renders red error box with "Coba Lagi" retry button.
  3. `todos.length === 0`: Renders dashed-border empty state illustration.
  4. `processedTodos.length === 0`: Renders search/filter empty state prompt.
  5. Success: Maps `processedTodos` to `TodoItem` components.

### 3.2 `TodoItem` (`frontend/src/features/todos/components/TodoItem.tsx`)
* **Props**: `{ todo: Todo, onEdit: (todo: Todo) => void }`
* **Local State**: Computed `isOverdue` boolean and `formattedDueDate` string.
* **Stores Read**: `useAuthStore` (`isAdmin`).
* **Hooks / Actions**:
  - `useToggleComplete`: Triggers optimistic toggle mutation.
  - `useDeleteTodo`: Triggers optimistic deletion with `window.confirm`.
* **Visual Elements**: Completion checkbox, priority badge (`Low`, `Medium`, `High`), due date warning with `(Terlambat)` indicator, role-aware Admin owner badge (`Owner: {ownerId}`), edit and delete buttons.

### 3.3 `TodoForm` (`frontend/src/features/todos/components/TodoForm.tsx`)
* **Props**: None.
* **Local State**: `title`, `description`, `priority` (`Medium` default), `dueDate`, `error`.
* **Hooks / Actions**: `useCreateTodo` mutation.
* **Validation**: Checks `!title.trim()` on client before firing mutation. Clears form upon successful creation.

### 3.4 `TodoFilterBar` (`frontend/src/features/todos/components/TodoFilterBar.tsx`)
* **Props**: None.
* **Stores Read/Write**: `useTodoUiStore` (`filter`, `setFilter`, `sortBy`, `setSortBy`, `sortOrder`, `toggleSortOrder`, `searchQuery`, `setSearchQuery`).
* **Visual Elements**: Search text input with icon, status filter buttons (`Semua`, `Aktif`, `Selesai`), sort criteria select dropdown, and ascending/descending toggle button.

### 3.5 `TodoEditModal` (`frontend/src/features/todos/components/TodoEditModal.tsx`)
* **Props**: `{ todo: Todo | null, isOpen: boolean, onClose: () => void }`
* **Local State**: Form drafts initialized from `todo` prop via `useEffect`: `title`, `description`, `priority`, `dueDate`, `isCompleted`, `error`.
* **Hooks / Actions**: `useUpdateTodo` mutation.
* **Elements**: Fixed modal backdrop with `backdrop-blur-sm`, title input, description textarea, priority dropdown, date picker, completion checkbox, cancel, and save buttons.

### 3.6 `UserTable` (`frontend/src/features/admin/components/UserTable.tsx`)
* **Props**:
  ```typescript
  interface UserTableProps {
    users: UserSummary[];
    onRoleChange: (user: UserSummary, newRole: string) => void;
    onToggleLock: (user: UserSummary) => void;
    onDelete: (user: UserSummary) => void;
    isUpdating?: boolean;
  }
  ```
* **Stores Read**: `useAuthStore` (`currentUser`).
* **Self-Protection Guard**: Computes `isSelf = (currentUser.id === u.id || currentUser.email === u.email)`.
  - For active admin: Displays `"Anda"` badge, disables role modification, hides lock/delete buttons, and displays `"Tidak dapat diubah"`.
  - For other users: Renders role dropdown (`User` / `Admin`), lock/unlock toggle button, and delete button.

---

## 4. Reusable UI Primitives (`frontend/src/components/ui/`)

1. **`Button.tsx`**:
   - Props: `ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`.
   - Variants: `primary` (blue), `secondary` (gray border), `danger` (red).
   - Sizes: `sm`, `md`, `lg`.
   - Loading: Displays embedded animated `<Spinner />` and sets `disabled`.
2. **`Input.tsx`**:
   - Props: `InputProps extends React.InputHTMLAttributes<HTMLInputElement>` with `label`, `error`, `helperText`.
   - Implemented with `React.forwardRef` to support focus management and external refs.
3. **`ConfirmDialog.tsx`**:
   - Accessible confirmation modal for destructive operations (user deletion).
   - Backdrop blur, alert icon, configurable confirm/cancel labels, loading indicator.
4. **`Toast.tsx`**:
   - Dismissible notification banner supporting `success`, `error`, and `info` types.
   - Built with automatic cleanup timer via `useEffect` (`setTimeout` / `clearTimeout`).
5. **`Card.tsx`**: Styled rounded container with subtle border and shadow.
6. **`Spinner.tsx`**: SVG loading spinner supporting `sm`, `md`, and `lg` sizes.

---

## 5. State Management Stores

### 5.1 `useAuthStore` (`frontend/src/stores/authStore.ts`)
* **Type**: Zustand store with `persist` middleware.
* **Storage**: `localStorage` under key `"auth-storage"`.
* **State**:
  - `token`: `string | null`
  - `user`: `{ id?: string, email: string, fullName: string, roles: string[] } | null`
* **Actions**:
  - `setAuth(dataOrToken, legacyUser?)`: Saves token and user details.
  - `logout()` / `clearAuth()`: Wipes token and user details from memory and `localStorage`.
  - `isAuthenticated()`: Returns `true` if token and user exist.
  - `isAdmin()`: Returns `true` if `user.roles.includes('Admin')`.
* **Readers**: `client.ts` (Axios interceptors), `ProtectedRoute.tsx`, `AppLayout.tsx`, `UserTable.tsx`, `TodoItem.tsx`.

### 5.2 `useTodoUiStore` (`frontend/src/features/todos/store/todoUiStore.ts`)
* **Type**: In-memory client UI Zustand store.
* **State**:
  - `filter`: `'all' | 'active' | 'completed'`
  - `sortBy`: `'createdAt' | 'dueDate' | 'priority'`
  - `sortOrder`: `'asc' | 'desc'`
  - `searchQuery`: `string`
* **Actions**: `setFilter`, `setSortBy`, `setSortOrder`, `toggleSortOrder`, `setSearchQuery`.
* **Readers**: `TodoList.tsx`, `TodoFilterBar.tsx`.


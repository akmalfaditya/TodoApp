# Modern React.js & Frontend Architecture: A Comprehensive Deep Dive

Welcome to the comprehensive architectural and educational guide for the **TodoApp Frontend**. This document is designed specifically as a masterclass for learning modern, production-grade **React.js (React 19)**, **TypeScript**, **Tailwind CSS**, and modern frontend engineering best practices.

Whether you are transitioning from beginner React tutorials or looking to understand how enterprise web applications are structured, this guide dissects every directory, component, custom hook, store, and design pattern used in this project.

---

## Table of Contents
1. [The Modern React Philosophy & Mindset Shift](#1-the-modern-react-philosophy--mindset-shift)
2. [Project Architecture: Feature-Based (Screaming Architecture)](#2-project-architecture-feature-based-screaming-architecture)
3. [Build Tooling & Infrastructure: Vite, TypeScript, and Tailwind CSS](#3-build-tooling--infrastructure-vite-typescript-and-tailwind-css)
4. [State Management Mastery: The 3-Tier State Rule](#4-state-management-mastery-the-3-tier-state-rule)
5. [Networking & HTTP Client: Axios and Interceptor Patterns](#5-networking--http-client-axios-and-interceptor-patterns)
6. [Server State & Optimistic UI Updates: TanStack Query v5](#6-server-state--optimistic-ui-updates-tanstack-query-v5)
7. [Declarative Routing & Security: React Router DOM v7](#7-declarative-routing--security-react-router-dom-v7)
8. [Component Design System & UI Patterns](#8-component-design-system--ui-patterns)
9. [Form Handling & Defensive Validation](#9-form-handling--defensive-validation)
10. [Testing Like a Pro: Vitest and React Testing Library](#10-testing-like-a-pro-vitest-and-react-testing-library)
11. [Common React Anti-Patterns & How We Avoided Them](#11-common-react-anti-patterns--how-we-avoided-them)
12. [Hands-On Practice Exercises](#12-hands-on-practice-exercises)

---

## 1. The Modern React Philosophy & Mindset Shift

Beginner React tutorials often teach an outdated or oversimplified mental model:
- Put every piece of data in `useState`.
- Fetch data in `useEffect`.
- Pass state and callbacks down through multiple levels of components (prop drilling).
- Mix network logic, UI rendering, and business algorithms in a single 400-line component.

In a **production-grade React application**, that approach leads to:
- **Race conditions**: When multiple network requests finish out of order.
- **Cache invalidation nightmares**: Stale data appearing after an edit or delete.
- **Unnecessary re-renders**: Because components depend on large, monolithic state objects.
- **Difficult maintenance & testing**: Because logic is tightly coupled to DOM elements.

### The Modern Principles Applied Here:
1. **Declarative UI**: UI is a pure function of state: `UI = f(state)`. You declare *what* the UI should look like for a given state, rather than imperatively manipulating the DOM.
2. **Strict Separation of Concerns**:
   - **UI Components** only care about layout, styling, and user interaction.
   - **Custom Hooks** encapsulate business logic and data mutations.
   - **API Modules** encapsulate raw HTTP requests.
   - **Stores** manage global state outside the React render tree.
3. **State Specialization**: Never treat remote server data the same way as local UI state. Use the right tool for each job.

---

## 2. Project Architecture: Feature-Based (Screaming Architecture)

In traditional small projects, developers organize files by **technical category**:
```
src/
├── components/   # All components for everything mixed together
├── hooks/        # All hooks for everything mixed together
├── pages/        # All pages
└── services/     # All API calls
```
When an application grows to 50+ components, this structure falls apart. If you need to modify the "Todo" feature, you must jump across 5 different folders.

### Our Architecture: Feature-Based Structure
In this codebase, we use **Feature-Based Architecture** (also known as *Screaming Architecture*, because the folder structure screams what the business domain is):

```
frontend/src/
├── api/                   # Global API client & Axios configuration
│   └── client.ts          # Axios instance with request/response interceptors
├── assets/                # Static assets (images, SVGs)
├── components/            # Cross-cutting, domain-agnostic UI elements
│   ├── layout/            # Layout shells (AppLayout, AuthLayout)
│   └── ui/                # Atomic reusable components (Button, Input, Card, etc.)
├── features/              # Feature modules (Business domains)
│   ├── admin/             # Admin management domain
│   │   ├── __tests__/     # Feature-specific unit and integration tests
│   │   ├── components/    # Components unique to admin (e.g., UserTable)
│   │   ├── hooks/         # React Query hooks for admin queries & mutations
│   │   ├── pages/         # Top-level route pages (AdminUsersPage)
│   │   └── api.ts         # Direct HTTP calls for admin endpoints
│   ├── auth/              # Authentication domain
│   │   ├── __tests__/
│   │   ├── hooks/         # useLogin, useRegister
│   │   ├── pages/         # LoginPage, RegisterPage
│   │   └── api.ts         # login, register API endpoints
│   └── todos/             # Todo CRUD domain
│       ├── __tests__/
│       ├── components/    # TodoForm, TodoList, TodoItem, TodoFilterBar, TodoEditModal
│       ├── hooks/         # useTodosQuery, useCreateTodo, useToggleComplete, etc.
│       ├── pages/         # TodosPage
│       ├── store/         # Zustand store for client UI filter/sort state
│       └── api.ts         # fetchTodos, createTodo, updateTodo, deleteTodo
├── lib/                   # Third-party library initializations (TanStack Query client)
├── routes/                # Centralized router configuration & route guards
│   ├── AppRouter.tsx      # Route table definition
│   ├── ProtectedRoute.tsx # Authentication & RBAC guard
│   └── NotFoundPage.tsx   # 404 fallback page
├── stores/                # Global app-wide state (Zustand authStore)
│   └── authStore.ts
├── styles/                # Global styling and Tailwind directives
│   └── index.css
└── types/                 # TypeScript type contracts mirroring backend DTOs
    ├── admin.ts
    ├── auth.ts
    └── todo.ts
```

### Why this is a Best Practice:
- **Colocation**: Everything related to "todos" lives inside `features/todos/`. If you delete or refactor the todo feature, you touch one folder.
- **High Cohesion, Low Coupling**: Features communicate through well-defined global stores or routing parameters, not by reaching into each other's private internals.
- **Scalability**: New developers can understand where to look in 5 seconds.

---

## 3. Build Tooling & Infrastructure: Vite, TypeScript, and Tailwind CSS

### 1. Vite 8 (`vite.config.ts`)
Instead of bundling every single file on change (like older Webpack setups), **Vite** leverages native browser **ES Modules (ESM)**. In development, files are served on-demand, resulting in sub-millisecond Hot Module Replacement (HMR).

### 2. TypeScript (`tsconfig.json`, `tsconfig.app.json`)
Notice how we define types in `src/types/`:
```typescript
// src/types/todo.ts
export type TodoPriority = 'Low' | 'Medium' | 'High';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  priority: TodoPriority;
  dueDate: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string | null;
}
```
**Best Practice**: Types in the frontend are an exact reflection of the backend's Data Transfer Objects (DTOs). When the backend changes, TypeScript will immediately flag compile errors across any component using modified fields.

### 3. Tailwind CSS 3.4 (`tailwind.config.js`)
Instead of writing custom `.css` files for every component with arbitrary class names (`.todo-item-container`, `.todo-item-inner-wrapper`), Tailwind provides atomic utility classes:
- `flex items-center justify-between`
- `p-4 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md`
- Responsive prefixes: `sm:flex-row flex-col` (mobile-first design).
- State variants: `hover:text-blue-600 focus:ring-2 disabled:cursor-not-allowed`.

---

## 4. State Management Mastery: The 3-Tier State Rule

One of the most important concepts to master in modern React is knowing **where state belongs**. We divide state into 3 distinct tiers:

| State Tier | What It Represents | Tool Used | Example in This Project |
|---|---|---|---|
| **1. Server State** | Remote data from the database, async, shared by multiple users, requires caching and sync. | **TanStack Query (React Query v5)** | `todos`, `users`, mutations (create, update, delete). |
| **2. Client UI State** | Synchronous state controlling the interface across multiple components, but not saved in database. | **Zustand** | Filter tabs (`all` / `active` / `completed`), sorting (`dueDate` / `priority`), search term (`searchQuery`). |
| **3. Persistent Session State** | Application-wide state that must survive browser reloads. | **Zustand + `persist` middleware** | JWT Auth Token, user profile (`fullName`, `email`, `roles`). |
| **4. Component Local State** | Transient state needed only by a single component. | **`useState`** | Modal open/close state, input field drafts. |

---

### Deep Dive: Persistent Auth Store with Zustand (`src/stores/authStore.ts`)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthResponse } from '../types/auth';

export interface AuthUserData {
  email: string;
  fullName: string;
  roles: string[];
  id?: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUserData | null;
  setAuth: (dataOrToken: AuthResponse | string, legacyUser?: AuthUserData) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (dataOrToken) => {
        if (typeof dataOrToken === 'string') {
          set({ token: dataOrToken, user: null });
        } else {
          set({
            token: dataOrToken.token,
            user: {
              email: dataOrToken.email,
              fullName: dataOrToken.fullName,
              roles: dataOrToken.roles,
              id: dataOrToken.id,
            },
          });
        }
      },
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token && !!get().user,
      isAdmin: () => get().user?.roles?.includes('Admin') ?? false,
    }),
    {
      name: 'auth-storage', // Key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

#### Why Zustand is superior to Context API + Redux for client state:
1. **Zero Boilerplate**: No actions, reducers, dispatchers, or provider nesting required.
2. **Access Outside React**: Notice how `useAuthStore.getState().token` can be read directly inside Axios interceptors without needing a React hook or component.
3. **Selective Subscriptions**: Components only re-render if the specific property they select changes:
   ```typescript
   // Only re-renders if 'isAdmin' changes, NOT if user's name changes!
   const isAdmin = useAuthStore((state) => state.isAdmin());
   ```

---

### Deep Dive: Client UI State (`src/features/todos/store/todoUiStore.ts`)

When a user types in the search bar or clicks "Completed", that information does not belong in the database or server. It's client UI state:

```typescript
import { create } from 'zustand';

export type TodoFilter = 'all' | 'active' | 'completed';
export type TodoSortBy = 'dueDate' | 'priority' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface TodoUiState {
  filter: TodoFilter;
  sortBy: TodoSortBy;
  sortOrder: SortOrder;
  searchQuery: string;
  setFilter: (filter: TodoFilter) => void;
  setSortBy: (sortBy: TodoSortBy) => void;
  toggleSortOrder: () => void;
  setSearchQuery: (query: string) => void;
}

export const useTodoUiStore = create<TodoUiState>((set) => ({
  filter: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  searchQuery: '',
  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),
  toggleSortOrder: () =>
    set((state) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
```

Notice how `TodoFilterBar.tsx` updates this store, and `TodoList.tsx` reads it. There is **zero prop drilling** between the filter bar and the list!

---

## 5. Networking & HTTP Client: Axios and Interceptor Patterns

All HTTP traffic passes through a configured Axios instance in `src/api/client.ts`.

```typescript
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Attach JWT Bearer token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Why this is a Best Practice:
1. **Don't Repeat Yourself (DRY)**: Individual API functions never have to manually specify `headers: { Authorization: ... }`.
2. **Graceful Expiration**: If a user's token expires while they are working, any subsequent API call returns `401`. The interceptor immediately wipes the storage and redirects them to the login page cleanly.

---

## 6. Server State & Optimistic UI Updates: TanStack Query v5

**TanStack Query** (React Query) is the industry standard for managing remote data in React. It eliminates `useEffect` data fetching entirely.

### What TanStack Query Gives You For Free:
- **Automatic Caching**: Data fetched once is cached in memory.
- **Deduplication**: If 3 components ask for `useTodosQuery()`, only 1 network request is sent.
- **Stale-While-Revalidate**: Instant rendering from cache while background requests refresh data.
- **Window Refocus Re-fetching**: Automatically updates data when the user switches tabs back to your app.

---

### The Crown Jewel Pattern: Optimistic Updates (`src/features/todos/hooks/useTodos.ts`)

In traditional apps, when you check a todo item:
1. User clicks checkbox.
2. Spinner appears for 500ms while waiting for backend.
3. Checkmark finally toggles.
*Result: Sluggish, clunky user experience.*

With **Optimistic Updates**:
1. User clicks checkbox.
2. UI toggles **instantly** (0ms latency).
3. Network request happens in the background.
4. If the server request succeeds, the cache is refreshed silently.
5. If the server request fails, the UI automatically **rolls back** to its previous state and shows an error message.

Here is the exact code from `src/features/todos/hooks/useTodos.ts`:

```typescript
export const useToggleComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleComplete(id),

    // Step A: Runs immediately before the network request is fired
    onMutate: async (id) => {
      // 1. Cancel outgoing queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });

      // 2. Snapshot current todos before modifying (for rollback)
      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY);

      // 3. Optimistically update TanStack Query cache right now!
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.map((item) =>
          item.id === id
            ? { ...item, isCompleted: !item.isCompleted, updatedAt: new Date().toISOString() }
            : item
        )
      );

      // 4. Return context containing the rollback snapshot
      return { previousTodos };
    },

    // Step B: Runs ONLY if the server returned an error (e.g. 500 or Network Disconnected)
    onError: (_err, _id, context) => {
      if (context?.previousTodos) {
        // Rollback cache to exact state before click
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },

    // Step C: Runs always (success or error) to ensure fresh sync with backend
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};
```

---

## 7. Declarative Routing & Security: React Router DOM v7

In React Router v7, routing is declared using objects and `createBrowserRouter` (`src/routes/AppRouter.tsx`).

### Route Structure Visualized:
```
/login           ──> AuthLayout ──> LoginPage
/register        ──> AuthLayout ──> RegisterPage
/                ──> ProtectedRoute ──> AppLayout ──> TodosPage
/admin/users     ──> ProtectedRoute(Role="Admin") ──> AppLayout ──> AdminUsersPage
* (Any other)    ──> NotFoundPage (404)
```

### The Route Guard (`src/routes/ProtectedRoute.tsx`):
```typescript
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);

  // 1. Check Login Status
  if (!isAuthenticated) {
    // Saves location so we can redirect back after successful login!
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Role Authorization (RBAC)
  if (requiredRole) {
    const hasRole = user?.roles?.includes(requiredRole) ?? false;
    if (!hasRole) {
      // Redirect regular users to "/" without revealing admin routes exist
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
```

> [!IMPORTANT]
> **Crucial Security Best Practice**:
> Client-side route protection is purely for **User Experience** (hiding inaccessible pages and guiding the user). True security is **ALWAYS enforced on the Backend API**. Even if someone bypasses JavaScript routing, the backend returns `401 Unauthorized` or `403 Forbidden`.

---

## 8. Component Design System & UI Patterns

### 1. Atomic UI Component: `Button.tsx`
Look at how our `Button` component handles polymorphic styling and loading states cleanly:

```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  ...props // Passes through onClick, type, title, etc.
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed shadow-sm',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {isLoading && <Spinner size={size === 'lg' ? 'md' : 'sm'} className="mr-2" />}
      {children}
    </button>
  );
};
```

### 2. High-Performance Memoization in `TodoList.tsx`
When filtering and sorting a list of 100 items, you should not re-run expensive array operations on every tiny render. We use `useMemo`:

```typescript
const processedTodos = useMemo(() => {
  if (!todos) return [];
  let result = [...todos];

  // 1. Filter by status
  if (filter === 'active') result = result.filter((t) => !t.isCompleted);
  else if (filter === 'completed') result = result.filter((t) => t.isCompleted);

  // 2. Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  // 3. Multi-criteria sorting
  result.sort((a, b) => {
    /* comparison logic */
  });

  return result;
}, [todos, filter, sortBy, sortOrder, searchQuery]);
```
`processedTodos` is **only recomputed** when one of its 5 dependencies changes.

### 3. The 4 States of Async UI
Notice how `TodoList.tsx` handles every possible UX state explicitly:
1. **Loading State**: Renders animated pulse skeleton cards (`isLoading`).
2. **Error State**: Renders an alert box with a "Coba Lagi" (Retry) button (`isError`).
3. **Empty State**: Renders a friendly prompt when zero todos exist (`todos.length === 0`).
4. **Filtered Empty State**: Renders a prompt when todos exist, but none match the search/filter criteria.
5. **Success State**: Renders the mapped list of `TodoItem`s.

---

## 9. Form Handling & Defensive Validation

Let's look at `LoginPage.tsx` and `RegisterPage.tsx` to understand form best practices:

### 1. Controlled Inputs vs Uncontrolled Inputs
In our forms, we use **controlled components** where React state is the single source of truth:
```typescript
<Input
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    if (clientErrors.email) setClientErrors((prev) => ({ ...prev, email: undefined }));
  }}
  error={clientErrors.email}
/>
```
Notice how typing into the input **clears the error message instantly**, giving immediate feedback to the user!

### 2. Defensive Validation Before Network Call
```typescript
const validate = (): boolean => {
  const errors: { email?: string; password?: string } = {};

  if (!email.trim()) {
    errors.email = 'Email wajib diisi.';
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'Format email tidak valid.';
  }

  if (!password) {
    errors.password = 'Password wajib diisi.';
  }

  setClientErrors(errors);
  return Object.keys(errors).length === 0;
};
```
By validating on the client first:
- Users get feedback in 0ms without waiting for a round-trip to the server.
- The backend server is protected from handling malformed requests.

---

## 10. Testing Like a Pro: Vitest and React Testing Library

This project includes **34 automated frontend tests** covering stores, API client functions, routing, and UI components.

### The Guiding Principle of React Testing Library:
> *"The more your tests resemble the way your software is used, the more confidence they can give you."* — Kent C. Dodds

We do **not** test internal component state variables (`wrapper.state('isOpen')`). Instead, we test what the **user sees and does**:
- Does text appear on screen? (`screen.findByText(...)`)
- Does clicking a button fire the action? (`fireEvent.click(...)`)
- Are unauthorized buttons hidden or disabled?

### Example: Testing Self-Protection in `UserTable.test.tsx`
In `UserTable.tsx`, an active admin must not be allowed to lock, demote, or delete themselves:

```typescript
it('enforces self-protection: disables/hides action buttons for logged in admin', () => {
  render(
    <UserTable
      users={mockUsers}
      onRoleChange={onRoleChange}
      onToggleLock={onToggleLock}
      onDelete={onDelete}
    />
  );

  // Self admin row shows "Anda" badge and "Tidak dapat diubah" text
  expect(screen.getByText('Anda')).toBeDefined();
  expect(screen.getByText('Tidak dapat diubah')).toBeDefined();
});
```

---

## 11. Common React Anti-Patterns & How We Avoided Them

| Anti-Pattern (Bad Practice) | Why It Causes Bugs | Our Solution in This Project |
|---|---|---|
| **Data Fetching in `useEffect`** | Race conditions, memory leaks, no caching, duplicate calls. | **TanStack Query (`useQuery`)** handles caching, deduplication, and lifecycle automatically. |
| **Storing Derived State in `useState`** | e.g. storing `filteredTodos` in state alongside `todos`. Causes desynchronization bugs. | Compute derived values on-the-fly inside **`useMemo`**. |
| **Direct Mutation of State** | e.g. `todos.push(newTodo)`. React cannot detect object identity changes, causing missed re-renders. | Always produce immutable copies: `[...todos, newTodo]` or `todos.map(...)`. |
| **Prop Drilling 5 Levels Deep** | Clutters intermediate components with props they don't even use. | Use **Zustand stores** for UI/Auth state and **TanStack Query** for data. |
| **Not Cleaning Up Timers** | Setting `setTimeout` in `useEffect` without returning `clearTimeout`. | See `Toast.tsx`: always returns `() => clearTimeout(timer)` to prevent memory leaks when unmounting. |

---

## 12. Hands-On Practice Exercises

To cement your understanding of React and this codebase, try implementing these 5 progressive exercises:

### Exercise 1 (Beginner): Add a "Characters Left" Counter
- **Location**: `src/features/todos/components/TodoForm.tsx`
- **Goal**: Limit the title input to 100 characters. Display a small counter underneath the input showing how many characters are remaining (e.g., `85 / 100 characters left`). If the remaining characters drop below 10, turn the text red using Tailwind classes.

### Exercise 2 (Intermediate): Add a "Clear All Completed" Button
- **Location**: `src/features/todos/components/TodoFilterBar.tsx`
- **Goal**: Add a button that only appears when there is at least one completed todo. When clicked, display a confirmation dialog. If confirmed, delete all completed todos using a custom mutation hook.

### Exercise 3 (Intermediate): Add Dark Mode Toggle
- **Location**: `src/components/layout/AppLayout.tsx` and a new Zustand store `src/stores/themeStore.ts`.
- **Goal**: Create a persistent Zustand store for `theme` (`'light' | 'dark'`). Toggle the `dark` class on the HTML `document.documentElement` element and adapt header and background colors.

### Exercise 4 (Advanced): Add Pagination to `UserTable.tsx`
- **Location**: `src/features/admin/components/UserTable.tsx`
- **Goal**: If there are more than 5 users, show pagination controls (*Previous*, *Page 1 of N*, *Next*). Manage the current page state and compute the sliced array using `useMemo`.

### Exercise 5 (Mastery): Optimistic Delete with Undo Toast
- **Location**: `src/features/todos/hooks/useTodos.ts` and `src/components/ui/Toast.tsx`
- **Goal**: When deleting a todo, immediately remove it from the screen optimistically and show a Toast with an "Undo" action button for 5 seconds. If the user clicks "Undo", restore the todo; otherwise, send the `DELETE` request to the backend after the timer expires.

---

*Authored for the TodoApp Full-Stack Learning Project.*


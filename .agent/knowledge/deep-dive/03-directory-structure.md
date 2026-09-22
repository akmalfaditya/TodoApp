# 03 — Annotated Directory Structure

This document provides a complete directory map of the TodoApp repository with explanations of what each folder contains and why it exists.

---

## 1. Top-Level Repository Overview

```
TodoApp/
├── .agent/                      # Machine & human readable repository knowledge base (governed by knowledgecache)
├── .agents/                     # Specialized agentic AI skill definitions (knowledgecache, backend, frontend, etc.)
├── .git/                        # [EXCLUDED] Git version control internals
├── backend/                     # .NET 8 backend solution and source projects
├── frontend/                    # React 19 + TypeScript + Vite single-page application
├── .gitignore                   # Version control ignore definitions
├── frontend_explanations.md     # Deep-dive educational guide on React 19 architecture
└── README.md                    # Root project documentation and setup manual
```

---

## 2. Backend Directory Tree (`backend/`)

```
backend/
├── TodoApp.sln                                          # Solution file orchestrating all 5 backend projects
│
├── src/                                                 # Production source code
│   ├── TodoApp.Domain/                                  # Pure Domain layer (0 external dependencies)
│   │   ├── TodoApp.Domain.csproj                        # Class library project definition (.NET 8)
│   │   ├── Entities/                                    # Domain POCO entities
│   │   │   ├── BaseEntity.cs                            # Abstract entity base (Id, CreatedAt, UpdatedAt)
│   │   │   └── TodoItem.cs                              # Core aggregate entity (Title, DueDate, Priority, OwnerId)
│   │   ├── Enums/                                       # Domain enumerations
│   │   │   └── TodoPriority.cs                          # Priority values: Low, Medium, High
│   │   ├── Exceptions/                                  # Custom domain exception types
│   │   │   ├── NotFoundException.cs                     # Entity lookup failure (maps to 404)
│   │   │   ├── ForbiddenException.cs                    # Unauthorized resource access attempt (maps to 403)
│   │   │   └── ValidationAppException.cs                # Business validation failure (maps to 400)
│   │   └── Interfaces/                                  # Repository abstractions
│   │       ├── IGenericRepository.cs                    # Generic repository CRUD contract
│   │       └── ITodoRepository.cs                       # Todo repository contract (GetByOwnerIdAsync, etc.)
│   │
│   ├── TodoApp.Application/                             # Business logic layer (Use Cases, DTOs, Contracts)
│   │   ├── TodoApp.Application.csproj                   # Project definition (references Domain, AutoMapper, FluentValidation)
│   │   ├── Common/                                      # Cross-cutting application patterns
│   │   │   ├── BaseService.cs                           # Abstract base service providing FluentValidation helper
│   │   │   ├── Constants/                               # Shared string constants
│   │   │   │   └── Roles.cs                             # System roles: "Admin" and "User"
│   │   │   ├── Extensions/                              # DI registration extensions
│   │   │   │   └── ServiceCollectionExtensions.cs       # Registers AutoMapper & FluentValidation assembly scanning
│   │   │   ├── Mappings/                                # AutoMapper base configurations
│   │   │   │   └── MappingProfile.cs                    # Assembly-level profile marker
│   │   │   └── Models/                                  # Operation result wrappers
│   │   │       └── ServiceResult.cs                     # ServiceResult<T> encapsulating success/data/error type
│   │   ├── Features/                                    # Feature-oriented application use cases
│   │   │   ├── Admin/                                   # Admin feature contracts and DTOs
│   │   │   │   ├── IAdminUserService.cs                 # User & role management service interface
│   │   │   │   ├── Dtos/                                # Data transfer objects for admin operations
│   │   │   │   │   ├── UpdateUserRoleRequestDto.cs      # Role modification payload
│   │   │   │   │   └── UserSummaryDto.cs                # User summary for administrative listing
│   │   │   │   └── Validators/                          # FluentValidation rules for admin requests
│   │   │   │       └── UpdateUserRoleRequestDtoValidator.cs # Validates role must be Admin or User
│   │   │   ├── Auth/                                    # Authentication contracts and DTOs
│   │   │   │   ├── IAuthService.cs                      # Login and registration service interface
│   │   │   │   └── Dtos/                                # Authentication request & response payloads
│   │   │   │       ├── AuthResponseDto.cs               # JWT token, expiry, and user summary response
│   │   │   │       ├── LoginRequestDto.cs               # Email and password login payload
│   │   │   │       └── RegisterRequestDto.cs            # User registration payload
│   │   │   └── Todos/                                   # Todo feature logic
│   │   │       ├── ITodoService.cs                      # Todo CRUD business interface
│   │   │       ├── TodoService.cs                       # Implementation orchestrating repo, mapper, and validator
│   │   │       ├── Dtos/                                # Todo request and response DTOs
│   │   │       │   ├── CreateTodoRequestDto.cs          # New task creation request
│   │   │       │   ├── TodoResponseDto.cs               # Full todo item response model
│   │   │       │   └── UpdateTodoRequestDto.cs          # Update task request model
│   │   │       ├── Mappings/                            # AutoMapper profile for Todos
│   │   │       │   └── TodoMappingProfile.cs            # Maps TodoItem <-> DTOs
│   │   │       └── Validators/                          # FluentValidation rules for Todos
│   │   │           ├── CreateTodoRequestDtoValidator.cs # Validates title, length, and future due dates
│   │   │           └── UpdateTodoRequestDtoValidator.cs # Validates title, length, and priority
│   │   ├── Identity/                                    # Application identity models
│   │   │   └── ApplicationUser.cs                       # IdentityUser subclass with FullName and CreatedAt
│   │   └── Interfaces/                                  # Security infrastructure contracts
│   │       └── IJwtTokenService.cs                      # JWT token generator interface
│   │
│   ├── TodoApp.Infrastructure/                          # Data access and technical infrastructure
│   │   ├── TodoApp.Infrastructure.csproj                # Project definition (references EF Core SQLite, Identity, JWT)
│   │   ├── DependencyInjection.cs                       # AddInfrastructure() extension registering services and DbContext
│   │   ├── Persistence/                                 # Entity Framework Core persistence
│   │   │   ├── ApplicationDbContext.cs                  # IdentityDbContext managing SQLite tables and ChangeTracker
│   │   │   ├── Configurations/                          # Fluent API entity configurations
│   │   │   │   └── TodoItemConfiguration.cs             # Schema, keys, index, and cascade delete rules
│   │   │   ├── Migrations/                              # EF Core database migrations
│   │   │   │   ├── 20260911034416_InitialCreate.cs      # Creates TodoItems and Identity tables
│   │   │   │   ├── 20260911034847_AddFullNameToApplicationUser.cs # Adds FullName column
│   │   │   │   ├── 20260911035802_AddCreatedAtToApplicationUser.cs # Adds CreatedAt column
│   │   │   │   └── ApplicationDbContextModelSnapshot.cs # EF Core compiled model metadata
│   │   │   ├── Repositories/                            # Concrete data repositories
│   │   │   │   ├── GenericRepository.cs                 # Base CRUD repository implementation
│   │   │   │   └── TodoRepository.cs                    # Todo-specific queries (GetByOwnerIdAsync)
│   │   │   └── Seed/                                    # Initial database seeder
│   │   │       └── IdentitySeeder.cs                    # Seeds Admin, John, Jane, roles, and 9 sample todos
│   │   └── Services/                                    # Concrete technical services
│   │       ├── AdminUserService.cs                      # User administration with self-protection guards
│   │       ├── AuthService.cs                           # User registration, password verification, login
│   │       └── JwtTokenService.cs                       # Generates HMAC-SHA256 JWT tokens with user claims
│   │
│   └── TodoApp.Api/                                     # Presentation layer (ASP.NET Core Web API)
│       ├── TodoApp.Api.csproj                           # Web API project definition
│       ├── Program.cs                                   # Application composition root, pipeline, and DI setup
│       ├── appsettings.json                             # Application configuration (connection string, JWT, CORS)
│       ├── appsettings.Development.json                 # Development overrides
│       ├── TodoApp.db                                   # Active SQLite database file
│       ├── Controllers/                                 # HTTP REST API Controllers
│       │   ├── AdminUsersController.cs                  # /api/admin/users endpoints (Admin-only)
│       │   ├── ApiControllerBase.cs                     # Abstract base controller mapping ServiceResult -> HTTP codes
│       │   ├── AuthController.cs                        # /api/auth endpoints (register, login, me)
│       │   └── TodosController.cs                       # /api/todos endpoints (CRUD, complete)
│       ├── Middleware/                                  # HTTP pipeline middleware
│       │   └── ExceptionHandlingMiddleware.cs           # Global error handler translating exceptions to JSON
│       └── Properties/
│           └── launchSettings.json                      # Local development launch profiles (ports, env)
│
└── tests/                                               # Automated test suites
    └── TodoApp.UnitTests/                               # xUnit backend test project
        ├── TodoApp.UnitTests.csproj                     # Test project definition
        ├── Admin/
        │   └── AdminValidatorTests.cs                   # Tests for UpdateUserRoleRequestDtoValidator
        ├── Common/
        │   └── ServiceResultTests.cs                    # Unit tests for ServiceResult success/failure branches
        ├── Domain/
        │   └── TodoItemTests.cs                         # Tests for entity initialization and domain exceptions
        ├── Middleware/
        │   └── ExceptionHandlingMiddlewareTests.cs      # Tests verifying 404, 403, 400, and safe 500 responses
        └── Todos/
            └── TodoValidatorTests.cs                    # Tests for CreateTodoRequestDtoValidator rules
```

---

## 3. Frontend Directory Tree (`frontend/`)

```
frontend/
├── index.html                                           # Single Page Application HTML entry point
├── package.json                                         # Frontend npm dependency manifest and scripts
├── package-lock.json                                    # Precise npm dependency lockfile
├── postcss.config.js                                    # PostCSS configuration running Tailwind & Autoprefixer
├── tailwind.config.js                                   # Tailwind CSS design tokens, content paths, and themes
├── tsconfig.json                                        # Root TypeScript project reference configuration
├── tsconfig.app.json                                    # Application source TypeScript compiler options
├── tsconfig.node.json                                   # Vite / tooling TypeScript configuration
├── vite.config.ts                                       # Vite build tool and dev server configuration
├── vitest.config.ts                                     # Vitest test runner configuration (jsdom environment)
├── .env                                                 # Active local environment variables (API URL)
├── .env.example                                         # Example environment variable template
├── .gitignore                                           # Frontend ignore file
├── .oxlintrc.json                                       # Oxlint linter rules
│
├── public/                                              # Static public assets served directly
│   ├── favicon.svg                                      # Application browser tab icon
│   └── icons.svg                                        # Static SVG sprite definition
│
├── dist/                                                # [EXCLUDED] Production build output
├── node_modules/                                        # [EXCLUDED] Installed npm packages
│
└── src/                                                 # Frontend source code
    ├── main.tsx                                         # React application entry point (ReactDOM.createRoot)
    ├── App.tsx                                          # Root component rendering RouterProvider
    │
    ├── api/                                             # Global network transport
    │   └── client.ts                                    # Axios singleton with Bearer injection and 401 redirect
    │
    ├── assets/                                          # Bundled static media
    │   ├── hero.png                                     # Application banner graphic
    │   ├── react.svg                                    # React logo
    │   └── vite.svg                                     # Vite logo
    │
    ├── components/                                      # Reusable, domain-agnostic UI elements
    │   ├── layout/                                      # Layout shell wrappers
    │   │   ├── AppLayout.tsx                            # Main application layout (header, nav, user badge, outlet)
    │   │   └── AuthLayout.tsx                           # Unauthenticated page centered layout (login/register)
    │   └── ui/                                          # Atomic design primitives
    │       ├── Button.tsx                               # Polymorphic button (primary, secondary, danger, loading)
    │       ├── Card.tsx                                 # Rounded border card container
    │       ├── ConfirmDialog.tsx                        # Accessible confirmation modal for destructive operations
    │       ├── index.ts                                 # Barrel export for UI primitives
    │       ├── Input.tsx                                # Text input with label, forwardRef, error state
    │       ├── Spinner.tsx                              # SVG loading spinner
    │       └── Toast.tsx                                # Notification alert banner with auto-dismiss
    │
    ├── features/                                        # Domain-specific feature modules
    │   ├── admin/                                       # Administrative management feature
    │   │   ├── api.ts                                   # Axios calls for /api/admin/users
    │   │   ├── components/
    │   │   │   └── UserTable.tsx                        # User table with role selector, lock toggle, self-safeguards
    │   │   ├── hooks/
    │   │   │   └── useAdminUsers.ts                     # TanStack Query hooks (useUsersQuery, mutations)
    │   │   ├── pages/
    │   │   │   └── AdminUsersPage.tsx                   # Top-level page with search bar, table, dialogs, toasts
    │   │   └── __tests__/
    │   │       ├── adminApi.test.ts                     # Unit tests for admin API client functions
    │   │       └── UserTable.test.tsx                   # Component tests verifying self-protection guards
    │   │
    │   ├── auth/                                        # Authentication and session management
    │   │   ├── api.ts                                   # Axios calls for /api/auth/login and /register
    │   │   ├── hooks/
    │   │   │   └── useAuth.ts                           # React Query mutation hooks (useLogin, useRegister)
    │   │   ├── pages/
    │   │   │   ├── LoginPage.tsx                        # Controlled login form with validation and error alerts
    │   │   │   └── RegisterPage.tsx                     # Registration form with password confirmation check
    │   │   └── __tests__/
    │   │       └── auth.test.ts                         # Unit tests verifying auth API and token handling
    │   │
    │   └── todos/                                       # Todo item CRUD operations
    │       ├── api.ts                                   # Axios calls for /api/todos endpoints
    │       ├── components/
    │       │   ├── TodoEditModal.tsx                    # Modal dialog for editing existing todo properties
    │       │   ├── TodoFilterBar.tsx                    # Status tabs (All/Active/Completed), sort & search controls
    │       │   ├── TodoForm.tsx                         # Controlled form for creating a new task
    │       │   ├── TodoItem.tsx                         # Individual todo card with priority styles & owner tags
    │       │   └── TodoList.tsx                         # Smart container with useMemo and 4 UX async states
    │       ├── hooks/
    │       │   └── useTodos.ts                          # React Query hooks with optimistic updates and rollback
    │       ├── pages/
    │       │   └── TodosPage.tsx                        # Main dashboard page assembling form, filter, and list
    │       ├── store/
    │       │   └── todoUiStore.ts                       # Zustand store managing filter, sort, and search query state
    │       └── __tests__/
    │           ├── TodoList.test.tsx                    # Component test verifying list rendering & owner badges
    │           ├── todosApi.test.ts                     # Unit tests for todo API client calls
    │           └── todoUiStore.test.ts                  # Unit tests for UI store filter/sort mutations
    │
    ├── lib/                                             # Library setup singletons
    │   └── queryClient.ts                               # TanStack QueryClient instance with 30s staleTime
    │
    ├── routes/                                          # Route table and navigation guards
    │   ├── AppRouter.tsx                                # createBrowserRouter route definitions
    │   ├── NotFoundPage.tsx                             # 404 fallback page
    │   ├── ProtectedRoute.tsx                           # Route guard checking authentication and required role
    │   └── __tests__/
    │       └── Routing.test.tsx                         # Integration tests verifying route protection
    │
    ├── stores/                                          # Global application state
    │   ├── authStore.ts                                 # Persistent Zustand auth store storing token & user
    │   └── __tests__/
    │       └── authStore.test.ts                        # Unit tests for auth store mutations and selectors
    │
    ├── styles/                                          # Global styling
    │   └── index.css                                    # Tailwind CSS base, components, and utilities directives
    │
    └── types/                                           # Shared TypeScript contracts mirroring backend DTOs
        ├── admin.ts                                     # UserSummary interface
        ├── auth.ts                                      # AuthResponse, LoginRequest, RegisterRequest
        └── todo.ts                                      # Todo, TodoPriority, CreateTodoPayload, UpdateTodoPayload
```


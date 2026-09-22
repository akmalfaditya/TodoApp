# 01 — Tech Stack Inventory

This document provides an exhaustive inventory of all technologies, runtimes, software development kits (SDKs), build tools, and third-party libraries across the TodoApp repository.

---

## 1. System Runtimes & SDKs

| Component | Technology | Version | Location / Manifest | Purpose in TodoApp |
|---|---|---|---|---|
| **Backend Runtime** | .NET SDK | `8.0` (C# 12) | `backend/*/*.csproj` | Core backend runtime powering ASP.NET Core web host, dependency injection, and business execution. |
| **Frontend Runtime** | Node.js | `>= 18.0.0` | `frontend/package.json` | JavaScript runtime environment executing Vite development server, Vitest test runner, and build scripts. |
| **Frontend Package Manager**| npm | `>= 9.0.0` | `frontend/package-lock.json` | Package management and dependency lock resolution. |
| **Language** | C# | `12.0` | `backend/*/*.csproj` (`net8.0`) | Strongly-typed backend programming language. |
| **Language** | TypeScript | `~6.0.2` | `frontend/package.json`, `tsconfig.json` | Strongly-typed frontend language enforcing DTO contracts and component prop validation. |

---

## 2. Backend Dependencies (.NET 8 Solution)

The backend solution (`backend/TodoApp.sln`) comprises 5 projects. Every NuGet dependency is categorized below.

### 2.1 Web Framework & Hosting
* **`Microsoft.NET.Sdk.Web`** (SDK `net8.0`):
  - **Project**: `TodoApp.Api`
  - **Usage**: Provides Kestrel web server, controller routing (`[ApiController]`, `[Route]`), middleware pipeline, and dependency injection host.
  - **Config**: Configured in `backend/src/TodoApp.Api/Program.cs` and `appsettings.json`.

### 2.2 Persistence & Database Layer (ORM)
* **`Microsoft.EntityFrameworkCore.Sqlite`** (v`8.0.11`):
  - **Project**: `TodoApp.Infrastructure`
  - **Usage**: SQLite database provider for EF Core. Manages SQLite database file (`TodoApp.db`) connection, SQL generation, and transactions.
  - **Config**: Connection string configured in `backend/src/TodoApp.Api/appsettings.json` under `"ConnectionStrings:DefaultConnection"`.
* **`Microsoft.EntityFrameworkCore.Design`** (v`8.0.11`):
  - **Projects**: `TodoApp.Infrastructure`, `TodoApp.Api`
  - **Usage**: Design-time tools used by EF Core CLI tools to generate database migrations (`dotnet ef migrations add`).
  - **Config**: Marked with `<PrivateAssets>all</PrivateAssets>` and `<IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>`.

### 2.3 Identity & Security
* **`Microsoft.AspNetCore.Identity.EntityFrameworkCore`** (v`8.0.11`):
  - **Project**: `TodoApp.Infrastructure`
  - **Usage**: Implements ASP.NET Core Identity on top of EF Core. Manages user records (`ApplicationUser`), roles (`IdentityRole`), password hashing (PBKDF2), and lockout states.
  - **Config**: Wired in `Program.cs` via `builder.Services.AddIdentity<ApplicationUser, IdentityRole>()`.
* **`Microsoft.Extensions.Identity.Stores`** (v`8.0.11`):
  - **Project**: `TodoApp.Application`
  - **Usage**: Lightweight abstraction package allowing `ApplicationUser` to inherit from `IdentityUser` inside the Application layer without referencing the full EF Core provider.
* **`Microsoft.AspNetCore.Authentication.JwtBearer`** (v`8.0.11`):
  - **Projects**: `TodoApp.Infrastructure`, `TodoApp.Api`
  - **Usage**: Middleware handler validating incoming HTTP request `Authorization: Bearer <token>` headers against symmetric key, issuer, and audience.
  - **Config**: Configured in `Program.cs` under `builder.Services.AddAuthentication().AddJwtBearer()`.
* **`System.IdentityModel.Tokens.Jwt`** (v`8.0.1`):
  - **Project**: `TodoApp.Infrastructure`
  - **Usage**: Used by `JwtTokenService` to create, sign (HmacSha256), and serialize JSON Web Tokens containing claims (`sub`, `email`, `FullName`, `role`, `jti`).
  - **Config**: Implemented in `backend/src/TodoApp.Infrastructure/Services/JwtTokenService.cs`.

### 2.4 Object Mapping & Validation
* **`AutoMapper`** (v`14.0.0`):
  - **Project**: `TodoApp.Application`
  - **Usage**: Declarative object-to-object mapping between entities (`TodoItem`) and DTOs (`TodoResponseDto`, `CreateTodoRequestDto`).
  - **Config**: Profile registered in `backend/src/TodoApp.Application/Features/Todos/Mappings/TodoMappingProfile.cs` and scanned via `builder.Services.AddAutoMapper()`.
* **`FluentValidation`** (v`11.11.0`):
  - **Project**: `TodoApp.Application`
  - **Usage**: Strongly-typed request validator engine separating validation rules from DTOs.
* **`FluentValidation.DependencyInjectionExtensions`** (v`11.11.0`):
  - **Project**: `TodoApp.Application`
  - **Usage**: Automatic discovery and DI registration of all `AbstractValidator<T>` implementations across the Application assembly.
  - **Config**: Registered in `backend/src/TodoApp.Application/Common/Extensions/ServiceCollectionExtensions.cs`.

### 2.5 API Documentation
* **`Swashbuckle.AspNetCore`** (v`6.6.2`):
  - **Project**: `TodoApp.Api`
  - **Usage**: Generates OpenAPI (Swagger) v1 JSON specification and interactive UI. Configured with JWT Bearer security definition to allow testing authenticated endpoints directly in the browser.
  - **Config**: Configured in `Program.cs` under `builder.Services.AddSwaggerGen()`.

### 2.6 Backend Testing Framework
* **`xunit`** (v`2.5.3`):
  - **Project**: `TodoApp.UnitTests`
  - **Usage**: Primary xUnit test framework runner and assertion engine.
* **`xunit.runner.visualstudio`** (v`2.5.3`):
  - **Project**: `TodoApp.UnitTests`
  - **Usage**: Adapter enabling Visual Studio, Rider, and `dotnet test` CLI integration.
* **`Microsoft.NET.Test.Sdk`** (v`17.8.0`):
  - **Project**: `TodoApp.UnitTests`
  - **Usage**: Test platform infrastructure for executing .NET tests.
* **`coverlet.collector`** (v`6.0.0`):
  - **Project**: `TodoApp.UnitTests`
  - **Usage**: Cross-platform code coverage data collector.

---

## 3. Frontend Dependencies (`frontend/package.json`)

All dependencies declared in `frontend/package.json` are listed below with version and architectural role.

### 3.1 Production Dependencies (`dependencies`)

| Package | Version | Purpose in TodoApp | Config File |
|---|---|---|---|
| **`react`** | `^19.2.8` | Declarative component model and UI rendering engine. | `package.json` |
| **`react-dom`** | `^19.2.8` | DOM renderer mounting the React tree into `<div id="root"></div>`. | `src/main.tsx` |
| **`react-router-dom`** | `^7.18.3` | Client-side declarative routing, nested layouts via `<Outlet />`, and navigation hooks (`useNavigate`, `useLocation`). | `src/routes/AppRouter.tsx` |
| **`@tanstack/react-query`** | `^5.102.8` | Asynchronous server-state management, cache synchronization, optimistic updates, and query invalidation. | `src/lib/queryClient.ts` |
| **`zustand`** | `^5.0.15` | Minimalist client UI state management (`todoUiStore.ts`) and persistent session auth store (`authStore.ts`). | `src/stores/authStore.ts`, `src/features/todos/store/todoUiStore.ts` |
| **`axios`** | `^1.20.0` | Promise-based HTTP client equipped with request interceptor (JWT bearer injection) and response interceptor (401 auto-logout). | `src/api/client.ts` |
| **`lucide-react`** | `^1.44.0` | Lightweight SVG icons (CheckSquare, Users, Lock, Unlock, Trash2, Calendar, etc.). | Component imports |
| **`clsx`** | `^2.1.1` | Utility for conditionally constructing `className` strings across UI primitives (`Button`, `Input`). | `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx` |

### 3.2 Development & Tooling Dependencies (`devDependencies`)

| Package | Version | Purpose | Config File |
|---|---|---|---|
| **`vite`** | `^8.3.0` | Fast ESM development server and Rollup production build bundler. | `frontend/vite.config.ts` |
| **`@vitejs/plugin-react`** | `^6.1.1` | Official Vite plugin providing React Fast Refresh and JSX transformation. | `frontend/vite.config.ts` |
| **`typescript`** | `~6.0.2` | Static type checker. | `frontend/tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` |
| **`tailwindcss`** | `^3.4.19` | Utility-first CSS framework generating atomic styles on demand. | `frontend/tailwind.config.js`, `postcss.config.js` |
| **`postcss`** | `^8.5.28` | CSS processing pipeline running Tailwind CSS and Autoprefixer. | `frontend/postcss.config.js` |
| **`autoprefixer`** | `^10.5.6` | PostCSS plugin parsing CSS and adding vendor prefixes automatically. | `frontend/postcss.config.js` |
| **`oxlint`** | `^1.81.0` | High-speed Rust-based JavaScript and TypeScript linter. | `frontend/.oxlintrc.json` |
| **`vitest`** | `^5.0.0` | Vite-native unit and component test runner. | `frontend/vitest.config.ts` |
| **`jsdom`** | `^29.1.1` | Pure JavaScript implementation of web standards simulating a browser DOM in Node.js for tests. | `frontend/vitest.config.ts` |
| **`@testing-library/react`** | `^16.3.3` | React testing utilities encouraging tests that reflect user behavior. | `frontend/src/**/__tests__/*.test.tsx` |
| **`@tanstack/react-query-devtools`** | `^5.102.8` | Development panel inspecting React Query cache states in development mode. | `frontend/src/main.tsx` |
| **`@types/react`** | `^19.2.18` | TypeScript type definitions for React. | `package.json` |
| **`@types/react-dom`** | `^19.2.7` | TypeScript type definitions for React DOM. | `package.json` |
| **`@types/node`** | `^24.13.3` | TypeScript type definitions for Node.js runtime APIs. | `package.json` |

---

## 4. Manifest Integrity Hashes (SHA-256)

These cryptographic hashes are tracked in `manifest.json` to detect file staleness:
* `frontend/package.json`: `507BAE979262F2356DFF7BF93FE17F4D03FF54C7C094E7CD40187643FF34F179`
* `backend/src/TodoApp.Domain/TodoApp.Domain.csproj`: `E151F959964EB450A5B86B72765E3F9C505645FA9516EAE485743D2B43911C8E`
* `backend/src/TodoApp.Application/TodoApp.Application.csproj`: `44DF9A4115C35FA80C98C98DE42BE1FF997C01B5139B2639D42C984C57F10074`
* `backend/src/TodoApp.Infrastructure/TodoApp.Infrastructure.csproj`: `49C193A9F19098D3D9DFC5BA95D14CFA64575B847ACE122C150E0982FEC40A7E`
* `backend/src/TodoApp.Api/TodoApp.Api.csproj`: `678F4D88A860116F64A86C59A9BD51111F0E3CF40B51743731B1E8961C35D702`
* `backend/tests/TodoApp.UnitTests/TodoApp.UnitTests.csproj`: `EBBFA9A89D2B5A41E2F8007511C437AD3ED4A7A971AE0B75BE88E2848423BE89`


# Codebase Map: TodoApp

## Overview
**TodoApp** is a production-grade full-stack reference application implementing an enterprise Todo and User Management system. The solution pairs an **ASP.NET Core .NET 8 Clean Architecture** backend with a **React 19 + TypeScript + Tailwind CSS** single-page application (SPA) organized around a **Feature-Based (Screaming) Architecture**.

The application serves two primary roles:
1. **Regular Users**: Manage personal tasks with complete CRUD operations, priority classification (`Low`, `Medium`, `High`), due date scheduling, and client-side filtering/sorting with optimistic UI updates. Data access is strictly sandboxed—users can only access their own items.
2. **System Administrators**: Possess elevated privileges to inspect all todos across the entire user base, oversee all registered user accounts via a dedicated administrative panel, change user roles (`User` $\leftrightarrow$ `Admin`), toggle login lockout states, and delete accounts (with cascade deletion of associated todos), all protected by active self-modification safeguards.

---

## Deep-Dive Knowledge Base Index

| Document | Summary |
|---|---|
| [**01-tech-stack.md**](deep-dive/01-tech-stack.md) | Exhaustive inventory of every backend NuGet package, frontend npm dependency, tool, runtime, and SDK version. |
| [**02-architecture.md**](deep-dive/02-architecture.md) | Architectural patterns, Clean Architecture dependency graphs, module boundaries, Mermaid diagrams, and end-to-end request lifecycles. |
| [**03-directory-structure.md**](deep-dive/03-directory-structure.md) | Fully annotated repository directory tree detailing purpose and conventions for every directory. |
| [**04-data-model.md**](deep-dive/04-data-model.md) | Comprehensive entity definitions, EF Core SQLite tables, column types, constraints, cascade rules, and Mermaid ER diagram. |
| [**05-api-contracts.md**](deep-dive/05-api-contracts.md) | Complete REST API specification covering routes, HTTP methods, authorization requirements, payloads, and status codes. |
| [**06-frontend-inventory.md**](deep-dive/06-frontend-inventory.md) | Exhaustive inventory of frontend routes, pages, components, props interfaces, Zustand stores, and TanStack Query hooks. |
| [**07-conventions.md**](deep-dive/07-conventions.md) | Real-world coding conventions, naming rules, file layouts, error-handling shapes, and DI patterns with grounded file references. |
| [**08-business-rules.md**](deep-dive/08-business-rules.md) | Plain-language domain invariants, authorization ownership rules, administrator self-protection logic, and validation rules. |
| [**09-test-coverage-map.md**](deep-dive/09-test-coverage-map.md) | Matrix of automated test coverage across xUnit backend suites and Vitest frontend suites, including uncovered areas. |
| [**10-config-and-environments.md**](deep-dive/10-config-and-environments.md) | Audit of all configuration keys, environment variables, JWT parameters, CORS policies, SQLite connection strings, and launch profiles. |
| [**11-technical-debt-register.md**](deep-dive/11-technical-debt-register.md) | Ranked technical debt inventory, churn hotspots from git history, and potential architectural fragility seams. |
| [**12-glossary.md**](deep-dive/12-glossary.md) | Dictionary of domain-specific terminology, architectural patterns, and business acronyms used throughout the project. |

---

## Setup, Run, and Test Commands

### Backend (.NET 8)
```powershell
# Restore dependencies & build solution
dotnet build backend/TodoApp.sln

# Run backend API server (runs on http://localhost:5056)
dotnet run --project backend/src/TodoApp.Api

# Run automated backend test suite (20 xUnit tests)
dotnet test backend/TodoApp.sln
```

### Frontend (React 19 + Vite)
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start local development server (runs on http://localhost:5173)
npm run dev

# Run automated frontend test suite (34 Vitest tests)
npm test

# Build for production
npm run build
```

---

## Scan Metadata & Changelog
* **Last Full Scan Date**: 2026-09-22T03:15:00Z
* **Commit**: `79404a7dd058805629bf74f7d1c0d517fd578b91`
* **Scan Mode**: `comprehensive`
* **Changelog**:
  - `2026-09-22`: Initial creation of comprehensive repository knowledge base via `knowledgecache` skill.


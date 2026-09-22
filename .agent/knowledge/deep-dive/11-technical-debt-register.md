# 11 — Technical Debt Register & Hotspot Analysis

This document catalogs code churn hotspots, technical debt markers (`TODO`, `FIXME`, `HACK`), skipped tests, and potential architectural fragility seams across the repository.

---

## 1. Technical Debt Markers (`TODO`, `FIXME`, `HACK`)

A comprehensive search of the repository (`git grep -n -w -E "TODO|FIXME|HACK"`) yielded:
* **Total Markers Found**: **0**.
* **Status**: Clean. No unresolved debt comments or temporary hacks remain in production or test files.

---

## 2. Git Churn Hotspots (Ranked by Commit Frequency)

Analysis of commit history up to HEAD (`79404a7`):

| Rank | Churn Count | File Path | Primary Reason for High Churn |
|---|---|---|---|
| **1** | 5 | `backend/src/TodoApp.Api/Program.cs` | Application composition root touched across multiple incremental specifications (JWT setup, Identity, Swagger, CORS, middleware). |
| **2** | 4 | `backend/src/TodoApp.Api/appsettings.json` | Configuration values added sequentially for SQLite, JWT secrets, seed admin password, and CORS allowed origins. |
| **3** | 4 | `backend/src/TodoApp.Api/TodoApp.Api.csproj` | Package references added for JWT Bearer, EF Core Design, and Swashbuckle Swagger. |
| **4** | 3 | `backend/src/TodoApp.Infrastructure/Persistence/Migrations/ApplicationDbContextModelSnapshot.cs` | Generated schema snapshot updated across 3 successive migrations (`InitialCreate`, `FullName`, `CreatedAt`). |
| **5** | 3 | `frontend/src/features/todos/pages/TodosPage.tsx` | Main dashboard page evolving from scaffold placeholder to fully integrated layout with modal and filters. |
| **6** | 3 | `backend/src/TodoApp.Application/TodoApp.Application.csproj` | Package references added for AutoMapper, FluentValidation, and Identity stores. |
| **7** | 3 | `frontend/vite.config.ts` | Initial setup, React plugin configuration, and separation from Vitest configuration. |
| **8** | 3 | `backend/src/TodoApp.Infrastructure/Services/AuthService.cs` | Authentication service implementation covering initial login, registration, and account lockout checks. |
| **9** | 3 | `backend/src/TodoApp.Infrastructure/DependencyInjection.cs` | Infrastructure DI extension updated as new repositories and identity services were added. |
| **10** | 3 | `frontend/src/features/admin/pages/AdminUsersPage.tsx` | Admin panel evolving from Spec 10 placeholder to Spec 13 full user management table with search and toasts. |

---

## 3. Skipped or Disabled Tests

* **Backend (xUnit)**: **0 skipped tests** (`Skipped: 0` in `dotnet test`).
* **Frontend (Vitest)**: **0 skipped tests** (no `it.skip` or `describe.skip` present across all 8 test suites).

---

## 4. Architectural Fragility Seams & Watch Items

The following areas are functioning properly but warrant attention during future feature expansions:

1. **SQLite Database Concurrency**:
   - **Risk**: SQLite uses file-level locking during writes. If the application is ever deployed in a high-concurrency multi-instance production environment, concurrent writes may throw `SqliteException (database is locked)`.
   - **Recommendation**: For production enterprise deployments, swap `Microsoft.EntityFrameworkCore.Sqlite` for `Npgsql.EntityFrameworkCore.PostgreSQL` or `Microsoft.EntityFrameworkCore.SqlServer` in `DependencyInjection.cs`.
2. **Hardcoded CORS Localhost**:
   - **Risk**: CORS allowed origins currently default to `["http://localhost:5173"]` in `appsettings.json`.
   - **Recommendation**: Ensure production deployment configurations supply `Cors__AllowedOrigins__0` via environment variables.
3. **Hardcoded JWT Key in Development Configuration**:
   - **Risk**: `appsettings.json` contains a development dummy secret.
   - **Recommendation**: Ensure CI/CD deployment pipelines prevent startup if `Jwt:Key` matches the default dummy string.


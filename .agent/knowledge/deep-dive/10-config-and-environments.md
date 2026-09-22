# 10 — Configuration & Environment Catalog

This document audits all configuration keys, environment variables, launch profiles, and network bindings across the TodoApp codebase.

---

## 1. Backend Configuration Surfaces

### 1.1 `appsettings.json` (`backend/src/TodoApp.Api/appsettings.json`)

| Configuration Path | Key / Property | Default in Repo | Purpose & Impact | Production Handling |
|---|---|---|---|---|
| `ConnectionStrings` | `DefaultConnection` | `"Data Source=TodoApp.db"` | SQLite database filename and connection path. | In production, use absolute path or migrate to SQL Server / PostgreSQL. |
| `Jwt` | `Key` | `"...MINIMAL_32_KARAKTER..."` | Symmetric HMAC-SHA256 secret key used to sign and verify JWT tokens. | **MUST** be overridden by environment variable (`Jwt__Key`) or Azure Key Vault / Secret Manager. |
| `Jwt` | `Issuer` | `"TodoApp"` | Expected issuer claim (`iss`) in JWT token. | Configurable per environment. |
| `Jwt` | `Audience` | `"TodoAppClient"` | Expected audience claim (`aud`) in JWT token. | Configurable per environment. |
| `Jwt` | `ExpiryMinutes` | `60` | Duration in minutes before issued JWT tokens expire. | Integer, typically 15–60. |
| `SeedAdmin` | `Password` | `"Admin@12345"` | Default password for initial administrator account `admin@todoapp.local`. | Override in production via `SeedAdmin__Password`. |
| `Cors` | `AllowedOrigins` | `["http://localhost:5173"]` | Array of CORS origin domains allowed to send credentials to the API. | Must include the production frontend domain. |
| `Logging:LogLevel` | `Default` | `"Information"` | Root ASP.NET Core logging level. | Set to `Warning` in high-throughput production. |
| `Logging:LogLevel` | `Microsoft.AspNetCore` | `"Warning"` | Filters out verbose framework requests. | Kept at `Warning`. |
| `AllowedHosts` | `*` | `"*"` | HTTP Host header validation. | Restrict to allowed domain names in production. |

### 1.2 `launchSettings.json` (`backend/src/TodoApp.Api/Properties/launchSettings.json`)
* **Local Development Binding**:
  - `applicationUrl`: `http://localhost:5056`
  - `environmentVariables`: `ASPNETCORE_ENVIRONMENT: "Development"`

---

## 2. Frontend Configuration Surfaces

### 2.1 Environment Variables (`frontend/.env` & `.env.example`)

| Variable Name | Default Value | Purpose & Usage in Code |
|---|---|---|
| **`VITE_API_BASE_URL`** | `http://localhost:5056/api` | Base URL used by the singleton Axios client in `frontend/src/api/client.ts`. |

* **Code Reference**:
  ```typescript
  export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5056/api',
    timeout: 10000,
  });
  ```

---

## 3. Network Topology & Port Bindings

```
[ Web Browser ]
      │
      ├── (Port 5173) ──> [ Vite Dev Server / Static SPA ]
      │
      └── (Port 5056) ──> [ ASP.NET Core Kestrel Web Host ]
                                │
                                ├── /api/auth/*
                                ├── /api/todos/*
                                ├── /api/admin/*
                                ├── /swagger (OpenAPI UI)
                                ├── /health (Liveness Probe)
                                │
                                └── SQLite Provider ──> [ TodoApp.db ]
```

---

## 4. Default Seeded Credentials (Development Environment)

These accounts are initialized automatically on startup by `IdentitySeeder.cs`:

| Role | Email | Password | Pre-seeded Todos |
|---|---|---|---|
| **Admin** | `admin@todoapp.local` | `Admin@12345` | 2 tasks (audit logs, vacuum database) |
| **User** | `john.doe@todoapp.local` | `User@12345` | 4 tasks (dev setup, CRUD API, xUnit, coffee) |
| **User** | `jane.smith@todoapp.local` | `User@12345` | 3 tasks (Figma design, feedback, PR review) |


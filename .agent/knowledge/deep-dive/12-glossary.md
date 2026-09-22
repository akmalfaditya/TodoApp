# 12 — Domain & Architectural Glossary

This document defines the domain-specific terminology, technical acronyms, and architectural patterns used across the TodoApp codebase.

---

## 1. Domain Terminology

* **Todo / TodoItem**: The central aggregate entity in the application representing a single task. Holds an ID, Title, optional Description, Priority, optional DueDate, completion flag, owner ID, and audit timestamps.
* **TodoPriority**: An enumeration representing task urgency: `Low`, `Medium`, or `High`. Stored in SQLite as a string and converted by EF Core.
* **OwnerId**: The unique identifier of the user account that created a particular `TodoItem`. Used to enforce user-scoped multi-tenancy and data isolation.
* **ApplicationUser**: Subclass of ASP.NET Core Identity's `IdentityUser` storing extended profile information including `FullName` and account `CreatedAt`.
* **Role**: An authorization category assigned to users. TodoApp defines two standard roles: `User` (standard tenant) and `Admin` (system administrator).
* **Lockout (`isLocked`)**: An administrative security feature where a user's `LockoutEnd` timestamp is set into the future, prohibiting login authentication even if credentials are correct.
* **Self-Protection Guard**: Safety invariant enforced at backend and frontend layers preventing an authenticated administrator from accidentally changing their own role, locking their own account, or deleting their own account.

---

## 2. Architectural & Technical Terminology

* **Clean Architecture**: A software architecture style emphasizing separation of concerns and the Inward Dependency Rule, ensuring core business logic does not depend on database or UI technologies.
* **POCO (Plain Old CLR Object)**: A class unencumbered by framework-specific inheritance or attributes. `TodoApp.Domain` consists purely of POCO entities and abstractions.
* **Inward Dependency Rule**: Architectural principle dictating that source code dependencies must only point inward toward higher-level policies (Presentation $\rightarrow$ Infrastructure $\rightarrow$ Application $\rightarrow$ Domain).
* **Service Result Pattern**: Design pattern replacing exception-based control flow with a standardized result wrapper (`ServiceResult<T>`) containing boolean status, payload, error message, and explicit `ServiceErrorType`.
* **ServiceErrorType**: Enum categorizing business failures: `None`, `NotFound`, `Forbidden`, `Validation`, `Unauthorized`, `Conflict`, `BadRequest`.
* **Fluent API**: An EF Core configuration technique using method chaining (`IEntityTypeConfiguration<T>`) to map entities to relational schemas outside the entity classes.
* **FluentValidation**: Third-party .NET library allowing declarative, strongly typed validation rules (`AbstractValidator<T>`) separated from DTO classes.
* **AutoMapper**: Object-to-object mapping library that automates property transfer between EF Core entities and network DTOs.
* **JWT (JSON Web Token)**: A compact, URL-safe standard (RFC 7519) for transmitting claims securely between the client and server, signed with HMAC-SHA256.
* **Claims**: Statements about an entity (user) such as `sub` (subject/user ID), `email`, `role`, and `FullName` carried inside a JWT.
* **PBKDF2**: Password-Based Key Derivation Function 2 used by ASP.NET Core Identity to hash passwords with salt and high iteration counts.
* **Optimistic UI Update**: Frontend UI pattern where client state is mutated immediately upon user interaction (0ms latency), assuming server success, while sending the network request in the background and rolling back if an error occurs.
* **Stale-While-Revalidate**: Caching strategy employed by TanStack Query where stale cached data is immediately rendered while fresh data is fetched in the background.
* **Zustand**: Minimalist, unopinionated state management library for React based on simplified flux principles with zero boilerplate.
* **Screaming Architecture (Feature-Based)**: Frontend folder organization where top-level directories name business domains (`features/todos`, `features/auth`, `features/admin`) rather than technical types (`components/`, `hooks/`).
* **Route Guard (`ProtectedRoute`)**: React Router component intercepting route transitions to verify authentication tokens and role authorization before rendering protected children.


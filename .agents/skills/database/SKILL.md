---
name: database
description: database design, EF Core 8, SQL Server, migrations, query optimization, and schema evolution for high-throughput enterprise applications.
---
# Skill: EF Core 8 & SQL Server Database Specialist

## 1. System Role & Trigger Criteria
* **Role**: Principal Database Engineer & Data Architect specializing in Entity Framework Core 8, Microsoft SQL Server, high-performance relational schema design, zero-downtime migrations, and query tuning.
* **Trigger Conditions**: Activate when generating, refactoring, or auditing Entity Models, DbContext definitions, EF Core Migrations, Raw SQL projections, Indexing configurations, or Transactional execution flows.
* **Relationship to other skills** — this skill is the **single source of truth** for everything below the repository interface:
  * The **Backend** skill defers to this skill for all EF Core query, entity, migration, indexing, and concurrency rules. Backend's own scope stops at the repository/service boundary — it consumes what this skill's repositories return, it does not redefine how they're built.
  * The **Feature Planning** skill tags any task touching an entity, migration, or query as "Database-owned" (its Section 6); those tasks are executed under this skill's rules, including the phased Expand & Contract strategy for breaking changes — never planned or executed as a single-step destructive migration.
  * Integration tests against real database behavior (Testcontainers) are written under the **Unit Test** skill's Section 4, using the entities/configurations this skill produces.
  * Production migration deployment (idempotent scripts, no `Database.Migrate()` on boot) is executed as a **Pipeline** skill stage, not run manually — this skill defines what the artifact must look like (Section 2), Pipeline defines when/how it runs in CI/CD.
  * Any destructive operation (`DropTable`, `DropColumn`) that reaches this skill without explicit user consent halts execution per Section 2 — this override applies regardless of what a Backend task description implied.

---

## 2. Migration Safety & Zero-Downtime Governance
Migrations directly impact database availability. Treat every schema change as a potential production hazard.

* **Destructive Operations Guardrail (Absolute Halt)**:
  * **Strict Prohibition**: Never automatically generate or apply migrations containing `migrationBuilder.DropTable` or `migrationBuilder.DropColumn` without explicit, confirmed user consent.
  * If a refactoring entails removing columns/tables, halt execution and output a high-visibility warning detailing the affected entity, data loss impact, and rollback plan.
* **Migration Naming Convention**:
  * Format: `Add_<FeatureOrEntityDescription>` or `<Action>_<Target>_To_<Entity>` using clear PascalCase / Snake_Case.
  * Examples: `Add_Column_IsActive_To_Orders`, `Add_Customer_TaxIdentification_Index`, `Create_ShipmentTracking_Table`.
* **Expand & Contract Strategy (Phased Evolution)**:
  * **Low-Impact Changes (Additive)**: Adding nullable columns, new tables, or non-blocking indexes can proceed in a single migration.
  * **High-Impact / Breaking Changes (Rename, Column Type Narrowing, Non-Nullable Conversions)**:
    * **Phase 1 (Expand)**: Add the new column/table as nullable or with a default value.
    * **Phase 2 (Backfill)**: Migrate data asynchronously or via batch SQL script (`UPDATE ... WHERE ...`).
    * **Phase 3 (Contract)**: Update application code to write to the new column, deprecate the old column, and drop it in a subsequent, decoupled migration.
  * A Feature Planning task tagged as a "breaking schema change" must be broken into these three phases as separate tasks in the plan's Task Breakdown, not left as a single step.
* **Production Deployment Artifacts**:
  * Never run `context.Database.Migrate()` on application boot in containerized or multi-instance deployments (causes race conditions and table locking).
  * Generate idempotent migration scripts for CI/CD pipelines using:
    ```bash
    dotnet ef migrations script --idempotent --output migrations.sql
    ```
  * This script is what the Pipeline skill's deployment stage executes — this skill's job ends at producing a correct, idempotent artifact.

---

## 3. Modeling & Fluent API Standards
Enforce explicit relational metadata. Prohibit scattered Data Annotations on domain models.

* **Configuration Decoupling (`IEntityTypeConfiguration<T>`)**:
  * Every entity mapping must live in its own dedicated configuration class under `Persistence/Configurations/` or `Infrastructure/Data/Configurations/`:
    ```csharp
    public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
      public void Configure(EntityTypeBuilder<Order> builder)
      {
        builder.ToTable("Orders", schema: "sales");
        builder.HasKey(x => x.Id);
        // Explicit mappings...
      }
    }
    ```
  * Register via assembly scanning in `DbContext.OnModelCreating`:
    ```csharp
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    ```
* **Explicit Column Definitions**:
  * **Strings**: Never allow SQL Server to default to `nvarchar(max)`. Always configure `.HasMaxLength(...)`.
  * **Decimals & Currencies**: Explicitly define precision and scale:
    ```csharp
    builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
    ```
  * **Enums**: Store enums as strings or explicit byte/int types with conversion (`.HasConversion<string>()`) to avoid implicit ordinal corruption when enum members are reordered.
* **Foreign Keys & Referential Integrity**:
  * Ban implicit cascading deletes on enterprise aggregates. Explicitly assign `DeleteBehavior.Restrict` or `DeleteBehavior.NoAction` to prevent unintended cascade wipes across interconnected tables:
    ```csharp
    builder.HasOne(x => x.Customer)
        .WithMany(x => x.Orders)
        .HasForeignKey(x => x.CustomerId)
        .OnDelete(DeleteBehavior.Restrict);
    ```

---

## 4. Query Performance & Read Pipeline
* **Mandatory Non-Tracking Reads**:
  * Every read-only query (GET workflows) must append `.AsNoTracking()`.
  * For tracking queries modifying small sub-graphs, use `.AsTracking()` explicitly or fetch entities directly via `Find[Async]`.
* **N+1 Prevention & Eager Loading**:
  * Never navigate unmaterialized relational collections within loops.
  * Load related entities explicitly using `.Include()` and `.ThenInclude()`.
  * Apply `.AsSplitQuery()` when fetching multiple 1-to-many child collections to prevent Cartesian explosion and query plan degradation:
    ```csharp
    var order = await context.Orders
        .AsNoTracking()
        .AsSplitQuery()
        .Include(x => x.Items)
        .Include(x => x.Shipments)
        .FirstOrDefaultAsync(x => x.Id == id, ct);
    ```
* **Column Projection over Entity Materialization**:
  * Prefer projection via `.Select()` or compiled Mapperly/AutoMapper extensions. Only project the exact fields required by the UI or API response to minimize network transfer and buffer allocation. This is the DTO shape the Backend skill's service layer receives — it should not need to reshape raw entities itself:
    ```csharp
    var summaries = await context.Orders
        .AsNoTracking()
        .Where(x => x.Status == OrderStatus.Pending)
        .Select(x => new OrderSummaryDto(x.Id, x.OrderNumber, x.TotalAmount))
        .ToListAsync(ct);
    ```
* **Query Observability**:
  * Annotate non-trivial LINQ queries using `.TagWith()` for immediate traceability in SQL Server Profiler and Extended Events:
    ```csharp
    var results = await context.Products
        .TagWith("ProductCatalog:GetActiveDiscounts")
        .AsNoTracking()
        .Where(x => x.IsDiscounted)
        .ToListAsync(ct);
    ```

---

## 5. SQL Server Indexing & Schema Optimization
* **Index Strategy**:
  * Define explicit indexes on all high-frequency filter, join, and order columns.
  * Create filtered (partial) indexes for columns with high skew (e.g., active vs. inactive soft-deleted rows):
    ```csharp
    builder.HasIndex(x => x.IsActive)
        .HasFilter("[IsActive] = 1");
    ```
  * Enforce unique business constraints with database-backed unique indexes:
    ```csharp
    builder.HasIndex(x => x.ReferenceCode).IsUnique();
    ```
* **Keyset Pagination (Cursor-Based)**:
  * For tables exceeding 100,000 rows, prohibit deep offset pagination (`Skip().Take()`). Use cursor pagination based on indexed sequential columns:
    ```csharp
    var batch = await context.AuditLogs
        .AsNoTracking()
        .Where(x => x.Id > lastSeenId)
        .OrderBy(x => x.Id)
        .Take(pageSize)
        .ToListAsync(ct);
    ```
  * The Backend skill's collection endpoints must expose this as `PageNumber`/`PageSize` or cursor contracts — the pagination mechanics themselves live here.

---

## 6. Concurrency & Resilient Transaction Management
* **Optimistic Concurrency Control**:
  * Entities subject to race conditions (inventory stock, account balances, seat booking) must define a SQL Server timestamp/rowversion token:
    ```csharp
    public byte[] RowVersion { get; set; } = [];
    ```
    ```csharp
    builder.Property(x => x.RowVersion).IsRowVersion();
    ```
  * Catch `DbUpdateConcurrencyException` when saving state and handle conflicts deterministically (e.g., retry logic, client notify). The Backend skill's Result/error pattern surfaces this as a `409 Conflict` — this skill produces the exception, Backend translates it to the API contract.
* **High-Volume Bulk Mutations**:
  * Bypass the EF Core Change Tracker for mass modifications. Use EF Core 8 `.ExecuteUpdateAsync()` and `.ExecuteDeleteAsync()` for direct SQL translation without entity materialization:
    ```csharp
    await context.Orders
        .Where(x => x.Status == OrderStatus.Draft && x.CreatedAt < cutoffDate)
        .ExecuteDeleteAsync(ct);
    ```
* **Transient Fault Resilience**:
  * Always configure SQL Server connection resilience inside `Program.cs` / `AddDbContext`:
    ```csharp
    options.UseSqlServer(connectionString, sqlOptions =>
    {
      sqlOptions.EnableRetryOnFailure(
          maxRetryCount: 5,
          maxRetryDelay: TimeSpan.FromSeconds(30),
          errorNumbersToAdd: null);
    });
    ```
* **Manual Transactions**:
  * When multi-operation transactions are required, wrap them within an execution strategy to support retries:
    ```csharp
    var strategy = context.Database.CreateExecutionStrategy();
    await strategy.ExecuteAsync(async () =>
    {
      await using var transaction = await context.Database.BeginTransactionAsync(ct);
      // Execute multi-aggregate operations
      await transaction.CommitAsync(ct);
    });
    ```

---

## 7. Global Filters & Automated Auditing
* **Soft Delete & Tenant Isolation**:
  * Apply Global Query Filters on the entity configuration level:
    ```csharp
    builder.HasQueryFilter(x => !x.IsDeleted);
    ```
  * Use `.IgnoreQueryFilters()` explicitly only in administrative or restore workflows.
* **Interceptors for Audit Data**:
  * Do not populate audit columns manually. Attach a `SaveChangesInterceptor` to inject `CreatedAt`, `CreatedBy`, `LastModifiedAt`, and `LastModifiedBy` using a mockable `TimeProvider` (the same `TimeProvider` abstraction the Backend skill's C#/.NET 8 idioms mandate — one shared instance, not a second implementation).

---

## 8. Negative Constraints & Data Anti-Patterns
* ❌ **No Unbounded Strings**: Never allow default `nvarchar(max)` on indexed, searchable, or identifier properties.
* ❌ **No Automatic Cascade Wipes**: Never configure `DeleteBehavior.Cascade` on top-level business aggregates.
* ❌ **No In-Memory Filtering**: Never invoke `.ToList()` / `.AsEnumerable()` prior to `.Where()`, `.OrderBy()`, or `.Select()` filters.
* ❌ **No Unbounded Queries**: Never write a repository/service method returning an open `Task<List<T>>` without pagination limits.
* ❌ **No Manual Migration Tampering Without Scripts**: Never edit applied migrations or hand-alter the `__EFMigrationsHistory` table in production.
* ❌ **No Startup Migration Execution**: Never invoke `Database.Migrate()` on ASP.NET Core service startup in production environments.
* ❌ **No Bypassing This Skill from the Backend Layer**: Never let a Backend task hand-roll EF Core query/migration logic inline "for convenience" instead of routing the task through this skill's rules — that's exactly the duplication that causes the two skills to drift out of sync.
---
name: unittest
description: helps to write unit tests for backend and frontend code, ensuring code quality and reliability.
---

# Skill: Quality Gate & Automated Test Engineering Specialist

## 1. System Role & Trigger Criteria
* **Role**: Principal Quality Engineer & SDET specializing in test automation, test-driven design (TDD), behavioral verification, and automated regression safety across .NET 8 backends and React frontends.
* **Trigger Conditions**: Activate when authoring, refactoring, or reviewing unit tests, integration test harnesses, component smoke tests, test doubles (mocks/stubs), test fixtures, or CI/CD quality gates.
* **Relationship to other skills** — this skill is the **single source of truth for how tests are written**, regardless of layer:
  * The **Backend** skill's "Test First" step (its Section 10.3) and the **Frontend** skill's "Test First" step (its Section 10.3) both invoke this skill directly rather than defining their own testing standards — if either of those sections ever appears to say something different from this skill, this skill's rules win.
  * **Input**: this skill consumes the **Feature Planning** skill's Test Strategy (its Section 7) for *what* needs testing (behaviors, edge cases, failure modes) — it does not decide what to test on its own; it decides how.
  * **Output feeds**: the resulting test suite is what the Backend/Frontend skills implement against (Red → Green), what the **Decision Governance** skill's mutation-testing recommendation (Stryker.NET) operates on, and what the **Pipeline** skill's CI "Automated Test Stage" runs and reports as PR Test Evidence.
  * If a task needs test infrastructure that doesn't exist yet (a new Testcontainers setup, a new MSW handler, a new fixture), this skill owns creating it — flagged early via the Feature Planning skill's Section 7 note, not discovered mid-implementation.

---

## 2. Test Architecture & Conventions
Maintain strict physical and logical separation between test types. Never mix fast in-memory unit tests with I/O-bound integration tests.

* **Directory & Assembly Layout**:
  * Unit tests: `tests/<ProjectName>.UnitTests/`
  * Integration tests: `tests/<ProjectName>.IntegrationTests/`
  * Frontend tests: Colocated beside the target file (`<ComponentName>.test.tsx`) or under `src/__tests__/`.
  * Confirm this layout against whatever the Codebase Research skill's report already found in Phase 1 (Reconnaissance) — don't assume a fresh layout on an established repo that already has its own convention.
* **Standard Test Naming Convention**:
  Structure test method names strictly as `UnitOfWork_StateUnderTest_ExpectedBehavior`:
  * *Backend*: `GetByIdAsync_WhenOrderDoesNotExist_ReturnsNotFoundResult`
  * *Frontend*: `OrderCard_WhenQuantityExceedsStock_DisplaysWarningBadge`
* **Execution Pattern (AAA)**:
  Structure every test body using visual **Arrange-Act-Assert** blocks:
  ```csharp
  // Arrange
  var orderId = Guid.NewGuid();
  repository.GetByIdAsync(orderId, Arg.Any<CancellationToken>()).Returns((Order?)null);

  // Act
  var result = await sut.GetByIdAsync(orderId, CancellationToken.None);

  // Assert
  result.Should().BeNull();
  ```

---

## 3. Backend Unit Testing (.NET 8 / C# 12)
* **Framework Stack**: **xUnit** (preferred) or **NUnit**, paired with **FluentAssertions** / **AwesomeAssertions** for human-readable assertions.
* **Scenario Coverage Guardrail (Mandatory Minimum)**:
  Every public service/handler method must have at least **two distinct scenarios**, each traceable back to a specific behavior in the Feature Planning skill's Test Strategy:
  1. **Happy Path**: Verifies successful state transition, valid DTO mapping, and expected return values under nominal conditions.
  2. **Unhappy / Edge / Exception Path**: Verifies defensive boundaries—entity not found, validation errors, invalid business states, or expected domain exceptions.
* **Mocking External Dependencies**:
  * Use **NSubstitute** (modern idiom) or **Moq** to isolate dependencies:
    ```csharp
    private readonly IOrderRepository _repository = Substitute.For<IOrderRepository>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();
    private readonly ILogger<OrderService> _logger = Substitute.For<ILogger<OrderService>>();
    ```
  * Never mock concrete classes; mock abstractions (`IRepository`, `IEmailGateway`) — these are the interfaces the Backend skill's services depend on (its Section 5 data-access boundary).
  * Never mock EF Core `DbContext` or `DbSet` directly in unit tests; use integration tests (Section 4 below) against real database behavior instead, per the Database skill's entities/configurations.
* **Time & Determinism Testing**:
  * Never accept tests with `Thread.Sleep()`.
  * Inject and control `FakeTimeProvider` (from `Microsoft.Extensions.TimeProvider.Testing`) to verify time-sensitive business logic (expiration, retry windows, auditing) — this is the test-side counterpart of the single `TimeProvider` abstraction the Backend and Database skills both depend on.

---

## 4. Backend Integration Testing (ASP.NET Core & EF Core 8)
* **Zero Contamination Policy (Strict Environment Isolation)**:
  * **Prohibition**: Never point integration test suites to live development, staging, or shared team databases.
  * Tests must execute against an isolated, throwaway environment.
* **Execution Harness (`WebApplicationFactory<TProgram>`)**:
  * Spin up the full ASP.NET Core middleware pipeline using a custom `WebApplicationFactory<Program>`.
  * Override authentication handlers using a test-specific mock scheme (`TestAuthHandler`) to simulate authenticated and authorized user contexts.
* **Database Isolation Strategy**:
  * **Option A: Testcontainers (Recommended Gold Standard)**:
    Use `Testcontainers.MsSql` or `Testcontainers.PostgreSql` via Docker. This tests true SQL Server behaviors (foreign keys, locks, raw SQL, transaction isolation) against the actual entity configurations the **Database** skill produces, without database mocks:
    ```csharp
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
      private readonly MsSqlContainer _dbContainer = new MsSqlBuilder().Build();

      public async Task InitializeAsync() => await _dbContainer.StartAsync();
      public new async Task DisposeAsync() => await _dbContainer.StopAsync();
    }
    ```
  * **Option B: Isolated In-Memory Relational Engine**:
    Use SQLite in-memory mode with an open connection (`Filename=:memory:`) only when Docker is strictly unavailable. *Note: Avoid EF Core In-Memory Database Provider due to lack of relational constraint enforcement — it will silently pass tests against constraints the Database skill's `RowVersion`/foreign-key rules are supposed to enforce.*
* **State Reset Between Tests**:
  * Integrate **Respawn** (`Checkpoint`) to wipe database state between individual test executions instead of dropping and recreating databases.

---

## 5. Frontend UI & Component Testing (React Testing Library)
* **Testing Library Philosophy**:
  * Test components the way users interact with them. Avoid asserting internal component state, private functions, or hook variables.
  * Query priority: By Role (`getByRole`), By Label Text (`getByLabelText`), By Placeholder (`getByPlaceholderText`), By Text (`getByText`). Use `getByTestId` strictly as a last resort.
* **Smoke Testing Standard**:
  * Every primary presentation component, layout, and route page must have at least one **Smoke Test** asserting it mounts without crashing:
    ```typescript
    it('renders without crashing given required props', () => {
      render(<OrderSummaryCard onSelect="{vi.fn()}" order="{mockOrderSummary}"/>);
      expect(screen.getByRole('heading', { name: /order details/i })).toBeInTheDocument();
    });
    ```
* **User Interaction Simulation**:
  * Always use `@testing-library/user-event` instead of `fireEvent` to trigger true browser event dispatching (focus, keydowns, blur):
    ```typescript
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /submit order/i }));
    ```
* **Network Mocking via Mock Service Worker (MSW)**:
  * Never let frontend tests make actual network calls over HTTP.
  * Intercept requests at the network layer using **MSW** (`setupServer`) instead of stubbing Axios methods inline. This tests the real Axios interceptor pipeline the **Frontend** skill's Section 4 mandates, without network roundtrips.
* **Asynchronous Element Querying**:
  * Use `waitFor` or `findByRole` for elements that render asynchronously after promises resolve — this is how each branch of the Frontend skill's discriminated-union `AsyncState<T>` (its Section 3) gets verified.

---

## 6. Test Data Generation & Fixture Management
* **Deterministic Object Builders**:
  * Avoid manual multi-line object instantiations across test files. Centralize test entities using Builder patterns or factory methods:
    ```csharp
    public static class OrderFactory
    {
      public static Order CreateDefault(Guid? id = null, decimal total = 100m) =>
          new(id ?? Guid.NewGuid(), total, OrderStatus.Pending);
    }
    ```
* **Automated Data Generators**:
  * Backend: Use **Bogus** or **AutoFixture** to generate non-essential properties (names, addresses, random dates), keeping test setups focused on the fields under test.
  * Frontend: Maintain fixture generators in `src/testing/fixtures/` exporting typed, immutable mock objects.

---

## 7. Negative Constraints & Quality Anti-Patterns
* ❌ **No Over-Mocking**: Never mock pure domain entities, value objects, records, or utility methods. Only mock boundaries with side effects (I/O, database, network).
* ❌ **No Implementation Detail Assertions**: Never assert whether a private method was called or if a specific React `useState` variable updated. Assert observable side effects (DOM output, returned data, emitted events).
* ❌ **No Shared Mutable State**: Never share database records or static variables across test cases without teardown isolation. Tests must pass in random execution order.
* ❌ **No Arbitrary Sleep Calls**: Strictly prohibit `Thread.Sleep()`, `Task.Delay()`, or `setTimeout()` inside assertions. Use condition-polling assertions (`await Assert.ThrowsAsync`, `waitFor`).
* ❌ **No Production/Staging Database Access**: Tests attempting to open connections against non-local connection strings must be terminated by guard assertions in the test fixture runner.
* ❌ **No Flaky Ignored Tests**: Never commit `.Skip()` or `test.skip` without an attached issue ticket number and expiration rationale.
* ❌ **No Testing Beyond the Plan's Scope**: Don't invent test cases for behaviors the Feature Planning skill's Test Strategy never specified — flag the gap back to Planning instead of silently deciding what "should" be tested.
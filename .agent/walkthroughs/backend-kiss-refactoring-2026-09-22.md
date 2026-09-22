# Implementation Walkthrough: Backend KISS Refactoring & Comprehensive Unit Test Coverage

* **Date**: 2026-09-22
* **Status**: Complete & Verified
* **Target Audience**: Backend Engineers learning .NET 8, Clean Architecture, and high-coverage unit testing.
* **Solution Health**: 84 backend unit tests passed (100%), 34 frontend tests passed (100%), 0 build warnings.

---

## 1. Executive Summary & Problem Context

Before this refactoring, the .NET 8 backend featured unnecessary abstraction layers:
1. **Repository Anti-Pattern**: Wrapping EF Core's `DbSet<TodoItem>` in `IGenericRepository<T>`, `GenericRepository<T>`, `ITodoRepository`, and `TodoRepository` added 4 redundant files, obscured EF Core's native LINQ capabilities (e.g. `.AsNoTracking()`), and forced tedious mocking of repositories during testing.
2. **Inconsistent Service Implementations**: `TodoService` was forced through repository wrappers in `TodoApp.Application`, while `AuthService` and `AdminUserService` in `TodoApp.Infrastructure` accessed ASP.NET Core Identity and EF Core directly.
3. **Severe Test Coverage Gaps**: Only 20 unit tests existed across the entire backend, with 0% automated test coverage for `TodoService`, `AuthService`, `AdminUserService`, `JwtTokenService`, `TodosController`, `AuthController`, and `AdminUsersController`.

Following **KISS (Keep It Simple, Stupid)** principles and the approved plan:
- The redundant repository layer was removed.
- `IApplicationDbContext` was introduced in `TodoApp.Application`, preserving Clean Architecture boundaries without leaky wrappers.
- **AutoMapper 14** was retained as requested and hardened with configuration validation tests.
- C# 12 primary constructors were introduced across all services and controllers.
- Backend automated unit test coverage was quadrupled from **20 to 84 tests**, validating every business invariant, authorization guard, and edge case.

---

## 2. Step-by-Step Implementation & Learning Walkthrough

### Step 1: Test Infrastructure Setup (`TodoApp.UnitTests.csproj`)

#### Goal
Equip the backend test project with modern assertion and mocking libraries (`Moq`, `FluentAssertions`, and `Microsoft.EntityFrameworkCore.InMemory`) and link it to `TodoApp.Infrastructure`.

#### The Actual Code
```xml
<!-- backend/tests/TodoApp.UnitTests/TodoApp.UnitTests.csproj -->
<ItemGroup>
  <PackageReference Include="coverlet.collector" Version="6.0.0" />
  <PackageReference Include="FluentAssertions" Version="6.12.2" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.11" />
  <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
  <PackageReference Include="Moq" Version="4.20.72" />
  <PackageReference Include="xunit" Version="2.5.3" />
  <PackageReference Include="xunit.runner.visualstudio" Version="2.5.3" />
</ItemGroup>

<ItemGroup>
  <ProjectReference Include="..\..\src\TodoApp.Application\TodoApp.Application.csproj" />
  <ProjectReference Include="..\..\src\TodoApp.Domain\TodoApp.Domain.csproj" />
  <ProjectReference Include="..\..\src\TodoApp.Infrastructure\TodoApp.Infrastructure.csproj" />
  <ProjectReference Include="..\..\src\TodoApp.Api\TodoApp.Api.csproj" />
</ItemGroup>
```

#### What It Does
Provides the test suite with:
- **`Moq`**: For mocking external services such as `UserManager<ApplicationUser>`, `RoleManager<IdentityRole>`, and `IJwtTokenService`.
- **`FluentAssertions`**: For human-readable assertion syntax (e.g. `result.IsSuccess.Should().BeTrue()`).
- **`Microsoft.EntityFrameworkCore.InMemory`**: For executing real EF Core queries against an isolated in-memory database without mocking `DbSet`.

#### Why It's Built This Way
Per the **Unit Test skill** (Section 3: Backend Unit Testing):
- Fast in-memory relational testing avoids mocking `DbContext` or `DbSet` directly (which leads to fragile, unnatural tests).
- Referencing `TodoApp.Infrastructure` allows test suites to instantiate concrete services and test them end-to-end in isolation.

---

### Step 2: Repository Layer Removal & `IApplicationDbContext` Introduction

#### Goal
Eliminate the leaky Generic/Todo Repository wrappers while keeping `TodoApp.Application` independent of the concrete SQLite database provider.

#### The Actual Code
```csharp
// backend/src/TodoApp.Application/Common/Interfaces/IApplicationDbContext.cs
using Microsoft.EntityFrameworkCore;
using TodoApp.Domain.Entities;

namespace TodoApp.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<TodoItem> TodoItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

```csharp
// backend/src/TodoApp.Infrastructure/Persistence/ApplicationDbContext.cs
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<TodoItem> TodoItems => Set<TodoItem>();
    // ... automatic CreatedAt/UpdatedAt change-tracking interceptor preserved
}
```

```csharp
// backend/src/TodoApp.Infrastructure/DependencyInjection.cs
public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
{
    var connectionString = config.GetConnectionString("DefaultConnection");

    services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(connectionString));

    services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
    services.AddScoped<IJwtTokenService, Services.JwtTokenService>();
    services.AddScoped<IAuthService, Services.AuthService>();
    services.AddScoped<IAdminUserService, Services.AdminUserService>();

    return services;
}
```

#### What It Does
- Removed `IGenericRepository.cs`, `ITodoRepository.cs`, `GenericRepository.cs`, and `TodoRepository.cs`.
- `IApplicationDbContext` exposes only what application use cases need: `DbSet<TodoItem>` and `SaveChangesAsync`.
- Dependency injection binds `IApplicationDbContext` to the existing `ApplicationDbContext` scoped lifetime.

#### Why It's Built This Way
Per the **Backend skill** (Section 2 Pattern A & Section 5 Data Access Boundary):
- In EF Core, `DbSet<T>` *is* already a repository, and `DbContext` *is* a Unit of Work. Adding an extra repository wrapper around `_context.Set<T>().AddAsync()` simply duplicates EF Core's API surface without adding value.
- By placing `IApplicationDbContext` in `TodoApp.Application`, the Inward Dependency Rule is preserved: `Application` defines the interface; `Infrastructure` implements it.

---

### Step 3: Retaining & Hardening AutoMapper 14

#### Goal
Retain AutoMapper 14 for mapping `TodoItem` $\leftrightarrow$ DTOs, clean up unmapped database-managed members, and eliminate runtime reflection errors with automated configuration validation.

#### The Actual Code
```csharp
// backend/src/TodoApp.Application/Features/Todos/Mappings/TodoMappingProfile.cs
using AutoMapper;
using TodoApp.Application.Features.Todos.Dtos;
using TodoApp.Domain.Entities;

namespace TodoApp.Application.Features.Todos.Mappings;

public class TodoMappingProfile : Profile
{
    public TodoMappingProfile()
    {
        CreateMap<TodoItem, TodoResponseDto>()
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()));

        CreateMap<CreateTodoRequestDto, TodoItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.OwnerId, opt => opt.Ignore())
            .ForMember(dest => dest.IsCompleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateTodoRequestDto, TodoItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.OwnerId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }
}
```

#### Decision Point & Test Verification
When authoring unit tests for AutoMapper configuration, `config.AssertConfigurationIsValid()` immediately flagged that `Id`, `OwnerId`, `CreatedAt`, `UpdatedAt`, and `IsCompleted` were unmapped destination properties on `TodoItem`.
By adding `.ForMember(..., opt => opt.Ignore())`, the mapping contract became explicit and robust.

```csharp
// backend/tests/TodoApp.UnitTests/Mappings/TodoMappingProfileTests.cs
public class TodoMappingProfileTests
{
    private readonly IMapper _mapper;

    public TodoMappingProfileTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<TodoMappingProfile>());
        config.AssertConfigurationIsValid(); // Locks in configuration safety
        _mapper = config.CreateMapper();
    }

    [Fact]
    public void AutoMapper_Configuration_IsValid()
    {
        _mapper.Should().NotBeNull();
    }

    [Fact]
    public void Map_TodoItemToTodoResponseDto_MapsAllPropertiesAccurately()
    {
        // Arrange
        var entity = new TodoItem { Id = Guid.NewGuid(), Title = "Task", Priority = TodoPriority.High };
        // Act
        var dto = _mapper.Map<TodoResponseDto>(entity);
        // Assert
        dto.Title.Should().Be("Task");
        dto.Priority.Should().Be("High");
    }
}
```

---

### Step 4: Streamlining `TodoService` with Direct EF Core & Primary Constructors

#### Goal
Refactor `TodoService` to eliminate constructor boilerplate and interact directly with `IApplicationDbContext` using high-performance LINQ expressions (`.AsNoTracking()`).

#### The Actual Code
```csharp
// backend/src/TodoApp.Application/Features/Todos/TodoService.cs
public class TodoService(
    IApplicationDbContext context,
    IMapper mapper,
    IValidator<CreateTodoRequestDto> createValidator,
    IValidator<UpdateTodoRequestDto> updateValidator,
    ILogger<TodoService> logger) : BaseService, ITodoService
{
    public async Task<ServiceResult<List<TodoResponseDto>>> GetAllForUserAsync(string userId, bool isAdmin)
    {
        var query = isAdmin
            ? context.TodoItems.AsNoTracking()
            : context.TodoItems.AsNoTracking().Where(t => t.OwnerId == userId);

        var items = await query.ToListAsync();
        var dtoList = mapper.Map<List<TodoResponseDto>>(items);
        return ServiceResult<List<TodoResponseDto>>.Success(dtoList);
    }

    public async Task<ServiceResult<TodoResponseDto>> GetByIdAsync(Guid id, string userId, bool isAdmin)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item == null)
            return ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan.");

        if (!isAdmin && item.OwnerId != userId)
        {
            logger.LogWarning("User {UserId} attempted unauthorized access to Todo {TodoId}", userId, id);
            return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses ke todo ini.");
        }

        var dto = mapper.Map<TodoResponseDto>(item);
        return ServiceResult<TodoResponseDto>.Success(dto);
    }

    public async Task<ServiceResult<TodoResponseDto>> CreateAsync(CreateTodoRequestDto dto, string userId)
    {
        var validationFailure = await ValidateAsync<CreateTodoRequestDto, TodoResponseDto>(createValidator, dto);
        if (validationFailure != null) return validationFailure;

        var item = mapper.Map<TodoItem>(dto);
        item.Id = Guid.NewGuid();
        item.OwnerId = userId;
        item.CreatedAt = DateTime.UtcNow;

        await context.TodoItems.AddAsync(item);
        await context.SaveChangesAsync();

        logger.LogInformation("Todo {TodoId} created successfully for user {UserId}", item.Id, userId);
        return ServiceResult<TodoResponseDto>.Success(mapper.Map<TodoResponseDto>(item));
    }

    public async Task<ServiceResult<TodoResponseDto>> UpdateAsync(Guid id, UpdateTodoRequestDto dto, string userId, bool isAdmin)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item == null) return ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan.");

        if (!isAdmin && item.OwnerId != userId)
            return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses untuk mengubah todo ini.");

        var validationFailure = await ValidateAsync<UpdateTodoRequestDto, TodoResponseDto>(updateValidator, dto);
        if (validationFailure != null) return validationFailure;

        mapper.Map(dto, item);
        item.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return ServiceResult<TodoResponseDto>.Success(mapper.Map<TodoResponseDto>(item));
    }

    public async Task<ServiceResult> DeleteAsync(Guid id, string userId, bool isAdmin)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item == null) return ServiceResult.NotFound("Todo tidak ditemukan.");

        if (!isAdmin && item.OwnerId != userId)
            return ServiceResult.Forbidden("Anda tidak memiliki akses untuk menghapus todo ini.");

        context.TodoItems.Remove(item);
        await context.SaveChangesAsync();
        return ServiceResult.Success();
    }

    public async Task<ServiceResult<TodoResponseDto>> ToggleCompleteAsync(Guid id, string userId, bool isAdmin)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item == null) return ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan.");

        if (!isAdmin && item.OwnerId != userId)
            return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses ke todo ini.");

        item.IsCompleted = !item.IsCompleted;
        item.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return ServiceResult<TodoResponseDto>.Success(mapper.Map<TodoResponseDto>(item));
    }
}
```

#### Why It's Built This Way
- **C# 12 Primary Constructor**: Eliminates 15 lines of boilerplate private readonly fields and constructor assignment.
- **`.AsNoTracking()`**: Applied on `GetAllForUserAsync`, reducing EF Core memory consumption and change-tracker overhead.
- **Functional `ServiceResult<T>`**: Preserved to avoid throwing exceptions for expected business states (NotFound, Forbidden, Validation).

#### The Tests Written for `TodoService`
18 tests in [`TodoServiceTests.cs`](file:///c:/Users/Formulatrix/Documents/AntiGravity%20Project/TodoApp/backend/tests/TodoApp.UnitTests/Services/TodoServiceTests.cs) verify:
- Data isolation: normal users only see their tasks; admin sees all tasks.
- Security boundaries: non-admin accessing another user's task returns `403 Forbidden` for read, update, delete, and toggle.
- Error handling: missing ID returns `404 NotFound`.
- Validation errors: invalid payload returns `400 ValidationFailure`.

---

### Step 5: Modernizing Infrastructure Services (`AuthService`, `AdminUserService`, `JwtTokenService`)

#### Goal
Adopt C# 12 primary constructors in infrastructure services and build comprehensive test suites for authentication, admin safeguards, and JWT generation.

#### The Actual Code
```csharp
// backend/src/TodoApp.Infrastructure/Services/AuthService.cs
public class AuthService(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager,
    IJwtTokenService jwtTokenService,
    ILogger<AuthService> logger) : IAuthService
{
    // Implementation uses primary constructor parameters directly
}
```

```csharp
// backend/src/TodoApp.Infrastructure/Services/AdminUserService.cs
public class AdminUserService(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager,
    IValidator<UpdateUserRoleRequestDto> updateRoleValidator,
    ILogger<AdminUserService> logger) : IAdminUserService
{
    // Implementation uses primary constructor parameters directly
}
```

```csharp
// backend/src/TodoApp.Infrastructure/Services/JwtTokenService.cs
public class JwtTokenService(IConfiguration configuration) : IJwtTokenService
{
    // Reads Jwt settings and signs JWTs
}
```

#### The Tests Written
- **`AuthServiceTests.cs` (8 tests)**: Tests password mismatch, duplicate email, lockout check (returns `403 Forbidden`), invalid credentials, and success token issuance.
- **`AdminUserServiceTests.cs` (14 tests)**: Tests **Self-Protection Guard** (prevents admin from modifying, locking, or deleting own account), role elevation/demotion, lockout toggling, user deletion, and not-found states using a real in-memory `UserManager` and `RoleManager`.
- **`JwtTokenServiceTests.cs` (2 tests)**: Validates HMAC-SHA256 signature, claims (`sub`, `email`, `role`, `FullName`), and expiration timestamps.

---

### Step 6: Modernizing API Controllers (`TodosController`, `AuthController`, `AdminUsersController`)

#### Goal
Modernize presentation controllers with C# 12 primary constructors and author controller-level unit tests verifying route dispatching and HTTP status codes.

#### The Actual Code
```csharp
// backend/src/TodoApp.Api/Controllers/TodosController.cs
[Authorize]
[Route("api/[controller]")]
public class TodosController(ITodoService todoService) : ApiControllerBase
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                    ?? User.FindFirst("sub")?.Value
                                    ?? string.Empty;

    private bool IsAdmin => User.IsInRole(Roles.Admin);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await todoService.GetAllForUserAsync(CurrentUserId, IsAdmin);
        return HandleResult(result);
    }
    // ...
}
```

#### The Tests Written
- **`TodosControllerTests.cs` (7 tests)**: Verifies that controller extracts claims and dispatches to `ITodoService`, mapping results to `200 OK`, `201 Created`, `204 NoContent`, `400 BadRequest`, `403 Forbidden`, `404 NotFound`.
- **`AuthControllerTests.cs` (3 tests)**: Verifies `/register`, `/login`, and claims reflection in `/me`.
- **`AdminUsersControllerTests.cs` (5 tests)**: Verifies administrative user management endpoints.

---

### Step 7: Expanding Validator Testing (`UpdateTodoRequestDtoValidator`)

#### Goal
Ensure all validator classes are thoroughly tested for edge cases.

#### The Actual Code
```csharp
// backend/tests/TodoApp.UnitTests/Todos/TodoValidatorTests.cs
[Fact]
public void UpdateValidator_ShouldFail_WhenTitleIsEmpty()
{
    var validator = new UpdateTodoRequestDtoValidator();
    var result = validator.Validate(new UpdateTodoRequestDto { Title = "" });
    Assert.False(result.IsValid);
}

[Fact]
public void UpdateValidator_ShouldFail_WhenDueDateIsInThePast()
{
    var validator = new UpdateTodoRequestDtoValidator();
    var result = validator.Validate(new UpdateTodoRequestDto { Title = "Valid", DueDate = DateTime.UtcNow.AddDays(-2) });
    Assert.False(result.IsValid);
}

[Fact]
public void UpdateValidator_ShouldPass_WhenDataIsValid()
{
    var validator = new UpdateTodoRequestDtoValidator();
    var result = validator.Validate(new UpdateTodoRequestDto { Title = "Valid", DueDate = DateTime.UtcNow.AddDays(1) });
    Assert.True(result.IsValid);
}
```

---

## 3. Key Takeaways for Developers

1. **Don't Layer Repositories on Top of EF Core Without a Business Reason**:
   EF Core's `DbSet<T>` is already a repository. Adding a custom `GenericRepository` creates unnecessary friction, blocks LINQ features, and forces tedious mock setups. Exposing `IApplicationDbContext` from the application layer keeps Clean Architecture decoupled while preserving EF Core's full power.
2. **Always Enforce `AssertConfigurationIsValid()` on AutoMapper**:
   If your project uses AutoMapper, author a test calling `config.AssertConfigurationIsValid()`. This catches unmapped destination properties at test time rather than experiencing silent nulls or runtime exceptions in production.
3. **Prefer In-Memory Relational Stores over Mocking `DbSet`**:
   Mocking `DbSet<T>` with `Mock<DbSet<T>>` requires complex setup for async enumerables and query providers. Using `Microsoft.EntityFrameworkCore.InMemory` allows testing services against real LINQ queries with zero mocking boilerplate.
4. **Leverage C# 12 Primary Constructors**:
   Primary constructors dramatically reduce ceremony in dependency injection classes, turning 15-line boilerplate constructors into clean, concise single-line headers.
5. **Preserve Exact API Contracts**:
   Refactoring the backend to be KISS did not alter a single route, status code, or JSON contract. As a result, all 34 existing React frontend tests passed with zero changes.

---

## 4. Verification Evidence

```powershell
# 1. Backend Build
dotnet build backend/TodoApp.sln
# Result: 0 Warning(s), 0 Error(s)

# 2. Backend Automated Test Suite
dotnet test backend/TodoApp.sln
# Result: Passed! - Failed: 0, Passed: 84, Skipped: 0, Total: 84, Duration: 680 ms

# 3. Frontend Test Suite
npm test
# Result: 8 passed (8), 34 passed (34)

# 4. Frontend Production Build
npm run build
# Result: built in 13.47s with 0 errors
```


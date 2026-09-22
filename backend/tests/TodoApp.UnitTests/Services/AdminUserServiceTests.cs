using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Admin.Validators;
using TodoApp.Application.Identity;
using TodoApp.Infrastructure.Persistence;
using TodoApp.Infrastructure.Services;
using Xunit;

namespace TodoApp.UnitTests.Services;

public class AdminUserServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly UpdateUserRoleRequestDtoValidator _validator = new();
    private readonly AdminUserService _sut;

    public AdminUserServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);

        var userStore = new UserStore<ApplicationUser>(_context);
        _userManager = new UserManager<ApplicationUser>(
            userStore,
            Options.Create(new IdentityOptions()),
            new PasswordHasher<ApplicationUser>(),
            Array.Empty<IUserValidator<ApplicationUser>>(),
            Array.Empty<IPasswordValidator<ApplicationUser>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            null!,
            NullLogger<UserManager<ApplicationUser>>.Instance
        );

        var roleStore = new RoleStore<IdentityRole>(_context);
        _roleManager = new RoleManager<IdentityRole>(
            roleStore,
            Array.Empty<IRoleValidator<IdentityRole>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            NullLogger<RoleManager<IdentityRole>>.Instance
        );

        _sut = new AdminUserService(
            _userManager,
            _roleManager,
            _validator,
            NullLogger<AdminUserService>.Instance
        );
    }

    public void Dispose()
    {
        _userManager.Dispose();
        _roleManager.Dispose();
        _context.Dispose();
    }

    [Fact]
    public async Task GetAllUsersAsync_ReturnsAllUsersWithRolesAndLockoutStatus()
    {
        // Arrange
        await _roleManager.CreateAsync(new IdentityRole(Roles.User));
        await _roleManager.CreateAsync(new IdentityRole(Roles.Admin));

        var user1 = new ApplicationUser { Id = "u1", UserName = "u1@test.com", Email = "u1@test.com", FullName = "User 1" };
        var user2 = new ApplicationUser
        {
            Id = "u2",
            UserName = "u2@test.com",
            Email = "u2@test.com",
            FullName = "User 2",
            LockoutEnd = DateTimeOffset.UtcNow.AddHours(2)
        };

        await _userManager.CreateAsync(user1);
        await _userManager.CreateAsync(user2);

        await _userManager.AddToRoleAsync(user1, Roles.User);
        await _userManager.AddToRoleAsync(user2, Roles.Admin);

        // Act
        var result = await _sut.GetAllUsersAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);

        var u1Dto = result.Data!.First(u => u.Id == "u1");
        u1Dto.FullName.Should().Be("User 1");
        u1Dto.Roles.Should().Contain(Roles.User);
        u1Dto.IsLocked.Should().BeFalse();

        var u2Dto = result.Data!.First(u => u.Id == "u2");
        u2Dto.FullName.Should().Be("User 2");
        u2Dto.Roles.Should().Contain(Roles.Admin);
        u2Dto.IsLocked.Should().BeTrue();
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserExists_ReturnsUserSummaryDto()
    {
        // Arrange
        await _roleManager.CreateAsync(new IdentityRole(Roles.User));
        var user = new ApplicationUser { Id = "target-user", UserName = "target@test.com", Email = "target@test.com", FullName = "Target" };
        await _userManager.CreateAsync(user);
        await _userManager.AddToRoleAsync(user, Roles.User);

        // Act
        var result = await _sut.GetUserByIdAsync("target-user");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be("target-user");
        result.Data.Email.Should().Be("target@test.com");
        result.Data.Roles.Should().Contain(Roles.User);
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserNotFound_ReturnsNotFound()
    {
        // Act
        var result = await _sut.GetUserByIdAsync("non-existent-user");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.NotFound);
        result.ErrorMessage.Should().Contain("tidak ditemukan");
    }

    [Fact]
    public async Task UpdateUserRoleAsync_WhenAdminModifiesSelf_ReturnsFailure()
    {
        // Act
        var result = await _sut.UpdateUserRoleAsync("admin-1", Roles.User, currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Tidak bisa mengubah role akun sendiri");
    }

    [Fact]
    public async Task UpdateUserRoleAsync_WhenValidationFails_ReturnsValidationFailure()
    {
        // Act
        var result = await _sut.UpdateUserRoleAsync("target-user", "InvalidRoleName", currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.Validation);
        result.ValidationErrors.Should().NotBeEmpty();
    }

    [Fact]
    public async Task UpdateUserRoleAsync_WhenUserNotFound_ReturnsNotFound()
    {
        // Act
        var result = await _sut.UpdateUserRoleAsync("missing-user", Roles.Admin, currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.NotFound);
    }

    [Fact]
    public async Task UpdateUserRoleAsync_WhenValid_UpdatesRoleSuccessfully()
    {
        // Arrange
        await _roleManager.CreateAsync(new IdentityRole(Roles.User));
        await _roleManager.CreateAsync(new IdentityRole(Roles.Admin));

        var user = new ApplicationUser { Id = "target-user", UserName = "target@test.com", Email = "target@test.com" };
        await _userManager.CreateAsync(user);
        await _userManager.AddToRoleAsync(user, Roles.User);

        // Act
        var result = await _sut.UpdateUserRoleAsync("target-user", Roles.Admin, currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeTrue();
        var roles = await _userManager.GetRolesAsync(user);
        roles.Should().ContainSingle().Which.Should().Be(Roles.Admin);
    }

    [Fact]
    public async Task ToggleLockUserAsync_WhenAdminModifiesSelf_ReturnsFailure()
    {
        // Act
        var result = await _sut.ToggleLockUserAsync("admin-1", currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Tidak bisa mengunci akun sendiri");
    }

    [Fact]
    public async Task ToggleLockUserAsync_WhenUserNotFound_ReturnsNotFound()
    {
        // Act
        var result = await _sut.ToggleLockUserAsync("missing-user", currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.NotFound);
    }

    [Fact]
    public async Task ToggleLockUserAsync_WhenCurrentlyUnlocked_LocksUser()
    {
        // Arrange
        var user = new ApplicationUser { Id = "user-to-lock", UserName = "lock@test.com", Email = "lock@test.com" };
        await _userManager.CreateAsync(user);

        // Act
        var result = await _sut.ToggleLockUserAsync("user-to-lock", currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeTrue();
        var reloaded = await _userManager.FindByIdAsync("user-to-lock");
        reloaded!.LockoutEnd.Should().NotBeNull();
        reloaded.LockoutEnd!.Value.Should().BeAfter(DateTimeOffset.UtcNow.AddYears(50));
    }

    [Fact]
    public async Task ToggleLockUserAsync_WhenCurrentlyLocked_UnlocksUser()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = "user-to-unlock",
            UserName = "unlock@test.com",
            Email = "unlock@test.com",
            LockoutEnd = DateTimeOffset.UtcNow.AddYears(10)
        };
        await _userManager.CreateAsync(user);

        // Act
        var result = await _sut.ToggleLockUserAsync("user-to-unlock", currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeTrue();
        var reloaded = await _userManager.FindByIdAsync("user-to-unlock");
        reloaded!.LockoutEnd.Should().BeNull();
    }

    [Fact]
    public async Task DeleteUserAsync_WhenAdminModifiesSelf_ReturnsFailure()
    {
        // Act
        var result = await _sut.DeleteUserAsync("admin-1", currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Tidak bisa menghapus akun sendiri");
    }

    [Fact]
    public async Task DeleteUserAsync_WhenUserNotFound_ReturnsNotFound()
    {
        // Act
        var result = await _sut.DeleteUserAsync("missing-user", currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.NotFound);
    }

    [Fact]
    public async Task DeleteUserAsync_WhenValid_DeletesUserSuccessfully()
    {
        // Arrange
        var user = new ApplicationUser { Id = "user-to-delete", UserName = "del@test.com", Email = "del@test.com" };
        await _userManager.CreateAsync(user);

        // Act
        var result = await _sut.DeleteUserAsync("user-to-delete", currentAdminId: "admin-1");

        // Assert
        result.IsSuccess.Should().BeTrue();
        (await _userManager.FindByIdAsync("user-to-delete")).Should().BeNull();
    }
}


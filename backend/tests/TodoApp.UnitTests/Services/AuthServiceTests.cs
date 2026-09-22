using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Auth.Dtos;
using TodoApp.Application.Identity;
using TodoApp.Application.Interfaces;
using TodoApp.Infrastructure.Services;
using Xunit;

namespace TodoApp.UnitTests.Services;

public class AuthServiceTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock;
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
        _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
            roleStoreMock.Object, null!, null!, null!, null!);

        _jwtTokenServiceMock = new Mock<IJwtTokenService>();

        _sut = new AuthService(
            _userManagerMock.Object,
            _roleManagerMock.Object,
            _jwtTokenServiceMock.Object,
            NullLogger<AuthService>.Instance
        );
    }

    [Fact]
    public async Task RegisterAsync_WhenPasswordsDoNotMatch_ReturnsFailure()
    {
        // Arrange
        var dto = new RegisterRequestDto
        {
            Email = "test@example.com",
            FullName = "Test User",
            Password = "Password123!",
            ConfirmPassword = "DifferentPassword123!"
        };

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("tidak cocok");
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailAlreadyExists_ReturnsFailure()
    {
        // Arrange
        var dto = new RegisterRequestDto
        {
            Email = "existing@example.com",
            FullName = "Existing User",
            Password = "Password123!",
            ConfirmPassword = "Password123!"
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync(new ApplicationUser { Email = dto.Email });

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("sudah terdaftar");
    }

    [Fact]
    public async Task RegisterAsync_WhenIdentityCreationFails_ReturnsFailureWithErrors()
    {
        // Arrange
        var dto = new RegisterRequestDto
        {
            Email = "new@example.com",
            FullName = "New User",
            Password = "Weak",
            ConfirmPassword = "Weak"
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), dto.Password))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Password too weak" }));

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Password too weak");
    }

    [Fact]
    public async Task RegisterAsync_WhenValid_CreatesUserAssignsRoleAndReturnsAuthResponse()
    {
        // Arrange
        var dto = new RegisterRequestDto
        {
            Email = "valid@example.com",
            FullName = "Valid User",
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!"
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), dto.Password))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(m => m.RoleExistsAsync(Roles.User))
            .ReturnsAsync(false);

        _roleManagerMock.Setup(m => m.CreateAsync(It.IsAny<IdentityRole>()))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), Roles.User))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(m => m.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { Roles.User });

        var expiry = DateTime.UtcNow.AddHours(1);
        _jwtTokenServiceMock.Setup(m => m.GenerateToken(It.IsAny<ApplicationUser>(), It.IsAny<IList<string>>()))
            .Returns("fake-jwt-token");
        _jwtTokenServiceMock.Setup(m => m.GetTokenExpiryUtc())
            .Returns(expiry);

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Email.Should().Be(dto.Email);
        result.Data.FullName.Should().Be(dto.FullName);
        result.Data.Token.Should().Be("fake-jwt-token");
        result.Data.Roles.Should().Contain(Roles.User);
    }

    [Fact]
    public async Task LoginAsync_WhenUserNotFound_ReturnsFailure()
    {
        // Arrange
        var dto = new LoginRequestDto { Email = "notfound@example.com", Password = "Password123!" };
        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Email atau password salah");
    }

    [Fact]
    public async Task LoginAsync_WhenPasswordIncorrect_ReturnsFailure()
    {
        // Arrange
        var dto = new LoginRequestDto { Email = "user@example.com", Password = "WrongPassword!" };
        var user = new ApplicationUser { Email = dto.Email };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(m => m.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Email atau password salah");
    }

    [Fact]
    public async Task LoginAsync_WhenUserIsLockedOut_ReturnsForbiddenFailure()
    {
        // Arrange
        var dto = new LoginRequestDto { Email = "locked@example.com", Password = "CorrectPassword123!" };
        var user = new ApplicationUser { Email = dto.Email };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(m => m.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(true);

        _userManagerMock.Setup(m => m.IsLockedOutAsync(user))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.Forbidden);
        result.ErrorMessage.Should().Contain("telah dikunci");
    }

    [Fact]
    public async Task LoginAsync_WhenCredentialsValid_ReturnsSuccessWithTokenAndRoles()
    {
        // Arrange
        var dto = new LoginRequestDto { Email = "active@example.com", Password = "CorrectPassword123!" };
        var user = new ApplicationUser { Id = "user-abc", Email = dto.Email, FullName = "Active User" };

        _userManagerMock.Setup(m => m.FindByEmailAsync(dto.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(m => m.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(true);

        _userManagerMock.Setup(m => m.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { Roles.User });

        var expiry = DateTime.UtcNow.AddHours(2);
        _jwtTokenServiceMock.Setup(m => m.GenerateToken(user, It.IsAny<IList<string>>()))
            .Returns("valid-session-jwt");
        _jwtTokenServiceMock.Setup(m => m.GetTokenExpiryUtc())
            .Returns(expiry);

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be("user-abc");
        result.Data.Token.Should().Be("valid-session-jwt");
        result.Data.Roles.Should().Contain(Roles.User);
    }
}


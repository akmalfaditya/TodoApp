using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TodoApp.Api.Controllers;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Auth;
using TodoApp.Application.Features.Auth.Dtos;
using Xunit;

namespace TodoApp.UnitTests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly AuthController _sut;

    public AuthControllerTests()
    {
        _sut = new AuthController(_authServiceMock.Object);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "user-id-999"),
            new(ClaimTypes.Email, "authuser@example.com"),
            new("FullName", "Authenticated User"),
            new(ClaimTypes.Role, Roles.User)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    [Fact]
    public async Task Register_WhenSuccess_Returns201Created()
    {
        // Arrange
        var request = new RegisterRequestDto
        {
            Email = "newuser@example.com",
            FullName = "New User",
            Password = "Password123!",
            ConfirmPassword = "Password123!"
        };
        var authResponse = new AuthResponseDto
        {
            Id = "new-id",
            Email = request.Email,
            FullName = request.FullName,
            Token = "valid-token",
            Roles = new List<string> { Roles.User }
        };

        _authServiceMock.Setup(s => s.RegisterAsync(request))
            .ReturnsAsync(ServiceResult<AuthResponseDto>.Success(authResponse));

        // Act
        var result = await _sut.Register(request);

        // Assert
        var createdResult = result.Should().BeOfType<ObjectResult>().Subject;
        createdResult.StatusCode.Should().Be(StatusCodes.Status201Created);
        createdResult.Value.Should().Be(authResponse);
    }

    [Fact]
    public async Task Login_WhenSuccess_Returns200Ok()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "user@example.com", Password = "Password123!" };
        var authResponse = new AuthResponseDto
        {
            Id = "existing-id",
            Email = request.Email,
            Token = "valid-token",
            Roles = new List<string> { Roles.User }
        };

        _authServiceMock.Setup(s => s.LoginAsync(request))
            .ReturnsAsync(ServiceResult<AuthResponseDto>.Success(authResponse));

        // Act
        var result = await _sut.Login(request);

        // Assert
        var okResult = result.Should().BeOfType<ObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().Be(authResponse);
    }

    [Fact]
    public void GetMe_WhenAuthenticated_ReturnsClaimsPayload()
    {
        // Act
        var result = _sut.GetMe();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);

        var dynamicObj = okResult.Value;
        dynamicObj.Should().NotBeNull();

        var idProp = dynamicObj!.GetType().GetProperty("id")?.GetValue(dynamicObj);
        var emailProp = dynamicObj.GetType().GetProperty("email")?.GetValue(dynamicObj);
        var fullNameProp = dynamicObj.GetType().GetProperty("fullName")?.GetValue(dynamicObj);
        var rolesProp = dynamicObj.GetType().GetProperty("roles")?.GetValue(dynamicObj) as List<string>;

        idProp.Should().Be("user-id-999");
        emailProp.Should().Be("authuser@example.com");
        fullNameProp.Should().Be("Authenticated User");
        rolesProp.Should().Contain(Roles.User);
    }
}


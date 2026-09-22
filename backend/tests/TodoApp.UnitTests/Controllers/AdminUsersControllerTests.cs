using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TodoApp.Api.Controllers;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Admin;
using TodoApp.Application.Features.Admin.Dtos;
using Xunit;

namespace TodoApp.UnitTests.Controllers;

public class AdminUsersControllerTests
{
    private readonly Mock<IAdminUserService> _adminUserServiceMock = new();
    private readonly AdminUsersController _sut;

    public AdminUsersControllerTests()
    {
        _sut = new AdminUsersController(_adminUserServiceMock.Object);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "admin-user-id"),
            new(ClaimTypes.Role, Roles.Admin)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithUsers()
    {
        // Arrange
        var users = new List<UserSummaryDto>
        {
            new() { Id = "u1", Email = "u1@test.com", FullName = "User One" }
        };
        _adminUserServiceMock.Setup(s => s.GetAllUsersAsync())
            .ReturnsAsync(ServiceResult<List<UserSummaryDto>>.Success(users));

        // Act
        var result = await _sut.GetAll();

        // Assert
        var okResult = result.Should().BeOfType<ObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().BeEquivalentTo(users);
    }

    [Fact]
    public async Task GetById_WhenSuccess_ReturnsOk()
    {
        // Arrange
        var user = new UserSummaryDto { Id = "u1", Email = "u1@test.com", FullName = "User One" };
        _adminUserServiceMock.Setup(s => s.GetUserByIdAsync("u1"))
            .ReturnsAsync(ServiceResult<UserSummaryDto>.Success(user));

        // Act
        var result = await _sut.GetById("u1");

        // Assert
        var okResult = result.Should().BeOfType<ObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().Be(user);
    }

    [Fact]
    public async Task UpdateRole_WhenSuccess_ReturnsOk()
    {
        // Arrange
        var dto = new UpdateUserRoleRequestDto { Role = Roles.Admin };
        _adminUserServiceMock.Setup(s => s.UpdateUserRoleAsync("u1", Roles.Admin, "admin-user-id"))
            .ReturnsAsync(ServiceResult.Success());

        // Act
        var result = await _sut.UpdateRole("u1", dto);

        // Assert
        var okResult = result.Should().BeOfType<StatusCodeResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task ToggleLock_WhenSuccess_ReturnsOk()
    {
        // Arrange
        _adminUserServiceMock.Setup(s => s.ToggleLockUserAsync("u1", "admin-user-id"))
            .ReturnsAsync(ServiceResult.Success());

        // Act
        var result = await _sut.ToggleLock("u1");

        // Assert
        var okResult = result.Should().BeOfType<StatusCodeResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task Delete_WhenSuccess_Returns204NoContent()
    {
        // Arrange
        _adminUserServiceMock.Setup(s => s.DeleteUserAsync("u1", "admin-user-id"))
            .ReturnsAsync(ServiceResult.Success());

        // Act
        var result = await _sut.Delete("u1");

        // Assert
        var noContentResult = result.Should().BeOfType<StatusCodeResult>().Subject;
        noContentResult.StatusCode.Should().Be(StatusCodes.Status204NoContent);
    }
}


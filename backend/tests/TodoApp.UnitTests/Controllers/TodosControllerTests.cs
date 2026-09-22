using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TodoApp.Api.Controllers;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Todos;
using TodoApp.Application.Features.Todos.Dtos;
using Xunit;

namespace TodoApp.UnitTests.Controllers;

public class TodosControllerTests
{
    private readonly Mock<ITodoService> _todoServiceMock = new();
    private readonly TodosController _sut;

    public TodosControllerTests()
    {
        _sut = new TodosController(_todoServiceMock.Object);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "test-user-id"),
            new(ClaimTypes.Role, Roles.User)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithTodoList()
    {
        // Arrange
        var dtoList = new List<TodoResponseDto>
        {
            new() { Id = Guid.NewGuid(), Title = "Task 1" }
        };
        _todoServiceMock.Setup(s => s.GetAllForUserAsync("test-user-id", false))
            .ReturnsAsync(ServiceResult<List<TodoResponseDto>>.Success(dtoList));

        // Act
        var result = await _sut.GetAll();

        // Assert
        var okResult = result.Should().BeOfType<ObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().BeEquivalentTo(dtoList);
    }

    [Fact]
    public async Task GetById_WhenSuccess_ReturnsOk()
    {
        // Arrange
        var todoId = Guid.NewGuid();
        var dto = new TodoResponseDto { Id = todoId, Title = "Task 1" };
        _todoServiceMock.Setup(s => s.GetByIdAsync(todoId, "test-user-id", false))
            .ReturnsAsync(ServiceResult<TodoResponseDto>.Success(dto));

        // Act
        var result = await _sut.GetById(todoId);

        // Assert
        var okResult = result.Should().BeOfType<ObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().Be(dto);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        var todoId = Guid.NewGuid();
        _todoServiceMock.Setup(s => s.GetByIdAsync(todoId, "test-user-id", false))
            .ReturnsAsync(ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan."));

        // Act
        var result = await _sut.GetById(todoId);

        // Assert
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Create_WhenSuccess_Returns201Created()
    {
        // Arrange
        var createDto = new CreateTodoRequestDto { Title = "New Task" };
        var responseDto = new TodoResponseDto { Id = Guid.NewGuid(), Title = "New Task" };
        _todoServiceMock.Setup(s => s.CreateAsync(createDto, "test-user-id"))
            .ReturnsAsync(ServiceResult<TodoResponseDto>.Success(responseDto));

        // Act
        var result = await _sut.Create(createDto);

        // Assert
        var createdResult = result.Should().BeOfType<ObjectResult>().Subject;
        createdResult.StatusCode.Should().Be(StatusCodes.Status201Created);
        createdResult.Value.Should().Be(responseDto);
    }

    [Fact]
    public async Task Update_WhenSuccess_ReturnsOk()
    {
        // Arrange
        var todoId = Guid.NewGuid();
        var updateDto = new UpdateTodoRequestDto { Title = "Updated Task" };
        var responseDto = new TodoResponseDto { Id = todoId, Title = "Updated Task" };
        _todoServiceMock.Setup(s => s.UpdateAsync(todoId, updateDto, "test-user-id", false))
            .ReturnsAsync(ServiceResult<TodoResponseDto>.Success(responseDto));

        // Act
        var result = await _sut.Update(todoId, updateDto);

        // Assert
        var okResult = result.Should().BeOfType<ObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task Delete_WhenSuccess_Returns204NoContent()
    {
        // Arrange
        var todoId = Guid.NewGuid();
        _todoServiceMock.Setup(s => s.DeleteAsync(todoId, "test-user-id", false))
            .ReturnsAsync(ServiceResult.Success());

        // Act
        var result = await _sut.Delete(todoId);

        // Assert
        var statusResult = result.Should().BeOfType<StatusCodeResult>().Subject;
        statusResult.StatusCode.Should().Be(StatusCodes.Status204NoContent);
    }

    [Fact]
    public async Task ToggleComplete_WhenSuccess_ReturnsOk()
    {
        // Arrange
        var todoId = Guid.NewGuid();
        var responseDto = new TodoResponseDto { Id = todoId, IsCompleted = true };
        _todoServiceMock.Setup(s => s.ToggleCompleteAsync(todoId, "test-user-id", false))
            .ReturnsAsync(ServiceResult<TodoResponseDto>.Success(responseDto));

        // Act
        var result = await _sut.ToggleComplete(todoId);

        // Assert
        var okResult = result.Should().BeOfType<ObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
    }
}


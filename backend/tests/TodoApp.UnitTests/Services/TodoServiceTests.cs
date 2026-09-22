using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Todos;
using TodoApp.Application.Features.Todos.Dtos;
using TodoApp.Application.Features.Todos.Mappings;
using TodoApp.Application.Features.Todos.Validators;
using TodoApp.Domain.Entities;
using TodoApp.Domain.Enums;
using TodoApp.Infrastructure.Persistence;
using Xunit;

namespace TodoApp.UnitTests.Services;

public class TodoServiceTests
{
    private readonly IMapper _mapper;
    private readonly CreateTodoRequestDtoValidator _createValidator = new();
    private readonly UpdateTodoRequestDtoValidator _updateValidator = new();

    public TodoServiceTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<TodoMappingProfile>());
        _mapper = config.CreateMapper();
    }

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private TodoService CreateSut(ApplicationDbContext context)
    {
        return new TodoService(
            context,
            _mapper,
            _createValidator,
            _updateValidator,
            NullLogger<TodoService>.Instance
        );
    }

    [Fact]
    public async Task GetAllForUserAsync_WhenRegularUser_ReturnsOnlyUserTodos()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var user1 = "user-1";
        var user2 = "user-2";

        context.TodoItems.AddRange(
            new TodoItem { Id = Guid.NewGuid(), Title = "Task 1", OwnerId = user1 },
            new TodoItem { Id = Guid.NewGuid(), Title = "Task 2", OwnerId = user1 },
            new TodoItem { Id = Guid.NewGuid(), Title = "Task 3", OwnerId = user2 }
        );
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.GetAllForUserAsync(user1, isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
        result.Data.Should().OnlyContain(t => t.OwnerId == user1);
    }

    [Fact]
    public async Task GetAllForUserAsync_WhenAdminUser_ReturnsAllTodosAcrossUsers()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.TodoItems.AddRange(
            new TodoItem { Id = Guid.NewGuid(), Title = "Task 1", OwnerId = "user-1" },
            new TodoItem { Id = Guid.NewGuid(), Title = "Task 2", OwnerId = "user-2" },
            new TodoItem { Id = Guid.NewGuid(), Title = "Task 3", OwnerId = "user-3" }
        );
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.GetAllForUserAsync("admin-id", isAdmin: true);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetByIdAsync_WhenTodoExistsAndBelongsToUser_ReturnsSuccess()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        var userId = "user-1";
        context.TodoItems.Add(new TodoItem
        {
            Id = todoId,
            Title = "Specific Task",
            OwnerId = userId,
            Priority = TodoPriority.High
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.GetByIdAsync(todoId, userId, isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be(todoId);
        result.Data.Title.Should().Be("Specific Task");
    }

    [Fact]
    public async Task GetByIdAsync_WhenTodoExistsAndUserIsAdmin_ReturnsSuccessEvenIfDifferentOwner()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        context.TodoItems.Add(new TodoItem
        {
            Id = todoId,
            Title = "User Task",
            OwnerId = "regular-user"
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.GetByIdAsync(todoId, "admin-user", isAdmin: true);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.Id.Should().Be(todoId);
    }

    [Fact]
    public async Task GetByIdAsync_WhenTodoBelongsToOtherUser_ReturnsForbidden()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        context.TodoItems.Add(new TodoItem
        {
            Id = todoId,
            Title = "Secret Task",
            OwnerId = "owner-user"
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.GetByIdAsync(todoId, "unauthorized-user", isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.Forbidden);
        result.ErrorMessage.Should().Contain("tidak memiliki akses");
    }

    [Fact]
    public async Task GetByIdAsync_WhenTodoDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var sut = CreateSut(context);

        // Act
        var result = await sut.GetByIdAsync(Guid.NewGuid(), "user-1", isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.NotFound);
        result.ErrorMessage.Should().Contain("tidak ditemukan");
    }

    [Fact]
    public async Task CreateAsync_WhenPayloadIsValid_CreatesAndReturnsTodo()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var sut = CreateSut(context);
        var dto = new CreateTodoRequestDto
        {
            Title = "Learn Antigravity",
            Description = "Agentic workflows",
            Priority = TodoPriority.High,
            DueDate = DateTime.UtcNow.AddDays(7)
        };
        var userId = "dev-user";

        // Act
        var result = await sut.CreateAsync(dto, userId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Title.Should().Be("Learn Antigravity");
        result.Data.OwnerId.Should().Be(userId);

        var saved = await context.TodoItems.FirstOrDefaultAsync(t => t.Title == "Learn Antigravity");
        saved.Should().NotBeNull();
        saved!.OwnerId.Should().Be(userId);
    }

    [Fact]
    public async Task CreateAsync_WhenValidationFails_ReturnsValidationFailure()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var sut = CreateSut(context);
        var invalidDto = new CreateTodoRequestDto
        {
            Title = "", // empty title violates validation
            DueDate = DateTime.UtcNow.AddDays(-5) // past date violates validation
        };

        // Act
        var result = await sut.CreateAsync(invalidDto, "dev-user");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.Validation);
        result.ValidationErrors.Should().NotBeEmpty();
    }

    [Fact]
    public async Task UpdateAsync_WhenTodoBelongsToUserAndValid_UpdatesAndReturnsTodo()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        var userId = "user-1";
        context.TodoItems.Add(new TodoItem
        {
            Id = todoId,
            Title = "Initial Title",
            Description = "Initial Desc",
            OwnerId = userId,
            Priority = TodoPriority.Low
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);
        var updateDto = new UpdateTodoRequestDto
        {
            Title = "Updated Title",
            Description = "Updated Desc",
            IsCompleted = true,
            Priority = TodoPriority.High
        };

        // Act
        var result = await sut.UpdateAsync(todoId, updateDto, userId, isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.Title.Should().Be("Updated Title");
        result.Data.IsCompleted.Should().BeTrue();

        var inDb = await context.TodoItems.FindAsync(todoId);
        inDb!.Title.Should().Be("Updated Title");
        inDb.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAsync_WhenTodoBelongsToOtherUser_ReturnsForbidden()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        context.TodoItems.Add(new TodoItem
        {
            Id = todoId,
            Title = "Initial Title",
            OwnerId = "owner-id"
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);
        var updateDto = new UpdateTodoRequestDto { Title = "Hacked Title" };

        // Act
        var result = await sut.UpdateAsync(todoId, updateDto, "attacker-id", isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.Forbidden);
    }

    [Fact]
    public async Task UpdateAsync_WhenTodoDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var sut = CreateSut(context);
        var updateDto = new UpdateTodoRequestDto { Title = "Some Title" };

        // Act
        var result = await sut.UpdateAsync(Guid.NewGuid(), updateDto, "user-1", isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.NotFound);
    }

    [Fact]
    public async Task UpdateAsync_WhenValidationFails_ReturnsValidationFailure()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        var userId = "user-1";
        context.TodoItems.Add(new TodoItem
        {
            Id = todoId,
            Title = "Initial Title",
            OwnerId = userId
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);
        var invalidUpdateDto = new UpdateTodoRequestDto
        {
            Title = "", // empty
            DueDate = DateTime.UtcNow.AddDays(-10) // past
        };

        // Act
        var result = await sut.UpdateAsync(todoId, invalidUpdateDto, userId, isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.Validation);
    }

    [Fact]
    public async Task DeleteAsync_WhenTodoBelongsToUser_DeletesAndReturnsSuccess()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        var userId = "user-1";
        context.TodoItems.Add(new TodoItem { Id = todoId, Title = "To Delete", OwnerId = userId });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.DeleteAsync(todoId, userId, isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeTrue();
        (await context.TodoItems.FindAsync(todoId)).Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_WhenTodoBelongsToOtherUser_ReturnsForbidden()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        context.TodoItems.Add(new TodoItem { Id = todoId, Title = "Private", OwnerId = "owner-id" });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.DeleteAsync(todoId, "other-user", isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.Forbidden);
        (await context.TodoItems.FindAsync(todoId)).Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteAsync_WhenTodoDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var sut = CreateSut(context);

        // Act
        var result = await sut.DeleteAsync(Guid.NewGuid(), "user-1", isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.NotFound);
    }

    [Fact]
    public async Task ToggleCompleteAsync_WhenTodoBelongsToUser_FlipsCompletionAndReturnsTodo()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        var userId = "user-1";
        context.TodoItems.Add(new TodoItem
        {
            Id = todoId,
            Title = "Toggle Test",
            OwnerId = userId,
            IsCompleted = false
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.ToggleCompleteAsync(todoId, userId, isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.IsCompleted.Should().BeTrue();

        var inDb = await context.TodoItems.FindAsync(todoId);
        inDb!.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task ToggleCompleteAsync_WhenTodoBelongsToOtherUser_ReturnsForbidden()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var todoId = Guid.NewGuid();
        context.TodoItems.Add(new TodoItem
        {
            Id = todoId,
            Title = "Toggle Test",
            OwnerId = "owner-id",
            IsCompleted = false
        });
        await context.SaveChangesAsync();

        var sut = CreateSut(context);

        // Act
        var result = await sut.ToggleCompleteAsync(todoId, "other-id", isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.Forbidden);
    }

    [Fact]
    public async Task ToggleCompleteAsync_WhenTodoDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var sut = CreateSut(context);

        // Act
        var result = await sut.ToggleCompleteAsync(Guid.NewGuid(), "user-1", isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorType.Should().Be(ServiceErrorType.NotFound);
    }
}


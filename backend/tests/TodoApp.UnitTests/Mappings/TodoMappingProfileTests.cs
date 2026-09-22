using AutoMapper;
using FluentAssertions;
using TodoApp.Application.Features.Todos.Dtos;
using TodoApp.Application.Features.Todos.Mappings;
using TodoApp.Domain.Entities;
using TodoApp.Domain.Enums;
using Xunit;

namespace TodoApp.UnitTests.Mappings;

public class TodoMappingProfileTests
{
    private readonly IMapper _mapper;

    public TodoMappingProfileTests()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<TodoMappingProfile>();
        });
        config.AssertConfigurationIsValid();
        _mapper = config.CreateMapper();
    }

    [Fact]
    public void AutoMapper_Configuration_IsValid()
    {
        // Asserted in constructor via AssertConfigurationIsValid()
        _mapper.Should().NotBeNull();
    }

    [Fact]
    public void Map_TodoItemToTodoResponseDto_MapsAllPropertiesAccurately()
    {
        // Arrange
        var todoId = Guid.NewGuid();
        var dueDate = DateTime.UtcNow.AddDays(3);
        var created = DateTime.UtcNow.AddHours(-1);
        var updated = DateTime.UtcNow;

        var entity = new TodoItem
        {
            Id = todoId,
            Title = "Test Task",
            Description = "Test Details",
            IsCompleted = true,
            Priority = TodoPriority.High,
            DueDate = dueDate,
            OwnerId = "user-123",
            CreatedAt = created,
            UpdatedAt = updated
        };

        // Act
        var dto = _mapper.Map<TodoResponseDto>(entity);

        // Assert
        dto.Should().NotBeNull();
        dto.Id.Should().Be(todoId);
        dto.Title.Should().Be("Test Task");
        dto.Description.Should().Be("Test Details");
        dto.IsCompleted.Should().BeTrue();
        dto.Priority.Should().Be("High");
        dto.DueDate.Should().Be(dueDate);
        dto.OwnerId.Should().Be("user-123");
        dto.CreatedAt.Should().Be(created);
        dto.UpdatedAt.Should().Be(updated);
    }

    [Fact]
    public void Map_CreateTodoRequestDtoToTodoItem_MapsPropertiesCorrectly()
    {
        // Arrange
        var dueDate = DateTime.UtcNow.AddDays(5);
        var dto = new CreateTodoRequestDto
        {
            Title = "New Task",
            Description = "Description here",
            Priority = TodoPriority.Medium,
            DueDate = dueDate
        };

        // Act
        var entity = _mapper.Map<TodoItem>(dto);

        // Assert
        entity.Should().NotBeNull();
        entity.Title.Should().Be("New Task");
        entity.Description.Should().Be("Description here");
        entity.Priority.Should().Be(TodoPriority.Medium);
        entity.DueDate.Should().Be(dueDate);
    }

    [Fact]
    public void Map_UpdateTodoRequestDtoToTodoItem_UpdatesTargetEntity()
    {
        // Arrange
        var original = new TodoItem
        {
            Id = Guid.NewGuid(),
            Title = "Old Title",
            Description = "Old Desc",
            IsCompleted = false,
            Priority = TodoPriority.Low,
            OwnerId = "user-1"
        };

        var updateDto = new UpdateTodoRequestDto
        {
            Title = "Updated Title",
            Description = "Updated Desc",
            IsCompleted = true,
            Priority = TodoPriority.High,
            DueDate = DateTime.UtcNow.AddDays(2)
        };

        // Act
        _mapper.Map(updateDto, original);

        // Assert
        original.Title.Should().Be("Updated Title");
        original.Description.Should().Be("Updated Desc");
        original.IsCompleted.Should().BeTrue();
        original.Priority.Should().Be(TodoPriority.High);
        original.DueDate.Should().Be(updateDto.DueDate);
    }
}


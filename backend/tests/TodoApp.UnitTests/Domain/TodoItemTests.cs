using TodoApp.Domain.Entities;
using TodoApp.Domain.Enums;
using TodoApp.Domain.Exceptions;

namespace TodoApp.UnitTests.Domain;

public class TodoItemTests
{
    [Fact]
    public void TodoItem_DefaultValues_ShouldBeSetCorrectly()
    {
        var todo = new TodoItem();

        Assert.Equal(Guid.Empty, todo.Id);
        Assert.Equal(string.Empty, todo.Title);
        Assert.Null(todo.Description);
        Assert.False(todo.IsCompleted);
        Assert.Equal(TodoPriority.Medium, todo.Priority);
        Assert.Null(todo.DueDate);
        Assert.Equal(string.Empty, todo.OwnerId);
    }

    [Fact]
    public void Exceptions_ShouldContainExpectedMessages()
    {
        var notFound = new NotFoundException("TodoItem", "123");
        Assert.Contains("Entity \"TodoItem\" (123) was not found.", notFound.Message);

        var forbidden = new ForbiddenException();
        Assert.Equal("You do not have permission to access this resource.", forbidden.Message);

        var errors = new Dictionary<string, string[]>
        {
            { "Title", new[] { "Title is required." } }
        };
        var validation = new ValidationAppException(errors);
        Assert.True(validation.Errors.ContainsKey("Title"));
    }
}


using TodoApp.Application.Features.Todos.Dtos;
using TodoApp.Application.Features.Todos.Validators;
using TodoApp.Domain.Enums;

namespace TodoApp.UnitTests.Todos;

public class TodoValidatorTests
{
    private readonly CreateTodoRequestDtoValidator _validator = new();

    [Fact]
    public void Validator_ShouldFail_WhenTitleIsEmpty()
    {
        var dto = new CreateTodoRequestDto { Title = "" };
        var result = _validator.Validate(dto);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Title");
    }

    [Fact]
    public void Validator_ShouldFail_WhenDueDateIsInThePast()
    {
        var dto = new CreateTodoRequestDto
        {
            Title = "Valid title",
            DueDate = DateTime.UtcNow.AddDays(-2)
        };
        var result = _validator.Validate(dto);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "DueDate");
    }

    [Fact]
    public void Validator_ShouldPass_WhenDataIsValid()
    {
        var dto = new CreateTodoRequestDto
        {
            Title = "Valid task",
            Description = "A valid description",
            Priority = TodoPriority.High,
            DueDate = DateTime.UtcNow.AddDays(1)
        };
        var result = _validator.Validate(dto);

        Assert.True(result.IsValid);
    }
}


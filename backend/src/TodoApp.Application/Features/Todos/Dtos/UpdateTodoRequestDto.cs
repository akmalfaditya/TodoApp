using TodoApp.Domain.Enums;

namespace TodoApp.Application.Features.Todos.Dtos;

public class UpdateTodoRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TodoPriority Priority { get; set; } = TodoPriority.Medium;
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
}


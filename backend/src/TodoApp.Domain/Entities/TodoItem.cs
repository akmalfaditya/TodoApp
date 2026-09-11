using TodoApp.Domain.Enums;

namespace TodoApp.Domain.Entities;

public class TodoItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCompleted { get; set; } = false;
    public TodoPriority Priority { get; set; } = TodoPriority.Medium;
    public DateTime? DueDate { get; set; }
    public string OwnerId { get; set; } = string.Empty;
}


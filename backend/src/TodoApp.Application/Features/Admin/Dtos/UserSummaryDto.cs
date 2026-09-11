namespace TodoApp.Application.Features.Admin.Dtos;

public class UserSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public bool IsLocked { get; set; }
    public DateTime CreatedAt { get; set; }
}


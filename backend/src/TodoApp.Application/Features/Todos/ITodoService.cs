using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Todos.Dtos;

namespace TodoApp.Application.Features.Todos;

public interface ITodoService
{
    Task<ServiceResult<List<TodoResponseDto>>> GetAllForUserAsync(string userId, bool isAdmin);
    Task<ServiceResult<TodoResponseDto>> GetByIdAsync(Guid id, string userId, bool isAdmin);
    Task<ServiceResult<TodoResponseDto>> CreateAsync(CreateTodoRequestDto dto, string userId);
    Task<ServiceResult<TodoResponseDto>> UpdateAsync(Guid id, UpdateTodoRequestDto dto, string userId, bool isAdmin);
    Task<ServiceResult> DeleteAsync(Guid id, string userId, bool isAdmin);
    Task<ServiceResult<TodoResponseDto>> ToggleCompleteAsync(Guid id, string userId, bool isAdmin);
}


using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Admin.Dtos;

namespace TodoApp.Application.Features.Admin;

public interface IAdminUserService
{
    Task<ServiceResult<List<UserSummaryDto>>> GetAllUsersAsync();
    Task<ServiceResult<UserSummaryDto>> GetUserByIdAsync(string id);
    Task<ServiceResult> UpdateUserRoleAsync(string id, string newRole, string currentAdminId);
    Task<ServiceResult> ToggleLockUserAsync(string id, string currentAdminId);
    Task<ServiceResult> DeleteUserAsync(string id, string currentAdminId);
}


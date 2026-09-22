using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Admin;
using TodoApp.Application.Features.Admin.Dtos;
using TodoApp.Application.Identity;

namespace TodoApp.Infrastructure.Services;

public class AdminUserService(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager,
    IValidator<UpdateUserRoleRequestDto> updateRoleValidator,
    ILogger<AdminUserService> logger) : IAdminUserService
{
    public async Task<ServiceResult<List<UserSummaryDto>>> GetAllUsersAsync()
    {
        var users = await userManager.Users.ToListAsync();
        var resultList = new List<UserSummaryDto>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            var isLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow;

            resultList.Add(new UserSummaryDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                Roles = roles.ToList(),
                IsLocked = isLocked,
                CreatedAt = user.CreatedAt
            });
        }

        return ServiceResult<List<UserSummaryDto>>.Success(resultList);
    }

    public async Task<ServiceResult<UserSummaryDto>> GetUserByIdAsync(string id)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ServiceResult<UserSummaryDto>.NotFound("User tidak ditemukan.");
        }

        var roles = await userManager.GetRolesAsync(user);
        var isLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow;

        var dto = new UserSummaryDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles.ToList(),
            IsLocked = isLocked,
            CreatedAt = user.CreatedAt
        };

        return ServiceResult<UserSummaryDto>.Success(dto);
    }

    public async Task<ServiceResult> UpdateUserRoleAsync(string id, string newRole, string currentAdminId)
    {
        if (id == currentAdminId)
        {
            logger.LogWarning("Admin {AdminId} attempted to change their own role", currentAdminId);
            return ServiceResult.Failure("Tidak bisa mengubah role akun sendiri");
        }

        var validationResult = await updateRoleValidator.ValidateAsync(new UpdateUserRoleRequestDto { Role = newRole });
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return ServiceResult.ValidationFailure(errors);
        }

        var user = await userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ServiceResult.NotFound("User tidak ditemukan.");
        }

        if (!await roleManager.RoleExistsAsync(newRole))
        {
            await roleManager.CreateAsync(new IdentityRole(newRole));
        }

        var currentRoles = await userManager.GetRolesAsync(user);
        var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
        if (!removeResult.Succeeded)
        {
            var errors = string.Join("; ", removeResult.Errors.Select(e => e.Description));
            return ServiceResult.Failure(errors);
        }

        var addResult = await userManager.AddToRoleAsync(user, newRole);
        if (!addResult.Succeeded)
        {
            var errors = string.Join("; ", addResult.Errors.Select(e => e.Description));
            return ServiceResult.Failure(errors);
        }

        logger.LogInformation("Admin {AdminId} updated role of user {UserId} to {NewRole}", currentAdminId, id, newRole);

        return ServiceResult.Success();
    }

    public async Task<ServiceResult> ToggleLockUserAsync(string id, string currentAdminId)
    {
        if (id == currentAdminId)
        {
            logger.LogWarning("Admin {AdminId} attempted to lock their own account", currentAdminId);
            return ServiceResult.Failure("Tidak bisa mengunci akun sendiri");
        }

        var user = await userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ServiceResult.NotFound("User tidak ditemukan.");
        }

        var isCurrentlyLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow;
        if (isCurrentlyLocked)
        {
            await userManager.SetLockoutEndDateAsync(user, null);
            logger.LogInformation("Admin {AdminId} unlocked user {UserId}", currentAdminId, id);
        }
        else
        {
            await userManager.SetLockoutEnabledAsync(user, true);
            await userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
            logger.LogInformation("Admin {AdminId} locked user {UserId}", currentAdminId, id);
        }

        return ServiceResult.Success();
    }

    public async Task<ServiceResult> DeleteUserAsync(string id, string currentAdminId)
    {
        if (id == currentAdminId)
        {
            logger.LogWarning("Admin {AdminId} attempted to delete their own account", currentAdminId);
            return ServiceResult.Failure("Tidak bisa menghapus akun sendiri");
        }

        var user = await userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ServiceResult.NotFound("User tidak ditemukan.");
        }

        var result = await userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return ServiceResult.Failure(errors);
        }

        logger.LogInformation("Admin {AdminId} deleted user {UserId}", currentAdminId, id);

        return ServiceResult.Success();
    }
}

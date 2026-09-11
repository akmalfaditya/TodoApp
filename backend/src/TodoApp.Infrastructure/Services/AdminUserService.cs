using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Admin;
using TodoApp.Application.Features.Admin.Dtos;
using TodoApp.Application.Identity;

namespace TodoApp.Infrastructure.Services;

public class AdminUserService : IAdminUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IValidator<UpdateUserRoleRequestDto> _updateRoleValidator;

    public AdminUserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IValidator<UpdateUserRoleRequestDto> updateRoleValidator)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _updateRoleValidator = updateRoleValidator;
    }

    public async Task<ServiceResult<List<UserSummaryDto>>> GetAllUsersAsync()
    {
        var users = await _userManager.Users.ToListAsync();
        var resultList = new List<UserSummaryDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
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
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ServiceResult<UserSummaryDto>.NotFound("User tidak ditemukan.");
        }

        var roles = await _userManager.GetRolesAsync(user);
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
            return ServiceResult.Failure("Tidak bisa mengubah role akun sendiri");
        }

        var validationResult = await _updateRoleValidator.ValidateAsync(new UpdateUserRoleRequestDto { Role = newRole });
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return ServiceResult.ValidationFailure(errors);
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ServiceResult.NotFound("User tidak ditemukan.");
        }

        if (!await _roleManager.RoleExistsAsync(newRole))
        {
            await _roleManager.CreateAsync(new IdentityRole(newRole));
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
        if (!removeResult.Succeeded)
        {
            var errors = string.Join("; ", removeResult.Errors.Select(e => e.Description));
            return ServiceResult.Failure(errors);
        }

        var addResult = await _userManager.AddToRoleAsync(user, newRole);
        if (!addResult.Succeeded)
        {
            var errors = string.Join("; ", addResult.Errors.Select(e => e.Description));
            return ServiceResult.Failure(errors);
        }

        return ServiceResult.Success();
    }

    public async Task<ServiceResult> ToggleLockUserAsync(string id, string currentAdminId)
    {
        if (id == currentAdminId)
        {
            return ServiceResult.Failure("Tidak bisa mengunci akun sendiri");
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ServiceResult.NotFound("User tidak ditemukan.");
        }

        var isCurrentlyLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow;
        if (isCurrentlyLocked)
        {
            await _userManager.SetLockoutEndDateAsync(user, null);
        }
        else
        {
            await _userManager.SetLockoutEnabledAsync(user, true);
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
        }

        return ServiceResult.Success();
    }

    public async Task<ServiceResult> DeleteUserAsync(string id, string currentAdminId)
    {
        if (id == currentAdminId)
        {
            return ServiceResult.Failure("Tidak bisa menghapus akun sendiri");
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ServiceResult.NotFound("User tidak ditemukan.");
        }

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return ServiceResult.Failure(errors);
        }

        return ServiceResult.Success();
    }
}


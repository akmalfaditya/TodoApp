using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Features.Admin;
using TodoApp.Application.Features.Admin.Dtos;

namespace TodoApp.Api.Controllers;

[Authorize(Roles = Roles.Admin)]
[Route("api/admin/users")]
public class AdminUsersController : ApiControllerBase
{
    private readonly IAdminUserService _adminUserService;

    public AdminUsersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    private string CurrentAdminId => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                     ?? User.FindFirst("sub")?.Value
                                     ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _adminUserService.GetAllUsersAsync();
        return HandleResult(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById([FromRoute] string id)
    {
        var result = await _adminUserService.GetUserByIdAsync(id);
        return HandleResult(result);
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateRole([FromRoute] string id, [FromBody] UpdateUserRoleRequestDto dto)
    {
        var result = await _adminUserService.UpdateUserRoleAsync(id, dto.Role, CurrentAdminId);
        return HandleResult(result, StatusCodes.Status200OK);
    }

    [HttpPatch("{id}/toggle-lock")]
    public async Task<IActionResult> ToggleLock([FromRoute] string id)
    {
        var result = await _adminUserService.ToggleLockUserAsync(id, CurrentAdminId);
        return HandleResult(result, StatusCodes.Status200OK);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] string id)
    {
        var result = await _adminUserService.DeleteUserAsync(id, CurrentAdminId);
        return HandleResult(result);
    }
}


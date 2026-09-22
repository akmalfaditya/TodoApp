using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Features.Admin;
using TodoApp.Application.Features.Admin.Dtos;

namespace TodoApp.Api.Controllers;

[Authorize(Roles = Roles.Admin)]
[Route("api/admin/users")]
public class AdminUsersController(IAdminUserService adminUserService) : ApiControllerBase
{
    private string CurrentAdminId => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                     ?? User.FindFirst("sub")?.Value
                                     ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await adminUserService.GetAllUsersAsync();
        return HandleResult(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById([FromRoute] string id)
    {
        var result = await adminUserService.GetUserByIdAsync(id);
        return HandleResult(result);
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateRole([FromRoute] string id, [FromBody] UpdateUserRoleRequestDto dto)
    {
        var result = await adminUserService.UpdateUserRoleAsync(id, dto.Role, CurrentAdminId);
        return HandleResult(result, StatusCodes.Status200OK);
    }

    [HttpPatch("{id}/toggle-lock")]
    public async Task<IActionResult> ToggleLock([FromRoute] string id)
    {
        var result = await adminUserService.ToggleLockUserAsync(id, CurrentAdminId);
        return HandleResult(result, StatusCodes.Status200OK);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] string id)
    {
        var result = await adminUserService.DeleteUserAsync(id, CurrentAdminId);
        return HandleResult(result);
    }
}

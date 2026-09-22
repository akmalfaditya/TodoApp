using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Features.Todos;
using TodoApp.Application.Features.Todos.Dtos;

namespace TodoApp.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
public class TodosController(ITodoService todoService) : ApiControllerBase
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                    ?? User.FindFirst("sub")?.Value
                                    ?? string.Empty;

    private bool IsAdmin => User.IsInRole(Roles.Admin);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await todoService.GetAllForUserAsync(CurrentUserId, IsAdmin);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var result = await todoService.GetByIdAsync(id, CurrentUserId, IsAdmin);
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTodoRequestDto dto)
    {
        var result = await todoService.CreateAsync(dto, CurrentUserId);
        return HandleResult(result, StatusCodes.Status201Created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateTodoRequestDto dto)
    {
        var result = await todoService.UpdateAsync(id, dto, CurrentUserId, IsAdmin);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var result = await todoService.DeleteAsync(id, CurrentUserId, IsAdmin);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/complete")]
    public async Task<IActionResult> ToggleComplete([FromRoute] Guid id)
    {
        var result = await todoService.ToggleCompleteAsync(id, CurrentUserId, IsAdmin);
        return HandleResult(result);
    }
}

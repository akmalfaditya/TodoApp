using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.Application.Features.Auth;
using TodoApp.Application.Features.Auth.Dtos;

namespace TodoApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ApiControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        var result = await authService.RegisterAsync(dto);
        return HandleResult(result, StatusCodes.Status201Created);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await authService.LoginAsync(dto);
        return HandleResult(result);
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult GetMe()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                 ?? User.FindFirst("sub")?.Value 
                 ?? string.Empty;

        var email = User.FindFirstValue(ClaimTypes.Email) 
                    ?? User.FindFirst("email")?.Value 
                    ?? string.Empty;

        var fullName = User.FindFirst("FullName")?.Value 
                       ?? User.FindFirst(ClaimTypes.Name)?.Value 
                       ?? string.Empty;

        var roles = User.FindAll(c => c.Type == ClaimTypes.Role || c.Type == "role")
                        .Select(c => c.Value)
                        .Distinct()
                        .ToList();

        return Ok(new
        {
            id,
            email,
            fullName,
            roles
        });
    }
}

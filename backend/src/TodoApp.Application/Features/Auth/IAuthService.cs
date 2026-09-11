using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Auth.Dtos;

namespace TodoApp.Application.Features.Auth;

public interface IAuthService
{
    Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto);
    Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto dto);
}


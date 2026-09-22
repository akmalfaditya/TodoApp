using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Auth;
using TodoApp.Application.Features.Auth.Dtos;
using TodoApp.Application.Identity;
using TodoApp.Application.Interfaces;

namespace TodoApp.Infrastructure.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager,
    IJwtTokenService jwtTokenService,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto)
    {
        if (dto.Password != dto.ConfirmPassword)
        {
            return ServiceResult<AuthResponseDto>.Failure("Konfirmasi password tidak cocok.");
        }

        var existingUser = await userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return ServiceResult<AuthResponseDto>.Failure("Email sudah terdaftar.");
        }

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName
        };

        var result = await userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return ServiceResult<AuthResponseDto>.Failure(errors);
        }

        if (!await roleManager.RoleExistsAsync(Roles.User))
        {
            await roleManager.CreateAsync(new IdentityRole(Roles.User));
        }

        await userManager.AddToRoleAsync(user, Roles.User);

        var roles = await userManager.GetRolesAsync(user);
        var token = jwtTokenService.GenerateToken(user, roles);
        var expiresAt = jwtTokenService.GetTokenExpiryUtc();

        logger.LogInformation("New user registered successfully: {Email}", user.Email);

        return ServiceResult<AuthResponseDto>.Success(new AuthResponseDto
        {
            Id = user.Id,
            Token = token,
            ExpiresAtUtc = expiresAt,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles.ToList()
        });
    }

    public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await userManager.CheckPasswordAsync(user, dto.Password))
        {
            logger.LogWarning("Failed login attempt for {Email}", dto.Email);
            return ServiceResult<AuthResponseDto>.Failure("Email atau password salah");
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            logger.LogWarning("Login attempt for locked account: {Email}", dto.Email);
            return ServiceResult<AuthResponseDto>.Failure("Akun Anda telah dikunci oleh administrator.", ServiceErrorType.Forbidden);
        }

        var roles = await userManager.GetRolesAsync(user);
        var token = jwtTokenService.GenerateToken(user, roles);
        var expiresAt = jwtTokenService.GetTokenExpiryUtc();

        logger.LogInformation("User logged in successfully: {Email}", user.Email);

        return ServiceResult<AuthResponseDto>.Success(new AuthResponseDto
        {
            Id = user.Id,
            Token = token,
            ExpiresAtUtc = expiresAt,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles.ToList()
        });
    }
}

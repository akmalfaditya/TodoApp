using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Auth;
using TodoApp.Application.Features.Auth.Dtos;
using TodoApp.Application.Identity;
using TodoApp.Application.Interfaces;

namespace TodoApp.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IJwtTokenService jwtTokenService,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto)
    {
        if (dto.Password != dto.ConfirmPassword)
        {
            return ServiceResult<AuthResponseDto>.Failure("Konfirmasi password tidak cocok.");
        }

        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
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

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return ServiceResult<AuthResponseDto>.Failure(errors);
        }

        if (!await _roleManager.RoleExistsAsync(Roles.User))
        {
            await _roleManager.CreateAsync(new IdentityRole(Roles.User));
        }

        await _userManager.AddToRoleAsync(user, Roles.User);

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenService.GenerateToken(user, roles);
        var expiresAt = _jwtTokenService.GetTokenExpiryUtc();

        _logger.LogInformation("New user registered successfully: {Email}", user.Email);

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
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            _logger.LogWarning("Failed login attempt for {Email}", dto.Email);
            return ServiceResult<AuthResponseDto>.Failure("Email atau password salah");
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            _logger.LogWarning("Login attempt for locked account: {Email}", dto.Email);
            return ServiceResult<AuthResponseDto>.Failure("Akun Anda telah dikunci oleh administrator.", ServiceErrorType.Forbidden);
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenService.GenerateToken(user, roles);
        var expiresAt = _jwtTokenService.GetTokenExpiryUtc();

        _logger.LogInformation("User logged in successfully: {Email}", user.Email);

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

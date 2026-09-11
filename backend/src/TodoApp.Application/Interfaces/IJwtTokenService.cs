using TodoApp.Application.Identity;

namespace TodoApp.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(ApplicationUser user, IList<string> roles);
    DateTime GetTokenExpiryUtc();
}


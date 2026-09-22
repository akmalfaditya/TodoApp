using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using TodoApp.Application.Identity;
using TodoApp.Infrastructure.Services;
using Xunit;

namespace TodoApp.UnitTests.Services;

public class JwtTokenServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly JwtTokenService _sut;

    public JwtTokenServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Key", "super_secret_test_key_with_sufficient_length_12345!" },
            { "Jwt:Issuer", "TodoAppTestIssuer" },
            { "Jwt:Audience", "TodoAppTestAudience" },
            { "Jwt:ExpiryMinutes", "120" }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _sut = new JwtTokenService(_configuration);
    }

    [Fact]
    public void GetTokenExpiryUtc_ReturnsConfiguredFutureExpiry()
    {
        // Arrange
        var before = DateTime.UtcNow.AddMinutes(119);

        // Act
        var expiry = _sut.GetTokenExpiryUtc();

        // Assert
        expiry.Should().BeAfter(before);
        expiry.Should().BeBefore(DateTime.UtcNow.AddMinutes(121));
    }

    [Fact]
    public void GenerateToken_ReturnsValidSignedJwtWithAllClaimsAndRoles()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "test@example.com",
            FullName = "Test User"
        };
        var roles = new List<string> { "User", "Admin" };

        // Act
        var tokenString = _sut.GenerateToken(user, roles);

        // Assert
        tokenString.Should().NotBeNullOrWhiteSpace();

        var handler = new JwtSecurityTokenHandler();
        handler.CanReadToken(tokenString).Should().BeTrue();

        var jwtToken = handler.ReadJwtToken(tokenString);
        jwtToken.Issuer.Should().Be("TodoAppTestIssuer");
        jwtToken.Audiences.Should().Contain("TodoAppTestAudience");

        var claims = jwtToken.Claims.ToList();
        claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id);
        claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == user.Id);
        claims.Should().Contain(c => c.Type == ClaimTypes.Email && c.Value == user.Email);
        claims.Should().Contain(c => c.Type == "FullName" && c.Value == user.FullName);
        claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "User");
        claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "Admin");
    }
}


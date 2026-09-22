using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TodoApp.Application.Common.Interfaces;
using TodoApp.Infrastructure.Persistence;

namespace TodoApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DefaultConnection");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(connectionString));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<TodoApp.Application.Interfaces.IJwtTokenService, Services.JwtTokenService>();
        services.AddScoped<TodoApp.Application.Features.Auth.IAuthService, Services.AuthService>();
        services.AddScoped<TodoApp.Application.Features.Admin.IAdminUserService, Services.AdminUserService>();

        return services;
    }
}

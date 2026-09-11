using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TodoApp.Domain.Interfaces;
using TodoApp.Infrastructure.Persistence;
using TodoApp.Infrastructure.Persistence.Repositories;

namespace TodoApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DefaultConnection");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(connectionString));

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<ITodoRepository, TodoRepository>();
        services.AddScoped<TodoApp.Application.Interfaces.IJwtTokenService, Services.JwtTokenService>();
        services.AddScoped<TodoApp.Application.Features.Auth.IAuthService, Services.AuthService>();
        services.AddScoped<TodoApp.Application.Features.Admin.IAdminUserService, Services.AdminUserService>();

        return services;
    }
}


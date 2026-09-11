using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Identity;
using TodoApp.Domain.Entities;
using TodoApp.Domain.Enums;

namespace TodoApp.Infrastructure.Persistence.Seed;

public static class IdentitySeeder
{
    public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var configuration = serviceProvider.GetRequiredService<IConfiguration>();
        var dbContext = serviceProvider.GetRequiredService<ApplicationDbContext>();

        // 1. Seed Roles
        string[] roles = [Roles.Admin, Roles.User];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 2. Seed Default Admin
        const string adminEmail = "admin@todoapp.local";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            var adminPassword = configuration["SeedAdmin:Password"] ?? "Admin@12345";

            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Administrator",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow.AddMonths(-1)
            };

            var createResult = await userManager.CreateAsync(adminUser, adminPassword);
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, Roles.Admin);
                await userManager.AddToRoleAsync(adminUser, Roles.User);
            }
        }

        // 3. Seed Demo Users
        const string johnEmail = "john.doe@todoapp.local";
        var johnUser = await userManager.FindByEmailAsync(johnEmail);
        if (johnUser == null)
        {
            johnUser = new ApplicationUser
            {
                UserName = johnEmail,
                Email = johnEmail,
                FullName = "John Doe",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow.AddDays(-14)
            };

            var createResult = await userManager.CreateAsync(johnUser, "User@12345");
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(johnUser, Roles.User);
            }
        }

        const string janeEmail = "jane.smith@todoapp.local";
        var janeUser = await userManager.FindByEmailAsync(janeEmail);
        if (janeUser == null)
        {
            janeUser = new ApplicationUser
            {
                UserName = janeEmail,
                Email = janeEmail,
                FullName = "Jane Smith",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow.AddDays(-7)
            };

            var createResult = await userManager.CreateAsync(janeUser, "User@12345");
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(janeUser, Roles.User);
            }
        }

        // 4. Seed Comprehensive Todos
        if (!await dbContext.TodoItems.AnyAsync(t => t.Title == "Audit server logs and user access"))
        {
            var sampleTodos = new List<TodoItem>
            {
                // Admin's Todos
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Audit server logs and user access",
                    Description = "Review authentication logs and active sessions for suspicious activity.",
                    IsCompleted = false,
                    Priority = TodoPriority.High,
                    DueDate = DateTime.UtcNow.AddDays(1),
                    OwnerId = adminUser!.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Perform database vacuum and backup",
                    Description = "Schedule weekly maintenance window and test SQLite backup integrity.",
                    IsCompleted = true,
                    Priority = TodoPriority.Medium,
                    DueDate = DateTime.UtcNow.AddDays(-1),
                    OwnerId = adminUser.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },

                // John's Todos
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Setup local development environment",
                    Description = "Clone repository, restore dotnet dependencies, and run database migrations.",
                    IsCompleted = true,
                    Priority = TodoPriority.High,
                    DueDate = DateTime.UtcNow.AddDays(-3),
                    OwnerId = johnUser!.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow.AddDays(-3)
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Implement Todo CRUD API endpoints",
                    Description = "Build controller-based web API with proper DTO mapping and FluentValidation.",
                    IsCompleted = true,
                    Priority = TodoPriority.High,
                    DueDate = DateTime.UtcNow.AddDays(-1),
                    OwnerId = johnUser.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Write comprehensive unit test suite",
                    Description = "Ensure domain, service, and validator behaviors are fully covered with xUnit tests.",
                    IsCompleted = false,
                    Priority = TodoPriority.Medium,
                    DueDate = DateTime.UtcNow.AddDays(3),
                    OwnerId = johnUser.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Restock office coffee beans",
                    Description = "Arabica medium roast beans from the local roastery.",
                    IsCompleted = false,
                    Priority = TodoPriority.Low,
                    DueDate = DateTime.UtcNow.AddDays(5),
                    OwnerId = johnUser.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                },

                // Jane's Todos
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Design frontend dashboard in Figma",
                    Description = "Create high-fidelity mockups for todo lists, filtering, and admin user table.",
                    IsCompleted = true,
                    Priority = TodoPriority.High,
                    DueDate = DateTime.UtcNow.AddDays(-2),
                    OwnerId = janeUser!.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-6),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Collect initial user feedback",
                    Description = "Interview early beta testers regarding todo priorities and due date notifications.",
                    IsCompleted = false,
                    Priority = TodoPriority.Medium,
                    DueDate = DateTime.UtcNow.AddDays(2),
                    OwnerId = janeUser.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Review pull request for JWT auth module",
                    Description = "Verify claim-based authorization and error responses meet security specifications.",
                    IsCompleted = false,
                    Priority = TodoPriority.High,
                    DueDate = DateTime.UtcNow.AddDays(1),
                    OwnerId = janeUser.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                }
            };

            await dbContext.TodoItems.AddRangeAsync(sampleTodos);
            await dbContext.SaveChangesAsync();
        }
    }
}

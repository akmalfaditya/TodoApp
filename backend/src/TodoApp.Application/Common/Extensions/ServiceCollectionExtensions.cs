using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

using TodoApp.Application.Features.Todos;

namespace TodoApp.Application.Common.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(ServiceCollectionExtensions).Assembly);
        services.AddValidatorsFromAssembly(typeof(ServiceCollectionExtensions).Assembly);
        services.AddScoped<ITodoService, TodoService>();

        return services;
    }
}


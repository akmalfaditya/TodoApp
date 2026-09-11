using System.Net;
using System.Text.Json;
using TodoApp.Domain.Exceptions;

namespace TodoApp.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        int statusCode;
        string message;
        object responsePayload;

        switch (exception)
        {
            case NotFoundException notFoundEx:
                statusCode = StatusCodes.Status404NotFound;
                message = notFoundEx.Message;
                responsePayload = new { message, statusCode };
                break;

            case ForbiddenException forbiddenEx:
                statusCode = StatusCodes.Status403Forbidden;
                message = forbiddenEx.Message;
                responsePayload = new { message, statusCode };
                break;

            case ValidationAppException validationEx:
                statusCode = StatusCodes.Status400BadRequest;
                message = validationEx.Message;
                responsePayload = new { message, statusCode, errors = validationEx.Errors };
                break;

            default:
                _logger.LogError(exception, "An unhandled exception occurred: {Message}", exception.Message);
                statusCode = StatusCodes.Status500InternalServerError;
                message = "Terjadi kesalahan pada server";
                responsePayload = new { message, statusCode };
                break;
        }

        context.Response.StatusCode = statusCode;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(responsePayload, jsonOptions));
    }
}


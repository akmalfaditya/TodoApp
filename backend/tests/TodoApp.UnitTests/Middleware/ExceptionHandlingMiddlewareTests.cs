using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using TodoApp.Api.Middleware;
using TodoApp.Domain.Exceptions;
using Xunit;

namespace TodoApp.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private readonly NullLogger<ExceptionHandlingMiddleware> _logger = NullLogger<ExceptionHandlingMiddleware>.Instance;

    [Fact]
    public async Task InvokeAsync_WhenNoException_CallsNextDelegate()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var nextCalled = false;
        RequestDelegate next = ctx =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
    }

    [Fact]
    public async Task InvokeAsync_WhenNotFoundException_Returns404()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        RequestDelegate next = _ => throw new NotFoundException("TodoItem dengan id 'xyz' tidak ditemukan.");
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var responseText = await reader.ReadToEndAsync();
        var json = JsonDocument.Parse(responseText);

        Assert.Equal("TodoItem dengan id 'xyz' tidak ditemukan.", json.RootElement.GetProperty("message").GetString());
        Assert.Equal(404, json.RootElement.GetProperty("statusCode").GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_WhenForbiddenException_Returns403()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        RequestDelegate next = _ => throw new ForbiddenException("Anda tidak memiliki akses ke item ini.");
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var responseText = await reader.ReadToEndAsync();
        var json = JsonDocument.Parse(responseText);

        Assert.Equal("Anda tidak memiliki akses ke item ini.", json.RootElement.GetProperty("message").GetString());
        Assert.Equal(403, json.RootElement.GetProperty("statusCode").GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_WhenValidationAppException_Returns400WithErrors()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var errorsDict = new Dictionary<string, string[]>
        {
            { "Title", new[] { "Title wajib diisi." } }
        };
        RequestDelegate next = _ => throw new ValidationAppException(errorsDict);
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var responseText = await reader.ReadToEndAsync();
        var json = JsonDocument.Parse(responseText);

        Assert.Equal(400, json.RootElement.GetProperty("statusCode").GetInt32());
        Assert.True(json.RootElement.TryGetProperty("errors", out _));
        Assert.Contains("Title wajib diisi.", responseText);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnexpectedException_Returns500AndGenericMessage()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        RequestDelegate next = _ => throw new InvalidOperationException("Fatal database connection string leaked!");
        var middleware = new ExceptionHandlingMiddleware(next, _logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var responseText = await reader.ReadToEndAsync();
        var json = JsonDocument.Parse(responseText);

        Assert.Equal("Terjadi kesalahan pada server", json.RootElement.GetProperty("message").GetString());
        Assert.Equal(500, json.RootElement.GetProperty("statusCode").GetInt32());
        // Verify stack trace or internal details are NOT in response
        Assert.DoesNotContain("Fatal database connection string leaked!", responseText);
    }
}

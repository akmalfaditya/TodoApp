using TodoApp.Application.Common.Constants;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Identity;

namespace TodoApp.UnitTests.Common;

public class ServiceResultTests
{
    [Fact]
    public void ServiceResult_Success_ShouldSetProperties()
    {
        var result = ServiceResult<string>.Success("test-data");

        Assert.True(result.IsSuccess);
        Assert.Equal("test-data", result.Data);
        Assert.Null(result.ErrorMessage);
        Assert.Equal(ServiceErrorType.None, result.ErrorType);
        Assert.Empty(result.ValidationErrors);
    }

    [Fact]
    public void ServiceResult_NotFound_ShouldSetNotFoundTypeAndMessage()
    {
        var result = ServiceResult<string>.NotFound("Item not found");

        Assert.False(result.IsSuccess);
        Assert.Null(result.Data);
        Assert.Equal("Item not found", result.ErrorMessage);
        Assert.Equal(ServiceErrorType.NotFound, result.ErrorType);
    }

    [Fact]
    public void ServiceResult_Forbidden_ShouldSetForbiddenType()
    {
        var result = ServiceResult<string>.Forbidden("Access denied");

        Assert.False(result.IsSuccess);
        Assert.Equal("Access denied", result.ErrorMessage);
        Assert.Equal(ServiceErrorType.Forbidden, result.ErrorType);
    }

    [Fact]
    public void ServiceResult_ValidationFailure_ShouldSetErrorsAndValidationType()
    {
        var errors = new List<string> { "Title is required", "Priority is invalid" };
        var result = ServiceResult<string>.ValidationFailure(errors);

        Assert.False(result.IsSuccess);
        Assert.Equal(ServiceErrorType.Validation, result.ErrorType);
        Assert.Equal(2, result.ValidationErrors.Count);
        Assert.Contains("Title is required", result.ValidationErrors);
    }

    [Fact]
    public void NonGenericServiceResult_ShouldWorkCorrectly()
    {
        var success = ServiceResult.Success();
        Assert.True(success.IsSuccess);
        Assert.Equal(ServiceErrorType.None, success.ErrorType);

        var failure = ServiceResult.Failure("Failed operation", ServiceErrorType.BadRequest);
        Assert.False(failure.IsSuccess);
        Assert.Equal("Failed operation", failure.ErrorMessage);
        Assert.Equal(ServiceErrorType.BadRequest, failure.ErrorType);
    }

    [Fact]
    public void Roles_And_ApplicationUser_ShouldHaveExpectedValues()
    {
        Assert.Equal("Admin", Roles.Admin);
        Assert.Equal("User", Roles.User);

        var user = new ApplicationUser
        {
            FullName = "John Doe",
            Email = "john@example.com"
        };

        Assert.Equal("John Doe", user.FullName);
        Assert.Equal("john@example.com", user.Email);
    }
}

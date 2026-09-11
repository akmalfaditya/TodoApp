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
        Assert.Null(result.Error);
    }

    [Fact]
    public void ServiceResult_Failure_ShouldSetError()
    {
        var result = ServiceResult<string>.Failure("Invalid credentials");

        Assert.False(result.IsSuccess);
        Assert.Null(result.Data);
        Assert.Equal("Invalid credentials", result.Error);
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


using TodoApp.Application.Common.Constants;
using TodoApp.Application.Features.Admin.Dtos;
using TodoApp.Application.Features.Admin.Validators;

namespace TodoApp.UnitTests.Admin;

public class AdminValidatorTests
{
    private readonly UpdateUserRoleRequestDtoValidator _validator = new();

    [Fact]
    public void Validator_ShouldPass_ForValidRoles()
    {
        var adminResult = _validator.Validate(new UpdateUserRoleRequestDto { Role = Roles.Admin });
        var userResult = _validator.Validate(new UpdateUserRoleRequestDto { Role = Roles.User });

        Assert.True(adminResult.IsValid);
        Assert.True(userResult.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("SuperAdmin")]
    [InlineData("Moderator")]
    public void Validator_ShouldFail_ForInvalidRoles(string invalidRole)
    {
        var result = _validator.Validate(new UpdateUserRoleRequestDto { Role = invalidRole });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Role");
    }
}


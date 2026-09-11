using FluentValidation;
using TodoApp.Application.Common.Constants;
using TodoApp.Application.Features.Admin.Dtos;

namespace TodoApp.Application.Features.Admin.Validators;

public class UpdateUserRoleRequestDtoValidator : AbstractValidator<UpdateUserRoleRequestDto>
{
    public UpdateUserRoleRequestDtoValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Role wajib diisi.")
            .Must(role => role == Roles.Admin || role == Roles.User)
            .WithMessage($"Role harus salah satu dari '{Roles.Admin}' atau '{Roles.User}'.");
    }
}


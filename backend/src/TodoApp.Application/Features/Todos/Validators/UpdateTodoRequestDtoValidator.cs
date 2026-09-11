using FluentValidation;
using TodoApp.Application.Features.Todos.Dtos;

namespace TodoApp.Application.Features.Todos.Validators;

public class UpdateTodoRequestDtoValidator : AbstractValidator<UpdateTodoRequestDto>
{
    public UpdateTodoRequestDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title wajib diisi.")
            .MaximumLength(200).WithMessage("Title maksimal 200 karakter.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description maksimal 2000 karakter.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.DueDate)
            .Must(date => !date.HasValue || date.Value.Date >= DateTime.UtcNow.Date)
            .WithMessage("DueDate tidak boleh di masa lalu.")
            .When(x => x.DueDate.HasValue);
    }
}


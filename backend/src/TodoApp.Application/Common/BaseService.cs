using FluentValidation;
using TodoApp.Application.Common.Models;

namespace TodoApp.Application.Common;

public abstract class BaseService
{
    protected async Task<ServiceResult?> ValidateAsync<TDto>(IValidator<TDto> validator, TDto dto)
    {
        var validationResult = await validator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return ServiceResult.ValidationFailure(errors);
        }

        return null;
    }

    protected async Task<ServiceResult<TResult>?> ValidateAsync<TDto, TResult>(IValidator<TDto> validator, TDto dto)
    {
        var validationResult = await validator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return ServiceResult<TResult>.ValidationFailure(errors);
        }

        return null;
    }
}


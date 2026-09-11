using Microsoft.AspNetCore.Mvc;
using TodoApp.Application.Common.Models;

namespace TodoApp.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult HandleResult<T>(ServiceResult<T> result, int successStatusCode = StatusCodes.Status200OK)
    {
        if (result.IsSuccess)
        {
            return StatusCode(successStatusCode, result.Data);
        }

        return result.ErrorType switch
        {
            ServiceErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
            ServiceErrorType.Forbidden => StatusCode(StatusCodes.Status403Forbidden, new { error = result.ErrorMessage }),
            ServiceErrorType.Validation => BadRequest(new { errors = result.ValidationErrors }),
            ServiceErrorType.Unauthorized => Unauthorized(new { error = result.ErrorMessage }),
            ServiceErrorType.Conflict => Conflict(new { error = result.ErrorMessage }),
            _ => BadRequest(new { error = result.ErrorMessage })
        };
    }

    protected IActionResult HandleResult(ServiceResult result, int successStatusCode = StatusCodes.Status204NoContent)
    {
        if (result.IsSuccess)
        {
            return StatusCode(successStatusCode);
        }

        return result.ErrorType switch
        {
            ServiceErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
            ServiceErrorType.Forbidden => StatusCode(StatusCodes.Status403Forbidden, new { error = result.ErrorMessage }),
            ServiceErrorType.Validation => BadRequest(new { errors = result.ValidationErrors }),
            ServiceErrorType.Unauthorized => Unauthorized(new { error = result.ErrorMessage }),
            ServiceErrorType.Conflict => Conflict(new { error = result.ErrorMessage }),
            _ => BadRequest(new { error = result.ErrorMessage })
        };
    }
}


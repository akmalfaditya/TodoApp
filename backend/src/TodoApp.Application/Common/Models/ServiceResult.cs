namespace TodoApp.Application.Common.Models;

public enum ServiceErrorType
{
    None,
    BadRequest,
    NotFound,
    Forbidden,
    Validation,
    Unauthorized,
    Conflict
}

public class ServiceResult<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string? ErrorMessage { get; private set; }
    public ServiceErrorType ErrorType { get; private set; } = ServiceErrorType.None;
    public List<string> ValidationErrors { get; private set; } = new();

    public string? Error => ErrorMessage;

    public static ServiceResult<T> Success(T data) => new() { IsSuccess = true, Data = data };
    public static ServiceResult<T> Failure(string message, ServiceErrorType type = ServiceErrorType.BadRequest)
        => new() { IsSuccess = false, ErrorMessage = message, ErrorType = type };
    public static ServiceResult<T> NotFound(string message) => Failure(message, ServiceErrorType.NotFound);
    public static ServiceResult<T> Forbidden(string message) => Failure(message, ServiceErrorType.Forbidden);
    public static ServiceResult<T> ValidationFailure(List<string> errors)
        => new() { IsSuccess = false, ValidationErrors = errors, ErrorType = ServiceErrorType.Validation };
}

public class ServiceResult
{
    public bool IsSuccess { get; private set; }
    public string? ErrorMessage { get; private set; }
    public ServiceErrorType ErrorType { get; private set; } = ServiceErrorType.None;
    public List<string> ValidationErrors { get; private set; } = new();

    public string? Error => ErrorMessage;

    public static ServiceResult Success() => new() { IsSuccess = true };
    public static ServiceResult Failure(string message, ServiceErrorType type = ServiceErrorType.BadRequest)
        => new() { IsSuccess = false, ErrorMessage = message, ErrorType = type };
    public static ServiceResult NotFound(string message) => Failure(message, ServiceErrorType.NotFound);
    public static ServiceResult Forbidden(string message) => Failure(message, ServiceErrorType.Forbidden);
    public static ServiceResult ValidationFailure(List<string> errors)
        => new() { IsSuccess = false, ValidationErrors = errors, ErrorType = ServiceErrorType.Validation };
}

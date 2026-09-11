namespace TodoApp.Domain.Exceptions;

public class ValidationAppException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationAppException(string message) : base(message)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationAppException(IDictionary<string, string[]> errors)
        : base("One or more validation failures have occurred.")
    {
        Errors = errors;
    }
}


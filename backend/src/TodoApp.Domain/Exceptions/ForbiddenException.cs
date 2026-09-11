namespace TodoApp.Domain.Exceptions;

public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "You do not have permission to access this resource.") : base(message)
    {
    }
}


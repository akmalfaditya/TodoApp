using TodoApp.Domain.Entities;

namespace TodoApp.Domain.Interfaces;

public interface ITodoRepository : IGenericRepository<TodoItem>
{
    Task<IEnumerable<TodoItem>> GetByOwnerIdAsync(string ownerId);
}


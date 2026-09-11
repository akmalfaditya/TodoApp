using Microsoft.EntityFrameworkCore;
using TodoApp.Domain.Entities;
using TodoApp.Domain.Interfaces;

namespace TodoApp.Infrastructure.Persistence.Repositories;

public class TodoRepository : GenericRepository<TodoItem>, ITodoRepository
{
    public TodoRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<TodoItem>> GetByOwnerIdAsync(string ownerId)
    {
        return await _dbSet.Where(t => t.OwnerId == ownerId).ToListAsync();
    }
}


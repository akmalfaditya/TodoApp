using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TodoApp.Application.Common;
using TodoApp.Application.Common.Interfaces;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Todos.Dtos;
using TodoApp.Domain.Entities;

namespace TodoApp.Application.Features.Todos;

public class TodoService(
    IApplicationDbContext context,
    IMapper mapper,
    IValidator<CreateTodoRequestDto> createValidator,
    IValidator<UpdateTodoRequestDto> updateValidator,
    ILogger<TodoService> logger) : BaseService, ITodoService
{
    public async Task<ServiceResult<List<TodoResponseDto>>> GetAllForUserAsync(string userId, bool isAdmin)
    {
        var query = isAdmin
            ? context.TodoItems.AsNoTracking()
            : context.TodoItems.AsNoTracking().Where(t => t.OwnerId == userId);

        var items = await query.ToListAsync();
        var dtoList = mapper.Map<List<TodoResponseDto>>(items);
        return ServiceResult<List<TodoResponseDto>>.Success(dtoList);
    }

    public async Task<ServiceResult<TodoResponseDto>> GetByIdAsync(Guid id, string userId, bool isAdmin)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item == null)
        {
            return ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan.");
        }

        if (!isAdmin && item.OwnerId != userId)
        {
            logger.LogWarning("User {UserId} attempted unauthorized access to Todo {TodoId}", userId, id);
            return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses ke todo ini.");
        }

        var dto = mapper.Map<TodoResponseDto>(item);
        return ServiceResult<TodoResponseDto>.Success(dto);
    }

    public async Task<ServiceResult<TodoResponseDto>> CreateAsync(CreateTodoRequestDto dto, string userId)
    {
        var validationFailure = await ValidateAsync<CreateTodoRequestDto, TodoResponseDto>(createValidator, dto);
        if (validationFailure != null)
        {
            return validationFailure;
        }

        var item = mapper.Map<TodoItem>(dto);
        item.Id = Guid.NewGuid();
        item.OwnerId = userId;
        item.CreatedAt = DateTime.UtcNow;

        await context.TodoItems.AddAsync(item);
        await context.SaveChangesAsync();

        logger.LogInformation("Todo {TodoId} created successfully for user {UserId}", item.Id, userId);

        var responseDto = mapper.Map<TodoResponseDto>(item);
        return ServiceResult<TodoResponseDto>.Success(responseDto);
    }

    public async Task<ServiceResult<TodoResponseDto>> UpdateAsync(Guid id, UpdateTodoRequestDto dto, string userId, bool isAdmin)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item == null)
        {
            return ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan.");
        }

        if (!isAdmin && item.OwnerId != userId)
        {
            logger.LogWarning("User {UserId} attempted unauthorized update on Todo {TodoId}", userId, id);
            return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses untuk mengubah todo ini.");
        }

        var validationFailure = await ValidateAsync<UpdateTodoRequestDto, TodoResponseDto>(updateValidator, dto);
        if (validationFailure != null)
        {
            return validationFailure;
        }

        mapper.Map(dto, item);
        item.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        logger.LogInformation("Todo {TodoId} updated successfully by user {UserId}", id, userId);

        var responseDto = mapper.Map<TodoResponseDto>(item);
        return ServiceResult<TodoResponseDto>.Success(responseDto);
    }

    public async Task<ServiceResult> DeleteAsync(Guid id, string userId, bool isAdmin)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item == null)
        {
            return ServiceResult.NotFound("Todo tidak ditemukan.");
        }

        if (!isAdmin && item.OwnerId != userId)
        {
            logger.LogWarning("User {UserId} attempted unauthorized deletion on Todo {TodoId}", userId, id);
            return ServiceResult.Forbidden("Anda tidak memiliki akses untuk menghapus todo ini.");
        }

        context.TodoItems.Remove(item);
        await context.SaveChangesAsync();

        logger.LogInformation("Todo {TodoId} deleted successfully by user {UserId}", id, userId);

        return ServiceResult.Success();
    }

    public async Task<ServiceResult<TodoResponseDto>> ToggleCompleteAsync(Guid id, string userId, bool isAdmin)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item == null)
        {
            return ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan.");
        }

        if (!isAdmin && item.OwnerId != userId)
        {
            logger.LogWarning("User {UserId} attempted unauthorized toggle complete on Todo {TodoId}", userId, id);
            return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses ke todo ini.");
        }

        item.IsCompleted = !item.IsCompleted;
        item.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        logger.LogInformation("Todo {TodoId} completion toggled to {IsCompleted} by user {UserId}", id, item.IsCompleted, userId);

        var responseDto = mapper.Map<TodoResponseDto>(item);
        return ServiceResult<TodoResponseDto>.Success(responseDto);
    }
}

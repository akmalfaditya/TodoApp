using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Logging;
using TodoApp.Application.Common;
using TodoApp.Application.Common.Models;
using TodoApp.Application.Features.Todos.Dtos;
using TodoApp.Domain.Entities;
using TodoApp.Domain.Interfaces;

namespace TodoApp.Application.Features.Todos;

public class TodoService : BaseService, ITodoService
{
    private readonly ITodoRepository _todoRepository;
    private readonly IMapper _mapper;
    private readonly IValidator<CreateTodoRequestDto> _createValidator;
    private readonly IValidator<UpdateTodoRequestDto> _updateValidator;
    private readonly ILogger<TodoService> _logger;

    public TodoService(
        ITodoRepository todoRepository,
        IMapper mapper,
        IValidator<CreateTodoRequestDto> createValidator,
        IValidator<UpdateTodoRequestDto> updateValidator,
        ILogger<TodoService> logger)
    {
        _todoRepository = todoRepository;
        _mapper = mapper;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _logger = logger;
    }

    public async Task<ServiceResult<List<TodoResponseDto>>> GetAllForUserAsync(string userId, bool isAdmin)
    {
        var items = isAdmin
            ? await _todoRepository.GetAllAsync()
            : await _todoRepository.GetByOwnerIdAsync(userId);

        var dtoList = _mapper.Map<List<TodoResponseDto>>(items);
        return ServiceResult<List<TodoResponseDto>>.Success(dtoList);
    }

    public async Task<ServiceResult<TodoResponseDto>> GetByIdAsync(Guid id, string userId, bool isAdmin)
    {
        var item = await _todoRepository.GetByIdAsync(id);
        if (item == null)
        {
            return ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan.");
        }

        if (!isAdmin && item.OwnerId != userId)
        {
            _logger.LogWarning("User {UserId} attempted unauthorized access to Todo {TodoId}", userId, id);
            return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses ke todo ini.");
        }

        var dto = _mapper.Map<TodoResponseDto>(item);
        return ServiceResult<TodoResponseDto>.Success(dto);
    }

    public async Task<ServiceResult<TodoResponseDto>> CreateAsync(CreateTodoRequestDto dto, string userId)
    {
        var validationFailure = await ValidateAsync<CreateTodoRequestDto, TodoResponseDto>(_createValidator, dto);
        if (validationFailure != null)
        {
            return validationFailure;
        }

        var item = _mapper.Map<TodoItem>(dto);
        item.Id = Guid.NewGuid();
        item.OwnerId = userId;
        item.CreatedAt = DateTime.UtcNow;

        await _todoRepository.AddAsync(item);
        await _todoRepository.SaveChangesAsync();

        _logger.LogInformation("Todo {TodoId} created successfully for user {UserId}", item.Id, userId);

        var responseDto = _mapper.Map<TodoResponseDto>(item);
        return ServiceResult<TodoResponseDto>.Success(responseDto);
    }

    public async Task<ServiceResult<TodoResponseDto>> UpdateAsync(Guid id, UpdateTodoRequestDto dto, string userId, bool isAdmin)
    {
        var item = await _todoRepository.GetByIdAsync(id);
        if (item == null)
        {
            return ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan.");
        }

        if (!isAdmin && item.OwnerId != userId)
        {
            _logger.LogWarning("User {UserId} attempted unauthorized update on Todo {TodoId}", userId, id);
            return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses untuk mengubah todo ini.");
        }

        var validationFailure = await ValidateAsync<UpdateTodoRequestDto, TodoResponseDto>(_updateValidator, dto);
        if (validationFailure != null)
        {
            return validationFailure;
        }

        _mapper.Map(dto, item);
        item.UpdatedAt = DateTime.UtcNow;

        _todoRepository.Update(item);
        await _todoRepository.SaveChangesAsync();

        _logger.LogInformation("Todo {TodoId} updated successfully by user {UserId}", id, userId);

        var responseDto = _mapper.Map<TodoResponseDto>(item);
        return ServiceResult<TodoResponseDto>.Success(responseDto);
    }

    public async Task<ServiceResult> DeleteAsync(Guid id, string userId, bool isAdmin)
    {
        var item = await _todoRepository.GetByIdAsync(id);
        if (item == null)
        {
            return ServiceResult.NotFound("Todo tidak ditemukan.");
        }

        if (!isAdmin && item.OwnerId != userId)
        {
            _logger.LogWarning("User {UserId} attempted unauthorized deletion on Todo {TodoId}", userId, id);
            return ServiceResult.Forbidden("Anda tidak memiliki akses untuk menghapus todo ini.");
        }

        _todoRepository.Delete(item);
        await _todoRepository.SaveChangesAsync();

        _logger.LogInformation("Todo {TodoId} deleted successfully by user {UserId}", id, userId);

        return ServiceResult.Success();
    }

    public async Task<ServiceResult<TodoResponseDto>> ToggleCompleteAsync(Guid id, string userId, bool isAdmin)
    {
        var item = await _todoRepository.GetByIdAsync(id);
        if (item == null)
        {
            return ServiceResult<TodoResponseDto>.NotFound("Todo tidak ditemukan.");
        }

        if (!isAdmin && item.OwnerId != userId)
        {
            _logger.LogWarning("User {UserId} attempted unauthorized toggle complete on Todo {TodoId}", userId, id);
            return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses ke todo ini.");
        }

        item.IsCompleted = !item.IsCompleted;
        item.UpdatedAt = DateTime.UtcNow;

        _todoRepository.Update(item);
        await _todoRepository.SaveChangesAsync();

        _logger.LogInformation("Todo {TodoId} completion toggled to {IsCompleted} by user {UserId}", id, item.IsCompleted, userId);

        var responseDto = _mapper.Map<TodoResponseDto>(item);
        return ServiceResult<TodoResponseDto>.Success(responseDto);
    }
}

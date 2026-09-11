import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../../api/client';
import {
  fetchTodos,
  fetchTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleComplete,
} from '../api';
import type { Todo } from '../../../types/todo';

describe('Todos API client functions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockTodo: Todo = {
    id: 'todo-123',
    title: 'Test Todo',
    description: 'Test description',
    isCompleted: false,
    priority: 'High',
    dueDate: '2026-12-31T23:59:59Z',
    ownerId: 'user-1',
    createdAt: '2026-09-11T00:00:00Z',
    updatedAt: null,
  };

  it('fetchTodos should call GET /todos', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: [mockTodo] });
    const result = await fetchTodos();
    expect(apiClient.get).toHaveBeenCalledWith('/todos');
    expect(result).toEqual([mockTodo]);
  });

  it('fetchTodoById should call GET /todos/{id}', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockTodo });
    const result = await fetchTodoById('todo-123');
    expect(apiClient.get).toHaveBeenCalledWith('/todos/todo-123');
    expect(result).toEqual(mockTodo);
  });

  it('createTodo should call POST /todos with payload', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: mockTodo });
    const payload = { title: 'New Todo', priority: 'Medium' as const };
    const result = await createTodo(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/todos', payload);
    expect(result).toEqual(mockTodo);
  });

  it('updateTodo should call PUT /todos/{id} with payload', async () => {
    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({ data: mockTodo });
    const payload = { title: 'Updated Todo', priority: 'Low' as const, isCompleted: true };
    const result = await updateTodo('todo-123', payload);
    expect(apiClient.put).toHaveBeenCalledWith('/todos/todo-123', payload);
    expect(result).toEqual(mockTodo);
  });

  it('deleteTodo should call DELETE /todos/{id}', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: null });
    await deleteTodo('todo-123');
    expect(apiClient.delete).toHaveBeenCalledWith('/todos/todo-123');
  });

  it('toggleComplete should call PATCH /todos/{id}/complete', async () => {
    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ data: { ...mockTodo, isCompleted: true } });
    const result = await toggleComplete('todo-123');
    expect(apiClient.patch).toHaveBeenCalledWith('/todos/todo-123/complete');
    expect(result.isCompleted).toBe(true);
  });
});


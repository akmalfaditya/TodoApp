import { apiClient } from '../../api/client';
import type { Todo, CreateTodoPayload, UpdateTodoPayload } from '../../types/todo';

export const fetchTodos = async (): Promise<Todo[]> => {
  const response = await apiClient.get<Todo[]>('/todos');
  return response.data;
};

export const fetchTodoById = async (id: string): Promise<Todo> => {
  const response = await apiClient.get<Todo>(`/todos/${id}`);
  return response.data;
};

export const createTodo = async (payload: CreateTodoPayload): Promise<Todo> => {
  const response = await apiClient.post<Todo>('/todos', payload);
  return response.data;
};

export const updateTodo = async (id: string, payload: UpdateTodoPayload): Promise<Todo> => {
  const response = await apiClient.put<Todo>(`/todos/${id}`, payload);
  return response.data;
};

export const deleteTodo = async (id: string): Promise<void> => {
  await apiClient.delete(`/todos/${id}`);
};

export const toggleComplete = async (id: string): Promise<Todo> => {
  const response = await apiClient.patch<Todo>(`/todos/${id}/complete`);
  return response.data;
};


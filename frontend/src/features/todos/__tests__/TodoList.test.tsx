import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoList } from '../components/TodoList';
import { useAuthStore } from '../../../stores/authStore';
import * as todoApi from '../api';
import type { Todo } from '../../../types/todo';

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('TodoList Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clearAuth();
  });

  const mockTodos: Todo[] = [
    {
      id: 'todo-1',
      title: 'Fix urgent production bug',
      description: 'Check null pointer exception in logger',
      isCompleted: false,
      priority: 'High',
      dueDate: '2026-12-31T23:59:59Z',
      ownerId: 'owner-uuid-1',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: null,
    },
    {
      id: 'todo-2',
      title: 'Update documentation',
      description: null,
      isCompleted: true,
      priority: 'Low',
      dueDate: null,
      ownerId: 'owner-uuid-2',
      createdAt: '2026-09-10T00:00:00Z',
      updatedAt: null,
    },
  ];

  it('renders todo items with titles and priority badges', async () => {
    vi.spyOn(todoApi, 'fetchTodos').mockResolvedValueOnce(mockTodos);

    renderWithClient(<TodoList onEdit={() => {}} />);

    expect(await screen.findByText('Fix urgent production bug')).toBeDefined();
    expect(screen.getByText('Update documentation')).toBeDefined();
    expect(screen.getByText('High')).toBeDefined();
    expect(screen.getByText('Low')).toBeDefined();
  });

  it('renders empty state when there are no todos', async () => {
    vi.spyOn(todoApi, 'fetchTodos').mockResolvedValueOnce([]);

    renderWithClient(<TodoList onEdit={() => {}} />);

    expect(await screen.findByText('Belum ada tugas')).toBeDefined();
  });

  it('hides owner tag when user is standard User', async () => {
    useAuthStore.getState().setAuth({
      token: 'user-token',
      expiresAtUtc: '2026-12-31T23:59:59Z',
      email: 'user@todoapp.local',
      fullName: 'Regular User',
      roles: ['User'],
    });

    vi.spyOn(todoApi, 'fetchTodos').mockResolvedValueOnce(mockTodos);

    renderWithClient(<TodoList onEdit={() => {}} />);

    await screen.findByText('Fix urgent production bug');
    expect(screen.queryByText(/Owner:/)).toBeNull();
  });

  it('shows owner tag when user is Admin', async () => {
    useAuthStore.getState().setAuth({
      token: 'admin-token',
      expiresAtUtc: '2026-12-31T23:59:59Z',
      email: 'admin@todoapp.local',
      fullName: 'System Admin',
      roles: ['Admin'],
    });

    vi.spyOn(todoApi, 'fetchTodos').mockResolvedValueOnce(mockTodos);

    renderWithClient(<TodoList onEdit={() => {}} />);

    await screen.findByText('Fix urgent production bug');
    expect(screen.getAllByText(/Owner:/).length).toBeGreaterThan(0);
  });
});


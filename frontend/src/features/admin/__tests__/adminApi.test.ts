import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../../api/client';
import {
  fetchUsers,
  updateUserRole,
  toggleLockUser,
  deleteUser,
} from '../api';
import type { UserSummary } from '../../../types/admin';

describe('Admin API client functions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockUsers: UserSummary[] = [
    {
      id: 'admin-1',
      email: 'admin@todoapp.local',
      fullName: 'System Admin',
      roles: ['Admin'],
      isLocked: false,
      createdAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'user-1',
      email: 'john@todoapp.local',
      fullName: 'John Doe',
      roles: ['User'],
      isLocked: true,
      createdAt: '2026-09-05T00:00:00Z',
    },
  ];

  it('fetchUsers should call GET /admin/users', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockUsers });
    const result = await fetchUsers();
    expect(apiClient.get).toHaveBeenCalledWith('/admin/users');
    expect(result).toEqual(mockUsers);
  });

  it('updateUserRole should call PUT /admin/users/{id}/role with role payload', async () => {
    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: { ...mockUsers[1], roles: ['Admin'] },
    });
    const result = await updateUserRole('user-1', 'Admin');
    expect(apiClient.put).toHaveBeenCalledWith('/admin/users/user-1/role', {
      role: 'Admin',
    });
    expect(result.roles).toContain('Admin');
  });

  it('toggleLockUser should call PATCH /admin/users/{id}/toggle-lock', async () => {
    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: { ...mockUsers[1], isLocked: false },
    });
    const result = await toggleLockUser('user-1');
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/admin/users/user-1/toggle-lock'
    );
    expect(result.isLocked).toBe(false);
  });

  it('deleteUser should call DELETE /admin/users/{id}', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: null });
    await deleteUser('user-1');
    expect(apiClient.delete).toHaveBeenCalledWith('/admin/users/user-1');
  });
});


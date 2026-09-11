import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserTable } from '../components/UserTable';
import { useAuthStore } from '../../../stores/authStore';
import type { UserSummary } from '../../../types/admin';

describe('UserTable Component', () => {
  const onRoleChange = vi.fn();
  const onToggleLock = vi.fn();
  const onDelete = vi.fn();

  const mockUsers: UserSummary[] = [
    {
      id: 'admin-id-1',
      email: 'admin@todoapp.local',
      fullName: 'Super Admin',
      roles: ['Admin'],
      isLocked: false,
      createdAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'user-id-2',
      email: 'john@todoapp.local',
      fullName: 'John Doe',
      roles: ['User'],
      isLocked: false,
      createdAt: '2026-09-05T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth({
      token: 'admin-token',
      expiresAtUtc: '2026-12-31T23:59:59Z',
      email: 'admin@todoapp.local',
      fullName: 'Super Admin',
      roles: ['Admin'],
      id: 'admin-id-1',
    });
  });

  it('renders user rows with details, role badges, and status', () => {
    render(
      <UserTable
        users={mockUsers}
        onRoleChange={onRoleChange}
        onToggleLock={onToggleLock}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Super Admin')).toBeDefined();
    expect(screen.getByText('admin@todoapp.local')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('john@todoapp.local')).toBeDefined();
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('User').length).toBeGreaterThan(0);
  });

  it('enforces self-protection: disables/hides action buttons for logged in admin', () => {
    render(
      <UserTable
        users={mockUsers}
        onRoleChange={onRoleChange}
        onToggleLock={onToggleLock}
        onDelete={onDelete}
      />
    );

    // Self admin row shows "Anda" badge and "Tidak dapat diubah" text
    expect(screen.getByText('Anda')).toBeDefined();
    expect(screen.getByText('Tidak dapat diubah')).toBeDefined();
  });

  it('allows actions (role change, toggle lock, delete) for other users', () => {
    render(
      <UserTable
        users={mockUsers}
        onRoleChange={onRoleChange}
        onToggleLock={onToggleLock}
        onDelete={onDelete}
      />
    );

    // Lock button and delete button should be clickable for John Doe
    const lockButton = screen.getByTitle('Kunci Akun');
    expect(lockButton).toBeDefined();
    fireEvent.click(lockButton);
    expect(onToggleLock).toHaveBeenCalledWith(mockUsers[1]);

    const deleteButton = screen.getByTitle('Hapus Pengguna');
    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(mockUsers[1]);
  });
});

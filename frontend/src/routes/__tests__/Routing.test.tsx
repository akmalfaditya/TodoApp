import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../AppRouter';
import { useAuthStore } from '../../stores/authStore';

describe('App Routing & Route Protection', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('redirects to /login when unauthenticated user visits /', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Masuk ke Akun')).toBeDefined();
    expect(screen.queryByText('Daftar Tugas (Todos)')).toBeNull();
  });

  it('redirects to /login when unauthenticated user visits /admin/users', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/admin/users'] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Masuk ke Akun')).toBeDefined();
    expect(screen.queryByText('Manajemen Pengguna & Role')).toBeNull();
  });

  it('renders TodosPage and AppLayout navbar when authenticated as normal User', async () => {
    useAuthStore.getState().setAuth('mock-user-token', {
      id: 'usr-1',
      email: 'john@todoapp.local',
      fullName: 'John Doe',
      roles: ['User'],
    });

    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Daftar Tugas (Todos)')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Todos')).toBeDefined();
    // "Kelola User" should NOT be visible to normal User
    expect(screen.queryByText('Kelola User')).toBeNull();
  });

  it('redirects to / when normal User visits /admin/users', async () => {
    useAuthStore.getState().setAuth('mock-user-token', {
      id: 'usr-1',
      email: 'john@todoapp.local',
      fullName: 'John Doe',
      roles: ['User'],
    });

    const router = createMemoryRouter(routes, { initialEntries: ['/admin/users'] });
    render(<RouterProvider router={router} />);

    // Redirects to / which renders TodosPage
    expect(await screen.findByText('Daftar Tugas (Todos)')).toBeDefined();
    expect(screen.queryByText('Manajemen Pengguna & Role')).toBeNull();
  });

  it('renders AdminUsersPage and shows "Kelola User" nav link when authenticated as Admin', async () => {
    useAuthStore.getState().setAuth('mock-admin-token', {
      id: 'adm-1',
      email: 'admin@todoapp.local',
      fullName: 'Admin Super',
      roles: ['Admin'],
    });

    const router = createMemoryRouter(routes, { initialEntries: ['/admin/users'] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Manajemen Pengguna & Role')).toBeDefined();
    // "Kelola User" should be visible in navbar
    expect(screen.getAllByText('Kelola User').length).toBeGreaterThan(0);
  });

  it('renders NotFoundPage when visiting an unmapped route', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/non-existent-page-xyz'] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('404')).toBeDefined();
    expect(screen.getByText('Halaman Tidak Ditemukan')).toBeDefined();
  });
});


import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('should initialize with null user and token and false authentication', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
    expect(state.isAdmin()).toBe(false);
  });

  it('should update state and authenticate when setAuth is called with user role', () => {
    useAuthStore.getState().setAuth('mock-token-123', {
      id: 'usr-1',
      email: 'user@todoapp.local',
      fullName: 'Standard User',
      roles: ['User'],
    });

    const state = useAuthStore.getState();
    expect(state.token).toBe('mock-token-123');
    expect(state.user?.email).toBe('user@todoapp.local');
    expect(state.isAuthenticated()).toBe(true);
    expect(state.isAdmin()).toBe(false);
  });

  it('should return isAdmin true when user has Admin role', () => {
    useAuthStore.getState().setAuth('mock-admin-token', {
      id: 'adm-1',
      email: 'admin@todoapp.local',
      fullName: 'Admin User',
      roles: ['Admin', 'User'],
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated()).toBe(true);
    expect(state.isAdmin()).toBe(true);
  });

  it('should clear authentication state when clearAuth is called', () => {
    useAuthStore.getState().setAuth('mock-token', {
      id: 'usr-1',
      email: 'test@todoapp.local',
      fullName: 'Test User',
      roles: ['User'],
    });

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
    expect(state.isAdmin()).toBe(false);
  });
});


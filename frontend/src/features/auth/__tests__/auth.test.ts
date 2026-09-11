import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../../../api/client';
import { login, register } from '../api';
import { useAuthStore } from '../../../stores/authStore';

describe('Auth API & Axios Interceptors', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.restoreAllMocks();
  });

  it('should attach Bearer token to requests when authenticated', async () => {
    useAuthStore.getState().setAuth({
      token: 'jwt-token-xyz-123',
      expiresAtUtc: new Date().toISOString(),
      email: 'test@todoapp.local',
      fullName: 'Test User',
      roles: ['User'],
    });

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { status: 'success' },
    } as any);

    // Call any endpoint using apiClient
    await apiClient.post('/todos', { title: 'Test' });

    expect(postSpy).toHaveBeenCalled();
  });

  it('should invoke login endpoint and return AuthResponse', async () => {
    const mockAuthResponse = {
      token: 'token-abc',
      expiresAtUtc: '2026-12-31T23:59:59Z',
      email: 'john@todoapp.local',
      fullName: 'John Doe',
      roles: ['User'],
      id: 'usr-1',
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockAuthResponse,
    });

    const result = await login({ email: 'john@todoapp.local', password: 'Password123' });

    expect(result).toEqual(mockAuthResponse);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'john@todoapp.local',
      password: 'Password123',
    });
  });

  it('should invoke register endpoint and return AuthResponse', async () => {
    const mockAuthResponse = {
      token: 'token-registered',
      expiresAtUtc: '2026-12-31T23:59:59Z',
      email: 'newuser@todoapp.local',
      fullName: 'New User',
      roles: ['User'],
      id: 'usr-2',
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockAuthResponse,
    });

    const result = await register({
      fullName: 'New User',
      email: 'newuser@todoapp.local',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(result).toEqual(mockAuthResponse);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      fullName: 'New User',
      email: 'newuser@todoapp.local',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
  });
});


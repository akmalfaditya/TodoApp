import { apiClient } from '../../api/client';
import type { UserSummary } from '../../types/admin';

export const fetchUsers = async (): Promise<UserSummary[]> => {
  const response = await apiClient.get<UserSummary[]>('/admin/users');
  return response.data;
};

export const updateUserRole = async (
  id: string,
  role: string
): Promise<UserSummary> => {
  const response = await apiClient.put<UserSummary>(`/admin/users/${id}/role`, {
    role,
  });
  return response.data;
};

export const toggleLockUser = async (id: string): Promise<UserSummary> => {
  const response = await apiClient.patch<UserSummary>(
    `/admin/users/${id}/toggle-lock`
  );
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${id}`);
};


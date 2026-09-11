import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers,
  updateUserRole,
  toggleLockUser,
  deleteUser,
} from '../api';
import type { UserSummary } from '../../../types/admin';

export const ADMIN_USERS_QUERY_KEY = ['admin-users'] as const;

export const useUsersQuery = () => {
  return useQuery<UserSummary[]>({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: fetchUsers,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
};

export const useToggleLockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleLockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
};


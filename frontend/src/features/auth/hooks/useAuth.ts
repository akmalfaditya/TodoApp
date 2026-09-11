import { useMutation } from '@tanstack/react-query';
import { login, register } from '../api';
import { useAuthStore } from '../../../stores/authStore';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../../../types/auth';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data);
    },
  });
};


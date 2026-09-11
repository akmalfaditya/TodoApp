import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: () => !!get().token && !!get().user,
  isAdmin: () => get().user?.roles?.includes('Admin') ?? false,
  setAuth: (token: string, user: AuthUser) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
}));

export default useAuthStore;


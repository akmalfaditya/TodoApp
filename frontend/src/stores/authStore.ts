import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthResponse } from '../types/auth';

export interface AuthUserData {
  email: string;
  fullName: string;
  roles: string[];
  id?: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUserData | null;
  setAuth: (dataOrToken: AuthResponse | string, legacyUser?: AuthUserData) => void;
  logout: () => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (dataOrToken: AuthResponse | string, legacyUser?: AuthUserData) => {
        if (typeof dataOrToken === 'string') {
          set({
            token: dataOrToken,
            user: legacyUser || null,
          });
        } else {
          set({
            token: dataOrToken.token,
            user: {
              email: dataOrToken.email,
              fullName: dataOrToken.fullName,
              roles: dataOrToken.roles,
              id: dataOrToken.id,
            },
          });
        }
      },
      logout: () => set({ token: null, user: null }),
      clearAuth: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token && !!get().user,
      isAdmin: () => get().user?.roles?.includes('Admin') ?? false,
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;

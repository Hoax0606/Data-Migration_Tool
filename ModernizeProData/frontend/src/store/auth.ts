import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'master' | 'admin' | 'viewer';

export interface AuthUser {
  username: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  expiresAt: string | null;

  setAuth: (token: string, user: AuthUser, expiresAt: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

/**
 * 인증 store.
 * 로그인 후 JWT 토큰·사용자 정보를 localStorage 에 영속.
 * 페이지 새로고침 후에도 유지.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      expiresAt: null,

      setAuth: (token, user, expiresAt) =>
        set({ token, user, expiresAt }),

      logout: () => set({ token: null, user: null, expiresAt: null }),

      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        // 토큰 만료 시각 검사
        return new Date(expiresAt) > new Date();
      },

      hasRole: (...roles) => {
        const role = get().user?.role;
        return role ? roles.includes(role) : false;
      },
    }),
    {
      name: 'modernize-auth',
    },
  ),
);

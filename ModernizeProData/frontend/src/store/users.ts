import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from './auth';

export interface ManagedUser {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  lastSignInAt?: string;
}

interface UsersState {
  users: ManagedUser[];

  addUser: (data: Omit<ManagedUser, 'id' | 'createdAt'>) => ManagedUser;
  updateUserRole: (id: string, role: UserRole) => void;
  deleteUser: (id: string) => void;
}

const newId = () => 'u' + Math.random().toString(36).slice(2, 9);

/**
 * Site 내 사용자 계정 목록.
 * 현재는 frontend localStorage placeholder — 실제 발급은 백엔드 사용자 모듈로 교체.
 *
 * Coordinator(master) 만 발급·삭제·역할 변경 가능. UI 측 게이트는
 * `UserManagementModal` 에서 처리.
 */
export const useUsersStore = create<UsersState>()(
  persist(
    (set) => ({
      users: [
        { id: 'u-master',  username: 'master',  role: 'master',  createdAt: '2026-01-01T00:00:00Z', lastSignInAt: new Date().toISOString() },
        { id: 'u-admin1',  username: 'admin1',  role: 'admin',   createdAt: '2026-01-15T00:00:00Z' },
        { id: 'u-admin2',  username: 'admin2',  role: 'admin',   createdAt: '2026-02-01T00:00:00Z' },
        { id: 'u-admin3',  username: 'admin3',  role: 'admin',   createdAt: '2026-02-05T00:00:00Z' },
        { id: 'u-viewer',  username: 'viewer',  role: 'viewer',  createdAt: '2026-02-10T00:00:00Z' },
      ],

      addUser: (data) => {
        const u: ManagedUser = {
          id: newId(),
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ users: [...s.users, u] }));
        return u;
      },

      updateUserRole: (id, role) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, role } : u)),
        })),

      deleteUser: (id) =>
        set((s) => ({
          users: s.users.filter((u) => u.id !== id),
        })),
    }),
    { name: 'modernize-users', version: 1 },
  ),
);

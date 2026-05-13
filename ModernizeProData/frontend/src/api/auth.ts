import { api, unwrap, type ApiResponse } from './client';
import type { UserRole } from '../store/auth';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: UserRole;
  expiresAt: string;
}

export const authApi = {
  login: (req: LoginRequest) =>
    unwrap(api.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', req)),

  logout: () =>
    unwrap(api.post<ApiResponse<{ message: string }>>('/api/v1/auth/logout')),
};

export interface HealthInfo {
  name: string;
  mode: string;
  javaVersion: string;
  osName: string;
  timestamp: string;
}

export const healthApi = {
  ping: () =>
    unwrap(api.get<ApiResponse<{ status: string; timestamp: string }>>('/api/v1/health')),

  info: () =>
    unwrap(api.get<ApiResponse<HealthInfo>>('/api/v1/health/info')),
};

import axios, { AxiosError, type AxiosResponse } from 'axios';
import { useAuthStore } from '../store/auth';

/**
 * 표준 API 응답 형식 (백엔드 ApiResponse 와 동일).
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
  timestamp: string;
}

/**
 * 공통 axios 인스턴스.
 *   - baseURL: dev 시 Vite proxy 또는 Coordinator URL 직접
 *   - 자동 JWT 토큰 헤더 부착
 *   - 401 응답 시 자동 로그아웃
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — JWT 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 시 자동 로그아웃
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

/**
 * 헬퍼 — ApiResponse 풀어서 data 만 반환.
 * 에러 시 throw.
 */
export async function unwrap<T>(promise: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
  const res = await promise;
  if (!res.data.success) {
    throw new Error(res.data.error?.message ?? 'Unknown error');
  }
  return res.data.data as T;
}

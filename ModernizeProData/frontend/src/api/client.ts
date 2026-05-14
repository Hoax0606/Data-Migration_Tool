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
 * 백엔드가 반환한 에러 코드를 보존하는 에러 클래스.
 * 호출부에서 code 로 분기 가능 (예: AUTH_USER_NOT_FOUND vs AUTH_PASSWORD_INVALID).
 */
export class ApiError extends Error {
  code: string;
  status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
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

// Response interceptor — 401 시 자동 로그아웃 + ApiError 변환
// 로그인 요청은 401 이 정상 흐름이므로 자동 logout 에서 제외.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    if (status === 401 && !url.includes('/auth/login')) {
      useAuthStore.getState().logout();
    }
    const body = error.response?.data;
    if (body?.error?.code) {
      return Promise.reject(new ApiError(body.error.code, body.error.message, status));
    }
    return Promise.reject(error);
  },
);

/**
 * 헬퍼 — ApiResponse 풀어서 data 만 반환.
 * 에러 시 ApiError (code 보존) 로 throw.
 */
export async function unwrap<T>(promise: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
  const res = await promise;
  if (!res.data.success) {
    const err = res.data.error;
    throw new ApiError(err?.code ?? 'UNKNOWN', err?.message ?? 'Unknown error');
  }
  return res.data.data as T;
}

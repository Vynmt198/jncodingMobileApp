import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { Store } from '@reduxjs/toolkit';
import { getSecureItem, removeSecureItem } from '@/utils/secureStorage';

// Ưu tiên EXPO_PUBLIC_API_BASE_URL (phù hợp Expo), fallback API_BASE_URL, cuối cùng localhost.
// Ví dụ cho Android Emulator: EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  'http://localhost:3000/api';

/** Store ref để interceptor dispatch logout khi 401 (tránh circular dependency). Gọi setStoreForAxios(store) trong store/index.ts. */
let storeRef: Store | null = null;
export function setStoreForAxios(store: Store) {
  storeRef = store;
}

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Key cho JWT trong SecureStore.
 * expo-secure-store chỉ chấp nhận key gồm chữ, số, ".", "-", "_" → không dùng ký tự "@".
 */
export const TOKEN_KEY = 'access_token';

// ─── Request interceptor: attach JWT ────────────────────────────────────────
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getSecureItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// ─── Response interceptor: 401 → clear token, logout Redux, chuyển về màn Login ─
axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await removeSecureItem(TOKEN_KEY);
      const { logout } = await import('@/store/slices/authSlice');
      storeRef?.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

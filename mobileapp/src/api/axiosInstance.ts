import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { Store } from '@reduxjs/toolkit';
import { getSecureItem, removeSecureItem } from '@/utils/secureStorage';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api';

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

/** Key for JWT. Stored via secureStorage (SecureStore when available, else AsyncStorage). */
export const TOKEN_KEY = '@access_token';

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

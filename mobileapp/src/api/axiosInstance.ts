import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
const PERSIST_AUTH_KEY = 'persist:auth';

/** Lấy token: ưu tiên SecureStore, fallback Redux Persist (tránh 401 khi rehydrate chưa kịp). */
async function getAuthToken(): Promise<string | null> {
  const fromSecure = await getSecureItem(TOKEN_KEY);
  if (fromSecure) return fromSecure;

  try {
    const raw = await AsyncStorage.getItem(PERSIST_AUTH_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const auth = parsed?.payload ?? parsed;
    const token = auth?.token ?? null;
    return typeof token === 'string' ? token : null;
  } catch {
    return null;
  }
}

// ─── Request interceptor: attach JWT ────────────────────────────────────────
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// ─── Response interceptor: 401 → clear token (SecureStore + persist) + logout Redux ─
axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await removeSecureItem(TOKEN_KEY);

      // Clear Redux Persist auth state nếu có
      try {
        const raw = await AsyncStorage.getItem(PERSIST_AUTH_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const payload = data?.payload ?? data;
          if (payload && typeof payload === 'object') {
            payload.token = null;
            payload.isAuthenticated = false;
            payload.user = null;
            await AsyncStorage.setItem(PERSIST_AUTH_KEY, JSON.stringify(data));
          }
        }
      } catch {
        // ignore
      }

      // Gửi action logout để cập nhật Redux
      try {
        const { logout } = await import('@/store/slices/authSlice');
        storeRef?.dispatch(logout());
      } catch {
        // ignore nếu import thất bại (tránh crash interceptor)
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

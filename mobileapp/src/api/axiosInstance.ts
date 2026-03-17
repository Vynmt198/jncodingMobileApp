import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { Store } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getSecureItem, removeSecureItem } from '@/utils/secureStorage';

// Web dùng API_BASE_URL (localhost). Android emulator dùng 10.0.2.2 để trỏ về host.
const isAndroidEmulator = Platform.OS === 'android' && !Constants.isDevice;
export const API_BASE_URL = (() => {
  if (Platform.OS === 'web') {
    return process.env.API_BASE_URL ?? 'http://localhost:3000/api';
  }

  if (isAndroidEmulator) {
    // Emulator Android chạy trên máy host: 10.0.2.2 là cách chuẩn để truy cập localhost của host.
    // Nếu bạn muốn override (ví dụ dùng máy thật), hãy dùng EXPO_PUBLIC_API_BASE_URL_DEVICE thay vì biến này.
    return process.env.EXPO_PUBLIC_API_BASE_URL_ANDROID_EMULATOR ?? 'http://10.0.2.2:3000/api';
  }

  // Thiết bị thật / iOS simulator: dùng biến chung hoặc biến riêng cho device
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL_DEVICE ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    'http://localhost:3000/api'
  );
})();

if (__DEV__) {
  // Giúp debug lỗi "Network request failed" trên emulator/device
  // (thường do baseURL trỏ sai host hoặc bị chặn mạng)
  // eslint-disable-next-line no-console
  console.log('[API] baseURL =', API_BASE_URL);
}

/** Store ref để interceptor dispatch logout khi 401 (tránh circular dependency). Gọi setStoreForAxios(store) trong store/index.ts. */
let storeRef: Store | null = null;
export function setStoreForAxios(store: Store) {
  storeRef = store;
}

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Key cho JWT trong SecureStore.
 * expo-secure-store chỉ chấp nhận key gồm chữ, số, ".", "-", "_"; không dùng ký tự "@".
 */
export const TOKEN_KEY = 'access_token';

// ─── Request interceptor: attach JWT ────────────────────────────────────────
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Ưu tiên SecureStore (nguồn sự thật cho interceptor),
    // fallback sang Redux-persist token để tránh lệch state sau khi reload app.
    const secureToken = await getSecureItem(TOKEN_KEY);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reduxToken = (storeRef?.getState?.() as any)?.auth?.token as string | null | undefined;
    const token = secureToken ?? reduxToken ?? null;
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
    if (__DEV__) {
      const status = error.response?.status;
      const url = String(error.config?.url ?? '');

      // 404 "my review" là trạng thái bình thường khi user chưa review khóa học → tránh log nhiễu
      const isExpectedNotFound = status === 404 && url.startsWith('/reviews/my-review/');

      if (!isExpectedNotFound) {
      // eslint-disable-next-line no-console
      console.warn('[API] request failed', {
        baseURL: error.config?.baseURL,
        url,
        method: error.config?.method,
        status,
        message: error.message,
      });
      }
    }

    if (error.response?.status === 401) {
      await removeSecureItem(TOKEN_KEY);
      const { logout } = await import('@/store/slices/authSlice');
      storeRef?.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

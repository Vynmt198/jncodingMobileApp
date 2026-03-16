import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureItem, removeSecureItem } from '@/utils/secureStorage';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api';

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

/** Lấy token: ưu tiên SecureStore/AsyncStorage, fallback đọc từ Redux persist (tránh 401 khi rehydrate chưa kịp sync). */
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

// ─── Response interceptor: 401 → clear token (SecureStore + persist) và reject ─
axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await removeSecureItem(TOKEN_KEY);
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
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

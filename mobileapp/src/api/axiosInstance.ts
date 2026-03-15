import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
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

// ─── Response interceptor: 401 → clear token and reject ─────────────────────
axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await removeSecureItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

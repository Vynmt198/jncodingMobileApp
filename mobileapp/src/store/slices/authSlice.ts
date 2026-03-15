import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types/api.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLaunch: boolean;
  /** Deep link: khi mở app bằng myapp://login hoặc myapp://register mà đang đăng nhập → logout và mở màn này */
  pendingAuthRoute: 'Login' | 'Register' | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isFirstLaunch: true,
  pendingAuthRoute: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Backend returns single JWT (no refresh token). Store token + user. */
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: state => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setPendingAuthRoute: (state, action: PayloadAction<'Login' | 'Register' | null>) => {
      state.pendingAuthRoute = action.payload;
    },
    clearPendingAuthRoute: state => {
      state.pendingAuthRoute = null;
    },
    setAppReady: (state, action: PayloadAction<{ isFirstLaunch: boolean; user?: User | null }>) => {
      state.isLoading = false;
      state.isFirstLaunch = action.payload.isFirstLaunch;
      if (action.payload.user) {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, logout, setAppReady, updateUser, setPendingAuthRoute, clearPendingAuthRoute } = authSlice.actions;
export default authSlice.reducer;

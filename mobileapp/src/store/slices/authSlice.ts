import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { User } from '@/types/api.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLaunch: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isFirstLaunch: true,
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
  extraReducers: builder => {
    builder.addCase(REHYDRATE, (state, action) => {
      const payload = action.payload as { auth?: AuthState } | undefined;
      const auth = payload?.auth;
      if (auth?.isAuthenticated && !auth?.token) {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      }
    });
  },
});

export const { setCredentials, logout, setAppReady, updateUser } = authSlice.actions;
export default authSlice.reducer;

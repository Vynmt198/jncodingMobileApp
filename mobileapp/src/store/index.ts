import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import { authApi } from './api/authApi';
import { coursesApi } from './api/coursesApi';
import { progressApi } from './api/progressApi';
import { certificateApi } from './api/certificateApi';
import { assignmentApi } from './api/assignmentApi';
import { quizzesApi } from './api/quizzesApi';
import { enrollmentApi } from './api/enrollmentApi';
import { enrollmentsApi } from './api/enrollmentsApi';
import { paymentsApi } from './api/paymentsApi';
import { instructorApi } from './api/instructorApi';
import { setStoreForAxios } from '@/api/axiosInstance';

// Persist config cho Auth slice: lưu thông tin đăng nhập,
// giúp người dùng không phải đăng nhập lại sau khi reload.
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'isAuthenticated', 'isFirstLaunch'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  [authApi.reducerPath]: authApi.reducer,
  [coursesApi.reducerPath]: coursesApi.reducer,
  [progressApi.reducerPath]: progressApi.reducer,
  [certificateApi.reducerPath]: certificateApi.reducer,
  [assignmentApi.reducerPath]: assignmentApi.reducer,
  [quizzesApi.reducerPath]: quizzesApi.reducer,
  [enrollmentApi.reducerPath]: enrollmentApi.reducer,
  [enrollmentsApi.reducerPath]: enrollmentsApi.reducer,
  [paymentsApi.reducerPath]: paymentsApi.reducer,
  [instructorApi.reducerPath]: instructorApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(authApi.middleware)
      .concat(coursesApi.middleware)
      .concat(progressApi.middleware)
      .concat(certificateApi.middleware)
      .concat(assignmentApi.middleware)
      .concat(quizzesApi.middleware)
      .concat(enrollmentApi.middleware)
      .concat(enrollmentsApi.middleware)
      .concat(paymentsApi.middleware)
      .concat(instructorApi.middleware),
});

// Gắn store cho axios interceptor (để xử lý 401 → logout)
setStoreForAxios(store);

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

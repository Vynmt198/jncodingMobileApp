import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '@/types/api.types';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Profile'],
  endpoints: builder => ({
    login: builder.mutation<LoginResponse['data'], LoginRequest>({
      query: credentials => ({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        data: credentials,
      }),
      transformResponse: (response: LoginResponse) => response.data,
      invalidatesTags: ['Profile'],
    }),
    register: builder.mutation<RegisterResponse['data'], RegisterRequest>({
      query: body => ({
        url: API_ENDPOINTS.AUTH.REGISTER,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: RegisterResponse | { user?: RegisterResponse['data']['user']; data?: { user: RegisterResponse['data']['user'] } }) => {
        if (response && typeof response === 'object' && 'data' in response && response.data) return response.data as RegisterResponse['data'];
        if (response && typeof response === 'object' && 'user' in response && response.user) return { user: response.user } as RegisterResponse['data'];
        return response as RegisterResponse['data'];
      },
    }),
    /** Current user profile (backend: GET /users/profile, no /auth/me) */
    getProfile: builder.query<User, void>({
      query: () => ({
        url: API_ENDPOINTS.USER.PROFILE,
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: { user: User } }) => response.data.user,
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<User, Partial<Pick<User, 'fullName' | 'avatar' | 'bio' | 'instructorHeadline' | 'instructorBio' | 'instructorSkills' | 'instructorWebsite' | 'instructorFacebook' | 'instructorYoutube' | 'instructorLinkedin'>>>({
      query: body => ({
        url: API_ENDPOINTS.USER.UPDATE_PROFILE,
        method: 'PUT',
        data: body,
      }),
      transformResponse: (response: { success: boolean; data: { user: User } }) => response.data.user,
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: 'POST',
      }),
      invalidatesTags: ['Profile'],
    }),
    forgotPassword: builder.mutation<{ success: boolean; message?: string }, { email: string }>({
      query: body => ({
        url: API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        method: 'POST',
        data: body,
      }),
    }),
    resetPassword: builder.mutation<{ success: boolean; message?: string }, { token: string; newPassword: string }>({
      query: body => ({
        url: API_ENDPOINTS.AUTH.RESET_PASSWORD,
        method: 'POST',
        data: body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;

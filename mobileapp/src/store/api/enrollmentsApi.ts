import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, MyEnrollmentsResponse } from '@/types/api.types';

export const enrollmentsApi = createApi({
  reducerPath: 'enrollmentsApi',
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    getMyEnrollments: builder.query<MyEnrollmentsResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.ENROLLMENTS.MY,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<MyEnrollmentsResponse>) => response.data ?? { enrollments: [] },
    }),
  }),
});

export const { useGetMyEnrollmentsQuery, useLazyGetMyEnrollmentsQuery } = enrollmentsApi;

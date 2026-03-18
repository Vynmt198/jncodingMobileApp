import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, MyEnrollmentsResponse } from '@/types/api.types';

export const enrollmentsApi = createApi({
  reducerPath: 'enrollmentsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Enrollments'],
  endpoints: builder => ({
    getMyEnrollments: builder.query<MyEnrollmentsResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.ENROLLMENTS.MY,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<MyEnrollmentsResponse>) => response.data ?? { enrollments: [] },
      providesTags: ['Enrollments'],
    }),
    /** POST /enrollments — đăng ký khóa học miễn phí (price === 0) */
    enrollFreeCourse: builder.mutation<{ enrollment: { _id: string } }, string>({
      query: courseId => ({
        url: API_ENDPOINTS.ENROLLMENTS.ENROLL_FREE,
        method: 'POST',
        data: { courseId },
      }),
      transformResponse: (response: ApiResponse<{ enrollment: { _id: string } }>) => response.data ?? { enrollment: { _id: '' } },
      invalidatesTags: ['Enrollments'],
    }),
  }),
});

export const { useGetMyEnrollmentsQuery, useLazyGetMyEnrollmentsQuery, useEnrollFreeCourseMutation } = enrollmentsApi;

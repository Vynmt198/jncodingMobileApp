import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/types/api.types';

export interface Enrollment {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    thumbnail?: string;
  };
  progress: number;
  completedLessons: number;
  totalLessons: number;
  status: string;
  updatedAt: string;
}

export const enrollmentApi = createApi({
  reducerPath: 'enrollmentApi',
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    /** GET /api/enrollments — lấy danh sách đăng ký của tôi kèm tiến độ */
    getMyEnrollments: builder.query<Enrollment[], void>({
      query: () => ({
        url: API_ENDPOINTS.ENROLLMENTS.MY,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<{ enrollments: Enrollment[] }>) => 
        response.data?.enrollments ?? [],
    }),
  }),
});

export const { useGetMyEnrollmentsQuery } = enrollmentApi;

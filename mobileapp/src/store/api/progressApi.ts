import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, Progress } from '@/types/api.types';

export const progressApi = createApi({
  reducerPath: 'progressApi',
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    /** POST /api/progress/mark-complete — đánh dấu hoàn thành bài học (video/text; quiz thì qua pass quiz) */
    markComplete: builder.mutation<Progress, { lessonId: string }>({
      query: body => ({
        url: API_ENDPOINTS.PROGRESS.MARK_COMPLETE,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<Progress>) => response.data!,
    }),

    /** PUT /api/progress/update-position — cập nhật vị trí video / timeSpent */
    updatePosition: builder.mutation<
      Progress,
      { lessonId: string; lastPosition?: number; timeSpent?: number }
    >({
      query: body => ({
        url: API_ENDPOINTS.PROGRESS.UPDATE_POSITION,
        method: 'PUT',
        data: body,
      }),
      transformResponse: (response: ApiResponse<Progress>) => response.data!,
    }),

    /** GET /api/progress/:courseId — tiến độ theo khóa */
    getByCourse: builder.query<Progress[], string>({
      query: courseId => ({
        url: API_ENDPOINTS.PROGRESS.BY_COURSE(courseId),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<Progress[]>) => response.data ?? [],
    }),
  }),
});

export const {
  useMarkCompleteMutation,
  useUpdatePositionMutation,
  useGetByCourseProgressQuery,
  useLazyGetByCourseProgressQuery,
} = progressApi;

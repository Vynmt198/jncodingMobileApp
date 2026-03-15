import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type {
  CourseLearningData,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api.types';

interface CourseListItem {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  categoryId?: string;
  instructorId?: string;
  status?: string;
}

export const coursesApi = createApi({
  reducerPath: 'coursesApi',
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    /** GET /api/courses/:id/learn — lessons + progress + completion % (enrolled) */
    getCourseLearning: builder.query<
      CourseLearningData,
      string
    >({
      query: courseId => ({
        url: API_ENDPOINTS.COURSES.LEARN(courseId),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<CourseLearningData>) => response.data!,
    }),

    /** GET /api/courses/:id — chi tiết khóa (public/optional auth) */
    getCourseById: builder.query<unknown, string>({
      query: id => ({
        url: API_ENDPOINTS.COURSES.DETAIL(id),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<unknown>) => response.data,
    }),

    /** GET /api/courses — danh sách khóa */
    listCourses: builder.query<{ data: CourseListItem[] }, Record<string, unknown> | void>({
      query: params => ({
        url: API_ENDPOINTS.COURSES.LIST,
        method: 'GET',
        params: params || undefined,
      }),
    }),

    /** GET /api/courses/:id/curriculum */
    getCurriculum: builder.query<unknown, string>({
      query: id => ({
        url: API_ENDPOINTS.COURSES.CURRICULUM(id),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<unknown>) => response.data,
    }),

    /** GET /api/courses/:id/assignments — list assignments + canSubmit */
    getAssignmentsByCourse: builder.query<
      { assignments: import('@/types/api.types').Assignment[]; canSubmit: boolean },
      string
    >({
      query: courseId => ({
        url: API_ENDPOINTS.COURSES.ASSIGNMENTS(courseId),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<{ assignments: import('@/types/api.types').Assignment[]; canSubmit: boolean }>) => response.data!,
    }),

    /** GET /api/courses/:id/my-assignment-submissions */
    getMyAssignmentSubmissionsByCourse: builder.query<
      import('@/types/api.types').AssignmentSubmission[],
      string
    >({
      query: courseId => ({
        url: API_ENDPOINTS.COURSES.MY_ASSIGNMENT_SUBMISSIONS(courseId),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<{ submissions: import('@/types/api.types').AssignmentSubmission[] }>) =>
        response.data?.submissions ?? [],
    }),
  }),
});

export const {
  useGetCourseLearningQuery,
  useLazyGetCourseLearningQuery,
  useGetCourseByIdQuery,
  useListCoursesQuery,
  useGetCurriculumQuery,
  useGetAssignmentsByCourseQuery,
  useGetMyAssignmentSubmissionsByCourseQuery,
} = coursesApi;

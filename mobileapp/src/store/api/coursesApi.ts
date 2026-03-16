import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type {
  CourseLearningData,
  ApiResponse,
  PaginatedResponse,
  Lesson,
  Progress,
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
      transformResponse: (response: ApiResponse<CourseLearningData>) =>
        response.data ?? { course: { _id: '', title: '', instructorId: null }, lessons: [], progress: [], completionPercentage: 0 },
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

    /** GET /api/courses/:id/curriculum — backend trả về { success, data: lessons[] } */
    getCurriculum: builder.query<Lesson[], string>({
      query: id => ({
        url: API_ENDPOINTS.COURSES.CURRICULUM(id),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<Lesson[]>) =>
        Array.isArray((response as any)?.data) ? (response as any).data : [],
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

    /** GET /api/lessons/:id/content — nội dung bài học (video URL, text content) */
    getLessonContent: builder.query<
      { lesson: Lesson; progress: Progress },
      string
    >({
      query: lessonId => ({
        url: API_ENDPOINTS.LESSONS.CONTENT(lessonId),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<{ lesson: Lesson; progress: Progress }>) =>
        response.data ?? { lesson: {} as Lesson, progress: {} as Progress },
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
  useGetLessonContentQuery,
} = coursesApi;

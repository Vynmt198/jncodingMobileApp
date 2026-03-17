import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, Quiz, QuizQuestion } from '@/types/api.types';

interface InstructorDashboardStats {
  totalStudents: number;
  activeCourses: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
}

interface InstructorAnalyticsTopCourse {
  courseId: string;
  title: string;
  averageRating: number;
  enrollments: number;
}

interface InstructorAnalyticsResponse {
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  topCourses: InstructorAnalyticsTopCourse[];
}

interface InstructorDiscussionSummaryItem {
  id: string;
  courseTitle: string;
  topic: string;
  replies: number;
  pinned: boolean;
  reported: number;
}

interface InstructorDiscussionSummaryResponse {
  discussions: InstructorDiscussionSummaryItem[];
}

interface InstructorMyCourse {
  _id: string;
  title: string;
  status?: string;
  thumbnail?: string | null;
  level?: string;
  enrollmentCount?: number;
}

interface InstructorMyCoursesResponse {
  courses: InstructorMyCourse[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const instructorApi = createApi({
  reducerPath: 'instructorApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['InstructorCourses', 'InstructorQuiz'],
  endpoints: builder => ({
    getDashboardStats: builder.query<InstructorDashboardStats, void>({
      query: () => ({
        url: API_ENDPOINTS.INSTRUCTOR.DASHBOARD,
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: InstructorDashboardStats }) =>
        response.data,
    }),
    getAnalytics: builder.query<InstructorAnalyticsResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.INSTRUCTOR.ANALYTICS,
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: InstructorAnalyticsResponse }) =>
        response.data,
    }),
    getDiscussionSummary: builder.query<InstructorDiscussionSummaryResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.INSTRUCTOR.DISCUSSION_SUMMARY,
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: InstructorDiscussionSummaryResponse }) =>
        response.data,
    }),
    getMyCourses: builder.query<
      InstructorMyCoursesResponse,
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (args) => ({
        url: API_ENDPOINTS.INSTRUCTOR.MY_COURSES,
        method: 'GET',
        params: args || undefined,
      }),
      providesTags: () => ['InstructorCourses'],
      transformResponse: (response: {
        success: boolean;
        data: { courses: InstructorMyCourse[]; pagination?: InstructorMyCoursesResponse['pagination'] };
      }) => response.data,
    }),
    updateCourse: builder.mutation<
      any,
      {
        courseId: string;
        payload: {
          title?: string;
          description?: string;
          syllabus?: string;
          categoryId?: string;
          level?: 'beginner' | 'intermediate' | 'advanced';
          price?: number;
          thumbnail?: string;
          estimatedCompletionHours?: number;
          submitForReview?: boolean;
        };
      }
    >({
      query: ({ courseId, payload }) => ({
        url: API_ENDPOINTS.COURSES.DETAIL(courseId),
        method: 'PUT',
        data: payload,
      }),
      invalidatesTags: ['InstructorCourses'],
      transformResponse: (response: { success?: boolean; data?: any } | any) =>
        (response as any)?.data ?? response,
    }),
    deleteCourse: builder.mutation<{ success?: boolean }, string>({
      query: courseId => ({
        url: API_ENDPOINTS.COURSES.DETAIL(courseId),
        method: 'DELETE',
      }),
      invalidatesTags: ['InstructorCourses'],
    }),

    /** GET /api/instructor/lessons/:lessonId/quiz — lấy quiz của lesson (instructor) */
    getQuizByLessonId: builder.query<Quiz, string>({
      query: lessonId => ({
        url: API_ENDPOINTS.INSTRUCTOR.QUIZ_BY_LESSON(lessonId),
        method: 'GET',
      }),
      providesTags: (_res, _err, lessonId) => [{ type: 'InstructorQuiz', id: lessonId }],
      transformResponse: (response: ApiResponse<Quiz>) => response.data!,
    }),

    /** POST /api/instructor/lessons/:lessonId/quiz — tạo/ghi đè quiz của lesson (instructor) */
    createOrUpdateQuiz: builder.mutation<
      Quiz,
      {
        lessonId: string;
        payload: {
          title?: string;
          questions?: QuizQuestion[];
          passingScore?: number;
          timeLimit?: number;
        };
      }
    >({
      query: ({ lessonId, payload }) => ({
        url: API_ENDPOINTS.INSTRUCTOR.QUIZ_BY_LESSON(lessonId),
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: (_res, _err, { lessonId }) => [{ type: 'InstructorQuiz', id: lessonId }],
      transformResponse: (response: ApiResponse<Quiz>) => response.data!,
    }),

    /** PUT /api/instructor/quizzes/:quizId — update quiz (instructor) */
    updateQuiz: builder.mutation<
      Quiz,
      {
        quizId: string;
        payload: {
          title?: string;
          questions?: QuizQuestion[];
          passingScore?: number;
          timeLimit?: number;
        };
      }
    >({
      query: ({ quizId, payload }) => ({
        url: API_ENDPOINTS.INSTRUCTOR.QUIZ_UPDATE(quizId),
        method: 'PUT',
        data: payload,
      }),
      transformResponse: (response: ApiResponse<Quiz>) => response.data!,
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetAnalyticsQuery,
  useGetDiscussionSummaryQuery,
  useGetMyCoursesQuery,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetQuizByLessonIdQuery,
  useLazyGetQuizByLessonIdQuery,
  useCreateOrUpdateQuizMutation,
  useUpdateQuizMutation,
} = instructorApi;


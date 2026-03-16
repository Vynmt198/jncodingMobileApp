import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';

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
}

interface InstructorMyCoursesResponse {
  courses: InstructorMyCourse[];
}

export const instructorApi = createApi({
  reducerPath: 'instructorApi',
  baseQuery: axiosBaseQuery(),
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
    getMyCourses: builder.query<InstructorMyCoursesResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.INSTRUCTOR.MY_COURSES,
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: InstructorMyCoursesResponse }) =>
        response.data,
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
      transformResponse: (response: { success?: boolean; data?: any } | any) =>
        (response as any)?.data ?? response,
    }),
    deleteCourse: builder.mutation<{ success?: boolean }, string>({
      query: courseId => ({
        url: API_ENDPOINTS.COURSES.DETAIL(courseId),
        method: 'DELETE',
      }),
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
} = instructorApi;


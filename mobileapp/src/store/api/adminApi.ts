import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { User } from '@/types/api.types';

// ─── Admin Stats (backend: totalRevenue, newStudentsThisWeek, totalCourses, revenueLast7Days) ─
export interface AdminStats {
  totalRevenue?: number;
  newStudentsThisWeek?: number;
  totalCourses?: number;
  revenueLast7Days?: Array<{ name: string; total: number }>;
  [key: string]: number | Array<{ name: string; total: number }> | undefined;
}

// ─── Admin Users ───────────────────────────────────────────────────────────
export interface AdminUsersParams {
  page?: number;
  limit?: number;
  role?: 'learner' | 'instructor' | 'admin';
  /** Backend dùng isActive (true/false), map: active -> true, suspended -> false */
  status?: 'active' | 'suspended' | 'inactive';
  search?: string;
}

export interface AdminUserListItem {
  _id: string;
  id?: string;
  email: string;
  fullName: string;
  role: 'learner' | 'instructor' | 'admin';
  isActive?: boolean;
  status?: 'active' | 'suspended';
  createdAt?: string;
  totalCourses?: number;
}

export interface AdminUsersResponse {
  data: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Admin Courses ─────────────────────────────────────────────────────────
export interface AdminCourseListItem {
  _id: string;
  id?: string;
  title: string;
  instructorId?: string;
  instructorName?: string;
  price?: number;
  categoryName?: string;
  status?: 'draft' | 'pending' | 'active' | 'rejected' | 'disabled';
  submittedAt?: string;
  createdAt?: string;
}

export interface AdminCoursesResponse {
  data: AdminCourseListItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// ─── Admin Content Lessons ─────────────────────────────────────────────────
export interface AdminLessonListItem {
  _id: string;
  lessonId?: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  type?: string;
  order?: number;
  isHidden?: boolean;
  isVisible?: boolean;
}

export interface AdminLessonsResponse {
  data: AdminLessonListItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// ─── Admin Reviews ─────────────────────────────────────────────────────────
export interface AdminReviewListItem {
  _id: string;
  courseId: string;
  courseTitle?: string;
  userId: string;
  userName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface AdminReviewsResponse {
  data: AdminReviewListItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['AdminStats', 'AdminUsers', 'AdminCourses', 'AdminLessons', 'AdminReviews'],
  endpoints: builder => ({
    getStats: builder.query<AdminStats, void>({
      query: () => ({
        url: API_ENDPOINTS.ADMIN.STATS,
        method: 'GET',
      }),
      transformResponse: (res: { success?: boolean; data?: AdminStats }) => res.data ?? {},
      providesTags: ['AdminStats'],
    }),

    getUsers: builder.query<AdminUsersResponse, AdminUsersParams | void>({
      query: (params = {}) => ({
        url: API_ENDPOINTS.ADMIN.USERS,
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          ...(params?.role && { role: params.role }),
          ...(params?.status === 'active' && { isActive: 'true' }),
          ...(params?.status === 'suspended' && { isActive: 'false' }),
          ...(params?.search && { search: params.search }),
        },
      }),
      transformResponse: (res: { success?: boolean; data?: { users?: AdminUserListItem[]; pagination?: { total: number; page: number; limit: number; totalPages: number } } }) => {
        const d = res.data;
        if (!d) return { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
        const pag = d.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 };
        return {
          data: Array.isArray(d.users) ? d.users : [],
          total: pag.total,
          page: pag.page,
          limit: pag.limit,
          totalPages: pag.totalPages,
        };
      },
      providesTags: (_, __, arg) => [{ type: 'AdminUsers', id: JSON.stringify(arg ?? {}) }],
    }),

    updateUserRole: builder.mutation<{ user: User }, { userId: string; role: 'learner' | 'instructor' | 'admin' }>({
      query: ({ userId, role }) => ({
        url: API_ENDPOINTS.ADMIN.USER_ROLE(userId),
        method: 'PUT',
        data: { role },
      }),
      transformResponse: (res: { success?: boolean; data?: { user: User } }) => res.data ?? { user: res as unknown as User },
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),

    updateUserStatus: builder.mutation<{ user: User }, { userId: string; status: 'active' | 'suspended' }>({
      query: ({ userId }) => ({
        url: API_ENDPOINTS.ADMIN.USER_STATUS(userId),
        method: 'PUT',
        data: {},
      }),
      transformResponse: (res: { success?: boolean; data?: { user: User } }) => res.data ?? { user: res as unknown as User },
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),

    getCourses: builder.query<AdminCoursesResponse, { page?: number; limit?: number; status?: string } | void>({
      query: (params = {}) => ({
        url: API_ENDPOINTS.ADMIN.COURSES,
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.status && params.status !== 'all' && { status: params.status }),
        },
      }),
      transformResponse: (res: { success?: boolean; data?: { courses?: unknown[]; pagination?: { total: number; page: number; limit: number; totalPages: number } } }) => {
        const d = res.data;
        if (!d) return { data: [], total: 0, page: 1, limit: 20, totalPages: 1 };
        const pag = d.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 };
        const rawCourses = Array.isArray(d.courses) ? d.courses : [];
        const data: AdminCourseListItem[] = rawCourses.map((c: Record<string, unknown>) => {
          const instr = c.instructorId as { _id?: string; fullName?: string } | undefined;
          const cat = c.categoryId as { name?: string } | undefined;
          return {
            _id: String(c._id ?? c.id ?? ''),
            title: String(c.title ?? ''),
            instructorId: instr?._id != null ? String(instr._id) : undefined,
            instructorName: instr?.fullName ?? undefined,
            price: typeof c.price === 'number' ? c.price : undefined,
            categoryName: cat?.name ?? undefined,
            status: (c.status as AdminCourseListItem['status']) ?? undefined,
            createdAt: c.createdAt != null ? String(c.createdAt) : undefined,
          };
        });
        return { data, total: pag.total, page: pag.page, limit: pag.limit, totalPages: pag.totalPages };
      },
      providesTags: (_, __, arg) => [{ type: 'AdminCourses', id: JSON.stringify(arg ?? {}) }],
    }),

    approveCourse: builder.mutation<unknown, { courseId: string; action: 'approve' | 'reject' }>({
      query: ({ courseId, action }) => ({
        url: API_ENDPOINTS.ADMIN.COURSE_APPROVE(courseId),
        method: 'PUT',
        data: { action },
      }),
      invalidatesTags: ['AdminCourses', 'AdminStats'],
    }),

    updateCourseStatus: builder.mutation<unknown, { courseId: string; status: 'active' | 'rejected' | 'disabled' }>({
      query: ({ courseId, status }) => ({
        url: API_ENDPOINTS.ADMIN.COURSE_STATUS(courseId),
        method: 'PUT',
        data: { status },
      }),
      invalidatesTags: ['AdminCourses', 'AdminStats'],
    }),

    getContentLessons: builder.query<AdminLessonsResponse, { page?: number; limit?: number; search?: string } | void>({
      query: (params = {}) => ({
        url: API_ENDPOINTS.ADMIN.CONTENT_LESSONS,
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.search && { search: params.search }),
        },
      }),
      transformResponse: (res: { success?: boolean; data?: { lessons?: AdminLessonListItem[]; pagination?: { total: number; page: number; limit: number; totalPages: number } } }) => {
        const d = res.data;
        if (!d) return { data: [], total: 0, page: 1, limit: 20, totalPages: 1 };
        const pag = d.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 };
        const data = Array.isArray(d.lessons) ? d.lessons : [];
        return { data, total: pag.total, page: pag.page, limit: pag.limit, totalPages: pag.totalPages };
      },
      providesTags: (_, __, arg) => [{ type: 'AdminLessons', id: JSON.stringify(arg ?? {}) }],
    }),

    patchLessonVisibility: builder.mutation<unknown, { lessonId: string }>({
      query: ({ lessonId }) => ({
        url: API_ENDPOINTS.ADMIN.LESSON_VISIBILITY(lessonId),
        method: 'PATCH',
        data: {},
      }),
      invalidatesTags: ['AdminLessons'],
    }),

    getContentReviews: builder.query<AdminReviewsResponse, { page?: number; limit?: number; search?: string } | void>({
      query: (params = {}) => ({
        url: API_ENDPOINTS.ADMIN.CONTENT_REVIEWS,
        method: 'GET',
        params: { page: params?.page ?? 1, limit: params?.limit ?? 20, ...(params?.search && { search: params.search }) },
      }),
      transformResponse: (res: { success?: boolean; data?: { reviews?: Array<{ _id: string; user?: string; courseId?: string; courseTitle?: string; rating: number; reviewText?: string; date?: string }>; pagination?: { total: number; page: number; limit: number; totalPages: number } } }) => {
        const d = res.data;
        if (!d) return { data: [], total: 0, page: 1, limit: 20, totalPages: 1 };
        const pag = d.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 };
        const raw = Array.isArray(d.reviews) ? d.reviews : [];
        const data: AdminReviewListItem[] = raw.map(r => ({
          _id: r._id,
          courseId: typeof r.courseId === 'object' && r.courseId && '_id' in (r.courseId as object) ? String((r.courseId as { _id: string })._id) : String(r.courseId ?? ''),
          courseTitle: r.courseTitle,
          userId: '',
          userName: r.user,
          rating: r.rating,
          comment: r.reviewText,
          createdAt: r.date,
        }));
        return { data, total: pag.total, page: pag.page, limit: pag.limit, totalPages: pag.totalPages };
      },
      providesTags: ['AdminReviews'],
    }),
  }),
});

export const {
  useGetStatsQuery,
  useLazyGetStatsQuery,
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useGetCoursesQuery,
  useLazyGetCoursesQuery,
  useApproveCourseMutation,
  useUpdateCourseStatusMutation,
  useGetContentLessonsQuery,
  useLazyGetContentLessonsQuery,
  usePatchLessonVisibilityMutation,
  useGetContentReviewsQuery,
  useLazyGetContentReviewsQuery,
} = adminApi;

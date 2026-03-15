import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type {
  ApiResponse,
  AssignmentDetailResponse,
  AssignmentSubmission,
} from '@/types/api.types';

export const assignmentApi = createApi({
  reducerPath: 'assignmentApi',
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    /** GET /api/assignments/:id — chi tiết assignment + canSubmit + mySubmission */
    getOne: builder.query<AssignmentDetailResponse, string>({
      query: id => ({
        url: API_ENDPOINTS.ASSIGNMENTS.GET_ONE(id),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<AssignmentDetailResponse>) => response.data!,
    }),

    /** POST /api/assignments/:id/submit — nộp bài (regular: content, attachments) */
    submit: builder.mutation<
      { submission: AssignmentSubmission },
      { assignmentId: string; content?: string; attachments?: string[] }
    >({
      query: ({ assignmentId, content, attachments }) => ({
        url: API_ENDPOINTS.ASSIGNMENTS.SUBMIT(assignmentId),
        method: 'POST',
        data: { content, attachments },
      }),
      transformResponse: (response: ApiResponse<{ submission: AssignmentSubmission }>) => response.data!,
    }),

    /** POST /api/assignments/:id/submit-exam — nộp bài thi trắc nghiệm (answers = mảng index đã chọn theo thứ tự câu) */
    submitExam: builder.mutation<
      { score: number; isPassed: boolean; submission: AssignmentSubmission },
      {
        assignmentId: string;
        answers: number[];
        timeSpent?: number;
      }
    >({
      query: ({ assignmentId, answers, timeSpent }) => ({
        url: API_ENDPOINTS.ASSIGNMENTS.SUBMIT_EXAM(assignmentId),
        method: 'POST',
        data: { answers, timeSpent },
      }),
      transformResponse: (response: ApiResponse<{ score: number; isPassed: boolean; submission: AssignmentSubmission }>) => response.data!,
    }),
  }),
});

export const {
  useGetOneQuery,
  useLazyGetOneQuery,
  useSubmitAssignmentMutation,
  useSubmitExamMutation,
} = assignmentApi;

/** Alias: lấy chi tiết assignment (GET /assignments/:id) */
export const useGetAssignmentQuery = useGetOneQuery;
export const useLazyGetAssignmentQuery = useLazyGetOneQuery;

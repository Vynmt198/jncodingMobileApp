import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type {
  ApiResponse,
  Quiz,
  QuizAttemptRequest,
  QuizAttemptResponse,
} from '@/types/api.types';

export type QuizLatestAttempt = {
  attempt: null | {
    score: number;
    isPassed: boolean;
    submittedAt?: string;
    timeSpent?: number;
  };
};

export const quizzesApi = createApi({
  reducerPath: 'quizzesApi',
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    /** GET /api/quizzes/:id — lấy đề quiz (ẩn correctAnswer/explanation cho learner) */
    getQuiz: builder.query<Quiz, string>({
      query: id => ({
        url: API_ENDPOINTS.QUIZZES.GET(id),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<Quiz>) => response.data!,
    }),

    /** POST /api/quizzes/:id/attempt — nộp bài làm quiz */
    submitAttempt: builder.mutation<
      QuizAttemptResponse['data'],
      { quizId: string; body: QuizAttemptRequest }
    >({
      query: ({ quizId, body }) => ({
        url: API_ENDPOINTS.QUIZZES.ATTEMPT(quizId),
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: QuizAttemptResponse) => response.data,
    }),

    /** GET kết quả quiz theo attemptId */
    getQuizResults: builder.query<unknown, string>({
      query: id => ({
        url: API_ENDPOINTS.QUIZZES.RESULTS(id),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<unknown>) => response.data,
    }),

    /** GET /api/quizzes/:id/my-latest — lấy lần làm gần nhất để hiển thị điểm + nút làm lại */
    getMyLatestAttempt: builder.query<QuizLatestAttempt, string>({
      query: quizId => ({
        url: API_ENDPOINTS.QUIZZES.MY_LATEST(quizId),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<QuizLatestAttempt>) =>
        response.data ?? { attempt: null },
    }),
  }),
});

export const {
  useGetQuizQuery,
  useLazyGetQuizQuery,
  useSubmitAttemptMutation,
  useGetQuizResultsQuery,
  useGetMyLatestAttemptQuery,
} = quizzesApi;

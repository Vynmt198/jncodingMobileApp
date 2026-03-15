import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type {
  ApiResponse,
  Quiz,
  QuizAttemptRequest,
  QuizAttemptResponse,
} from '@/types/api.types';

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

    /** GET /api/quizzes/:id/results — lịch sử kết quả (nếu backend hỗ trợ) */
    getResults: builder.query<unknown, string>({
      query: id => ({
        url: API_ENDPOINTS.QUIZZES.RESULTS(id),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<unknown>) => response.data,
    }),
  }),
});

export const {
  useGetQuizQuery,
  useLazyGetQuizQuery,
  useSubmitAttemptMutation,
  useGetQuizResultsQuery,
} = quizzesApi;

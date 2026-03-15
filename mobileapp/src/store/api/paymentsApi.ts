import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, PaymentHistoryResponse, PaymentStatus } from '@/types/api.types';

export interface GetPaymentHistoryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
}

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    getPaymentHistory: builder.query<PaymentHistoryResponse, GetPaymentHistoryParams | void>({
      query: (params = {}) => ({
        url: API_ENDPOINTS.PAYMENTS.HISTORY,
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiResponse<PaymentHistoryResponse>) =>
        response.data ?? { payments: [], totalPages: 0, currentPage: 1, total: 0 },
    }),
  }),
});

export const { useGetPaymentHistoryQuery, useLazyGetPaymentHistoryQuery } = paymentsApi;

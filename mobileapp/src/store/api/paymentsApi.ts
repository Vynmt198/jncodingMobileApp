import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type {
  ApiResponse,
  PaymentHistoryResponse,
  PaymentStatus,
  PaymentDetailResponse,
} from '@/types/api.types';

export interface GetPaymentHistoryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
}

export interface CreatePaymentParams {
  courseId: string;
  amount: number;
  /** Override VNPay return URL for mobile/emulator (avoid localhost in emulator browser). */
  returnUrl?: string;
}

export interface CreatePaymentResponse {
  paymentUrl: string;
  orderId: string;
}

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: axiosBaseQuery(),
  endpoints: builder => ({
    /** POST /payments/create — tạo thanh toán VNPay, trả về paymentUrl */
    createPayment: builder.mutation<CreatePaymentResponse, CreatePaymentParams>({
      query: body => ({
        url: API_ENDPOINTS.PAYMENTS.CREATE,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<CreatePaymentResponse>) => response.data ?? { paymentUrl: '', orderId: '' },
    }),
    getPaymentHistory: builder.query<PaymentHistoryResponse, GetPaymentHistoryParams | void>({
      query: (params = {}) => ({
        url: API_ENDPOINTS.PAYMENTS.HISTORY,
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiResponse<PaymentHistoryResponse>) =>
        response.data ?? { payments: [], totalPages: 0, currentPage: 1, total: 0 },
    }),
    getPaymentDetail: builder.query<PaymentDetailResponse, string>({
      query: orderId => ({
        url: API_ENDPOINTS.PAYMENTS.DETAIL(orderId),
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<PaymentDetailResponse>) =>
        response.data ?? { payment: null },
    }),
  }),
});

export const {
  useGetPaymentHistoryQuery,
  useLazyGetPaymentHistoryQuery,
  useCreatePaymentMutation,
  useGetPaymentDetailQuery,
} = paymentsApi;

import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseApi';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, Certificate } from '@/types/api.types';

export const certificateApi = createApi({
  reducerPath: 'certificateApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Certificates'],
  endpoints: builder => ({
    /** GET /api/certificates/my-certificates */
    getMyCertificates: builder.query<Certificate[], void>({
      query: () => ({
        url: API_ENDPOINTS.CERTIFICATES.MY,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<{ certificates: Certificate[] }>) =>
        response.data?.certificates ?? [],
      providesTags: ['Certificates'],
    }),

    /** POST /api/certificates/generate — tạo chứng chỉ khi đủ điều kiện */
    generate: builder.mutation<Certificate, { courseId: string }>({
      query: body => ({
        url: API_ENDPOINTS.CERTIFICATES.GENERATE,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<{ certificate: Certificate }>) => response.data!.certificate,
      invalidatesTags: ['Certificates'],
    }),

    /** GET /api/certificates/:id/download — PDF hoặc URL (backend trả về theo cấu hình) */
    download: builder.query<Blob | { url?: string }, string>({
      query: id => ({
        url: API_ENDPOINTS.CERTIFICATES.DOWNLOAD(id),
        method: 'GET',
      }),
      transformResponse: (response: unknown) => response as Blob | { url?: string },
    }),
  }),
});

export const {
  useGetMyCertificatesQuery,
  useLazyGetMyCertificatesQuery,
  useGenerateMutation,
  useLazyDownloadQuery,
} = certificateApi;

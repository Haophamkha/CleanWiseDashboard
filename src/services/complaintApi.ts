import { baseApi } from "@/store/baseApi";
import type {
  Complaint,
  ComplaintDetail,
  ComplaintPreview,
  GetComplaintsParams,
  GetComplaintPreviewParams,
  ResolveComplaintRequest,
} from "@/types/Complaint";

const BASE_PATH = "/api/admin/complaints";

const unwrapResponse = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "data" in response) {
    const level1 = (response as { data?: unknown }).data;

    if (level1 && typeof level1 === "object" && "data" in level1) {
      return (level1 as { data?: T }).data as T;
    }

    return level1 as T;
  }

  return response as T;
};

export const complaintApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComplaints: builder.query<Complaint[], GetComplaintsParams | void>({
      query: (params) => ({
        url: `${BASE_PATH}/`,
        method: "GET",
        params: params ?? undefined,
      }),

      transformResponse: (response: unknown) =>
        unwrapResponse<Complaint[]>(response),

      providesTags: (result) =>
        result
          ? [
              ...result.map((complaint) => ({
                type: "Complaints" as const,
                id: complaint.id,
              })),
              {
                type: "Complaints" as const,
                id: "LIST",
              },
            ]
          : [
              {
                type: "Complaints" as const,
                id: "LIST",
              },
            ],
    }),

    getComplaintDetail: builder.query<ComplaintDetail, number>({
      query: (id) => ({
        url: `${BASE_PATH}/${id}/`,
        method: "GET",
      }),

      transformResponse: (response: unknown) =>
        unwrapResponse<ComplaintDetail>(response),

      providesTags: (_result, _error, id) => [
        {
          type: "Complaints",
          id,
        },
      ],
    }),

    getComplaintPreview: builder.query<
      ComplaintPreview,
      GetComplaintPreviewParams
    >({
      query: ({ id, ...params }) => ({
        url: `${BASE_PATH}/${id}/preview/`,
        method: "GET",
        params,
      }),

      transformResponse: (response: unknown) =>
        unwrapResponse<ComplaintPreview>(response),

      keepUnusedDataFor: 0,
    }),

    resolveComplaint: builder.mutation<
      ComplaintDetail,
      ResolveComplaintRequest
    >({
      query: ({ id, ...data }) => ({
        url: `${BASE_PATH}/${id}/resolve/`,
        method: "POST",
        data,
      }),

      transformResponse: (response: unknown) =>
        unwrapResponse<ComplaintDetail>(response),

      // Khi xử lý kèm hoàn tiền, đơn (refunded_amount, trạng thái thanh toán,
      // lịch sử) và danh sách giao dịch ví đều thay đổi nên cần tải lại.
      invalidatesTags: (result, _error, { id }) => [
        {
          type: "Complaints",
          id,
        },
        {
          type: "Complaints",
          id: "LIST",
        },
        ...(result
          ? [
              { type: "Bookings" as const, id: result.booking },
              { type: "Bookings" as const, id: `TIMELINE-${result.booking}` },
            ]
          : []),
        { type: "Bookings", id: "LIST" },
        { type: "Wallets", id: "LIST" },
        { type: "Wallets", id: "TARGETS" },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetComplaintsQuery,
  useGetComplaintDetailQuery,
  useGetComplaintPreviewQuery,
  useResolveComplaintMutation,
} = complaintApi;

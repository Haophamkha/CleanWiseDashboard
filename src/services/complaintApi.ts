import { baseApi } from "@/store/baseApi";
import type {
  Complaint,
  ComplaintDetail,
  GetComplaintsParams,
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

      invalidatesTags: (_result, _error, { id }) => [
        {
          type: "Complaints",
          id,
        },
        {
          type: "Complaints",
          id: "LIST",
        },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetComplaintsQuery,
  useGetComplaintDetailQuery,
  useResolveComplaintMutation,
} = complaintApi;

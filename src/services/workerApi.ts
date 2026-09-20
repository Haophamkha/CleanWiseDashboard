import { baseApi } from "@/store/baseApi";
import type {
  UpdateWorkerStatusRequest,
  WorkerProfile,
  WorkerStatus,
} from "@/types/Worker";

const unwrap = (response: any) =>
  response?.data?.data ?? response?.data ?? response;

export type WorkerListFilter = WorkerStatus | "ALL";

export const workerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkerProfiles: builder.query<
      WorkerProfile[],
      WorkerListFilter | void
    >({
      query: (statusFilter) => ({
        url: "/api/auth/admin/worker-profiles/",
        method: "GET",
        params:
          statusFilter && statusFilter !== "ALL"
            ? { status: statusFilter }
            : undefined,
      }),
      transformResponse: unwrap,
      providesTags: ["Workers"],
    }),

    updateWorkerStatus: builder.mutation<
      WorkerProfile,
      { id: number } & UpdateWorkerStatusRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/api/auth/admin/worker-profiles/${id}/status/`,
        method: "PATCH",
        data: body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Workers"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetWorkerProfilesQuery,
  useUpdateWorkerStatusMutation,
} = workerApi;

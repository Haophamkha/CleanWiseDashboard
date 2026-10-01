import { baseApi } from "@/store/baseApi";
import type { WorkerSchedule } from "@/types/WorkerSchedule";
import type {
  UpdateWorkerStatusRequest,
  WorkerProfile,
  WorkerStatus,
} from "@/types/Worker";

const unwrap = <T,>(response: unknown): T => {
  if (response && typeof response === "object" && "data" in response) {
    const first = (response as { data: unknown }).data;
    if (first && typeof first === "object" && "data" in first) {
      return (first as { data: T }).data;
    }
    return first as T;
  }
  return response as T;
};

export type WorkerListFilter = WorkerStatus | "ALL";

export const workerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkerSchedule: builder.query<WorkerSchedule, { workerId: number; start: string; end: string }>({
      query: ({ workerId, start, end }) => ({ url: `/api/admin/workers/${workerId}/schedule/`, method: "GET", params: { start, end } }),
      transformResponse: unwrap,
      providesTags: [{ type: "Bookings", id: "LIST" }],
    }),
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
      async onQueryStarted(_argument, { dispatch, getState, queryFulfilled }) {
        try {
          // Chờ backend xác nhận thành công rồi dùng chính response chuẩn của
          // server để cập nhật từng danh sách đã cache. Không refetch toàn bộ.
          const { data: updatedWorker } = await queryFulfilled;
          const cachedFilters = workerApi.util.selectCachedArgsForQuery(
            getState(),
            "getWorkerProfiles",
          );

          for (const statusFilter of cachedFilters) {
            dispatch(
              workerApi.util.updateQueryData(
                "getWorkerProfiles",
                statusFilter,
                (workers) => {
                  const index = workers.findIndex(
                    (worker) => worker.id === updatedWorker.id,
                  );
                  const belongsToList =
                    !statusFilter ||
                    statusFilter === "ALL" ||
                    statusFilter === updatedWorker.status;

                  if (index >= 0 && belongsToList) {
                    workers[index] = updatedWorker;
                  } else if (index >= 0) {
                    workers.splice(index, 1);
                  } else if (belongsToList) {
                    workers.unshift(updatedWorker);
                  }
                },
              ),
            );
          }
        } catch {
          // Mutation lỗi không thay đổi cache; component sẽ hiển thị thông báo.
        }
      },
      // Trạng thái ACTIVE/SUSPENDED ảnh hưởng danh sách có thể phân công,
      // nhưng không cần tải lại danh sách quản lý nhân viên.
      invalidatesTags: [{ type: "Workers", id: "AVAILABLE" }],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetWorkerScheduleQuery,
  useGetWorkerProfilesQuery,
  useUpdateWorkerStatusMutation,
} = workerApi;

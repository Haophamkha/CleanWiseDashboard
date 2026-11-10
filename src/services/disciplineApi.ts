import { baseApi } from "@/store/baseApi";
import type { DisciplineAction, DisciplineDetail, DisciplinePage } from "@/types/Discipline";
const unwrap = <T>(response: T | { data: T }): T =>
  response && typeof response === "object" && "data" in response ? response.data : response;
const path = "/api/admin/worker-discipline";
const tag = { type: "Complaints" as const, id: "DISCIPLINE" };

export const disciplineApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDisciplineCases: builder.query<DisciplinePage, { page: number; pending: boolean; search: string }>({
      query: (params) => ({ url: `${path}/`, method: "GET", params }),
      transformResponse: unwrap<DisciplinePage>,
      providesTags: [tag],
    }),
    getDisciplineDetail: builder.query<DisciplineDetail, number>({
      query: (id) => ({ url: `${path}/${id}/`, method: "GET" }),
      transformResponse: unwrap<DisciplineDetail>,
      providesTags: [tag],
    }),
    decideDiscipline: builder.mutation<DisciplineDetail, { id: number; action: DisciplineAction; note: string }>({
      query: ({ id, ...data }) => ({ url: `${path}/${id}/`, method: "POST", data }),
      transformResponse: unwrap<DisciplineDetail>,
      invalidatesTags: [tag],
    }),
  }),
});

export const { useGetDisciplineCasesQuery, useGetDisciplineDetailQuery, useDecideDisciplineMutation } = disciplineApi;

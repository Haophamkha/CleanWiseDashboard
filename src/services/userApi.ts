// src/services/userApi.ts
import { baseApi } from "@/store/baseApi";
import type { User } from "@/types/User";

const unwrap = <T,>(response: unknown): T => {
  let current = response;
  for (let depth = 0; depth < 5; depth++) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    if ("results" in current) { current = current.results; break; }
    if ("data" in current) current = current.data;
    else break;
  }
  return current as T;
};

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => ({
        url: "/api/auth/users/",
        method: "GET",
      }),
      transformResponse: (response: unknown) => {
        const users = unwrap<User[]>(response);
        return Array.isArray(users) ? users : [];
      },
      providesTags: ["Users"],
    }),
    getCustomerDetail: builder.query<User, number>({
      query: (id) => ({ url: `/api/auth/admin/customers/${id}/`, method: "GET" }),
      transformResponse: unwrap<User>,
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    updateCustomerStatus: builder.mutation<User, { id: number; is_active: boolean }>({
      query: ({ id, is_active }) => ({ url: `/api/auth/admin/customers/${id}/status/`, method: "PATCH", data: { is_active } }),
      transformResponse: unwrap<User>,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: customer } = await queryFulfilled;
          dispatch(userApi.util.updateQueryData("getUsers", undefined, (users) => {
            const index = users.findIndex((user) => user.id === id);
            if (index !== -1) users[index] = customer;
          }));
          dispatch(userApi.util.updateQueryData("getCustomerDetail", id, () => customer));
        } catch {
          // Keep the previous status when the server rejects the update.
        }
      },
      invalidatesTags: (_result, error, { id }) => error ? [] : [{ type: "Users", id }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetUsersQuery, useGetCustomerDetailQuery, useUpdateCustomerStatusMutation } = userApi;

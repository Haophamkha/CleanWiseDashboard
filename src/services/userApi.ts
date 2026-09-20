// src/services/userApi.ts
import { baseApi } from "@/store/baseApi";
import type { User } from "@/types/User";

const unwrap = (response: any) => {
  const res =
    response?.results ??
    response?.data?.results ??
    response?.data?.data ??
    response?.data ??
    response;
  return Array.isArray(res) ? res : [];
};

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => ({
        url: "/api/auth/users/",
        method: "GET",
      }),
      transformResponse: unwrap,
      providesTags: ["Users"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetUsersQuery } = userApi;

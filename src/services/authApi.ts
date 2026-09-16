import { COOKIE_KEYS } from "@/config/constants";
import { baseApi } from "@/store/baseApi";
import type { LoginRequest } from "@/types/Request";
import type { AuthResponse } from "@/types/Response";
import Cookies from "js-cookie";

export const saveTokens = (access: string, refresh: string) => {
  Cookies.set(COOKIE_KEYS.ACCESS_TOKEN, access, { expires: 1 });
  Cookies.set(COOKIE_KEYS.REFRESH_TOKEN, refresh, { expires: 7 });
};

export const logout = () => {
  Cookies.remove(COOKIE_KEYS.ACCESS_TOKEN);
  Cookies.remove(COOKIE_KEYS.REFRESH_TOKEN);
};

const unwrapAuthResponse = (response: any): AuthResponse => {
  return response?.data?.data ?? response?.data ?? response;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/api/auth/login/",
        method: "POST",
        data: body,
      }),
      transformResponse: unwrapAuthResponse,
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        const { data } = await queryFulfilled;
        saveTokens(data.access, data.refresh);
      },
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation } = authApi;


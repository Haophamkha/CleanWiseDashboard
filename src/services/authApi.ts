import { baseApi } from "@/store/baseApi";
import type { LoginRequest } from "@/types/Request";
import type { AuthResponse } from "@/types/Response";

export { saveTokens } from "@/utils/authCookies";

const unwrapAuthResponse = (response: unknown): AuthResponse => {
  if (typeof response === "object" && response !== null && "data" in response) {
    const outer = response as { data?: unknown };

    if (
      typeof outer.data === "object" &&
      outer.data !== null &&
      "data" in outer.data
    ) {
      return (outer.data as { data: AuthResponse }).data;
    }

    return outer.data as AuthResponse;
  }

  return response as AuthResponse;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // KHÔNG lưu token ở đây: LoginForm phải check role ADMIN trước rồi mới lưu
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/api/auth/login/",
        method: "POST",
        data: body,
      }),
      transformResponse: unwrapAuthResponse,
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation } = authApi;

import { baseApi } from "@/store/baseApi";
import type { AdminPaymentPage, GetPaymentsParams } from "@/types/Payment";

const unwrap = <T>(response: unknown): T => {
  let current = response;
  for (let i = 0; i < 3; i++) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      "data" in current
    ) {
      current = (current as { data: unknown }).data;
    } else break;
  }
  return current as T;
};

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminPayments: builder.query<AdminPaymentPage, GetPaymentsParams>({
      query: (params) => ({
        url: "/api/admin/payments/",
        method: "GET",
        params,
      }),
      transformResponse: (response: unknown) =>
        unwrap<AdminPaymentPage>(response),
    }),
  }),
  overrideExisting: false,
});

export const { useGetAdminPaymentsQuery } = paymentApi;

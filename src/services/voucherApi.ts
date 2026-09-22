import { baseApi } from "@/store/baseApi";
import type {
  Voucher,
  VoucherListParams,
  VoucherMutationPayload,
} from "@/types/Voucher";
import type { ApiMessageResponse } from "@/types/Response";

export type VoucherListResponse = ApiMessageResponse<Voucher[]>;
export type VoucherDetailResponse = ApiMessageResponse<Voucher>;

const unwrapListResponse = (response: unknown): VoucherListResponse => {
  const wrapped = response as {
    message?: string;
    data?: { message?: string; data?: Voucher[] } | Voucher[];
  };
  const nested = wrapped?.data;
  const items = Array.isArray(nested)
    ? nested
    : Array.isArray(nested?.data)
      ? nested.data
      : [];

  return {
    message:
      wrapped?.message ?? (!Array.isArray(nested) ? nested?.message : "") ?? "",
    data: items,
  };
};

const unwrapDetailResponse = (response: unknown): VoucherDetailResponse => {
  const wrapped = response as {
    message?: string;
    data?: { message?: string; data?: Voucher } | Voucher;
  };
  const nested = wrapped?.data;
  const voucher =
    nested && "data" in nested && nested.data ? nested.data : (nested as Voucher);

  return {
    message:
      wrapped?.message ??
      (nested && "message" in nested ? nested.message : "") ??
      "",
    data: voucher,
  };
};

export const voucherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVouchers: builder.query<VoucherListResponse, VoucherListParams | void>({
      query: (params) => ({
        url: "/api/admin/vouchers/",
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: unwrapListResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({
                type: "Vouchers" as const,
                id,
              })),
              { type: "Vouchers" as const, id: "LIST" },
            ]
          : [{ type: "Vouchers" as const, id: "LIST" }],
    }),

    getVoucherDetail: builder.query<VoucherDetailResponse, number>({
      query: (id) => ({
        url: `/api/admin/vouchers/${id}/`,
        method: "GET",
      }),
      transformResponse: unwrapDetailResponse,
      providesTags: (_result, _error, id) => [{ type: "Vouchers", id }],
    }),

    createVoucher: builder.mutation<
      VoucherDetailResponse,
      VoucherMutationPayload
    >({
      query: (data) => ({
        url: "/api/admin/vouchers/",
        method: "POST",
        data,
      }),
      transformResponse: unwrapDetailResponse,
      invalidatesTags: [{ type: "Vouchers", id: "LIST" }],
    }),

    updateVoucher: builder.mutation<
      VoucherDetailResponse,
      { id: number; data: VoucherMutationPayload }
    >({
      query: ({ id, data }) => ({
        url: `/api/admin/vouchers/${id}/`,
        method: "PATCH",
        data,
      }),
      transformResponse: unwrapDetailResponse,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Vouchers", id },
        { type: "Vouchers", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVouchersQuery,
  useGetVoucherDetailQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
} = voucherApi;


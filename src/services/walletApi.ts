import { baseApi } from "@/store/baseApi";
import type { PageResult } from "@/types/Booking";
import type {
  AdjustWalletPayload,
  AdminUserWallet,
  RefundBookingPayload,
  RefundBookingResult,
  WalletTarget,
  WalletTargetListParams,
  WalletTransaction,
  WalletTransactionListParams,
  WalletTransactionPage,
} from "@/types/Wallet";

const unwrap = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "data" in response) {
    const first = (response as { data: unknown }).data;
    if (first && typeof first === "object" && "data" in first) {
      return (first as { data: T }).data;
    }
    return first as T;
  }
  return response as T;
};

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWalletTransactions: builder.query<
      WalletTransactionPage,
      WalletTransactionListParams
    >({
      query: (params) => ({
        url: "/api/admin/wallets/transactions/",
        method: "GET",
        params,
      }),
      transformResponse: unwrap,
      providesTags: [{ type: "Wallets", id: "LIST" }],
    }),

    // Tìm khách hàng / nhân viên (kèm số dư) để chọn người nhận điều chỉnh.
    getWalletTargets: builder.query<
      PageResult<WalletTarget>,
      WalletTargetListParams
    >({
      query: (params) => ({
        url: "/api/admin/wallets/targets/",
        method: "GET",
        params,
      }),
      transformResponse: unwrap,
      providesTags: [{ type: "Wallets", id: "TARGETS" }],
    }),

    getUserWallet: builder.query<AdminUserWallet, number>({
      query: (userId) => ({
        url: `/api/admin/wallets/users/${userId}/`,
        method: "GET",
      }),
      transformResponse: unwrap,
      providesTags: (_r, _e, userId) => [{ type: "Wallets", id: userId }],
    }),

    // Hoàn tiền đơn đã thanh toán vào ví khách.
    // Idempotency-Key do dialog tạo và giữ nguyên khi gửi lại cùng một nội dung.
    refundBooking: builder.mutation<RefundBookingResult, RefundBookingPayload>({
      query: ({ bookingId, reason, amount, idempotencyKey }) => ({
        url: `/api/admin/bookings/${bookingId}/refund/`,
        method: "POST",
        data: { reason, ...(amount ? { amount } : {}) },
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { bookingId }) => [
        { type: "Bookings", id: bookingId },
        { type: "Bookings", id: "LIST" },
        { type: "Bookings", id: "SUMMARY" },
        { type: "Bookings", id: `TIMELINE-${bookingId}` },
        { type: "Wallets", id: "LIST" },
        { type: "Wallets", id: "TARGETS" },
      ],
    }),

    // Cộng/trừ số dư ví của khách hàng hoặc nhân viên.
    adjustWallet: builder.mutation<WalletTransaction, AdjustWalletPayload>({
      query: ({ idempotencyKey, ...data }) => ({
        url: "/api/admin/wallets/adjust/",
        method: "POST",
        data,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { user_id }) => [
        { type: "Wallets", id: "LIST" },
        { type: "Wallets", id: "TARGETS" },
        { type: "Wallets", id: user_id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWalletTransactionsQuery,
  useGetWalletTargetsQuery,
  useGetUserWalletQuery,
  useRefundBookingMutation,
  useAdjustWalletMutation,
} = walletApi;

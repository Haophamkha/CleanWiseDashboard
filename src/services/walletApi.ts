import { baseApi } from "@/store/baseApi";
import type {
  AdminUserWallet,
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

    getUserWallet: builder.query<AdminUserWallet, number>({
      query: (userId) => ({
        url: `/api/admin/wallets/users/${userId}/`,
        method: "GET",
      }),
      transformResponse: unwrap,
      providesTags: (_r, _e, userId) => [{ type: "Wallets", id: userId }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetWalletTransactionsQuery, useGetUserWalletQuery } =
  walletApi;

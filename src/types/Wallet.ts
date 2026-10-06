import type { PageResult } from "@/types/Booking";

export type WalletTransactionType =
  | "PAYMENT"
  | "REFUND"
  | "WITHDRAW"
  | "ADJUSTMENT"
  | "EARNING";
export type WalletTransactionStatus = "PENDING" | "SUCCESS" | "FAILED";
export type WalletDirection = "CREDIT" | "DEBIT" | "";

/** Giao dịch ví (dạng dùng chung với app khách/nhân viên). */
export type WalletTransaction = {
  id: number;
  type: WalletTransactionType;
  type_display: string;
  amount: string;
  balance_after: string;
  status: WalletTransactionStatus;
  status_display: string;
  booking_code: string | null;
  note: string | null;
  created_at: string;
  direction: WalletDirection;
};

/** Giao dịch ví kèm thông tin chủ ví, dùng cho trang admin. */
export type AdminWalletTransaction = WalletTransaction & {
  booking_id: number | null;
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  created_by_name: string | null;
};

export type WalletTransactionPage = PageResult<AdminWalletTransaction>;

export type WalletTransactionListParams = {
  search?: string;
  type?: string;
  direction?: string;
  status?: string;
  role?: string;
  /** admin = do admin thực hiện, system = hệ thống tự tạo */
  source?: string;
  user_id?: number;
  booking_id?: number;
  /** YYYY-MM-DD, tính theo ngày tạo giao dịch */
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
};

export type AdminUserWallet = {
  user_id: number;
  role: string;
  balance: string;
  transactions: WalletTransaction[];
};

export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "MOMO"
  | "VNPAY"
  | "CARD"
  | "WALLET";

export interface AdminPayment {
  id: number;
  booking: number;
  booking_code: string | null;
  customer_name: string;
  amount: string;
  method: PaymentMethod;
  method_label: string;
  status: PaymentStatus;
  status_label: string;
  transaction_code: string | null;
  order_code: number | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface AdminPaymentPage {
  results: AdminPayment[];
  count: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  summary: {
    success_total: string;
    pending: number;
    failed: number;
  };
}

export interface GetPaymentsParams {
  status?: PaymentStatus;
  method?: PaymentMethod;
  search?: string;
  page?: number;
  page_size?: number;
}

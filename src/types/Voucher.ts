export type VoucherDiscountType = "PERCENT" | "FIXED";

export type VoucherDistributionType = "PUBLIC" | "CODE_ONLY" | "ASSIGNED";

export type VoucherLifecycleStatus =
  | "ACTIVE"
  | "UPCOMING"
  | "EXPIRED"
  | "EXHAUSTED"
  | "DISABLED";

export type Voucher = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  distribution_type: VoucherDistributionType;
  discount_type: VoucherDiscountType;
  discount_value: string;
  max_discount_amount: string | null;
  min_order_amount: string;
  issuance_limit: number | null;
  issued_count: number;
  remaining_issuance: number | null;
  start_at: string;
  end_at: string;
  is_active: boolean;
  lifecycle_status: VoucherLifecycleStatus;
  created_at: string;
  updated_at: string;
};

export type VoucherListParams = {
  search?: string;
  is_active?: boolean;
  discount_type?: VoucherDiscountType;
  distribution_type?: VoucherDistributionType;
};

export type VoucherMutationPayload = {
  code: string;
  name: string;
  description?: string | null;
  distribution_type: VoucherDistributionType;
  discount_type: VoucherDiscountType;
  discount_value: string;
  max_discount_amount?: string | null;
  min_order_amount: string;
  issuance_limit?: number | null;
  start_at: string;
  end_at: string;
  is_active: boolean;
};


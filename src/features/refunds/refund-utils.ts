import { useEffect, useState } from "react";
import type { BookingDetail } from "@/types/Booking";

export const vnd = (value: string | number | null | undefined) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(value ?? 0))}đ`;

export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

export function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "Khách hàng",
  WORKER: "Nhân viên",
};

/** Mức ký quỹ tối thiểu của nhân viên (khớp BE: MIN_WORKER_ESCROW_BALANCE). */
export const MIN_WORKER_ESCROW = 400000;

type RefundInfoInput = Pick<
  BookingDetail,
  "payment_status" | "total_amount" | "payments"
> & { refunded_amount?: string };

/** Tính số tiền còn hoàn được và lý do không được hoàn (nếu có). Khớp điều kiện của BE. */
export function refundInfo(booking: RefundInfoInput) {
  const total = Number(booking.total_amount || 0);
  const refunded = Number(booking.refunded_amount || 0);
  const remaining = Math.max(total - refunded, 0);
  const paidOnline = booking.payments.some(
    (p) =>
      ["SUCCESS", "PAID"].includes(String(p.status)) && p.method !== "CASH",
  );

  let blockedReason: string | null = null;
  if (booking.payment_status !== "PAID") {
    blockedReason = "Chỉ hoàn tiền cho đơn đã thanh toán.";
  } else if (!paidOnline) {
    blockedReason =
      "Đơn tiền mặt không hoàn qua ví. Dùng Điều chỉnh ví ở trang Ví & hoàn tiền.";
  } else if (remaining <= 0) {
    blockedReason = "Đơn đã được hoàn đủ.";
  }
  return { total, refunded, remaining, blockedReason };
}

export const TX_STATUS_STYLE: Record<string, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-rose-50 text-rose-700",
};

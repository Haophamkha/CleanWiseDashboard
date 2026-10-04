"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useGetAdminBookingDetailQuery } from "@/services/bookingApi";
import { refundInfo, vnd } from "@/features/refunds/refund-utils";

export type ComplaintRefundValue = {
  /** Số tiền gửi lên BE; undefined = không hoàn tiền. */
  amount?: string;
  /** true khi đã bật hoàn tiền nhưng số tiền chưa hợp lệ, cần chặn nút Lưu. */
  invalid: boolean;
};

/**
 * Chỉ render khi admin chọn trạng thái RESOLVED.
 * Tự lấy chi tiết đơn để biết đơn có hoàn được không và còn tối đa bao nhiêu.
 */
export function ComplaintRefundField({
  bookingId,
  onChange,
}: {
  bookingId: number;
  onChange: (value: ComplaintRefundValue) => void;
}) {
  const { data: booking, isLoading } = useGetAdminBookingDetailQuery(bookingId);
  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState("");

  if (isLoading)
    return (
      <p className="text-sm text-slate-500">
        Đang kiểm tra khả năng hoàn tiền...
      </p>
    );
  if (!booking) return null;

  const { remaining, refunded, blockedReason } = refundInfo(booking);
  if (blockedReason) {
    return (
      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        Không hoàn tiền được từ khiếu nại này. {blockedReason}
      </p>
    );
  }

  const emit = (on: boolean, raw: string) => {
    const n = Number(raw);
    const valid = Number.isInteger(n) && n >= 1 && n <= remaining;
    onChange(
      on
        ? { amount: valid ? String(n) : undefined, invalid: !valid }
        : { invalid: false },
    );
  };
  const invalid =
    enabled &&
    !(
      Number.isInteger(Number(amount)) &&
      Number(amount) >= 1 &&
      Number(amount) <= remaining
    );

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-900">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            emit(e.target.checked, amount);
          }}
        />
        Hoàn tiền vào ví khách hàng
      </label>
      {enabled && (
        <>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={remaining}
              step={1}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                emit(true, e.target.value);
              }}
              placeholder="Số tiền hoàn (đ)"
            />
            <button
              type="button"
              className="shrink-0 text-sm text-blue-600 hover:underline"
              onClick={() => {
                setAmount(String(remaining));
                emit(true, String(remaining));
              }}
            >
              Hoàn tối đa
            </button>
          </div>
          <p
            className={`text-xs ${invalid && amount !== "" ? "text-rose-600" : "text-slate-500"}`}
          >
            Còn hoàn được {vnd(remaining)}
            {refunded > 0 ? ` (đã hoàn ${vnd(refunded)})` : ""}.
          </p>
        </>
      )}
    </div>
  );
}

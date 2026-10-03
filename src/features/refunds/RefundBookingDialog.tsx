"use client";
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiError, Field } from "@/features/bookings/booking-ui";
import { useRefundBookingMutation } from "@/services/walletApi";
import type { BookingDetail } from "@/types/Booking";
import { newIdempotencyKey, refundInfo, vnd } from "./refund-utils";

type Mode = "full" | "partial";

export function RefundBookingDialog({
  booking,
}: {
  booking: BookingDetail & { refunded_amount?: string };
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [refund, { isLoading }] = useRefundBookingMutation();
  // Giữ nguyên key khi gửi lại cùng nội dung; đổi nội dung thì tạo key mới.
  const keyRef = useRef<{ sig: string; key: string }>({ sig: "", key: "" });

  // Đơn chưa thanh toán hoặc đã hoàn đủ (REFUNDED) thì không hiện nút.
  if (booking.payment_status !== "PAID") return null;

  const { total, refunded, remaining, blockedReason } = refundInfo(booking);
  const partialValue = Number(amount);
  const partialInvalid =
    mode === "partial" &&
    (!Number.isInteger(partialValue) ||
      partialValue < 1 ||
      partialValue > remaining);
  const canSubmit = !partialInvalid && reason.trim().length >= 3 && !isLoading;

  const reset = () => {
    setMode("full");
    setAmount("");
    setReason("");
    keyRef.current = { sig: "", key: "" };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const value = mode === "full" ? undefined : String(partialValue);
    const sig = `${value ?? "ALL"}|${reason.trim()}`;
    if (keyRef.current.sig !== sig) {
      keyRef.current = { sig, key: newIdempotencyKey() };
    }
    try {
      const result = await refund({
        bookingId: booking.id,
        reason: reason.trim(),
        amount: value,
        idempotencyKey: keyRef.current.key,
      }).unwrap();
      toast.success(`Đã hoàn ${vnd(result.refunded)} vào ví khách hàng.`);
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(apiError(error));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={!!blockedReason}
          title={blockedReason ?? undefined}
        >
          Hoàn tiền
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Hoàn tiền đơn {booking.booking_code}</DialogTitle>
          <DialogDescription>
            Tiền được cộng vào ví của {booking.customer.full_name}. Khách dùng
            số dư này cho đơn sau hoặc yêu cầu rút.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <dl className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div>
              <dt className="text-slate-500">Tổng đơn</dt>
              <dd className="font-medium text-slate-900">{vnd(total)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Đã hoàn</dt>
              <dd className="font-medium text-slate-900">{vnd(refunded)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Còn hoàn được</dt>
              <dd className="font-semibold text-blue-700">{vnd(remaining)}</dd>
            </div>
          </dl>

          <div className="space-y-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="refund-mode"
                checked={mode === "full"}
                onChange={() => setMode("full")}
              />
              Hoàn toàn bộ phần còn lại ({vnd(remaining)})
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="refund-mode"
                checked={mode === "partial"}
                onChange={() => setMode("partial")}
              />
              Hoàn một phần
            </label>
          </div>

          {mode === "partial" && (
            <Field label="Số tiền hoàn (đ)" required>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={remaining}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Tối đa ${remaining}`}
                required
              />
              {amount !== "" && partialInvalid && (
                <p className="mt-1 text-xs text-rose-600">
                  Nhập số nguyên từ 1 đến {vnd(remaining)}.
                </p>
              )}
            </Field>
          )}

          <Field label="Lý do hoàn tiền" required>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              required
              minLength={3}
              placeholder="Khách sẽ thấy lý do này trong thông báo hoàn tiền"
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Đóng
            </Button>
            <Button disabled={!canSubmit}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Hoàn{" "}
              {vnd(
                mode === "full" ? remaining : partialInvalid ? 0 : partialValue,
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

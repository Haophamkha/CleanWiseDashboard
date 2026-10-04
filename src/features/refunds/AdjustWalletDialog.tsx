"use client";
import { useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiError, Field } from "@/features/bookings/booking-ui";
import {
  useAdjustWalletMutation,
  useGetWalletTargetsQuery,
} from "@/services/walletApi";
import type { WalletTarget } from "@/types/Wallet";
import {
  MIN_WORKER_ESCROW,
  newIdempotencyKey,
  ROLE_LABEL,
  useDebounced,
  vnd,
} from "./refund-utils";

type Direction = "CREDIT" | "DEBIT";

export function AdjustWalletDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [target, setTarget] = useState<WalletTarget | null>(null);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<Direction>("CREDIT");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [bookingId, setBookingId] = useState("");
  const keyRef = useRef<{ sig: string; key: string }>({ sig: "", key: "" });

  const dSearch = useDebounced(search);
  const { data, isFetching } = useGetWalletTargetsQuery(
    { search: dSearch || undefined, role: role || undefined, page_size: 6 },
    { skip: !open || !!target },
  );
  const [adjust, { isLoading }] = useAdjustWalletMutation();

  const balance = Number(target?.balance ?? 0);
  const value = Number(amount);
  const amountOk = Number.isInteger(value) && value >= 1;
  const overdraw = direction === "DEBIT" && amountOk && value > balance;
  const after = !amountOk
    ? balance
    : direction === "CREDIT"
      ? balance + value
      : balance - value;
  const escrowWarn =
    target?.role === "WORKER" &&
    direction === "DEBIT" &&
    amountOk &&
    !overdraw &&
    after < MIN_WORKER_ESCROW;
  const bookingOk = bookingId === "" || /^\d+$/.test(bookingId);
  const canSubmit =
    !!target &&
    amountOk &&
    !overdraw &&
    reason.trim().length >= 3 &&
    bookingOk &&
    !isLoading;

  const reset = () => {
    setTarget(null);
    setRole("");
    setSearch("");
    setDirection("CREDIT");
    setAmount("");
    setReason("");
    setBookingId("");
    keyRef.current = { sig: "", key: "" };
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !target) return;
    const sig = [target.id, direction, value, reason.trim(), bookingId].join(
      "|",
    );
    if (keyRef.current.sig !== sig)
      keyRef.current = { sig, key: newIdempotencyKey() };
    try {
      await adjust({
        user_id: target.id,
        direction,
        amount: String(value),
        reason: reason.trim(),
        booking_id: bookingId ? Number(bookingId) : null,
        idempotencyKey: keyRef.current.key,
      }).unwrap();
      toast.success(
        `Đã ${direction === "CREDIT" ? "cộng" : "trừ"} ${vnd(value)} ${direction === "CREDIT" ? "vào" : "khỏi"} ví ${target.name}.`,
      );
      handleOpenChange(false);
    } catch (error) {
      toast.error(apiError(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Điều chỉnh số dư ví</DialogTitle>
          <DialogDescription>
            Dùng cho đơn tiền mặt, ví ký quỹ nhân viên hoặc khoản không gắn với
            đơn. Mọi điều chỉnh đều được ghi lại cùng lý do.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {!target ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tên, số điện thoại hoặc email"
                  />
                </div>
                <Select value={role || "ALL"} onValueChange={(value) => setRole(value === "ALL" ? "" : value)}>
                  <SelectTrigger className="w-36" aria-label="Loại chủ ví"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                    <SelectItem value="WORKER">Nhân viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {isFetching && (
                  <p className="py-4 text-center text-sm text-slate-500">
                    Đang tìm...
                  </p>
                )}
                {data?.results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setTarget(u)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 p-2.5 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">
                        {u.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {ROLE_LABEL[u.role] ?? u.role}
                        {u.phone_number ? ` • ${u.phone_number}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-slate-600">
                      {vnd(u.balance)}
                    </span>
                  </button>
                ))}
                {data && !data.results.length && !isFetching && (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Không tìm thấy người dùng phù hợp.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {target.name}
                </p>
                <p className="text-xs text-slate-600">
                  {ROLE_LABEL[target.role] ?? target.role} • Số dư hiện tại{" "}
                  <span className="font-semibold">{vnd(balance)}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTarget(null)}
              >
                Đổi người
              </Button>
            </div>
          )}

          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label="Loại điều chỉnh"
          >
            {(["CREDIT", "DEBIT"] as const).map((d) => (
              <Button
                key={d}
                type="button"
                variant={direction === d ? "default" : "outline"}
                onClick={() => setDirection(d)}
              >
                {d === "CREDIT" ? "Cộng tiền" : "Trừ tiền"}
              </Button>
            ))}
          </div>

          <Field label="Số tiền (đ)" required>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {overdraw && (
              <p className="mt-1 text-xs text-rose-600">
                Số dư ví chỉ còn {vnd(balance)}, không trừ được {vnd(value)}.
              </p>
            )}
            {escrowWarn && (
              <p className="mt-1 text-xs text-amber-700">
                Ví nhân viên sẽ còn {vnd(after)}, thấp hơn mức ký quỹ tối thiểu{" "}
                {vnd(MIN_WORKER_ESCROW)}. Nhân viên có thể không nhận được đơn
                mới.
              </p>
            )}
            {target && amountOk && !overdraw && (
              <p className="mt-1 text-xs text-slate-500">
                Số dư sau điều chỉnh: {vnd(after)}
              </p>
            )}
          </Field>

          <Field label="Lý do" required>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              required
              minLength={3}
              placeholder="Ví dụ: Hoàn tiền mặt đơn CW123 do khách hủy"
            />
          </Field>

          <Field label="Mã đơn liên quan (ID, không bắt buộc)">
            <Input
              inputMode="numeric"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value.trim())}
              placeholder="Ví dụ: 128"
            />
            {!bookingOk && (
              <p className="mt-1 text-xs text-rose-600">ID đơn phải là số.</p>
            )}
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Đóng
            </Button>
            <Button
              disabled={!canSubmit}
              variant={direction === "DEBIT" ? "destructive" : "default"}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {direction === "CREDIT" ? "Cộng vào ví" : "Trừ khỏi ví"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

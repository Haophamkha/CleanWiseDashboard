import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import type { BookingStatus, PaymentStatus, ScheduleStatus } from "@/types/Booking";

export const money = (value: string | number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));
export const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
export const compactDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return `${day} · ${time}`;
};
export { apiError } from "@/lib/api-error";

const statusTones: Record<string, StatusTone> = {
  PENDING: "amber", ASSIGNED: "blue", IN_PROGRESS: "violet", COMPLETED: "emerald",
  CANCELLED: "rose", FAILED: "red", MISSED: "red",
};

export function StatusBadge({ status, label }: { status: BookingStatus | PaymentStatus | ScheduleStatus | string; label: string }) {
  return <StatusPill tone={statusTones[status]}>{label}</StatusPill>;
}

export function PaymentBadge({ status, label }: { status: PaymentStatus; label: string }) {
  const style = status === "PAID" || status === "REFUNDED" ? "border-emerald-200 text-emerald-700" : status === "FAILED" ? "border-red-200 text-red-700" : "border-slate-200 text-slate-500";
  return <Badge variant="outline" className={`h-5 whitespace-nowrap bg-white px-1.5 text-[10px] font-medium ${style}`}>{label}</Badge>;
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="space-y-1.5 text-sm font-medium text-slate-700"><span>{label}{required && <span className="text-red-500"> *</span>}</span>{children}</label>; }
export const selectClass = "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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
export const apiError = (error: unknown) => {
  const root = typeof error === "object" && error !== null ? error as { data?: unknown } : {};
  const raw = root.data;
  const data = typeof raw === "object" && raw !== null && "data" in raw ? (raw as { data: unknown }).data : raw;
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "detail" in data) return String((data as { detail: unknown }).detail);
  if (data && typeof data === "object") return Object.values(data).flat().join(" ");
  return "Có lỗi xảy ra. Vui lòng thử lại.";
};

const statusStyles: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ASSIGNED: "border-blue-200 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-violet-200 bg-violet-50 text-violet-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  MISSED: "border-red-200 bg-red-50 text-red-700",
};

const dotStyles: Record<string, string> = {
  PENDING: "bg-amber-500", ASSIGNED: "bg-blue-500", IN_PROGRESS: "bg-violet-500",
  COMPLETED: "bg-emerald-500", CANCELLED: "bg-rose-500", FAILED: "bg-red-500", MISSED: "bg-red-500",
};

export function StatusBadge({ status, label }: { status: BookingStatus | PaymentStatus | ScheduleStatus | string; label: string }) {
  return <Badge variant="outline" className={`h-6 gap-1.5 whitespace-nowrap px-2 font-medium ${statusStyles[status] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status] ?? "bg-slate-400"}`} />{label}</Badge>;
}

export function PaymentBadge({ status, label }: { status: PaymentStatus; label: string }) {
  const style = status === "PAID" || status === "REFUNDED" ? "border-emerald-200 text-emerald-700" : status === "FAILED" ? "border-red-200 text-red-700" : "border-slate-200 text-slate-500";
  return <Badge variant="outline" className={`h-5 whitespace-nowrap bg-white px-1.5 text-[10px] font-medium ${style}`}>{label}</Badge>;
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="space-y-1.5 text-sm font-medium text-slate-700"><span>{label}{required && <span className="text-red-500"> *</span>}</span>{children}</label>; }
export const selectClass = "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

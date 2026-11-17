import Link from "next/link";
import { ArrowRight, CalendarClock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ComplaintOrderLink({ bookingId, code, subtitle, redo = false }: {
  bookingId: number;
  code?: string | null;
  subtitle?: string;
  redo?: boolean;
}) {
  const Icon = redo ? CalendarClock : FileText;

  return (
    <Button asChild variant="outline" className={cn(
      "group grid h-auto w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-2.5 whitespace-normal px-3 py-2 text-left",
      redo
        ? "min-h-16 border-teal-200 bg-teal-50 text-teal-950 hover:bg-teal-100 focus-visible:ring-teal-600"
        : "min-h-17 border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100",
    )}>
      <Link href={`/bookings/${bookingId}`}>
        <span className={cn("grid size-8 place-items-center rounded-md border bg-white", redo ? "border-teal-200 text-teal-700" : "border-slate-200 text-slate-600")}>
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className={cn("block text-xs", redo ? "text-teal-800" : "text-slate-600")}>{redo ? "Đơn làm lại" : "Đơn gốc"}</span>
          <span className={cn("min-w-0 wrap-anywhere", redo ? "block" : "flex flex-wrap items-baseline gap-x-2")}>
            <strong className="block min-w-0 font-semibold">{code || `#${bookingId}`}</strong>
            {subtitle && <span className="block min-w-0 text-xs font-normal text-slate-600">{subtitle}</span>}
          </span>
        </span>
        <ArrowRight className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </Button>
  );
}

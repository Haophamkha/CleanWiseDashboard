import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkerScheduleItem } from "@/types/WorkerSchedule";

const dateLabel = (value: string) => new Date(value).toLocaleString("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

export default function WorkerScheduleDetail({ item, onBack }: {
  item: WorkerScheduleItem;
  onBack: () => void;
}) {
  return (
    <section
      aria-label="Chi tiết buổi làm"
      className="absolute inset-0 z-30 flex min-h-0 flex-col bg-white px-6 py-4"
      onKeyDown={event => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onBack();
        }
      }}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <Button autoFocus variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />Quay lại lịch
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/bookings/${item.booking_id}`}>Mở đơn {item.booking_code}</Link>
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pt-4 [scrollbar-gutter:stable]">
        <div>
          <h3 className="break-words text-lg font-semibold text-slate-900">{item.service_name} · Buổi #{item.sequence_no}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{item.assignment_status_label}</Badge>
            <Badge variant="outline">{item.status_label}</Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card><CardContent className="space-y-2 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-blue-600" />Thời gian làm việc</p>
            <dl className="space-y-2">
              <div><dt className="text-xs text-slate-500">Dự kiến · Giờ Việt Nam</dt><dd>{dateLabel(item.scheduled_start)} – {dateLabel(item.scheduled_end)}</dd></div>
              <div><dt className="text-xs text-slate-500">Bắt đầu thực tế</dt><dd>{item.actual_start ? dateLabel(item.actual_start) : "Chưa bắt đầu"}</dd></div>
              <div><dt className="text-xs text-slate-500">Kết thúc thực tế</dt><dd>{item.actual_end ? dateLabel(item.actual_end) : "Chưa kết thúc"}</dd></div>
            </dl>
          </CardContent></Card>
          <Card><CardContent className="space-y-2 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4 text-blue-600" />Khách hàng</p>
            <p className="break-words">{item.customer.full_name}</p>
            <p>{item.customer.phone_number || "Chưa có số điện thoại"}</p>
            <p className="flex items-start gap-2 break-words text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{[item.address.address_line, item.address.ward, item.address.city].filter(Boolean).join(", ")}</span></p>
          </CardContent></Card>
        </div>

        {(item.note || item.completion_note || item.cancel_reason) && (
          <Card><CardContent className="space-y-3 p-4 text-sm">
            {item.note && <div><p className="font-semibold">Ghi chú</p><p className="whitespace-pre-wrap break-words text-slate-600">{item.note}</p></div>}
            {item.completion_note && <div><p className="font-semibold">Ghi chú hoàn thành</p><p className="whitespace-pre-wrap break-words text-slate-600">{item.completion_note}</p></div>}
            {item.cancel_reason && <div><p className="font-semibold">Lý do hủy</p><p className="whitespace-pre-wrap break-words text-slate-600">{item.cancel_reason}</p></div>}
          </CardContent></Card>
        )}
        {!!item.images.length && (
          <div className="space-y-2"><p className="text-sm font-semibold">Ảnh công việc</p>
            <div className="flex flex-wrap gap-2">{item.images.map((image, index) => (
              <Button key={image.id} asChild variant="outline" size="sm" className="max-w-full">
                <a href={image.image} target="_blank" rel="noopener noreferrer" className="truncate">Ảnh {index + 1}{image.note ? ` · ${image.note}` : ""}</a>
              </Button>
            ))}</div>
          </div>
        )}
      </div>
    </section>
  );
}

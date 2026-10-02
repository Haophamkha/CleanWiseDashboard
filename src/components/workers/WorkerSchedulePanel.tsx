"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WorkerScheduleDetail from "./WorkerScheduleDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetWorkerScheduleQuery } from "@/services/workerApi";
import { daySegments } from "@/lib/workerScheduleLayout";
import type { WorkerScheduleItem } from "@/types/WorkerSchedule";

const HOUR_HEIGHT = 52;
const DAY = 86400000;
const zone = "Asia/Ho_Chi_Minh";
const timeLabel = (value: string) => new Date(value).toLocaleTimeString("vi-VN", { timeZone: zone, hour: "2-digit", minute: "2-digit" });
const dateLabel = (value: string) => new Date(value).toLocaleString("vi-VN", { timeZone: zone, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
function monday() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return dateKey(date);
}
const shift = (date: string, days: number) => dateKey(new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY));
const minutes = (time: string) => { const [h, m, s = 0] = time.split(":").map(Number); return h * 60 + m + s / 60; };
const color = (item: WorkerScheduleItem) => {
  if (item.status === "COMPLETED") return "border-emerald-300 bg-emerald-100 text-emerald-950";
  if (item.status === "IN_PROGRESS") return "border-violet-300 bg-violet-100 text-violet-950";
  if (item.status === "CANCELLED" || item.status === "MISSED") return "border-rose-300 bg-rose-100 text-rose-950";
  if (item.assignment_status === "PENDING") return "border-amber-300 bg-amber-100 text-amber-950";
  return "border-blue-300 bg-blue-100 text-blue-950";
};

export default function WorkerSchedulePanel({ workerId }: { workerId: number }) {
  const [start, setStart] = useState(monday);
  const [selected, setSelected] = useState<WorkerScheduleItem | null>(null);
  const scrollElement = useRef<HTMLDivElement | null>(null);
  const selectedTrigger = useRef<HTMLButtonElement | null>(null);
  const end = shift(start, 7);
  const { currentData: data, isFetching, isError, refetch } = useGetWorkerScheduleQuery(
    { workerId, start, end }, { refetchOnMountOrArgChange: true },
  );
  const selectedItem = data?.assignments.find(item => item.id === selected?.id) ?? null;
  useEffect(() => {
    if (!selectedItem) selectedTrigger.current?.focus({ preventScroll: true });
  }, [selectedItem]);
  const days = Array.from({ length: 7 }, (_, i) => shift(start, i));
  const move = (next: string) => { setStart(next); setSelected(null); };
  return <div className="relative flex min-h-0 flex-1 overflow-hidden">
    <div inert={!!selectedItem} aria-hidden={!!selectedItem} className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div><p className="font-semibold text-slate-900">{new Date(`${start}T00:00:00Z`).toLocaleDateString("vi-VN", { timeZone: "UTC" })} – {new Date(`${shift(start, 6)}T00:00:00Z`).toLocaleDateString("vi-VN", { timeZone: "UTC" })}</p><p className="text-xs text-slate-500">Giờ Việt Nam · {data ? `${data.assignments.length} buổi được phân công` : "Đang tải lịch…"}</p></div>
      <div className="flex gap-1"><Button variant="outline" size="icon" aria-label="Tuần trước" onClick={() => move(shift(start, -7))}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => move(monday())}>Hôm nay</Button><Button variant="outline" size="icon" aria-label="Tuần sau" onClick={() => move(shift(start, 7))}><ChevronRight className="h-4 w-4" /></Button><Button variant="ghost" size="icon" disabled={isFetching} aria-label="Tải lại lịch" onClick={() => refetch()}><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></Button></div>
    </div>
    <div className="flex shrink-0 flex-wrap gap-2 text-xs"><Badge variant="outline" className="bg-green-50">Khung giờ đăng ký</Badge><Badge variant="outline" className="bg-amber-100">Chờ xác nhận</Badge><Badge variant="outline" className="bg-blue-100">Đã nhận</Badge><Badge variant="outline" className="bg-violet-100">Đang làm</Badge><Badge variant="outline" className="bg-emerald-100">Hoàn thành</Badge><Badge variant="outline" className="bg-rose-100">Hủy / bỏ lỡ</Badge></div>
    {isError ? <div role="alert" className="py-12 text-center text-sm"><p>Không tải được lịch làm việc.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Thử lại</Button></div> : !data ? <Skeleton className="h-96 w-full" /> : <>
      {!data.availability.length && <p className="text-xs text-slate-500">Nhân viên chưa đăng ký khung giờ làm việc.</p>}
      {!data.assignments.length && <p className="text-xs text-slate-500">Chưa có buổi được phân công trong tuần này.</p>}
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200" aria-busy={isFetching} ref={element => { if (element && element !== scrollElement.current) { const first = Math.min(6 * 60, ...data.assignments.map(item => minutes(timeLabel(item.scheduled_start)))); element.scrollTop = first / 60 * HOUR_HEIGHT; } scrollElement.current = element; }}>
        <div className="min-w-[800px]">
          <div className="sticky top-0 z-20 grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b bg-white shadow-sm"><div className="p-2 text-xs text-slate-400">Giờ</div>{days.map((date, i) => <div key={date} className="border-l p-2 text-center text-xs"><b>{i === 6 ? "CN" : `Thứ ${i + 2}`}</b><div>{date.slice(8, 10)}/{date.slice(5, 7)}</div></div>)}</div>
          <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))]">
            <div className="relative bg-slate-50" style={{ height: 24 * HOUR_HEIGHT }}>{Array.from({ length: 24 }, (_, h) => <span key={h} className="absolute right-1 text-[10px] text-slate-400" style={{ top: h * HOUR_HEIGHT }}>{String(h).padStart(2, "0")}:00</span>)}</div>
            {days.map((date, day) => <div key={date} className="relative border-l" style={{ height: 24 * HOUR_HEIGHT, backgroundImage: "linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)", backgroundSize: `100% ${HOUR_HEIGHT}px` }}>
              {data.availability.filter(slot => slot.weekday === day).map(slot => <div key={slot.id} title={`Đăng ký: ${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`} className="absolute inset-x-0 border-y border-green-200 bg-green-100/45" style={{ top: minutes(slot.start_time) / 60 * HOUR_HEIGHT, height: (minutes(slot.end_time) - minutes(slot.start_time)) / 60 * HOUR_HEIGHT }} />)}
              {daySegments(data.assignments, date).map(event => <button key={event.item.id} type="button" onClick={click => { selectedTrigger.current = click.currentTarget; setSelected(event.item); }} aria-label={`${dateLabel(event.item.scheduled_start)} – ${dateLabel(event.item.scheduled_end)}, ${event.item.status_label}, ${event.item.assignment_status_label}`} title={`${timeLabel(event.item.scheduled_start)} – ${timeLabel(event.item.scheduled_end)} · ${event.item.assignment_status_label} · ${event.item.status_label}`} className={`absolute z-10 overflow-hidden rounded border p-1 text-left text-[10px] leading-4 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-blue-600 ${color(event.item)}`} style={{ top: event.from / 60 * HOUR_HEIGHT, height: Math.max(4, (event.to - event.from) / 60 * HOUR_HEIGHT), left: `calc(${event.lane / event.lanes * 100}% + 2px)`, width: `calc(${100 / event.lanes}% - 4px)` }}><b className="block truncate">{timeLabel(event.item.scheduled_start)} – {timeLabel(event.item.scheduled_end)}</b><span className="block break-words">{event.item.status === "PENDING" ? (event.item.assignment_status === "PENDING" ? "Chờ xác nhận" : "Đã nhận") : event.item.status_label}</span>{event.item.status === "PENDING" && event.item.assignment_status === "ACCEPTED" && <span className="block break-words">Chờ thực hiện</span>}</button>)}
            </div>)}
          </div>
        </div>
      </div>
      <p className="shrink-0 text-[11px] text-slate-400">Khung giờ đăng ký phản ánh thiết lập hiện tại. Ô trống không đồng nghĩa nhân viên sẵn sàng nhận việc.</p>
    </>}
    </div>
    {selectedItem && <WorkerScheduleDetail item={selectedItem} onBack={() => setSelected(null)} />}
  </div>;
}

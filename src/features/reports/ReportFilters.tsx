"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReportParams } from "@/types/Report";
import { adjacentPeriod, shiftDay, todayVN } from "./report-utils";

export default function ReportFilters({ params, onChange }: { params: ReportParams; onChange: (params: ReportParams) => void }) {
  const [period, setPeriod] = useState(params.period);
  const [date, setDate] = useState(params.date ?? todayVN());
  const [start, setStart] = useState(params.start ?? shiftDay(todayVN(), -29));
  const [end, setEnd] = useState(params.end ? shiftDay(params.end, -1) : todayVN());
  const [group, setGroup] = useState<NonNullable<ReportParams["group_by"]>>(params.group_by ?? "auto");
  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    if (period === "custom") {
      if (!start || !end || end < start) {toast.error("Ngày kết thúc phải từ ngày bắt đầu trở đi."); return;}
      const days = (new Date(end).getTime() - new Date(start).getTime()) / 86400000 + 1;
      if (days > 3660 || (group === "day" && days > 366)) {toast.error("Khoảng ngày quá dài. Chọn kỳ nhỏ hơn hoặc nhóm theo tháng."); return;}
      onChange({period, start, end: shiftDay(end, 1), group_by: group});
    } else onChange({period, ...(period === "all" ? {} : {date}), group_by: group});
  };
  const move = (direction: number) => {const next = adjacentPeriod(params, direction); setDate(next.date!); onChange(next);};
  return <form onSubmit={apply} aria-label="Bộ lọc báo cáo toàn trang" className="flex flex-wrap items-end gap-2">
    <label className="flex min-w-40 flex-col gap-1.5 text-xs text-slate-500"><span>Khoảng thời gian</span><Select value={period} onValueChange={value => setPeriod(value as ReportParams["period"])}><SelectTrigger aria-label="Kỳ báo cáo"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toàn bộ thời gian</SelectItem><SelectItem value="week">Theo tuần</SelectItem><SelectItem value="month">Theo tháng</SelectItem><SelectItem value="quarter">Theo quý</SelectItem><SelectItem value="custom">Khoảng ngày tùy chọn</SelectItem></SelectContent></Select></label>
    {period !== "all" && period !== "custom" && <label className="flex flex-col gap-1.5 text-xs text-slate-500"><span>{period === "month" ? "Chọn tháng" : "Ngày trong kỳ"}</span><Input aria-label="Ngày trong kỳ" type={period === "month" ? "month" : "date"} min={period === "month" ? "1900-01" : "1900-01-01"} max={period === "month" ? "2100-12" : "2100-12-31"} required value={period === "month" ? date.slice(0, 7) : date} onChange={event => setDate(period === "month" && event.target.value ? `${event.target.value}-01` : event.target.value)} /></label>}
    {period === "custom" && <><label className="flex flex-col gap-1.5 text-xs text-slate-500"><span>Từ ngày</span><Input aria-label="Từ ngày" type="date" min="1900-01-01" max="2100-12-30" required value={start} onChange={event => setStart(event.target.value)} /></label><label className="flex flex-col gap-1.5 text-xs text-slate-500"><span>Đến hết ngày</span><Input aria-label="Đến hết ngày" type="date" min={start || "1900-01-01"} max="2100-12-30" required value={end} onChange={event => setEnd(event.target.value)} /></label></>}
    <label className="flex min-w-36 flex-col gap-1.5 text-xs text-slate-500"><span>Nhóm biểu đồ</span><Select value={group} onValueChange={value => setGroup(value as typeof group)}><SelectTrigger aria-label="Nhóm biểu đồ"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Tự động</SelectItem><SelectItem value="day">Theo ngày</SelectItem><SelectItem value="week">Theo tuần</SelectItem><SelectItem value="month">Theo tháng</SelectItem></SelectContent></Select></label>
    <Button type="submit">Áp dụng</Button>
    {period === params.period && ["week", "month", "quarter"].includes(period) && <div className="ml-auto flex gap-1"><Button type="button" aria-label="Kỳ trước" variant="outline" size="icon" className="h-10 w-10" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button><Button type="button" variant="outline" onClick={() => {const next = {...params, date: todayVN()}; setDate(next.date); onChange(next);}}>Kỳ hiện tại</Button><Button type="button" aria-label="Kỳ sau" variant="outline" size="icon" className="h-10 w-10" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button></div>}
  </form>;
}

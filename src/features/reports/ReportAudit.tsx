"use client";
import { SelectField } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiError } from "@/features/bookings/booking-ui";
import { useGetReportAuditQuery } from "@/services/reportApi";
import type { ReportParams, ReportSummary } from "@/types/Report";
import { currency, displayTime } from "./report-utils";

export default function ReportAudit({ params, summary }: { params: ReportParams; summary?: ReportSummary }) {
  const [kind, setKind] = useState("missing_earning");
  const [page, setPage] = useState(1);
  const query = useGetReportAuditQuery({ ...params, kind, page, page_size: 5 }, { refetchOnMountOrArgChange: true });
  return <div className="space-y-3">
    <Card><CardHeader className="p-4 pb-2"><CardTitle>Các khoản cần đối soát</CardTitle></CardHeader><CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">{[
      ["Hoa hồng tiền mặt chưa thu · Trong kỳ", summary ? currency(summary.cash_commission_owed_in_period) : "—"],
      ["Hoa hồng tiền mặt chưa thu · Hiện tại", summary ? currency(summary.cash_commission_owed_current) : "—"],
      ["Buổi trong kỳ thiếu sổ thu nhập", summary?.missing_earning_sessions ?? "—"],
      ["Buổi thiếu giờ kết thúc · Toàn hệ thống", summary?.completed_sessions_missing_actual_end ?? "—"],
      ["Hoa hồng trên đơn hoàn tiền · Trong kỳ", summary ? currency(summary.commission_on_refunded_bookings) : "—"],
    ].map(([label,value])=><p key={label} className="flex justify-between gap-4 text-xs text-slate-500"><span>{label}</span><b className="font-medium tabular-nums text-slate-900">{value}</b></p>)}<p className="text-xs text-amber-700 sm:col-span-2">Buổi thiếu sổ thu nhập chưa cộng vào doanh thu. Hoa hồng trên đơn hoàn tiền cần kiểm tra khoản điều chỉnh.</p></CardContent></Card>
    <Card><CardHeader className="flex-wrap gap-3 p-4 sm:flex-row sm:justify-between"><CardTitle>Buổi dịch vụ cần kiểm tra</CardTitle><SelectField label="Loại đối soát" className="sm:w-72" value={kind} onValueChange={(value) => { setKind(value as typeof kind); setPage(1); }} options={[{ value: "missing_earning", label: "Thiếu sổ thu nhập · Trong kỳ" }, { value: "missing_end", label: "Thiếu giờ kết thúc · Toàn hệ thống" }]} /></CardHeader>
      {query.isError?<div role="alert" className="p-6 text-sm text-rose-600">{apiError(query.error)} <Button variant="outline" onClick={()=>query.refetch()}>Thử lại</Button></div>:!query.currentData?<Skeleton className="m-4 h-48"/>:<div aria-busy={query.isFetching}><Table><TableHeader><TableRow><TableHead className="pl-4">Đơn dịch vụ</TableHead><TableHead>Buổi</TableHead><TableHead>Lịch thực hiện</TableHead><TableHead>Vấn đề</TableHead></TableRow></TableHeader><TableBody>{query.currentData.results.length?query.currentData.results.map(row=><TableRow key={row.schedule_id}><TableCell className="pl-4"><Link href={`/bookings/${row.booking_id}`} className="whitespace-nowrap font-medium text-blue-600 hover:underline">{row.booking_code}</Link></TableCell><TableCell>{row.sequence_no}</TableCell><TableCell>{displayTime(row.scheduled_start)}</TableCell><TableCell className="text-amber-700">{row.issue}</TableCell></TableRow>):<TableRow><TableCell colSpan={4} className="py-10 text-center text-slate-400">Không có buổi cần kiểm tra.</TableCell></TableRow>}</TableBody></Table><div className="flex items-center justify-between gap-3 border-t border-slate-100 p-3 text-xs text-slate-500"><span>{query.currentData.count} kết quả · Trang {query.currentData.page}/{Math.max(1,query.currentData.total_pages)}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!query.currentData.has_previous||query.isFetching} onClick={()=>setPage(page-1)}>Trước</Button><Button size="sm" variant="outline" disabled={!query.currentData.has_next||query.isFetching} onClick={()=>setPage(page+1)}>Tiếp</Button></div></div></div>}
    </Card>
  </div>;
}

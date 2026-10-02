"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Banknote, ClipboardList, Download, Loader2, RefreshCw, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiError } from "@/features/bookings/booking-ui";
import { downloadReport, useGetReportOverviewQuery } from "@/services/reportApi";
import type { ReportParams } from "@/types/Report";
import ReportCharts from "./ReportCharts";
import ReportFilters from "./ReportFilters";
import { ReportDetails, WorkerRanking } from "./ReportTables";
import { count, currency, shiftDay } from "./report-utils";

function StatCard({ title, value, note, icon: Icon, tone }: {title: string; value: string; note: string; icon: LucideIcon; tone: "blue" | "indigo" | "teal" | "sky"}) {
  const style = {blue: "bg-blue-50 text-blue-600", indigo: "bg-indigo-50 text-indigo-600", teal: "bg-teal-50 text-teal-600", sky: "bg-sky-50 text-sky-600"}[tone];
  return <Card><CardContent className="p-3.5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-500">{title}</p><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style}`}><Icon className="h-4 w-4" /></span></div><p className="mt-1 break-words text-xl font-semibold tracking-tight text-slate-950 2xl:text-2xl">{value}</p><p className="mt-1 text-xs leading-4 text-slate-500">{note}</p></CardContent></Card>;
}
function LoadingStats() {return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Đang tải chỉ số">{[0,1,2,3].map(i => <Skeleton key={i} className="h-28" />)}</div>;}

export default function ReportsDashboard() {
  const [params, setParams] = useState<ReportParams>({period: "all", group_by: "auto"});
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const {currentData: data, isFetching, isError, error, refetch} = useGetReportOverviewQuery(params, {refetchOnMountOrArgChange: true, refetchOnFocus: true});
  const summary = data?.summary;
  const problems = !!summary && (summary.missing_earning_sessions > 0 || summary.completed_sessions_missing_actual_end > 0 || Number(summary.commission_on_refunded_bookings) > 0);
  const tableKey = `${JSON.stringify(params)}-${refreshKey}`;
  const exportFile = async () => {
    if (!data) return;
    setExporting(true);
    try {await downloadReport(params, `cleanwise-report-${data.period.start}-${shiftDay(data.period.end, -1)}.xlsx`); toast.success("Đã tải báo cáo Excel.");}
    catch (error) {toast.error(apiError(error));}
    finally {setExporting(false);}
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Tổng quan </h1><p className="mt-1 text-sm text-slate-500">Theo dõi doanh thu, đơn hàng và hiệu suất hoạt động của CleanWise.</p></div><div className="flex flex-wrap gap-2">{summary && !isError && <Button variant="outline" onClick={() => setAuditOpen(true)} className={problems ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100" : ""}>{problems && <AlertCircle className="h-4 w-4" />}Cảnh báo{summary.missing_earning_sessions > 0 && <Badge variant="outline" className="border-amber-200 text-amber-800">{summary.missing_earning_sessions}</Badge>}</Button>}<Button variant="outline" disabled={isFetching} onClick={() => {refetch(); setRefreshKey(key => key + 1);}}><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Làm mới</span></Button><Button disabled={!data || isFetching || exporting || isError} onClick={exportFile}>{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Xuất Excel</Button></div></div>
    {data && summary && !isError ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-busy={isFetching}>
        <StatCard title="Tổng số đơn" value={count(summary.total_orders)} note={`${count(summary.orders_today)} đơn mới hôm nay`} icon={ClipboardList} tone="blue" />
        <StatCard title="Tổng giá trị đơn hàng" value={currency(summary.total_order_value)} note={`Đơn hủy / thất bại: ${currency(summary.cancelled_failed_order_value)}`} icon={Banknote} tone="indigo" />
        <StatCard title="Doanh thu CleanWise" value={currency(summary.cleanwise_revenue)} note="Hoa hồng đã ghi sổ trong kỳ" icon={Wallet} tone="teal" />
        <StatCard title="Nhân viên hoạt động" value={count(summary.active_workers_current)} note="Hiện tại · Hồ sơ được duyệt" icon={UsersRound} tone="sky" />
      </div> : !isError ? <LoadingStats /> : null}
    <ReportCharts data={isError ? undefined : data} fetching={isFetching}
      filters={<ReportFilters params={params} onChange={next => {setParams(next); setAuditOpen(false);}} />}
      errorContent={isError ? <div role="alert" className="py-12 text-center"><AlertCircle className="mx-auto h-8 w-8 text-rose-400" /><p className="mt-3 font-medium text-slate-700">Không tải được báo cáo</p><p className="mt-1 text-sm text-slate-500">{apiError(error)}</p><Button variant="outline" className="mt-4" onClick={() => refetch()}>Thử lại</Button></div> : undefined}
    />
    {data && summary && !isError && <>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs"><span className="text-slate-500">Trạng thái đơn trong kỳ</span><span className="text-blue-700">Đang xử lý <b className="ml-1">{count(summary.processing_orders)}</b></span><span className="text-emerald-700">Hoàn thành <b className="ml-1">{count(summary.order_statuses.COMPLETED ?? 0)}</b></span><span className="text-rose-600">Hủy / Thất bại <b className="ml-1">{count((summary.order_statuses.CANCELLED ?? 0) + (summary.order_statuses.FAILED ?? 0))}</b></span><span className="ml-auto text-slate-500">{count(summary.completed_sessions)} buổi hoàn thành</span></div>
      <WorkerRanking key={`workers-${tableKey}`} params={params} />
      <ReportDetails key={`details-${tableKey}`} params={params} />
      <p className="text-xs leading-5 text-slate-400">Doanh thu là hoa hồng đã ghi sổ, chưa trừ điều chỉnh hoàn tiền. Nhân viên hoạt động và tổng hoa hồng tiền mặt chưa thu là số liệu hiện tại.</p>
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}><DialogContent><DialogHeader><DialogTitle>Cảnh báo số liệu</DialogTitle><DialogDescription>Kiểm tra các khoản cần bổ sung hoặc điều chỉnh trước khi dùng báo cáo.</DialogDescription></DialogHeader><div className="space-y-3 text-sm">
        <div className="flex justify-between gap-4"><span>Hoa hồng tiền mặt chưa thu · Trong kỳ</span><b>{currency(summary.cash_commission_owed_in_period)}</b></div>
        <div className="flex justify-between gap-4"><span>Buổi trong kỳ thiếu sổ thu nhập</span><Badge variant="outline">{summary.missing_earning_sessions}</Badge></div>
        <div className="flex justify-between gap-4"><span>Buổi thiếu giờ kết thúc · Toàn hệ thống</span><Badge variant="outline">{summary.completed_sessions_missing_actual_end}</Badge></div>
        <div className="flex justify-between gap-4"><span>Hoa hồng trên đơn đã hoàn tiền trong kỳ</span><b>{currency(summary.commission_on_refunded_bookings)}</b></div>
        <div className="flex justify-between gap-4 border-t pt-3"><span>Hoa hồng tiền mặt chưa thu · Hiện tại</span><b>{currency(summary.cash_commission_owed_current)}</b></div>
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">Buổi thiếu sổ thu nhập chưa được cộng vào doanh thu. Hoa hồng trên đơn đã hoàn tiền vẫn nằm trong số đã ghi sổ, cần kiểm tra khoản điều chỉnh.</p>
        <Button asChild variant="outline"><Link href="/bookings">Mở danh sách đơn hàng</Link></Button>
      </div></DialogContent></Dialog>
    </>}
  </div>;
}

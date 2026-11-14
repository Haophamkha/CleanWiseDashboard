"use client";
import { SelectField } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowLeft, ArrowUpRight, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiError } from "@/features/bookings/booking-ui";
import { downloadReport, useGetMonthlyFavoritesQuery, useGetMonthlyVipQuery, useGetReportOverviewQuery } from "@/services/reportApi";
import type { ReportParams } from "@/types/Report";
import ReportCharts from "./ReportCharts";
import MonthlyFavorites from "./MonthlyFavorites";
import { BookingTable, RevenueTable, ServiceTable, WorkerRanking } from "./ReportTables";
import MonthlyVip from "./MonthlyVip";
import ReportAudit from "./ReportAudit";
import { count, currency, displayDate, shiftDay, shortNumber } from "./report-utils";
import { reportHref, reportModules, type ReportModule } from "./report-navigation";

export default function ReportsDashboard({ module = "overview", month }: { module?: ReportModule; month: string }) {
  const router = useRouter();
  const params: ReportParams = { period: "month", date: `${month}-01`, group_by: "week" };
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [detail, setDetail] = useState("bookings");
  const needsOverview = ["overview", "revenue", "services", "audit"].includes(module);
  const { currentData: data, isFetching, isError, error, refetch } = useGetReportOverviewQuery(params, { skip: !needsOverview, refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const monthly = { year: Number(month.slice(0, 4)), month: Number(month.slice(5)), min_bookings: 5 };
  const favorites = useGetMonthlyFavoritesQuery(monthly, { skip: module !== "overview" });
  const vip = useGetMonthlyVipQuery({ ...monthly, page: 1, page_size: 5 }, { skip: module !== "overview" });
  const summary = data?.summary;
  const label = reportModules.find(item => item.id === module)!.label;
  const href = (next: ReportModule) => reportHref(next, month);
  const title = module === "overview" ? "Tổng quan hoạt động" : module === "favorites" ? "Nhân viên được yêu thích" : module === "vip" ? "Khách hàng VIP" : module === "audit" ? "Đối soát số liệu" : `Thống kê ${label.toLowerCase()}`;
  const hasIssues = summary && (summary.missing_earning_sessions > 0 || Number(summary.cash_commission_owed_in_period) > 0 || summary.completed_sessions_missing_actual_end > 0 || Number(summary.commission_on_refunded_bookings) > 0);
  async function exportFile() {
    setExporting(true);
    try { await downloadReport(params, `cleanwise-report-${month}.xlsx`); toast.success("Đã tải báo cáo Excel."); }
    catch (error) { toast.error(apiError(error)); }
    finally { setExporting(false); }
  }
  function refresh() {
    if (needsOverview) void refetch();
    if (module === "overview") { void favorites.refetch(); void vip.refetch(); }
    setRefreshKey(key => key + 1);
  }
  const contentKey = `${month}-${refreshKey}`;
  return <div className="space-y-3">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1><p className="mt-1 text-xs text-slate-500">{module === "overview" ? "Các chỉ số chính và những việc cần chú ý trong kỳ." : "Báo cáo chuyên sâu · Cùng kỳ thống kê với trang Tổng quan."}</p></div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-xs text-slate-500"><span>Kỳ thống kê · Giờ Việt Nam</span><Input type="month" min="2000-01" max="2100-12" value={month} aria-label="Kỳ thống kê" onChange={event => { if (/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(event.target.value)) router.replace(reportHref(module, event.target.value)); }} className="h-9 w-44" /></label>
        {module !== "overview" && <Button asChild variant="outline" size="sm"><Link href={href("overview")}><ArrowLeft className="h-4 w-4" />Tổng quan</Link></Button>}
        <Button variant="outline" size="icon" aria-label="Làm mới báo cáo" onClick={refresh} disabled={isFetching}><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></Button>
        {needsOverview && <Button size="sm" variant="outline" onClick={exportFile} disabled={exporting || !data || isError}><Download className="h-4 w-4" />{exporting ? "Đang xuất…" : "Xuất Excel"}</Button>}
      </div>
    </header>
    <nav className="hidden flex-wrap gap-1 border-b border-slate-200 md:flex" aria-label="Các trang thống kê">{reportModules.map(item => <Link key={item.id} href={href(item.id)} aria-current={module === item.id ? "page" : undefined} className={`border-b-2 px-3 py-3 text-sm transition-colors ${module === item.id ? "border-blue-600 font-medium text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{item.label}</Link>)}</nav>
    <div className="md:hidden"><SelectField label="Trang thống kê" value={module} onValueChange={(value) => router.push(href(value as ReportModule))} options={reportModules.map((item) => ({ value: item.id, label: item.label }))} /></div>
    {needsOverview && isError ? <div role="alert" className="rounded-xl border border-rose-200 bg-white p-8 text-center"><AlertCircle className="mx-auto h-7 w-7 text-rose-400" /><p className="mt-2">Không tải được báo cáo</p><p className="my-2 text-sm text-slate-500">{apiError(error)}</p><Button variant="outline" onClick={() => refetch()}>Thử lại</Button></div> : <>
      {needsOverview && module !== "audit" && (summary ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy={isFetching}>{[
        { label: "Đơn dịch vụ", value: count(summary.total_orders), note: "Tạo trong kỳ báo cáo" },
        { label: "Giá trị hoàn thành", value: `${shortNumber(Number(summary.completed_service_value))} ₫`, note: "Giá trị buổi đã ghi sổ" },
        { label: "Doanh thu CleanWise", value: `${shortNumber(Number(summary.cleanwise_revenue))} ₫`, note: "Hoa hồng đã ghi sổ" },
        { label: "Nhân viên hoạt động", value: count(summary.active_workers_current), note: "Hiện tại · Hồ sơ được duyệt" },
      ].map(({ label, value, note }) => <Card key={label}><CardContent className="p-3.5"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 break-words text-xl font-semibold tracking-tight tabular-nums text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></CardContent></Card>)}</div> : <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>)}
      {module === "overview" && <>
        {hasIssues && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800"><span className="flex flex-wrap items-center gap-2"><AlertCircle className="h-4 w-4" />Cần đối soát · {count(summary!.missing_earning_sessions)} buổi thiếu sổ thu nhập · {currency(summary!.cash_commission_owed_in_period)} hoa hồng tiền mặt chưa thu</span><Link href={href("audit")} className="inline-flex items-center gap-1 font-medium underline underline-offset-4">Xem chi tiết<ArrowUpRight className="h-3 w-3" /></Link></div>}
        <div className="grid items-stretch gap-3 xl:grid-cols-[minmax(0,1fr)_220px]"><ReportCharts data={data} fetching={isFetching} compact /><Card><CardHeader className="p-4 pb-2"><CardTitle>Trạng thái đơn</CardTitle></CardHeader><CardContent className="space-y-3 p-4 pt-0"><p className="text-3xl font-semibold tabular-nums">{summary ? count(summary.total_orders) : "—"}</p><p className="text-xs text-slate-400">Tổng đơn trong kỳ</p>{summary && <><div className="flex h-2 gap-1 overflow-hidden rounded">{[{ n: summary.order_statuses.COMPLETED ?? 0, color: "bg-teal-500" }, { n: summary.processing_orders, color: "bg-blue-500" }, { n: (summary.order_statuses.CANCELLED ?? 0) + (summary.order_statuses.FAILED ?? 0), color: "bg-rose-400" }].map((x,i) => <span key={i} className={x.color} style={{ width: `${summary.total_orders ? x.n / summary.total_orders * 100 : 0}%` }} />)}</div>{[["Hoàn thành", summary.order_statuses.COMPLETED ?? 0],["Đang xử lý", summary.processing_orders],["Hủy / Thất bại", (summary.order_statuses.CANCELLED ?? 0)+(summary.order_statuses.FAILED ?? 0)]].map(([l,n]) => <p key={l} className="flex justify-between text-xs text-slate-500"><span>{l}</span><b className="font-medium text-slate-800">{count(Number(n))}</b></p>)}</>}<Link href={href("revenue")} className="inline-flex items-center gap-1 text-xs text-blue-600">Xem đơn trong kỳ<ArrowUpRight className="h-3 w-3" /></Link></CardContent></Card></div>
        <div className="grid gap-3 md:grid-cols-3">{[
          { module: "services" as const, title: "Dịch vụ dẫn đầu", value: data?.services.slice().sort((a,b)=>b.orders-a.orders)[0]?.name ?? (data ? "Chưa có dữ liệu" : "Đang tải…"), note: "Xem cơ cấu đơn và doanh thu" },
          { module: "favorites" as const, title: "Nhân viên yêu thích", value: favorites.currentData?.top_workers[0]?.name ?? (favorites.isError ? "Không tải được dữ liệu" : favorites.isFetching ? "Đang tải…" : "Chưa có lượt yêu thích"), note: "Xếp hạng theo tháng" },
          { module: "vip" as const, title: "Khách hàng VIP", value: vip.currentData ? `${count(vip.currentData.summary.customers)} khách đạt tiêu chí` : vip.isError ? "Không tải được dữ liệu" : "Đang tải…", note: vip.currentData ? `${count(vip.currentData.summary.unrewarded)} khách chưa nhận voucher` : "Xem khách thân thiết và tặng ưu đãi" },
        ].map(item => <Link key={item.module} href={href(item.module)} className="flex min-w-0 justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-blue-300"><div className="min-w-0"><p className="text-xs text-slate-400">{item.title}</p><p className="mt-1 truncate text-sm font-medium text-slate-800">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.note}</p></div><ArrowUpRight className="h-4 w-4 shrink-0 text-blue-500" /></Link>)}</div>
      </>}
      {module === "revenue" && <section className="rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap gap-2 p-4">{[["bookings", "Đơn dịch vụ"],["revenue", "Chi tiết doanh thu"],["chart", "Biểu đồ"]].map(([id,label]) => <Button key={id} size="sm" variant={detail===id?"default":"outline"} onClick={()=>setDetail(id)}>{label}</Button>)}</div>{detail==="chart"?<ReportCharts data={data} fetching={isFetching}/>:detail==="bookings"?<BookingTable key={contentKey} params={params}/>:<RevenueTable key={contentKey} params={params}/>}</section>}
      {module === "services" && <><div className="flex gap-2"><Button size="sm" variant={detail!=="table"?"default":"outline"} onClick={()=>setDetail("chart")}>Biểu đồ</Button><Button size="sm" variant={detail==="table"?"default":"outline"} onClick={()=>setDetail("table")}>Bảng chi tiết</Button></div>{detail==="table"?<Card><ServiceTable key={contentKey} params={params}/></Card>:<ReportCharts data={data} fetching={isFetching} view="services"/>}</>}
      {module === "workers" && <WorkerRanking key={contentKey} params={params}/>}
      {module === "favorites" && <MonthlyFavorites key={contentKey} selected={month} refreshKey={refreshKey}/>}
      {module === "vip" && <MonthlyVip key={contentKey} month={month}/>}
      {module === "audit" && <ReportAudit key={contentKey} params={params} summary={summary}/>}
    </>}
    <footer className="flex flex-wrap justify-between gap-2 text-xs text-slate-400"><span>{data && needsOverview ? `${displayDate(data.period.start)} – ${displayDate(shiftDay(data.period.end,-1))}` : `${month.slice(5)}/${month.slice(0,4)}`} · Giờ Việt Nam</span><span>Doanh thu = hoa hồng đã ghi sổ, chưa trừ điều chỉnh hoàn tiền.</span></footer>
  </div>;
}

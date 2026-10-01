"use client";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportOverview } from "@/types/Report";
import { count, currency, displayDate, shiftDay, shortNumber } from "./report-utils";

const palette = ["#2563eb", "#0d9488", "#818cf8", "#38bdf8", "#10b981", "#64748b"];
function EmptyChart() { return <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">Chưa có dữ liệu trong kỳ này</div>; }

export default function ReportCharts({ data, filters, fetching, errorContent }: { data?: ReportOverview; filters: ReactNode; fetching: boolean; errorContent?: ReactNode }) {
  const timeline = (data?.timeline ?? []).map(row => ({...row, label: displayDate(row.start), revenue: Number(row.cleanwise_revenue)}));
  const services = (data?.services ?? []).filter(row => row.orders > 0 || Number(row.cleanwise_revenue) > 0).map((row, index) => ({...row, revenue: Number(row.cleanwise_revenue), fill: palette[index % palette.length]}));
  const orderServices = services.filter(row => row.orders > 0);
  const hasTimeline = timeline.some(row => row.orders > 0 || row.revenue > 0);
  return <div className="space-y-5">
    <Card>
      <CardHeader className="gap-2 px-4 pb-3 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div><CardTitle>Doanh thu & số đơn theo thời gian</CardTitle><CardDescription className="mt-1">Hoa hồng theo ngày hoàn thành · Số đơn theo ngày tạo</CardDescription></div>
        <div className="flex shrink-0 gap-4 text-xs text-slate-500"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-blue-600" />Số đơn</span><span className="flex items-center gap-2"><i className="h-0.5 w-4 bg-teal-600" />Doanh thu CleanWise</span></div>
      </CardHeader>
      <CardContent className="px-4 pb-4" aria-busy={fetching}>
        {filters}
        <div className="my-3 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-2 text-xs text-slate-500" aria-live="polite">
          <span>Kỳ báo cáo áp dụng cho toàn trang · Giờ Việt Nam</span>
          <span>{fetching ? "Đang cập nhật…" : data ? `${displayDate(data.period.start)} – ${displayDate(shiftDay(data.period.end, -1))} · Theo ${data.period.group_by === "day" ? "ngày" : data.period.group_by === "week" ? "tuần" : "tháng"}` : ""}</span>
        </div>
        {errorContent ?? (!data ? <Skeleton className="h-[180px] w-full sm:h-[200px]" /> : hasTimeline ? <>
          <div className="mb-2 flex justify-between px-2 text-[11px] text-slate-400"><span>Số đơn</span><span>Hoa hồng (VNĐ)</span></div>
          <ChartContainer config={{orders: {label: "Số đơn", color: palette[0]}, revenue: {label: "Doanh thu CleanWise", color: palette[1]}}} className="h-[180px] w-full sm:h-[200px]">
            <ComposedChart data={timeline} accessibilityLayer margin={{top: 10, right: 8, left: 0, bottom: 0}}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={30} tickMargin={12} tickFormatter={value => data.period.group_by === "month" ? String(value).split("/").slice(1).join("/") : String(value).split("/").slice(0, 2).join("/")} />
              <YAxis yAxisId="orders" tickLine={false} axisLine={false} allowDecimals={false} width={40} tickFormatter={shortNumber} />
              <YAxis yAxisId="revenue" orientation="right" tickLine={false} axisLine={false} width={65} tickFormatter={shortNumber} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, key) => key === "revenue" ? currency(Number(value)) : `${value} đơn`} />} />
              <Bar yAxisId="orders" dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} maxBarSize={34} />
              <Line yAxisId="revenue" dataKey="revenue" type="linear" stroke="var(--color-revenue)" strokeWidth={2.5} dot={timeline.length <= 12 ? {r: 3, strokeWidth: 0} : false} activeDot={{r: 5}} />
            </ComposedChart>
          </ChartContainer>
        </> : <EmptyChart />)}
      </CardContent>
    </Card>

    {data && !errorContent && <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Cơ cấu đơn theo dịch vụ</CardTitle><CardDescription>Tỉ lệ trên tổng số đơn được tạo trong kỳ</CardDescription></CardHeader><CardContent>
        {orderServices.length ? <div className="grid items-center gap-3 sm:grid-cols-2">
          <div className="relative">
            <ChartContainer config={{orders: {label: "Số đơn", color: palette[0]}}} className="h-64 w-full"><PieChart accessibilityLayer>
              <Pie data={orderServices} dataKey="orders" nameKey="name" innerRadius="62%" outerRadius="85%" paddingAngle={orderServices.length > 1 ? 3 : 0} strokeWidth={0}>{orderServices.map(row => <Cell key={row.service_id} fill={row.fill} />)}</Pie>
              <ChartTooltip content={({active, payload}) => <ChartTooltipContent active={active} payload={payload.map(item => ({dataKey: String(item.dataKey), name: String(item.name ?? ""), value: Number(item.value ?? 0), color: item.color}))} label={payload?.[0]?.name} formatter={value => `${value} đơn`} />} />
            </PieChart></ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><b className="text-2xl tabular-nums text-slate-900">{count(data.summary.total_orders)}</b><span className="text-xs text-slate-400">Tổng số đơn</span></div>
          </div>
          <div className="max-h-64 space-y-4 overflow-y-auto pr-1">{orderServices.map(row => <div key={row.service_id} className="flex items-start gap-2 text-sm"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor: row.fill}} /><div className="min-w-0 flex-1"><p className="text-slate-700">{row.name}</p><p className="mt-0.5 text-xs text-slate-400">{count(row.orders)} đơn</p></div><b className="text-xs tabular-nums text-slate-600">{row.order_share_percent.toLocaleString("vi-VN")}%</b></div>)}</div>
        </div> : <EmptyChart />}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Doanh thu theo dịch vụ</CardTitle><CardDescription>Hoa hồng CleanWise từ các buổi đã ghi sổ</CardDescription></CardHeader><CardContent>
        {services.some(row => row.revenue > 0) ? <ChartContainer config={{revenue: {label: "Hoa hồng", color: palette[1]}}} className="w-full" style={{height: Math.max(256, services.length * 54)}}>
          <BarChart data={[...services].sort((a, b) => b.revenue - a.revenue)} layout="vertical" accessibilityLayer margin={{right: 20, left: 0, top: 10, bottom: 10}}>
            <CartesianGrid horizontal={false} strokeDasharray="4 4" />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={shortNumber} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={130} tickFormatter={value => String(value).length > 20 ? `${String(value).slice(0, 19)}…` : String(value)} />
            <ChartTooltip content={<ChartTooltipContent formatter={value => currency(Number(value))} />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} maxBarSize={24} />
          </BarChart>
        </ChartContainer> : <EmptyChart />}
        <p className="mt-3 text-right text-[11px] text-slate-400">Đơn vị: VNĐ</p>
      </CardContent></Card>
    </div>}
  </div>;
}

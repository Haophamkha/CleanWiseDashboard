"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Heart, RefreshCw, Trophy, UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiError } from "@/features/bookings/booking-ui";
import { useGetMonthlyFavoritesQuery } from "@/services/reportApi";
import { count } from "./report-utils";

export default function MonthlyFavorites({ refreshKey }: { refreshKey: number }) {
  const [selected, setSelected] = useState(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 7));
  const [year, month] = selected.split("-").map(Number);
  const { currentData: data, isFetching, isError, error, refetch } = useGetMonthlyFavoritesQuery(
    { year, month }, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true },
  );
  const previousRefresh = useRef(refreshKey);
  useEffect(() => {
    if (previousRefresh.current !== refreshKey) {
      previousRefresh.current = refreshKey;
      refetch();
    }
  }, [refreshKey, refetch]);
  const summary = data?.summary;
  const hasTrend = data?.timeline.some(row => row.favorites > 0);

  return (
    <Card aria-label="Thống kê nhân viên yêu thích theo tháng">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-rose-500" />Nhân viên được yêu thích theo tháng</CardTitle>
          <CardDescription className="mt-1.5">Mỗi khách được tính một lần cho mỗi nhân viên khi thêm yêu thích trong tháng, kể cả sau đó bỏ yêu thích.</CardDescription>
        </div>
        <div className="flex shrink-0 items-end gap-2">
          <label className="space-y-1 text-xs text-slate-500">
            <span>Tháng thống kê · Giờ Việt Nam</span>
            <Input type="month" aria-label="Tháng thống kê yêu thích" min="2000-01" max="2100-12" value={selected}
              onChange={event => {
                const value = event.target.value;
                if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= "2000-01" && value <= "2100-12") setSelected(value);
              }} className="w-48" />
          </label>
          <Button variant="outline" size="icon" aria-label="Làm mới thống kê yêu thích" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent aria-busy={isFetching}>
        {isError ? (
          <div role="alert" className="py-10 text-center">
            <AlertCircle className="mx-auto h-7 w-7 text-rose-400" />
            <p className="mt-2 font-medium text-slate-700">Không tải được thống kê yêu thích</p>
            <p className="mt-1 text-sm text-slate-500">{apiError(error)}</p>
            <Button variant="outline" className="mt-3" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : !data || !summary ? <Skeleton className="h-80 w-full" /> : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3" aria-live="polite">
              {[
                { label: "Lượt khách thêm yêu thích", value: summary.favorites, icon: Heart },
                { label: "Khách hàng tham gia", value: summary.customers, icon: UsersRound },
                { label: "Nhân viên được yêu thích", value: summary.workers, icon: Trophy },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3">
                  <p className="flex items-center justify-between gap-2 text-xs text-slate-500">{label}<Icon className="h-4 w-4 text-rose-400" /></p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{count(value)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Tháng {month}/{year}: <b className={summary.change > 0 ? "text-emerald-700" : summary.change < 0 ? "text-rose-600" : "text-slate-700"}>
                {summary.change > 0 ? "+" : ""}{count(summary.change)} lượt
                {summary.change_percent !== null ? ` (${summary.change_percent > 0 ? "+" : ""}${summary.change_percent.toLocaleString("vi-VN")}%)` : ""}
              </b> so với tháng trước ({count(summary.previous_month_favorites)} lượt).
            </p>
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="min-w-0">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">Xu hướng 12 tháng · Năm {year}</h3>
                {hasTrend ? (
                  <ChartContainer config={{ favorites: { label: "Lượt khách thêm yêu thích", color: "#f43f5e" } }} className="h-72 w-full">
                    <BarChart data={data.timeline.map(row => ({ ...row, label: `Tháng ${Number(row.month.slice(5, 7))}` }))} accessibilityLayer margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="4 4" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={value => String(value).replace("Tháng ", "T")} minTickGap={8} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent formatter={value => `${count(Number(value))} lượt`} />} />
                      <Bar dataKey="favorites" radius={[4, 4, 0, 0]} maxBarSize={32}>
                        {data.timeline.map(row => <Cell key={row.month} fill={Number(row.month.slice(5, 7)) === month ? "#e11d48" : "#fda4af"} />)}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : <p className="flex h-72 items-center justify-center text-sm text-slate-400">Chưa có lượt yêu thích trong năm {year}.</p>}
              </div>
              <div className="min-w-0">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Top 10 nhân viên · Tháng {month}/{year}</h3>
                {data.top_workers.length ? (
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">Xếp hạng nhân viên theo số khách thêm yêu thích trong tháng {month}/{year}</caption>
                      <thead className="sticky top-0 bg-white text-xs text-slate-500"><tr><th className="pb-3 pr-3 font-medium">Hạng</th><th className="pb-3 font-medium">Nhân viên</th><th className="pb-3 pl-3 text-right font-medium">Số khách</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.top_workers.map(worker => (
                          <tr key={worker.worker_id}>
                            <td className="py-3 pr-3 align-top"><span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${worker.rank <= 3 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"}`}>{worker.rank}</span></td>
                            <td className="py-3"><p className="font-medium text-slate-800">{worker.name}</p><p className="mt-0.5 text-xs text-slate-400">@{worker.username}</p>{!worker.active_current && <Badge variant="outline" className="mt-1">Hiện không hoạt động</Badge>}</td>
                            <td className="py-3 pl-3 text-right align-top font-semibold tabular-nums text-rose-600">{count(worker.favorite_count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="flex h-72 items-center justify-center text-sm text-slate-400">Chưa có lượt thêm yêu thích trong tháng này.</p>}
              </div>
            </div>
            {summary.legacy_entries > 0 && <p className="text-xs leading-5 text-amber-700">Một phần dữ liệu cũ được khôi phục từ danh sách yêu thích còn lưu; các lượt đã bỏ trước khi có thống kê có thể chưa được ghi nhận.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

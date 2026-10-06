"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Star, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetReportBookingsQuery,
  useGetReportRevenueQuery,
  useGetReportServicesQuery,
  useGetReportWorkersQuery,
} from "@/services/reportApi";
import type { ReportPage, ReportParams, WorkerSort } from "@/types/Report";
import { StatusBadge } from "@/features/bookings/booking-ui";
import { count, currency, displayTime } from "./report-utils";

type Column<T> = {
  label: string;
  className?: string;
  render: (row: T) => ReactNode;
};
function ReportTable<T>({
  data,
  columns,
  rowKey,
  fetching,
  error,
  retry,
  onPage,
}: {
  data?: ReportPage<T>;
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  fetching: boolean;
  error: boolean;
  retry: () => void;
  onPage: (page: number) => void;
}) {
  if (error)
    return (
      <div role="alert" className="py-10 text-center text-sm text-slate-500">
        Không tải được dữ liệu.
        <Button variant="outline" size="sm" className="ml-3" onClick={retry}>
          Thử lại
        </Button>
      </div>
    );
  if (!data)
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  return (
    <div aria-busy={fetching}>
      <Table className="min-w-[850px]">
        <TableHeader className="bg-slate-50">
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.label} className={col.className}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.results.length ? (
            data.results.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((col) => (
                  <TableCell key={col.label} className={col.className}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-slate-400"
              >
                Chưa có dữ liệu trong kỳ này
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span>
          {count(data.count)} kết quả · Trang {data.page}/
          {Math.max(1, data.total_pages)}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_previous || fetching}
            onClick={() => onPage(data.page - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_next || fetching}
            onClick={() => onPage(data.page + 1)}
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
const right = "text-right tabular-nums";

export function WorkerRanking({ params }: { params: ReportParams }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<WorkerSort>("orders");
  const query = useGetReportWorkersQuery(
    { ...params, page, page_size: 10, sort },
    { refetchOnMountOrArgChange: true },
  );
  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Xếp hạng nhân viên
          </CardTitle>
          <CardDescription className="mt-1">
            Đếm đơn có buổi hoàn thành · Điểm từ đánh giá hiển thị trong kỳ
          </CardDescription>
        </div>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as WorkerSort);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Xếp hạng theo" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="orders">Theo số đơn</SelectItem>
            <SelectItem value="sessions">Theo số buổi</SelectItem>
            <SelectItem value="rating">Theo điểm đánh giá</SelectItem>
            <SelectItem value="commission">Theo hoa hồng</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <ReportTable
          data={query.currentData}
          fetching={query.isFetching}
          error={query.isError}
          retry={query.refetch}
          onPage={setPage}
          rowKey={(row) => row.worker_id}
          columns={[
            {
              label: "Hạng",
              className: "pl-5",
              render: (row) => (
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-semibold ${row.rank <= 3 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {row.rank}
                </span>
              ),
            },
            {
              label: "Nhân viên",
              render: (row) => (
                <div>
                  <p className="font-medium text-slate-900">{row.name}</p>
                  <p className="text-xs text-slate-400">@{row.username}</p>
                </div>
              ),
            },
            {
              label: "Hiện tại",
              render: (row) => (
                <Badge
                  variant="outline"
                  className={
                    row.active_current
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "text-slate-400"
                  }
                >
                  {row.active_current ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              ),
            },
            {
              label: "Số đơn",
              className: right,
              render: (row) => count(row.completed_orders),
            },
            {
              label: "Số buổi",
              className: right,
              render: (row) => count(row.completed_sessions),
            },
            {
              label: "Đánh giá",
              render: (row) =>
                row.average_rating === null ? (
                  <span className="text-xs text-slate-400">Chưa có</span>
                ) : (
                  <div>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {row.average_rating.toLocaleString("vi-VN", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <p className="text-xs text-slate-400">
                      {count(row.review_count)} lượt
                    </p>
                  </div>
                ),
            },
            {
              label: "Hoa hồng CleanWise",
              className: `${right} pr-5`,
              render: (row) => currency(row.cleanwise_revenue),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function BookingTable({ params }: { params: ReportParams }) {
  const [page, setPage] = useState(1);
  const query = useGetReportBookingsQuery(
    { ...params, page, page_size: 10 },
    { refetchOnMountOrArgChange: true },
  );
  return (
    <ReportTable
      data={query.currentData}
      fetching={query.isFetching}
      error={query.isError}
      retry={query.refetch}
      onPage={setPage}
      rowKey={(row) => row.id}
      columns={[
        {
          label: "Đơn dịch vụ",
          className: "pl-5",
          render: (row) => (
            <div>
              <Link
                className="font-medium text-blue-600 hover:underline"
                href={`/bookings/${row.id}`}
              >
                {row.booking_code}
              </Link>
              <p className="mt-1 text-xs text-slate-400">
                {displayTime(row.created_at)}
              </p>
            </div>
          ),
        }, // ĐỔI
        { label: "Khách hàng", render: (row) => row.customer_name },
        {
          label: "Dịch vụ",
          render: (row) => (
            <span className="block max-w-52 truncate" title={row.service_name}>
              {row.service_name}
            </span>
          ),
        },
        {
          label: "Nhân viên",
          render: (row) => (
            <span
              className="block max-w-52 truncate"
              title={row.workers.map((w) => w.name).join(", ")}
            >
              {row.workers.map((w) => w.name).join(", ") || "Chưa phân công"}
            </span>
          ),
        },
        {
          label: "Trạng thái",
          render: (row) => (
            <StatusBadge status={row.status} label={row.status_label} />
          ),
        },
        {
          label: "Giá trị đơn",
          className: `${right} pr-5`,
          render: (row) => currency(row.total_amount),
        },
      ]}
    />
  );
}

function ServiceTable({ params }: { params: ReportParams }) {
  const [page, setPage] = useState(1);
  const query = useGetReportServicesQuery(
    { ...params, page, page_size: 10 },
    { refetchOnMountOrArgChange: true },
  );
  return (
    <ReportTable
      data={query.currentData}
      fetching={query.isFetching}
      error={query.isError}
      retry={query.refetch}
      onPage={setPage}
      rowKey={(row) => row.service_id}
      columns={[
        {
          label: "Dịch vụ",
          className: "pl-5",
          render: (row) => (
            <div>
              <p className="font-medium">{row.name}</p>
              <p className="text-xs text-slate-400">
                {row.code}
                {!row.active_current && " · Ngừng hoạt động"}
              </p>
            </div>
          ),
        },
        {
          label: "Số đơn",
          className: right,
          render: (row) => count(row.orders),
        },
        {
          label: "Tỉ lệ",
          className: right,
          render: (row) =>
            `${row.order_share_percent.toLocaleString("vi-VN")}%`,
        },
        {
          label: "Buổi hoàn thành",
          className: right,
          render: (row) => count(row.completed_sessions),
        },
        {
          label: "Hủy / Thất bại",
          className: right,
          render: (row) => `${row.cancelled_orders} / ${row.failed_orders}`,
        },
        {
          label: "Giá trị đơn",
          className: right,
          render: (row) => currency(row.order_value),
        },
        {
          label: "Hoa hồng CleanWise",
          className: `${right} pr-5`,
          render: (row) => currency(row.cleanwise_revenue),
        },
      ]}
    />
  );
}

function RevenueTable({ params }: { params: ReportParams }) {
  const [page, setPage] = useState(1);
  const query = useGetReportRevenueQuery(
    { ...params, page, page_size: 10 },
    { refetchOnMountOrArgChange: true },
  );
  return (
    <ReportTable
      data={query.currentData}
      fetching={query.isFetching}
      error={query.isError}
      retry={query.refetch}
      onPage={setPage}
      rowKey={(row) => row.id}
      columns={[
        {
          label: "Hoàn thành",
          className: "pl-5 whitespace-nowrap",
          render: (row) => displayTime(row.completed_at),
        },
        {
          label: "Đơn / Buổi",
          render: (row) => (
            <div>
              <Link
                className="font-medium text-blue-600 hover:underline"
                href={`/bookings/${row.booking_id}`}
              >
                {row.booking_code}
              </Link>
              <p className="text-xs text-slate-400">Buổi #{row.sequence_no}</p>
            </div>
          ),
        },
        {
          label: "Dịch vụ / Nhân viên",
          render: (row) => (
            <div>
              <p className="max-w-48 truncate" title={row.service_name}>
                {row.service_name}
              </p>
              <p className="text-xs text-slate-400">{row.worker_name}</p>
            </div>
          ),
        },
        {
          label: "Giá trị buổi",
          className: right,
          render: (row) => currency(row.gross_amount),
        },
        {
          label: "Hoa hồng",
          className: right,
          render: (row) => (
            <div>
              <p className="font-medium text-teal-700">
                {currency(row.commission_amount)}
              </p>
              <p className="text-xs text-slate-400">
                {(Number(row.commission_rate) * 100).toLocaleString("vi-VN")}%
              </p>
            </div>
          ),
        },
        {
          label: "Thanh toán",
          className: "pr-5",
          render: (row) => (
            <div>
              <Badge
                variant="outline"
                className={
                  row.cash_commission_owed
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }
              >
                {row.payment_method === "ONLINE"
                  ? "Online"
                  : row.cash_commission_owed
                    ? "Tiền mặt · Chưa thu"
                    : "Tiền mặt · Đã thu"}
              </Badge>
              {row.booking_payment_status === "REFUNDED" && (
                <p className="mt-1 text-xs text-rose-600">
                  Đơn đã hoàn tiền · Cần kiểm tra
                </p>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}

export function ReportDetails({ params }: { params: ReportParams }) {
  const [tab, setTab] = useState("bookings");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết báo cáo</CardTitle>
        <CardDescription>
          Tra cứu và kiểm tra các số liệu trong kỳ
        </CardDescription>
      </CardHeader>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto px-5 pb-4">
          <TabsList>
            <TabsTrigger value="bookings">Đơn dịch vụ gần đây</TabsTrigger>
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
            <TabsTrigger value="revenue">Chi tiết doanh thu</TabsTrigger>
          </TabsList>
        </div>
        {/* ĐỔI */}
        <TabsContent value="bookings" className="mt-0">
          <BookingTable params={params} />
        </TabsContent>
        <TabsContent value="services" className="mt-0">
          <ServiceTable params={params} />
        </TabsContent>
        <TabsContent value="revenue" className="mt-0">
          <RevenueTable params={params} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

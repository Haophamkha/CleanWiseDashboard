"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dateTime } from "@/features/bookings/booking-ui";
import { useDebounced } from "@/features/refunds/refund-utils";
import { useGetAdminPaymentsQuery } from "@/services/paymentApi";
import type { PaymentMethod, PaymentStatus } from "@/types/Payment";

const PAGE_SIZE = 20;

const money = (value: string | number) =>
  new Intl.NumberFormat("vi-VN").format(Number(value)) + " ₫";

const METHOD_OPTIONS = [
  ["CASH", "Tiền mặt"],
  ["BANK_TRANSFER", "Chuyển khoản"],
  ["MOMO", "MoMo"],
  ["VNPAY", "VNPay"],
  ["CARD", "Thẻ"],
  ["WALLET", "Ví CleanWise"],
] as const;

const TONE: Record<PaymentStatus, "emerald" | "amber" | "red" | "slate"> = {
  SUCCESS: "emerald",
  PENDING: "amber",
  FAILED: "red",
  CANCELLED: "slate",
  REFUNDED: "slate",
};

export function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);

  const dSearch = useDebounced(search);
  const { data, isFetching, isError, refetch } = useGetAdminPaymentsQuery({
    status: (status || undefined) as PaymentStatus | undefined,
    method: (method || undefined) as PaymentMethod | undefined,
    search: dSearch || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const hasFilters = Boolean(search || status || method);
  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setMethod("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Thanh toán
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Tiền khách trả cho từng đơn dịch vụ. Dùng để đối soát với cổng thanh
          toán. Giao dịch ví xem ở mục Giao dịch ví.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Tổng đã thu</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {data ? money(data.summary.success_total) : "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Chờ thanh toán</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {data?.summary.pending ?? "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Thất bại</p>
          <p className="mt-1 text-2xl font-semibold text-rose-600">
            {data?.summary.failed ?? "—"}
          </p>
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <Tabs
            value={status || "ALL"}
            onValueChange={(v) => {
              setStatus(v === "ALL" ? "" : v);
              setPage(1);
            }}
            className="overflow-x-auto"
          >
            <TabsList aria-label="Trạng thái thanh toán">
              <TabsTrigger value="ALL">Tất cả</TabsTrigger>
              <TabsTrigger value="SUCCESS">Thành công</TabsTrigger>
              <TabsTrigger value="PENDING">Chờ thanh toán</TabsTrigger>
              <TabsTrigger value="FAILED">Thất bại</TabsTrigger>
              <TabsTrigger value="CANCELLED">Đã hủy</TabsTrigger>
              <TabsTrigger value="REFUNDED">Đã hoàn</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex w-full items-center gap-2 xl:w-auto">
            <Select
              value={method || "ALL"}
              onValueChange={(v) => {
                setMethod(v === "ALL" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Phương thức" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Mọi phương thức</SelectItem>
                {METHOD_OPTIONS.map(([key, text]) => (
                  <SelectItem key={key} value={key}>
                    {text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 xl:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                aria-label="Tìm kiếm thanh toán"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Mã giao dịch, mã đơn, khách..."
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Tải lại"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RotateCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4" />
            Xóa lọc
          </Button>
        )}
      </Card>

      <Card className="overflow-hidden">
        <Table className="w-full min-w-[900px] text-sm">
          <TableHeader className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <TableRow>
              <TableHead className="px-4 py-3 font-medium">Thời gian</TableHead>
              <TableHead className="px-4 py-3 font-medium">
                Khách hàng
              </TableHead>
              <TableHead className="px-4 py-3 font-medium">Đơn</TableHead>
              <TableHead className="px-4 py-3 font-medium">
                Phương thức
              </TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">
                Số tiền
              </TableHead>
              <TableHead className="px-4 py-3 font-medium">
                Trạng thái
              </TableHead>
              <TableHead className="px-4 py-3 font-medium">
                Mã giao dịch
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {data?.results.map((p) => (
              <TableRow key={p.id} className="align-top hover:bg-slate-50/60">
                <TableCell className="whitespace-nowrap px-4 py-3 text-slate-600">
                  <p>{dateTime(p.created_at)}</p>
                  {p.paid_at && (
                    <p className="text-xs text-slate-400">
                      Trả: {dateTime(p.paid_at)}
                    </p>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 font-medium text-slate-900">
                  {p.customer_name}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Link
                    href={`/bookings/${p.booking}`}
                    className="text-blue-600 hover:underline"
                  >
                    {p.booking_code ?? `#${p.booking}`}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700">
                  {p.method_label}
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                  {money(p.amount)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StatusPill tone={TONE[p.status] ?? "slate"}>
                    {p.status_label}
                  </StatusPill>
                  {p.failure_reason && (
                    <p
                      className="mt-1 line-clamp-2 max-w-48 text-xs text-rose-600"
                      title={p.failure_reason}
                    >
                      {p.failure_reason}
                    </p>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-xs text-slate-500">
                  <p>{p.transaction_code ?? "—"}</p>
                  {p.order_code && <p>Order: {p.order_code}</p>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {isFetching && !data && (
          <p className="py-10 text-center text-sm text-slate-500">
            Đang tải thanh toán...
          </p>
        )}
        {isError && (
          <p className="py-10 text-center text-sm text-rose-600">
            Không tải được danh sách thanh toán.
            <Button
              variant="outline"
              size="sm"
              className="ml-3"
              onClick={() => refetch()}
            >
              Thử lại
            </Button>
          </p>
        )}
        {data && !data.results.length && (
          <p className="py-10 text-center text-sm text-slate-500">
            Không có thanh toán nào khớp bộ lọc.
          </p>
        )}
      </Card>

      {data && data.count > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {data.count} thanh toán • Trang {data.page}/{data.total_pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_next || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

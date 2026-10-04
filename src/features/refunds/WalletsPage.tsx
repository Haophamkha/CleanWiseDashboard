"use client";
import { StatusPill } from "@/components/ui/status-pill";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dateTime } from "@/features/bookings/booking-ui";
import { useGetWalletTransactionsQuery } from "@/services/walletApi";
import { AdjustWalletDialog } from "./AdjustWalletDialog";
import { ROLE_LABEL, useDebounced, vnd } from "./refund-utils";

const PAGE_SIZE = 20;

const TYPE_OPTIONS = [
  ["REFUND", "Hoàn tiền"],
  ["ADJUSTMENT", "Điều chỉnh"],
  ["PAYMENT", "Thanh toán dịch vụ"],
  ["EARNING", "Thu nhập từ đơn"],
  ["WITHDRAW", "Rút tiền"],
] as const;

export function WalletsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const dSearch = useDebounced(search);
  const { data, isFetching, isError, refetch } = useGetWalletTransactionsQuery({
    search: dSearch || undefined,
    type: type || undefined,
    direction: direction || undefined,
    status: status || undefined,
    role: role || undefined,
    source: source || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const filter = (setter: (value: string) => void) => (value: string) => {
    setter(value === "ALL" ? "" : value);
    setPage(1);
  };
  const hasFilters = Boolean(search || type || source || role || direction || status);
  const clearFilters = () => {
    setSearch(""); setType(""); setSource(""); setRole(""); setDirection(""); setStatus(""); setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Ví & hoàn tiền</h1>
          <p className="mt-1.5 text-sm text-slate-500">Theo dõi giao dịch và điều chỉnh ví khách hàng, nhân viên.</p>
        </div>
        <Button onClick={() => setAdjustOpen(true)} className="self-start"><Plus className="h-4 w-4" />Điều chỉnh ví</Button>
      </div>
      <Card className="space-y-4 p-4">
        <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <Tabs value={status || "ALL"} onValueChange={filter(setStatus)} className="hidden sm:block">
            <TabsList aria-label="Trạng thái giao dịch">
              <TabsTrigger value="ALL">Tất cả giao dịch</TabsTrigger>
              <TabsTrigger value="SUCCESS">Thành công</TabsTrigger>
              <TabsTrigger value="PENDING">Đang xử lý</TabsTrigger>
              <TabsTrigger value="FAILED">Thất bại</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="sm:hidden">
            <WalletFilter label="Trạng thái giao dịch" value={status} onChange={filter(setStatus)} allLabel="Tất cả giao dịch" options={[["SUCCESS", "Thành công"], ["PENDING", "Đang xử lý"], ["FAILED", "Thất bại"]]} />
          </div>
          <div className="flex w-full items-center gap-2 xl:w-auto">
            <div className="relative flex-1 xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input aria-label="Tìm kiếm giao dịch" className="pl-9" value={search} onChange={(event) => {setSearch(event.target.value); setPage(1);}} placeholder="Người dùng, mã đơn, ghi chú..." />
            </div>
            <Button variant="outline" size="icon" aria-label="Tải lại giao dịch" onClick={() => refetch()} disabled={isFetching}><RotateCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <WalletFilter label="Loại giao dịch" value={type} onChange={filter(setType)} allLabel="Mọi loại giao dịch" options={TYPE_OPTIONS} />
          <WalletFilter label="Nguồn giao dịch" value={source} onChange={filter(setSource)} allLabel="Mọi nguồn" options={[["system", "Hệ thống"], ["admin", "Quản trị viên"]]} />
          <WalletFilter label="Chủ ví" value={role} onChange={filter(setRole)} allLabel="Khách hàng và nhân viên" options={[["CUSTOMER", "Khách hàng"], ["WORKER", "Nhân viên"]]} />
          <WalletFilter label="Chiều giao dịch" value={direction} onChange={filter(setDirection)} allLabel="Mọi chiều giao dịch" options={[["CREDIT", "Cộng tiền"], ["DEBIT", "Trừ tiền"]]} />
        </div>
        {hasFilters && <Button variant="ghost" onClick={clearFilters}><X className="h-4 w-4" />Xóa lọc</Button>}
      </Card>

      <Card className="overflow-hidden">
        <Table className="w-full min-w-[960px] text-sm">
          <TableHeader className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <TableRow>
              <TableHead className="px-4 py-3 font-medium">Thời gian</TableHead>
              <TableHead className="px-4 py-3 font-medium">Chủ ví</TableHead>
              <TableHead className="px-4 py-3 font-medium">Giao dịch</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">Số tiền</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">Số dư sau</TableHead>
              <TableHead className="px-4 py-3 font-medium">Trạng thái</TableHead>
              <TableHead className="px-4 py-3 font-medium">Đơn</TableHead>
              <TableHead className="px-4 py-3 font-medium">Thực hiện bởi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {data?.results.map((t) => {
              const sign =
                t.direction === "CREDIT"
                  ? "+"
                  : t.direction === "DEBIT"
                    ? "−"
                    : "";
              const tone =
                t.direction === "CREDIT"
                  ? "text-emerald-600"
                  : t.direction === "DEBIT"
                    ? "text-rose-600"
                    : "text-slate-700";
              return (
                <TableRow key={t.id} className="align-top hover:bg-slate-50/60">
                  <TableCell className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {dateTime(t.created_at)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <p className="font-medium text-slate-900">{t.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {ROLE_LABEL[t.role] ?? t.role} • @{t.username}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-xs px-4 py-3">
                    <p className="text-slate-900">{t.type_display}</p>
                    {t.note && (
                      <p
                        className="line-clamp-2 text-xs text-slate-500"
                        title={t.note}
                      >
                        {t.note}
                      </p>
                    )}
                  </TableCell>
                  <TableCell
                    className={`whitespace-nowrap px-4 py-3 text-right font-medium ${tone}`}
                  >
                    {sign}
                    {vnd(t.amount)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                    {vnd(t.balance_after)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusPill tone={t.status === "SUCCESS" ? "emerald" : t.status === "PENDING" ? "amber" : "red"}>{t.status_display}</StatusPill>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {t.booking_id ? (
                      <Link
                        href={`/bookings/${t.booking_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {t.booking_code ?? `#${t.booking_id}`}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-600">
                    {t.created_by_name ?? "Hệ thống"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {isFetching && !data && (
          <p className="py-10 text-center text-sm text-slate-500">
            Đang tải giao dịch...
          </p>
        )}
        {isError && (
          <p className="py-10 text-center text-sm text-rose-600">
            Không tải được giao dịch.
            <Button variant="outline" size="sm" className="ml-3" onClick={() => refetch()}>Thử lại</Button>
          </p>
        )}
        {data && !data.results.length && (
          <p className="py-10 text-center text-sm text-slate-500">
            Không có giao dịch nào khớp bộ lọc.
          </p>
        )}
      </Card>

      {data && data.count > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {data.count} giao dịch • Trang {data.page}/{data.total_pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_previous || isFetching}
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

      <AdjustWalletDialog open={adjustOpen} onOpenChange={setAdjustOpen} />
    </div>
  );
}

function WalletFilter({ label, value, onChange, allLabel, options }: {
  label: string; value: string; onChange: (value: string) => void; allLabel: string;
  options: readonly (readonly [string, string])[];
}) {
  return <Select value={value || "ALL"} onValueChange={onChange}>
    <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="ALL">{allLabel}</SelectItem>
      {options.map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}
    </SelectContent>
  </Select>;
}

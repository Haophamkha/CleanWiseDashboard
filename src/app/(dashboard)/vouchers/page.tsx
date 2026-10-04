"use client";

import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VoucherFormModal from "@/components/vouchers/VoucherFormModal";
import { useGetVouchersQuery } from "@/services/voucherApi";
import type {
  Voucher,
  VoucherDiscountType,
  VoucherDistributionType,
  VoucherLifecycleStatus,
  VoucherListParams,
} from "@/types/Voucher";
import {
  CheckCircle2,
  Pencil,
  Plus,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ActiveFilter = "ALL" | "true" | "false";
type DiscountFilter = "ALL" | VoucherDiscountType;
type DistributionFilter = "ALL" | VoucherDistributionType;

const LIFECYCLE_BADGES: Record<
  VoucherLifecycleStatus,
  { label: string; tone: StatusTone }
> = {
  ACTIVE: { label: "Đang hoạt động", tone: "emerald" },
  UPCOMING: { label: "Sắp diễn ra", tone: "blue" },
  EXPIRED: { label: "Đã hết hạn", tone: "slate" },
  EXHAUSTED: { label: "Đã phát hết", tone: "amber" },
  DISABLED: { label: "Đã tắt", tone: "red" },
};

const DISTRIBUTION_LABELS: Record<VoucherDistributionType, string> = {
  PUBLIC: "Công khai",
  CODE_ONLY: "Nhận bằng mã",
  ASSIGNED: "Cấp riêng",
};

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));

const formatDiscount = (voucher: Voucher) =>
  voucher.discount_type === "PERCENT"
    ? `${Number(voucher.discount_value).toLocaleString("vi-VN")}%`
    : formatCurrency(voucher.discount_value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

export default function VouchersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
  const [discountFilter, setDiscountFilter] =
    useState<DiscountFilter>("ALL");
  const [distributionFilter, setDistributionFilter] =
    useState<DistributionFilter>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const params = useMemo<VoucherListParams>(
    () => ({
      search: search || undefined,
      is_active:
        activeFilter === "ALL" ? undefined : activeFilter === "true",
      discount_type:
        discountFilter === "ALL" ? undefined : discountFilter,
      distribution_type:
        distributionFilter === "ALL" ? undefined : distributionFilter,
    }),
    [activeFilter, discountFilter, distributionFilter, search],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useGetVouchersQuery(params);
  const vouchers = data?.data ?? [];
  const hasFilters =
    Boolean(searchInput) ||
    activeFilter !== "ALL" ||
    discountFilter !== "ALL" ||
    distributionFilter !== "ALL";

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    setEditingId(id);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="fixed right-5 top-5 z-[70] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800 shadow-lg">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <span className="flex-1">{successMessage}</span>
          <Button
            type="button"
            onClick={() => setSuccessMessage(null)}
            variant="ghost" size="icon" className="h-6 w-6"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Voucher
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Quản lý mã giảm giá, điều kiện áp dụng và thời gian hiệu lực.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="self-start"
        >
          <Plus className="h-4 w-4" />
          Thêm voucher
        </Button>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as ActiveFilter)}>
            <TabsList aria-label="Trạng thái voucher">
              <TabsTrigger value="ALL">Tất cả voucher</TabsTrigger>
              <TabsTrigger value="true">Đang bật</TabsTrigger>
              <TabsTrigger value="false">Đã tắt</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex w-full items-center gap-2 xl:w-auto">
            <div className="relative flex-1 xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input aria-label="Tìm kiếm voucher" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm mã hoặc tên voucher..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon" aria-label="Tải lại voucher" onClick={() => refetch()} disabled={isFetching}>
              <RotateCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={discountFilter} onValueChange={(value) => setDiscountFilter(value as DiscountFilter)}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Lọc loại giảm giá"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi loại giảm</SelectItem>
              <SelectItem value="PERCENT">Theo phần trăm</SelectItem>
              <SelectItem value="FIXED">Số tiền cố định</SelectItem>
            </SelectContent>
          </Select>
          <Select value={distributionFilter} onValueChange={(value) => setDistributionFilter(value as DistributionFilter)}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Lọc hình thức phát hành"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi hình thức</SelectItem>
              <SelectItem value="PUBLIC">Công khai</SelectItem>
              <SelectItem value="CODE_ONLY">Nhận bằng mã</SelectItem>
              <SelectItem value="ASSIGNED">Cấp riêng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[860px] table-fixed text-sm">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[19%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
              <col className="w-[13%]" />
              <col className="w-[9%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
            </colgroup>
            <TableHeader className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
              <TableRow>
                <TableHead className="px-3 py-4 font-medium">Mã voucher</TableHead>
                <TableHead className="px-3 py-4 font-medium">Tên chương trình</TableHead>
                <TableHead className="px-3 py-4 font-medium">Mức giảm</TableHead>
                <TableHead className="px-3 py-4 font-medium">Phát hành</TableHead>
                <TableHead className="px-3 py-4 font-medium">Hiệu lực</TableHead>
                <TableHead className="px-3 py-4 font-medium">Số lượng</TableHead>
                <TableHead className="px-3 py-4 font-medium">Trạng thái</TableHead>
                <TableHead className="px-3 py-4 text-right font-medium">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {(isLoading || (isFetching && vouchers.length === 0)) &&
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex} className="px-3 py-4">
                        <div className="h-4 rounded bg-slate-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={8} className="px-3 py-16 text-center">
                    <p className="text-sm font-medium text-red-600">
                      Không tải được danh sách voucher.
                    </p>
                    <Button
                      type="button"
                      onClick={() => refetch()}
                      variant="outline" className="mt-3"
                    >
                      <RotateCw className="h-4 w-4" />
                      Thử lại
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && vouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="px-3 py-16 text-center">
                    <p className="font-medium text-slate-600">
                      {hasFilters
                        ? "Không tìm thấy voucher phù hợp."
                        : "Chưa có voucher nào."}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {hasFilters
                        ? "Hãy thay đổi từ khóa hoặc bộ lọc."
                        : "Tạo voucher đầu tiên để bắt đầu chương trình ưu đãi."}
                    </p>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                vouchers.map((voucher) => {
                  const badge = LIFECYCLE_BADGES[voucher.lifecycle_status];
                  return (
                    <TableRow
                      key={voucher.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <TableCell className="overflow-hidden px-3 py-4">
                        <span className="block truncate rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                          {voucher.code}
                        </span>
                      </TableCell>
                      <TableCell className="overflow-hidden px-3 py-4">
                        <p className="truncate font-medium text-slate-900">
                          {voucher.name}
                        </p>
                        {voucher.description && (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {voucher.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <p className="font-semibold text-slate-900">
                          {formatDiscount(voucher)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Đơn từ {formatCurrency(voucher.min_order_amount)}
                        </p>
                      </TableCell>
                      <TableCell className="px-3 py-4 text-slate-600">
                        {DISTRIBUTION_LABELS[voucher.distribution_type]}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-4 text-xs text-slate-600">
                        <p>{formatDate(voucher.start_at)}</p>
                        <p className="mt-1 text-slate-400">
                          đến {formatDate(voucher.end_at)}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-4 text-slate-600">
                        <span className="font-medium text-slate-900">
                          {voucher.issued_count}
                        </span>
                        <span className="text-slate-400">
                          {voucher.issuance_limit === null
                            ? " / Không giới hạn"
                            : ` / ${voucher.issuance_limit}`}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <StatusPill tone={badge.tone}>{badge.label}</StatusPill>
                      </TableCell>
                      <TableCell className="px-3 py-4 text-right">
                        <Button
                          type="button"
                          onClick={() => openEdit(voucher.id)}
                          variant="outline" size="sm"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
        {isFetching && vouchers.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-2 text-right text-xs text-slate-400">
            Đang cập nhật danh sách...
          </div>
        )}
      </Card>

      {modalOpen && (
        <VoucherFormModal
          key={editingId === null ? "create" : `edit-${editingId}`}
          open
          editingId={editingId}
          onClose={() => setModalOpen(false)}
          onSaved={setSuccessMessage}
        />
      )}
    </div>
  );
}

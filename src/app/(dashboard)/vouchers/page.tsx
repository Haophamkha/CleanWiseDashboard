"use client";

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
  { label: string; className: string }
> = {
  ACTIVE: { label: "Đang hoạt động", className: "bg-emerald-100 text-emerald-700" },
  UPCOMING: { label: "Sắp diễn ra", className: "bg-blue-100 text-blue-700" },
  EXPIRED: { label: "Đã hết hạn", className: "bg-slate-100 text-slate-600" },
  EXHAUSTED: { label: "Đã phát hết", className: "bg-amber-100 text-amber-700" },
  DISABLED: { label: "Đã tắt", className: "bg-red-100 text-red-700" },
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

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setActiveFilter("ALL");
    setDiscountFilter("ALL");
    setDistributionFilter("ALL");
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="fixed right-5 top-5 z-[70] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800 shadow-lg">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <span className="flex-1">{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
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
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Plus className="h-4 w-4" />
          Thêm voucher
        </button>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative block w-full xl:max-w-md">
          <span className="sr-only">Tìm kiếm voucher</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Tìm theo mã hoặc tên voucher..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            value={activeFilter}
            onChange={(event) =>
              setActiveFilter(event.target.value as ActiveFilter)
            }
            aria-label="Lọc trạng thái hoạt động"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="true">Đang bật</option>
            <option value="false">Đã tắt</option>
          </select>

          <select
            value={discountFilter}
            onChange={(event) =>
              setDiscountFilter(event.target.value as DiscountFilter)
            }
            aria-label="Lọc loại giảm giá"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Mọi loại giảm</option>
            <option value="PERCENT">Theo phần trăm</option>
            <option value="FIXED">Số tiền cố định</option>
          </select>

          <select
            value={distributionFilter}
            onChange={(event) =>
              setDistributionFilter(event.target.value as DistributionFilter)
            }
            aria-label="Lọc hình thức phát hành"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Mọi hình thức</option>
            <option value="PUBLIC">Công khai</option>
            <option value="CODE_ONLY">Nhận bằng mã</option>
            <option value="ASSIGNED">Cấp riêng</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
            Xóa lọc
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] table-fixed text-sm">
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
            <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-4 font-medium">Mã voucher</th>
                <th className="px-3 py-4 font-medium">Tên chương trình</th>
                <th className="px-3 py-4 font-medium">Mức giảm</th>
                <th className="px-3 py-4 font-medium">Phát hành</th>
                <th className="px-3 py-4 font-medium">Hiệu lực</th>
                <th className="px-3 py-4 font-medium">Số lượng</th>
                <th className="px-3 py-4 font-medium">Trạng thái</th>
                <th className="px-3 py-4 text-right font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(isLoading || (isFetching && vouchers.length === 0)) &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-4">
                        <div className="h-4 rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={8} className="px-3 py-16 text-center">
                    <p className="text-sm font-medium text-red-600">
                      Không tải được danh sách voucher.
                    </p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      <RotateCw className="h-4 w-4" />
                      Thử lại
                    </button>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && vouchers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-16 text-center">
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
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                vouchers.map((voucher) => {
                  const badge = LIFECYCLE_BADGES[voucher.lifecycle_status];
                  return (
                    <tr
                      key={voucher.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="overflow-hidden px-3 py-4">
                        <span className="block truncate rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                          {voucher.code}
                        </span>
                      </td>
                      <td className="overflow-hidden px-3 py-4">
                        <p className="truncate font-medium text-slate-900">
                          {voucher.name}
                        </p>
                        {voucher.description && (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {voucher.description}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-semibold text-slate-900">
                          {formatDiscount(voucher)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Đơn từ {formatCurrency(voucher.min_order_amount)}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {DISTRIBUTION_LABELS[voucher.distribution_type]}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-600">
                        <p>{formatDate(voucher.start_at)}</p>
                        <p className="mt-1 text-slate-400">
                          đến {formatDate(voucher.end_at)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-slate-600">
                        <span className="font-medium text-slate-900">
                          {voucher.issued_count}
                        </span>
                        <span className="text-slate-400">
                          {voucher.issuance_limit === null
                            ? " / Không giới hạn"
                            : ` / ${voucher.issuance_limit}`}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(voucher.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {isFetching && vouchers.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-2 text-right text-xs text-slate-400">
            Đang cập nhật danh sách...
          </div>
        )}
      </div>

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

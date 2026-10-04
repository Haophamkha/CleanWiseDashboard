"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dateTime, selectClass } from "@/features/bookings/booking-ui";
import { useGetWalletTransactionsQuery } from "@/services/walletApi";
import { AdjustWalletDialog } from "./AdjustWalletDialog";
import { ROLE_LABEL, TX_STATUS_STYLE, useDebounced, vnd } from "./refund-utils";

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
  const { data, isFetching, isError } = useGetWalletTransactionsQuery({
    search: dSearch || undefined,
    type: type || undefined,
    direction: direction || undefined,
    status: status || undefined,
    role: role || undefined,
    source: source || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  // Đổi bộ lọc thì quay về trang 1.
  const filter =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-600">
          Mọi biến động ví khách hàng và nhân viên: hoàn tiền tự động, hoàn do
          khiếu nại, hoàn và điều chỉnh do admin. Hoàn tiền theo đơn thực hiện
          trong chi tiết đơn; hoàn do khiếu nại thực hiện lúc xử lý khiếu nại.
        </p>
        <Button onClick={() => setAdjustOpen(true)}>
          <Plus className="h-4 w-4" />
          Điều chỉnh ví
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Người dùng, mã đơn, ghi chú"
          />
        </div>
        <select
          className={selectClass}
          value={type}
          onChange={filter(setType)}
          aria-label="Loại giao dịch"
        >
          <option value="">Mọi loại</option>
          {TYPE_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={source}
          onChange={filter(setSource)}
          aria-label="Nguồn"
        >
          <option value="">Mọi nguồn</option>
          <option value="system">Hệ thống</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className={selectClass}
          value={role}
          onChange={filter(setRole)}
          aria-label="Chủ ví"
        >
          <option value="">Khách và nhân viên</option>
          <option value="CUSTOMER">Khách hàng</option>
          <option value="WORKER">Nhân viên</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select
            className={selectClass}
            value={direction}
            onChange={filter(setDirection)}
            aria-label="Chiều"
          >
            <option value="">Cộng/trừ</option>
            <option value="CREDIT">Cộng</option>
            <option value="DEBIT">Trừ</option>
          </select>
          <select
            className={selectClass}
            value={status}
            onChange={filter(setStatus)}
            aria-label="Trạng thái"
          >
            <option value="">Mọi trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="FAILED">Thất bại</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Thời gian</th>
              <th className="px-4 py-3 font-medium">Chủ ví</th>
              <th className="px-4 py-3 font-medium">Giao dịch</th>
              <th className="px-4 py-3 text-right font-medium">Số tiền</th>
              <th className="px-4 py-3 text-right font-medium">Số dư sau</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Đơn</th>
              <th className="px-4 py-3 font-medium">Thực hiện bởi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                <tr key={t.id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {dateTime(t.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{t.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {ROLE_LABEL[t.role] ?? t.role} • @{t.username}
                    </p>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="text-slate-900">{t.type_display}</p>
                    {t.note && (
                      <p
                        className="line-clamp-2 text-xs text-slate-500"
                        title={t.note}
                      >
                        {t.note}
                      </p>
                    )}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-medium ${tone}`}
                  >
                    {sign}
                    {vnd(t.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                    {vnd(t.balance_after)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TX_STATUS_STYLE[t.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {t.status_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.created_by_name ?? "Hệ thống"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {isFetching && !data && (
          <p className="py-10 text-center text-sm text-slate-500">
            Đang tải giao dịch...
          </p>
        )}
        {isError && (
          <p className="py-10 text-center text-sm text-rose-600">
            Không tải được giao dịch. Thử tải lại trang.
          </p>
        )}
        {data && !data.results.length && (
          <p className="py-10 text-center text-sm text-slate-500">
            Không có giao dịch nào khớp bộ lọc.
          </p>
        )}
      </div>

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

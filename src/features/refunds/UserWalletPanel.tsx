"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dateTime } from "@/features/bookings/booking-ui";
import {
  useGetUserWalletQuery,
  useGetWalletTransactionsQuery,
} from "@/services/walletApi";
import { vnd } from "./refund-utils";

const PAGE_SIZE = 10;

export function UserWalletPanel({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const wallet = useGetUserWalletQuery(userId, {
    refetchOnMountOrArgChange: true,
  });
  const { data, isFetching, isError, refetch } = useGetWalletTransactionsQuery(
    { user_id: userId, page, page_size: PAGE_SIZE },
    { refetchOnMountOrArgChange: true },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Số dư ví hiện tại
          </p>
          {wallet.isLoading ? (
            <Skeleton className="mt-1 h-7 w-32" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {vnd(wallet.data?.balance ?? 0)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Tải lại"
          onClick={() => {
            wallet.refetch();
            refetch();
          }}
          disabled={isFetching}
        >
          <RotateCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isError ? (
        <p className="py-6 text-center text-sm text-rose-600">
          Không tải được giao dịch.
          <Button
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Table className="w-full min-w-[640px] text-sm">
            <TableHeader className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <TableRow>
                <TableHead className="px-3 py-2.5 font-medium">
                  Thời gian
                </TableHead>
                <TableHead className="px-3 py-2.5 font-medium">
                  Giao dịch
                </TableHead>
                <TableHead className="px-3 py-2.5 text-right font-medium">
                  Số tiền
                </TableHead>
                <TableHead className="px-3 py-2.5 text-right font-medium">
                  Số dư sau
                </TableHead>
                <TableHead className="px-3 py-2.5 font-medium">
                  Trạng thái
                </TableHead>
                <TableHead className="px-3 py-2.5 font-medium">Đơn</TableHead>
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
                  <TableRow
                    key={t.id}
                    className="align-top hover:bg-slate-50/60"
                  >
                    <TableCell className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                      {dateTime(t.created_at)}
                    </TableCell>
                    <TableCell className="max-w-[220px] px-3 py-2.5">
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
                      className={`whitespace-nowrap px-3 py-2.5 text-right font-medium ${tone}`}
                    >
                      {sign}
                      {vnd(t.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-2.5 text-right text-slate-600">
                      {vnd(t.balance_after)}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <StatusPill
                        tone={
                          t.status === "SUCCESS"
                            ? "emerald"
                            : t.status === "PENDING"
                              ? "amber"
                              : "red"
                        }
                      >
                        {t.status_display}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {isFetching && !data && (
            <p className="py-8 text-center text-sm text-slate-500">
              Đang tải giao dịch...
            </p>
          )}
          {data && !data.results.length && (
            <p className="py-8 text-center text-sm text-slate-500">
              Chưa có giao dịch nào.
            </p>
          )}
        </div>
      )}

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
    </div>
  );
}

"use client";

import { Suspense, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ClipboardList,
  LockKeyhole,
  RefreshCw,
  Search,
  UserRound,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetAdminNotificationSummaryQuery } from "@/services/notificationApi";
import WorkerDetailModal from "@/components/workers/WorkerDetailModal";
import { workerName, WorkerStatusBadge } from "@/components/workers/worker-ui";
import {
  useGetWorkerProfilesQuery,
  type WorkerListFilter,
} from "@/services/workerApi";
import type { WorkerProfile } from "@/types/Worker";

const FILTERS: { value: WorkerListFilter; label: string }[] = [
  { value: "ACTIVE", label: "Đang làm việc" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "SUSPENDED", label: "Tạm khóa" },
  { value: "REJECTED", label: "Đã từ chối" },
  { value: "DRAFT", label: "Chưa hoàn tất" },
];

function WorkersTableSkeleton() {
  return (
    <Table className="table-fixed">
      <TableHeader className="bg-slate-50/80">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[24%]">Nhân viên</TableHead>
          <TableHead className="w-[18%]">Liên hệ</TableHead>
          <TableHead className="w-[20%]">Dịch vụ</TableHead>
          <TableHead className="w-[14%]">Trạng thái</TableHead>
          <TableHead className="w-[12%]">Hồ sơ</TableHead>
          <TableHead className="w-[12%] text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index} className="hover:bg-transparent">
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-24 rounded-full" />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton className="h-1.5 w-16 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="ml-auto h-8 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function WorkersPage() {
  return (
    <Suspense>
      <WorkersContent />
    </Suspense>
  );
}
function WorkersContent() {
  const params = useSearchParams();
  const router = useRouter();
  const requested = params.get("status");
  const initialFilter: WorkerListFilter =
    FILTERS.find((item) => item.value === requested)?.value ?? "ACTIVE";
  const filter = initialFilter;
  const setFilter = (value: WorkerListFilter) => {
    const next = new URLSearchParams(params.toString());
    next.set("status", value);
    next.delete("worker");
    router.replace(`/workers?${next}`, { scroll: false });
  };
  const { data: summary } = useGetAdminNotificationSummaryQuery();
  const [search, setSearch] = useState("");
  const [detailWorker, setDetailWorker] = useState<WorkerProfile | null>(null);
  const {
    currentData: workers,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetWorkerProfilesQuery(filter);
  const {
    data: allWorkers,
    isLoading: statsLoading,
    isError: statsError,
    isFetching: statsFetching,
    refetch: refetchAll,
  } = useGetWorkerProfilesQuery("ALL");
  const linkedWorkerId = Number(params.get("worker"));
  const shownWorker =
    allWorkers?.find(
      (worker) => worker.id === (detailWorker?.id ?? linkedWorkerId),
    ) ??
    detailWorker ??
    null;
  const showSkeleton = isLoading || (isFetching && !workers);
  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    if (!query) return workers ?? [];
    return (workers ?? []).filter((worker) =>
      [
        workerName(worker),
        worker.username,
        worker.email,
        worker.phone_number ?? "",
        worker.registered_service?.name ?? "",
      ].some((value) => value.toLocaleLowerCase("vi").includes(query)),
    );
  }, [search, workers]);

  const statistics = [
    {
      label: "Tổng nhân viên",
      value: allWorkers?.length ?? 0,
      detail: "Toàn bộ hồ sơ nhân viên",
      icon: UsersRound,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Chờ duyệt",
      value:
        allWorkers?.filter((worker) => worker.status === "PENDING").length ?? 0,
      detail: "Hồ sơ cần được kiểm tra",
      icon: ClipboardList,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Đang làm việc",
      value:
        allWorkers?.filter((worker) => worker.status === "ACTIVE").length ?? 0,
      detail: "Nhân viên đã được phê duyệt",
      icon: UserRoundCheck,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Tạm khóa",
      value:
        allWorkers?.filter((worker) => worker.status === "SUSPENDED").length ??
        0,
      detail: "Hồ sơ tạm ngừng hoạt động",
      icon: LockKeyhole,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Nhân viên</h1>
          <p className="mt-1 text-sm text-slate-500">
            Duyệt hồ sơ, theo dõi năng lực và quản lý trạng thái làm việc.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => (
          <StatCard
            key={statistic.label}
            {...statistic}
            value={statsError ? "—" : statistic.value}
            loading={statsLoading}
          />
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as WorkerListFilter)}
              className="hidden xl:block"
            >
              <TabsList>
                {FILTERS.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                    {item.value === "PENDING" &&
                      !!summary?.pending_profiles && (
                        <span className="ml-2 rounded-full bg-amber-100 px-1.5 text-xs text-amber-800">
                          {summary.pending_profiles}
                        </span>
                      )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="xl:hidden">
              <Select
                value={filter}
                onValueChange={(value) => setFilter(value as WorkerListFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTERS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-full items-center gap-3 xl:w-auto">
              <div className="relative min-w-0 flex-1 xl:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  aria-label="Tìm nhân viên"
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên, SĐT, email, dịch vụ..."
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 cursor-pointer transition-all hover:shadow-sm active:scale-[0.97]"
                disabled={isFetching || statsFetching}
                aria-label="Làm mới danh sách nhân viên"
                onClick={() => {
                  void refetch();
                  void refetchAll();
                }}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching || statsFetching ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {showSkeleton ? (
          <WorkersTableSkeleton />
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-red-600">
              Không tải được danh sách nhân viên.
            </p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : !filteredWorkers.length ? (
          <div className="py-16 text-center">
            <UserRound className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Không có nhân viên phù hợp
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Thử thay đổi trạng thái hoặc từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[24%]">Nhân viên</TableHead>
                <TableHead className="w-[18%]">Liên hệ</TableHead>
                <TableHead className="w-[20%]">Dịch vụ</TableHead>
                <TableHead className="w-[14%]">Trạng thái</TableHead>
                <TableHead className="w-[12%]">Hồ sơ</TableHead>
                <TableHead className="w-[12%] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {worker.first_name?.[0] ?? worker.username[0]}
                        {worker.last_name?.[0] ?? ""}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setDetailWorker(worker)}
                          className="block max-w-full truncate text-left font-medium text-slate-900 hover:text-blue-600 hover:underline"
                        >
                          {workerName(worker)}
                        </button>
                        <p className="truncate text-xs text-slate-500">
                          @{worker.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="truncate text-sm">
                      {worker.phone_number || "Chưa cập nhật"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {worker.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {worker.registered_service?.name || "Chưa đăng ký"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <WorkerStatusBadge status={worker.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${worker.completion_percent}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-slate-500">
                        {worker.completion_percent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDetailWorker(worker)}
                    >
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {isFetching && workers && (
          <div className="border-t border-slate-100 px-4 py-2 text-right text-xs text-slate-400">
            Đang cập nhật dữ liệu...
          </div>
        )}
      </Card>

      <WorkerDetailModal
        key={shownWorker?.id ?? "closed"}
        worker={shownWorker}
        onClose={() => {
          setDetailWorker(null);
          if (params.has("worker")) {
            const next = new URLSearchParams(params.toString());
            next.delete("worker");
            router.replace(`/workers${next.size ? `?${next}` : ""}`);
          }
        }}
      />
    </div>
  );
}

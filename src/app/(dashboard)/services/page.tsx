"use client";
import { useState } from "react";
import { Pencil, Plus, RefreshCw, Search } from "lucide-react";
import ServiceThumbnail from "@/components/services/ServiceThumbnail";
import ServiceFormModal from "@/components/services/ServiceFormModal";
import ServiceStatusToggle from "@/components/services/ServiceStatusToggle";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetServiceDetailQuery,
  useGetServicesQuery,
} from "@/services/servicesApi";
import { apiError } from "@/features/bookings/booking-ui";

const groups: Record<string, string> = {
  HOME_CLEANING: "Dọn dẹp nhà",
  APPLIANCE_CLEANING: "Vệ sinh thiết bị",
  MOVING: "Chuyển nhà",
  UPHOLSTERY_CLEANING: "Sofa, nệm, rèm, thảm",
  CLEANING: "Dọn dẹp",
};
export default function ServicesPage() {
  const query = useGetServicesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const detail = useGetServiceDetailQuery(editingId ?? 0, {
    skip: !modalOpen || editingId === null,
    refetchOnMountOrArgChange: true,
  });
  const services = query.data?.data ?? [];
  const groupCodes = [
    ...new Set(services.map((service) => service.section_code)),
  ].sort();
  const filtered = services.filter(
    (service) =>
      (group === "all" || service.section_code === group) &&
      (status === "all" || service.is_active === (status === "active")) &&
      `${service.name} ${service.code}`
        .toLocaleLowerCase("vi")
        .includes(search.trim().toLocaleLowerCase("vi")),
  );
  const currentDetail =
    !detail.isFetching &&
    editingId !== null &&
    detail.currentData?.data.id === editingId
      ? detail.currentData.data
      : null;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Dịch vụ</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý thông tin, form đặt dịch vụ, bảng giá và trạng thái kinh
            doanh.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={query.isFetching}
            aria-label="Làm mới dịch vụ"
            onClick={() => query.refetch()}
          >
            <RefreshCw
              className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            onClick={() => {
              setEditingId(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Thêm dịch vụ
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">{services.length} dịch vụ</Badge>
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          {services.filter((service) => service.is_active).length} đang bật
        </Badge>
        <Badge variant="outline">
          {services.filter((service) => !service.is_active).length} đã tắt
        </Badge>
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">Tìm dịch vụ</span>
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Tìm tên hoặc mã dịch vụ…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-56" aria-label="Nhóm dịch vụ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhóm dịch vụ</SelectItem>
              {groupCodes.map((code) => (
                <SelectItem key={code} value={code}>
                  {groups[code] ?? code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40" aria-label="Trạng thái dịch vụ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang bật</SelectItem>
              <SelectItem value="inactive">Đã tắt</SelectItem>
            </SelectContent>
          </Select>
          {(search || group !== "all" || status !== "all") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setGroup("all");
                setStatus("all");
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </CardContent>
      </Card>
      <Card>
        {query.isError ? (
          <div role="alert" className="p-10 text-center text-sm text-slate-500">
            <p>{apiError(query.error)}</p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => query.refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <>
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="pl-5">Dịch vụ</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead className="w-52">Trạng thái</TableHead>
                  <TableHead className="pr-5 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading
                  ? Array.from({ length: 4 }, (_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }, (_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-12" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : filtered.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <ServiceThumbnail
                              icon={service.icon}
                              primaryImage={service.primary_image}
                              code={service.code}
                              sectionCode={service.section_code}
                              name={service.name}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {service.name}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {service.code}
                              </p>
                              <p
                                className="mt-1 max-w-96 truncate text-xs text-slate-400"
                                title={service.description}
                              >
                                {service.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {groups[service.section_code] ??
                              service.section_code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ServiceStatusToggle
                            id={service.id}
                            name={service.name}
                            isActive={service.is_active}
                          />
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Sửa ${service.name}`}
                            onClick={() => {
                              setEditingId(service.id);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                {!query.isLoading && !filtered.length && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-slate-400"
                    >
                      {services.length
                        ? "Không có dịch vụ phù hợp bộ lọc."
                        : "Chưa có dịch vụ."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="border-t px-5 py-3 text-xs text-slate-500">
              Hiển thị {filtered.length}/{services.length} dịch vụ · Tắt dịch vụ
              để ngừng nhận đơn mới.
            </div>
          </>
        )}
      </Card>
      {modalOpen && (
        <ServiceFormModal
          key={
            editingId === null
              ? "create"
              : currentDetail
                ? `edit-${currentDetail.id}`
                : `loading-${editingId}`
          }
          open
          onClose={() => setModalOpen(false)}
          editingService={currentDetail}
          isEditMode={editingId !== null}
          isLoadingDetail={
            editingId !== null && (!currentDetail || detail.isFetching)
          }
          detailError={
            editingId !== null && detail.isError
              ? apiError(detail.error)
              : undefined
          }
          onRetry={() => detail.refetch()}
        />
      )}
    </div>
  );
}

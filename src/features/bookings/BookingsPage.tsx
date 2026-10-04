"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, ClipboardEdit, ClipboardList, Copy, Eye, MoreHorizontal, RefreshCw, Search, UserRoundCheck, UserRoundX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCancelAdminBookingMutation, useGetAdminBookingsQuery, useGetBookingSummaryQuery } from "@/services/bookingApi";
import { useGetServicesQuery } from "@/services/servicesApi";
import { AdvancedBookingFilters } from "./AdvancedBookingFilters";
import type { AdminUser, BookingListItem, BookingListParams } from "@/types/Booking";
import { CreateBookingDialog } from "./CreateBookingDialog";
import { apiError, compactDateTime, money, PaymentBadge, StatusBadge } from "./booking-ui";

const statuses = ["", "PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "FAILED"];
const statusLabels: Record<string, string> = { "": "Tất cả", PENDING: "Chờ xử lý", ASSIGNED: "Đã phân công", IN_PROGRESS: "Đang thực hiện", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy", FAILED: "Thất bại" };

function BookingRowActions({ booking }: { booking: BookingListItem }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [cancelBooking, { isLoading }] = useCancelAdminBookingMutation();
  const canCancel = !["COMPLETED", "CANCELLED", "FAILED"].includes(booking.status);

  const cancel = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await cancelBooking({ id: booking.id, reason }).unwrap();
      toast.success(`Đã hủy đơn ${booking.booking_code}.`);
      setCancelOpen(false);
      setReason("");
    } catch (error) {
      toast.error(apiError(error));
    }
  };

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" aria-label={`Thao tác với ${booking.booking_code}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{booking.booking_code}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href={`/bookings/${booking.id}`}><Eye className="h-4 w-4" />Xem chi tiết</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`/bookings/${booking.id}#schedules`}><UserRoundCheck className="h-4 w-4" />Quản lý phân công</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`/bookings/${booking.id}#booking-info`}><ClipboardEdit className="h-4 w-4" />Sửa thông tin</Link></DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { navigator.clipboard.writeText(booking.booking_code); toast.success("Đã sao chép mã đơn."); }}><Copy className="h-4 w-4" />Sao chép mã đơn</DropdownMenuItem>
        {canCancel && <><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onSelect={() => setCancelOpen(true)}><X className="h-4 w-4" />Hủy đơn</DropdownMenuItem></>}
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
      <DialogContent><DialogHeader><DialogTitle>Hủy đơn {booking.booking_code}?</DialogTitle><DialogDescription>Các buổi còn hiệu lực sẽ bị hủy. Đơn đã thanh toán sẽ chuyển sang quy trình hoàn tiền.</DialogDescription></DialogHeader><form onSubmit={cancel} className="space-y-4"><label className="space-y-1.5 text-sm font-medium text-slate-700"><span>Lý do hủy <span className="text-red-500">*</span></span><Textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={3} placeholder="Nhập lý do hủy đơn..." /></label><DialogFooter><Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>Quay lại</Button><Button type="submit" variant="destructive" disabled={isLoading}>Xác nhận hủy</Button></DialogFooter></form></DialogContent>
    </Dialog>
  </>;
}

export function BookingsPage() {
  const [filters, setFilters] = useState<BookingListParams>({ page: 1, page_size: 20, ordering: "-created_at" });
  const [search, setSearch] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<AdminUser>();
  const { data, isLoading, isFetching, refetch } = useGetAdminBookingsQuery(filters);
  const { data: summary } = useGetBookingSummaryQuery();
  const { data: services } = useGetServicesQuery();
  const update = (key: keyof BookingListParams, value: unknown) => setFilters((current) => ({ ...current, [key]: value === "" || value == null ? undefined : value, page: 1 }));
  const resetFilters = () => { setSearch(""); setSelectedWorker(undefined); setFilters({ page: 1, page_size: 20, ordering: "-created_at" }); };
  const hasActiveFilters = Boolean(filters.search || filters.status || filters.payment_status || filters.service_id || filters.worker_id || filters.unassigned !== undefined || filters.created_from || filters.created_to || (filters.ordering ?? "-created_at") !== "-created_at");
  const cards = [
    { label: "Đơn hôm nay", value: summary?.today_total ?? 0, detail: "Đơn mới được tạo", icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
    { label: "Chờ xử lý", value: summary?.pending ?? 0, detail: "Cần được theo dõi", icon: CalendarClock, color: "bg-amber-50 text-amber-600" },
    { label: "Chưa phân công", value: summary?.unassigned_schedules ?? 0, detail: "Buổi cần nhân viên", icon: UserRoundX, color: "bg-rose-50 text-rose-600" },
    { label: "Đang thực hiện", value: summary?.in_progress ?? 0, detail: "Đơn đang hoạt động", icon: RefreshCw, color: "bg-violet-50 text-violet-600" },
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950">Đơn dịch vụ</h1><p className="mt-1 text-sm text-slate-500">Quản lý, phân công và theo dõi toàn bộ đơn dịch vụ.</p></div><CreateBookingDialog /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <StatCard key={card.label} {...card} />)}</div>

    <Card className="overflow-hidden shadow-none">
      <div className="border-b border-slate-200 bg-white px-5 pt-5">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">{statuses.map((status) => <button key={status} type="button" onClick={() => update("status", status)} className={`h-8 shrink-0 rounded-md px-3 text-sm font-medium transition-all ${(filters.status ?? "") === status ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{statusLabels[status]}</button>)}</div>
        <div className="grid gap-3 py-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_repeat(2,minmax(150px,1fr))_auto]">
          <form className="relative" onSubmit={(event) => { event.preventDefault(); update("search", search); }}><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã đơn, khách hàng..." /></form>
          <Select value={filters.service_id ? String(filters.service_id) : "all"} onValueChange={(value) => update("service_id", value === "all" ? undefined : Number(value))}><SelectTrigger><SelectValue placeholder="Dịch vụ" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả dịch vụ</SelectItem>{services?.data.map((service) => <SelectItem key={service.id} value={String(service.id)}>{service.name}</SelectItem>)}</SelectContent></Select>
          <Select value={filters.payment_status ?? "all"} onValueChange={(value) => update("payment_status", value === "all" ? undefined : value)}><SelectTrigger><SelectValue placeholder="Thanh toán" /></SelectTrigger><SelectContent><SelectItem value="all">Mọi thanh toán</SelectItem><SelectItem value="UNPAID">Chưa thanh toán</SelectItem><SelectItem value="PAID">Đã thanh toán</SelectItem><SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem></SelectContent></Select>
          <AdvancedBookingFilters filters={filters} worker={selectedWorker} onApply={(advanced, worker) => {
            setSelectedWorker(worker);
            setFilters((current) => ({ ...current, ...advanced, page: 1 }));
          }} />
        </div>
        {hasActiveFilters && <div className="flex items-center gap-2 pb-4 text-xs text-slate-500"><span>Đang áp dụng bộ lọc</span><Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={resetFilters}><X className="h-3.5 w-3.5" />Xóa tất cả</Button></div>}
      </div>

      <CardContent className="p-0">{isLoading ? <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-20" />)}</div> : <Table className="min-w-[1100px] table-fixed">
        <colgroup><col className="w-[16%]" /><col className="w-[13%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[13%]" /><col className="w-[10%]" /><col className="w-12" /></colgroup>
        <TableHeader className="bg-slate-50/80"><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Đơn hàng</TableHead><TableHead>Khách hàng</TableHead><TableHead>Dịch vụ</TableHead><TableHead>Lịch tiếp theo</TableHead><TableHead>Phân công</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Tổng tiền</TableHead><TableHead><span className="sr-only">Thao tác</span></TableHead></TableRow></TableHeader>
        <TableBody>{data?.results.map((booking) => <TableRow key={booking.id} className={`h-20 ${isFetching ? "opacity-70" : ""}`}>
          <TableCell className="min-w-0 pl-5 align-middle"><Link className="block truncate font-semibold text-blue-600 hover:text-blue-700 hover:underline" href={`/bookings/${booking.id}`} title={booking.booking_code}>{booking.booking_code}</Link><p className="mt-1 truncate text-xs text-slate-400">Tạo {compactDateTime(booking.created_at)}</p></TableCell>
          <TableCell className="min-w-0 align-middle"><p className="truncate font-medium text-slate-800" title={booking.customer.full_name}>{booking.customer.full_name}</p><p className="mt-1 hidden truncate text-xs text-slate-500 md:block">{booking.customer.phone_number || booking.customer.email}</p></TableCell>
          <TableCell className="min-w-0 align-middle"><p className="line-clamp-2 font-medium leading-5 text-slate-700" title={booking.service.name}>{booking.service.name}</p></TableCell>
          <TableCell className="align-middle"><p className="whitespace-nowrap font-medium text-slate-700">{compactDateTime(booking.next_schedule_start)}</p><p className="mt-1 text-xs text-slate-400">Buổi gần nhất</p></TableCell>
          <TableCell className="min-w-0 align-middle"><p className="font-medium text-slate-700">{booking.assigned_schedules}/{booking.total_schedules} buổi</p><p className="mt-1 truncate text-xs text-slate-500" title={booking.workers.map((worker) => worker.full_name).join(", ")}>{booking.workers.map((worker) => worker.full_name).join(", ") || "Chưa có nhân viên"}</p></TableCell>
          <TableCell className="align-middle"><div className="flex flex-col items-start gap-1.5"><StatusBadge status={booking.status} label={booking.status_label} /><PaymentBadge status={booking.payment_status} label={booking.payment_status_label} /></div></TableCell>
          <TableCell className="whitespace-nowrap text-right align-middle font-semibold tabular-nums text-slate-900">{money(booking.total_amount)}</TableCell>
          <TableCell className="pr-3 text-right align-middle"><BookingRowActions booking={booking} /></TableCell>
        </TableRow>)}{!data?.results.length && <TableRow><TableCell colSpan={8} className="h-40 text-center"><div className="mx-auto flex max-w-sm flex-col items-center"><ClipboardList className="mb-3 h-8 w-8 text-slate-300" /><p className="font-medium text-slate-700">Không tìm thấy đơn</p><p className="mt-1 text-sm text-slate-400">Thử thay đổi từ khóa hoặc bộ lọc đang áp dụng.</p>{hasActiveFilters && <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Xóa bộ lọc</Button>}</div></TableCell></TableRow>}</TableBody>
      </Table>}</CardContent>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 text-sm text-slate-500"><span>Hiển thị <b className="font-medium text-slate-700">{data?.results.length ?? 0}</b> trong <b className="font-medium text-slate-700">{data?.count ?? 0}</b> đơn</span><div className="flex items-center gap-3"><span className="hidden sm:inline">Trang {data?.page ?? 1}/{data?.total_pages ?? 1}</span><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => refetch()} aria-label="Làm mới"><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></Button><Button size="sm" variant="outline" disabled={!data?.has_previous} onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))}><ChevronLeft className="h-4 w-4" />Trước</Button><Button size="sm" variant="outline" disabled={!data?.has_next} onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}>Sau<ChevronRight className="h-4 w-4" /></Button></div></div>
    </Card>
  </div>;
}

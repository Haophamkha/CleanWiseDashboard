"use client";

import { useState } from "react";
import { Eye, RefreshCw, Search, Users, UserRoundCheck, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetUsersQuery, useUpdateCustomerStatusMutation } from "@/services/userApi";
import { apiError } from "@/features/bookings/booking-ui";
import type { User } from "@/types/User";

const customerName = (customer: User) => `${customer.first_name} ${customer.last_name}`.trim() || customer.username;
const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cung cấp";
const buttonFeedback = "cursor-pointer transition-all duration-150 hover:shadow-sm active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";
const statusFilters = [
  { value: "all", label: "Tất cả khách hàng" },
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Đã khóa" },
];

function CustomerStatus({ customer }: { customer: User }) {
  const [updateStatus, { isLoading }] = useUpdateCustomerStatusMutation();
  const changeStatus = async (active: boolean) => {
    try {
      await updateStatus({ id: customer.id, is_active: active }).unwrap();
      toast.success(active ? "Đã kích hoạt tài khoản khách hàng." : "Đã khóa tài khoản khách hàng.");
    } catch (error) { toast.error(apiError(error)); }
  };
  return <div className="inline-flex items-center" aria-busy={isLoading}>
    <Button
      type="button"
      role="switch"
      aria-checked={customer.is_active}
      aria-label={`Trạng thái tài khoản ${customerName(customer)}: ${customer.is_active ? "Đang hoạt động" : "Đã khóa"}`}
      disabled={isLoading}
      onClick={() => changeStatus(!customer.is_active)}
      className={`h-6 w-11 shrink-0 cursor-pointer rounded-full p-0 disabled:cursor-wait ${customer.is_active ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 hover:bg-slate-400"}`}
    >
      <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${customer.is_active ? "translate-x-2.5" : "-translate-x-2.5"}`} />
    </Button>
    <span className="sr-only" aria-live="polite">
      {isLoading ? "Đang cập nhật…" : customer.is_active ? "Đang hoạt động" : "Đã khóa"}
    </span>
  </div>;
}

export function CustomersPage() {
  const { data: users, isLoading, isFetching, isError, refetch } = useGetUsersQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<number>();
  const allCustomers = (users ?? []).filter((user) => user.role === "CUSTOMER");
  const search = searchTerm.trim().toLocaleLowerCase("vi-VN");
  const customers = allCustomers.filter((customer) => {
    const matchesSearch = [customerName(customer), customer.username, customer.email, customer.phone_number ?? "", String(customer.id)].some((value) => value.toLocaleLowerCase("vi-VN").includes(search));
    return matchesSearch && (status === "all" || customer.is_active === (status === "active"));
  });
  const statistics = [
    { label: "Tổng khách hàng", value: allCustomers.length, detail: "Tài khoản khách hàng", icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Đang hoạt động", value: allCustomers.filter((customer) => customer.is_active).length, detail: "Tài khoản được kích hoạt", icon: UserRoundCheck, color: "bg-emerald-50 text-emerald-600" },
    { label: "Đã khóa", value: allCustomers.filter((customer) => !customer.is_active).length, detail: "Tài khoản ngừng hoạt động", icon: UserRoundX, color: "bg-rose-50 text-rose-600" },
  ];

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-950">Khách hàng</h1><p className="mt-1 text-sm text-slate-500">Xem hồ sơ và quản lý trạng thái hoạt động của tài khoản khách hàng.</p></div></div>
    <div className="grid gap-4 sm:grid-cols-3">{statistics.map((statistic) => <StatCard key={statistic.label} {...statistic} value={isError ? "—" : statistic.value} loading={isLoading} />)}</div>
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <Tabs value={status} onValueChange={setStatus} className="hidden xl:block"><TabsList>{statusFilters.map((filter) => <TabsTrigger key={filter.value} value={filter.value}>{filter.label}</TabsTrigger>)}</TabsList></Tabs>
        <div className="xl:hidden"><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44 cursor-pointer" aria-label="Lọc trạng thái khách hàng"><SelectValue /></SelectTrigger><SelectContent>{statusFilters.map((filter) => <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="relative min-w-0 flex-1 basis-64 xl:ml-auto xl:max-w-80"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input aria-label="Tìm khách hàng" className="pl-9" placeholder="Tìm tên, email, SĐT hoặc mã..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div>
        <Button variant="outline" size="icon" className={buttonFeedback} disabled={isFetching} aria-label="Làm mới danh sách khách hàng" onClick={() => refetch()}><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></Button>
      </CardContent>
    </Card>
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {isLoading ? <div className="space-y-3 p-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-16" />)}</div> : isError ? <div className="py-16 text-center"><p className="text-sm text-red-600">Không tải được danh sách khách hàng.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Thử lại</Button></div> : <Table className="min-w-[1000px]">
          <TableHeader className="bg-slate-50/80"><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Khách hàng</TableHead><TableHead>Email</TableHead><TableHead>Số điện thoại</TableHead><TableHead className="w-52">Trạng thái</TableHead><TableHead>Ngày tham gia</TableHead><TableHead className="pr-5 text-right">Thao tác</TableHead></TableRow></TableHeader>
          <TableBody>
            {customers.map((customer) => <TableRow key={customer.id}>
              <TableCell className="pl-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">{customer.first_name?.[0] ?? customer.username[0]}{customer.last_name?.[0] ?? ""}</span><div className="min-w-0"><button type="button" onClick={() => setSelectedId(customer.id)} className="block max-w-full truncate text-left font-medium text-slate-900 hover:text-blue-600 hover:underline">{customerName(customer)}</button><p className="mt-0.5 text-xs text-slate-500">#{customer.id} · @{customer.username}</p></div></div></TableCell>
              <TableCell className="text-slate-600">{customer.email || "—"}</TableCell><TableCell className="whitespace-nowrap text-slate-600">{customer.phone_number || "—"}</TableCell>
              <TableCell><CustomerStatus customer={customer} /></TableCell><TableCell className="whitespace-nowrap text-slate-600">{dateLabel(customer.date_joined)}</TableCell>
              <TableCell className="pr-5 text-right"><Button type="button" variant="outline" size="sm" className={`${buttonFeedback} text-blue-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700`} onClick={() => setSelectedId(customer.id)} aria-label={`Xem chi tiết ${customerName(customer)}`}><Eye className="h-4 w-4" />Xem chi tiết</Button></TableCell>
            </TableRow>)}
            {!customers.length && <TableRow><TableCell colSpan={6} className="h-40 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="font-medium text-slate-700">Không tìm thấy khách hàng</p><p className="mt-1 text-sm text-slate-500">Thử thay đổi từ khóa hoặc trạng thái tài khoản.</p></TableCell></TableRow>}
          </TableBody>
        </Table>}
      </CardContent>
      <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">{isLoading ? "Đang tải danh sách khách hàng..." : isError ? "Danh sách khách hàng chưa tải được." : `Hiển thị ${customers.length} trong ${allCustomers.length} khách hàng`}</div>
    </Card>
    {selectedId !== undefined && <CustomerDetailModal id={selectedId} onClose={() => setSelectedId(undefined)} />}
  </div>;
}

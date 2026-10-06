"use client";

import Image from "next/image";
import { useState } from "react";
import {
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileInfoCard } from "@/components/ui/profile-info-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserWalletPanel } from "@/features/refunds/UserWalletPanel";
import { useGetCustomerDetailQuery } from "@/services/userApi";

const genderLabels = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };
const dateLabel = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cập nhật";

export function CustomerDetailModal({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("profile");
  const {
    data: customer,
    isLoading,
    isError,
    refetch,
  } = useGetCustomerDetailQuery(id);
  const name = customer
    ? `${customer.first_name} ${customer.last_name}`.trim() || customer.username
    : "";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="mb-0 shrink-0 border-b border-slate-200 px-6 pb-4 pt-6 pr-12">
          <DialogTitle>Chi tiết khách hàng</DialogTitle>
          <DialogDescription>
            Xem hồ sơ, thông tin liên hệ, trạng thái tài khoản và ví khách hàng.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 border-b border-slate-200 px-6 py-3">
            <TabsList>
              <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
              <TabsTrigger value="wallet">Ví</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="profile"
            className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5"
          >
            {isLoading ? (
              <div className="space-y-5">
                <Skeleton className="h-32 rounded-xl" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }, (_, index) => (
                    <Skeleton key={index} className="h-20 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : isError || !customer ? (
              <div className="py-6 text-center">
                <p className="text-sm text-red-600">
                  Không tải được thông tin khách hàng.
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => refetch()}
                >
                  Thử lại
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-semibold text-blue-700">
                    {customer.avatar ? (
                      <Image
                        src={customer.avatar}
                        alt={name}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <UserRound className="h-8 w-8" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-lg font-semibold text-slate-950">
                        {name}
                      </h3>
                      <StatusPill
                        tone={customer.is_active ? "emerald" : "orange"}
                      >
                        {customer.is_active ? "Hoạt động" : "Đã khóa"}
                      </StatusPill>
                    </div>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      @{customer.username}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">
                        Mã khách hàng: {customer.id}
                      </Badge>
                      <Badge variant="secondary">Tài khoản khách hàng</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <ProfileInfoCard
                    icon={Phone}
                    label="Điện thoại"
                    value={customer.phone_number || "Chưa cập nhật"}
                  />
                  <ProfileInfoCard
                    icon={Mail}
                    label="Email"
                    value={customer.email || "Chưa cập nhật"}
                  />
                  <ProfileInfoCard
                    icon={CalendarDays}
                    label="Ngày sinh"
                    value={dateLabel(customer.birth_date)}
                  />
                  <ProfileInfoCard
                    icon={UserRound}
                    label="Giới tính"
                    value={
                      customer.gender
                        ? genderLabels[customer.gender]
                        : "Chưa cập nhật"
                    }
                  />
                  <ProfileInfoCard
                    icon={CalendarDays}
                    label="Ngày tham gia"
                    value={dateLabel(customer.date_joined)}
                  />
                  <ProfileInfoCard
                    icon={ShieldCheck}
                    label="Loại tài khoản"
                    value="Khách hàng"
                  />
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent
            value="wallet"
            className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5"
          >
            {tab === "wallet" && <UserWalletPanel userId={id} />}
          </TabsContent>
          <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50/70 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

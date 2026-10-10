"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";
import {
  useGetAdminBookingDetailQuery,
  useGetBookingTimelineQuery,
} from "@/services/bookingApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  AssignWorkerDialog,
  InvitationStatus,
  CancelBookingDialog,
  EditBookingDialog,
  RescheduleDialog,
  ScheduleReasonActions,
} from "./BookingActions";
import { useGetServiceDetailQuery } from "@/services/servicesApi";
import type { ServiceFormSchema } from "@/types/Service";
import { serviceFieldLabel, serviceFieldValue } from "./service-data-display";
import { dateTime, money, StatusBadge } from "./booking-ui";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-800">{value || "—"}</dd>
    </div>
  );
}

export function BookingDetailPage({ id }: { id: number }) {
  const {
    data: booking,
    isLoading,
    isError,
  } = useGetAdminBookingDetailQuery(id, { pollingInterval: 15000, refetchOnFocus: true });
  const { data: serviceDetail } = useGetServiceDetailQuery(booking?.service.id ?? 0, { skip: !booking?.service.id });
  const serviceFields = (serviceDetail?.data?.form_schema as ServiceFormSchema | undefined)?.fields ?? [];
  const { data: timeline } = useGetBookingTimelineQuery(id, { pollingInterval: 15000 });
  const [selected, setSelected] = useState<number[]>([]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
  if (isLoading)
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  if (isError || !booking)
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-600">
            Không tải được đơn hoặc đơn không tồn tại.
          </p>
          <Button asChild className="mt-4">
            <Link href="/bookings">Quay lại danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  const selectable = booking.schedules.filter((s) => s.status === "PENDING" && !s.current_assignment && !s.invitation && new Date(s.scheduled_start).getTime() > now);
  const firstSelected = booking.schedules.find((s) => s.id === selected[0]);
  const refunded = Number(booking.refunded_amount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/bookings"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách đơn
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {booking.booking_code}
            </h1>
            <StatusBadge status={booking.status} label={booking.status_label} />
            <StatusBadge
              status={booking.payment_status}
              label={booking.payment_status_label}
            />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tạo lúc {dateTime(booking.created_at)} • Cập nhật{" "}
            {dateTime(booking.updated_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <EditBookingDialog booking={booking} />
          <CancelBookingDialog booking={booking} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600" />
              Khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <Info label="Họ tên" value={booking.customer.full_name} />
              <Info label="Điện thoại" value={booking.customer.phone_number} />
              <Info label="Email" value={booking.customer.email} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Địa chỉ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <Info
                label="Thực hiện"
                value={`${booking.address.address_line}, ${booking.address.ward}, ${booking.address.city}`}
              />
              <Info
                label="Người nhận"
                value={`${booking.address.receiver_name} • ${booking.address.receiver_phone}`}
              />
              <Info
                label="Giao nhận"
                value={
                  booking.delivery_address
                    ? `${booking.delivery_address.address_line}, ${booking.delivery_address.city}`
                    : "Không có"
                }
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-blue-600" />
              Thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Info label="Tạm tính" value={money(booking.subtotal_amount)} />
              <Info label="Giảm giá" value={money(booking.discount_amount)} />
              <Info
                label="Tổng tiền"
                value={<b>{money(booking.total_amount)}</b>}
              />
              <Info label="Voucher" value={booking.voucher?.code} />
              {refunded > 0 && (
                <Info
                  label="Đã hoàn vào ví"
                  value={
                    <b className="text-emerald-600">
                      {money(booking.refunded_amount ?? 0)}
                    </b>
                  }
                />
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dịch vụ: {booking.service.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Info label="Ghi chú đơn" value={booking.note} />
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Dữ liệu dịch vụ
            </p>
            <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
              {Object.entries(booking.service_data).map(([key, value]) => (
                <Info
                  key={key}
                  label={serviceFieldLabel(key, serviceFields)}
                  value={serviceFieldValue(key, value, serviceFields, booking.service_data)}
                />
              ))}
              {!Object.keys(booking.service_data).length && (
                <p className="text-sm text-slate-500">
                  Không có dữ liệu bổ sung.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              Các buổi làm
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Chọn các buổi chưa có nhân viên để gửi lời mời nhận việc.
            </p>
          </div>
          {firstSelected && selected.length > 1 && (
            <AssignWorkerDialog
              bookingId={booking.id}
              schedule={firstSelected}
              selectedScheduleIds={selected}
              selectedSchedules={booking.schedules.filter((s) => selected.includes(s.id))}
              contextLabel={`${booking.service.name} · ${booking.address.address_line}`}
            />
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      selectable.length > 0 &&
                      selected.length === selectable.length
                    }
                    onCheckedChange={(checked) =>
                      setSelected(checked ? selectable.map((s) => s.id) : [])
                    }
                  />
                </TableHead>
                <TableHead>Buổi</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {booking.schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    {selectable.some((s) => s.id === schedule.id) && (
                      <Checkbox
                        checked={selected.includes(schedule.id)}
                        onCheckedChange={(checked) =>
                          setSelected((current) =>
                            checked
                              ? [...new Set([...current, schedule.id])]
                              : current.filter((id) => id !== schedule.id),
                          )
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <b>#{schedule.sequence_no}</b>
                    {schedule.note && (
                      <div className="max-w-40 truncate text-xs text-slate-500">
                        {schedule.note}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{dateTime(schedule.scheduled_start)}</div>
                    <div className="text-xs text-slate-500">
                      đến {dateTime(schedule.scheduled_end)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {schedule.current_assignment ? (
                      <div>
                        <div className="font-medium">
                          {schedule.current_assignment.worker.full_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {schedule.current_assignment.worker.phone_number}
                        </div>
                      </div>
                    ) : (
                      <div><span className="text-slate-400">Chưa có nhân viên</span><InvitationStatus bookingId={booking.id} schedule={schedule} /></div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={schedule.status}
                      label={schedule.status_label}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {schedule.status === "PENDING" && (
                        <>
                          <AssignWorkerDialog
                            bookingId={booking.id}
                            schedule={schedule}
                            contextLabel={`${booking.service.name} · ${booking.address.address_line}`}
                          />
                          <RescheduleDialog
                            bookingId={booking.id}
                            schedule={schedule}
                          />
                        </>
                      )}
                      <ScheduleReasonActions
                        bookingId={booking.id}
                        schedule={schedule}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div>
                  <div className="font-medium">{payment.method_label}</div>
                  <div className="text-xs text-slate-500">
                    {payment.transaction_code || `Giao dịch #${payment.id}`} •{" "}
                    {dateTime(payment.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <b>{money(payment.amount)}</b>
                  <div>
                    <StatusBadge
                      status={payment.status}
                      label={payment.status_label}
                    />
                  </div>
                </div>
              </div>
            ))}
            {!booking.payments.length && (
              <p className="text-sm text-slate-500">Chưa có giao dịch.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Khiếu nại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="flex justify-between rounded-lg border border-slate-200 p-3 text-sm"
              >
                <div>
                  <b>{complaint.issue_type}</b>
                  <p className="text-slate-500">
                    Buổi #{complaint.schedule_id} •{" "}
                    {dateTime(complaint.created_at)}
                  </p>
                </div>
                <Badge variant="outline">{complaint.status}</Badge>
              </div>
            ))}
            {!booking.complaints.length && (
              <p className="text-sm text-slate-500">Không có khiếu nại.</p>
            )}
          </CardContent>
        </Card>
      </div>
      {booking.schedules.some((s) => s.images.length) && (
        <Card>
          <CardHeader>
            <CardTitle>Ảnh công việc</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {booking.schedules.flatMap((s) =>
              s.images.map((image) => (
                <a
                  key={image.id}
                  href={image.image}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-lg border"
                >
                  <img
                    src={image.image}
                    alt={image.note || `Ảnh buổi ${s.sequence_no}`}
                    className="h-36 w-full object-cover"
                  />
                  <p className="p-2 text-xs text-slate-500">
                    Buổi #{s.sequence_no} • {image.image_type}
                  </p>
                </a>
              )),
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-blue-600" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-0 border-l-2 border-slate-100 pl-6">
            {timeline?.results.map((activity) => (
              <div key={activity.id} className="relative pb-6">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500 ring-2 ring-blue-100" />
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-sm text-slate-900">
                    {activity.event_type_label}
                  </b>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {activity.message}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {dateTime(activity.created_at)} •{" "}
                  {activity.actor?.full_name || "Hệ thống"}
                </p>
              </div>
            ))}
            {!timeline?.results.length && (
              <p className="text-sm text-slate-500">Chưa có hoạt động.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

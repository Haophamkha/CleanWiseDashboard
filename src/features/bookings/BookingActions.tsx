"use client";
import { useState } from "react";
import { ArrowLeft, Eye, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAssignWorkerMutation, useBulkAssignMutation, useCancelAdminBookingMutation, useCompleteScheduleMutation, useGetAvailableWorkersQuery, useUnassignWorkerMutation, useUpdateAdminBookingMutation, useUpdateAdminScheduleMutation } from "@/services/bookingApi";
import type { AvailableWorker, BookingDetail, Schedule } from "@/types/Booking";
import { apiError, dateTime, Field, selectClass } from "./booking-ui";
import { WorkerProfilePanel } from "./WorkerProfilePanel";

export function EditBookingDialog({ booking }: { booking: BookingDetail }) {
  const [open, setOpen] = useState(false); const [note, setNote] = useState(booking.note ?? ""); const [addressId, setAddressId] = useState(booking.address.id); const [deliveryId, setDeliveryId] = useState<number | undefined>(booking.delivery_address?.id); const [update, { isLoading }] = useUpdateAdminBookingMutation();
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { await update({ id: booking.id, data: { note, address_id: addressId, delivery_address_id: deliveryId ?? null } }).unwrap(); toast.success("Đã cập nhật đơn."); setOpen(false); } catch (error) { toast.error(apiError(error), { duration: 10000 }); } };
  const addresses = [booking.address, ...(booking.delivery_address && booking.delivery_address.id !== booking.address.id ? [booking.delivery_address] : [])];
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline">Sửa thông tin</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Cập nhật đơn</DialogTitle><DialogDescription>Chỉ cập nhật ghi chú và các địa chỉ an toàn của khách hàng.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label="Địa chỉ thực hiện"><select className={selectClass} value={addressId} onChange={(e) => setAddressId(Number(e.target.value))}>{addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.address_line}</option>)}</select></Field><Field label="Địa chỉ giao nhận"><select className={selectClass} value={deliveryId ?? ""} onChange={(e) => setDeliveryId(Number(e.target.value) || undefined)}><option value="">Không có</option>{addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.address_line}</option>)}</select></Field><Field label="Ghi chú"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field><DialogFooter><Button variant="outline" type="button" onClick={() => setOpen(false)}>Đóng</Button><Button disabled={isLoading}>{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function CancelBookingDialog({ booking }: { booking: BookingDetail }) {
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [cancel, { isLoading }] = useCancelAdminBookingMutation();
  if (["COMPLETED", "CANCELLED", "FAILED"].includes(booking.status)) return null;
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { await cancel({ id: booking.id, reason }).unwrap(); toast.success("Đã hủy đơn."); setOpen(false); } catch (error) { toast.error(apiError(error), { duration: 10000 }); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="destructive">Hủy đơn</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Hủy đơn {booking.booking_code}?</DialogTitle><DialogDescription>Thao tác sẽ hủy các buổi còn hiệu lực. Nếu đơn đã thanh toán, yêu cầu hoàn tiền sẽ được tạo theo luồng backend.</DialogDescription></DialogHeader><form onSubmit={submit}><Field label="Lý do hủy" required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} /></Field><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Quay lại</Button><Button variant="destructive" disabled={isLoading}>Xác nhận hủy</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function AssignWorkerDialog({ bookingId, schedule, selectedScheduleIds }: { bookingId: number; schedule: Schedule; selectedScheduleIds?: number[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [workerId, setWorkerId] = useState<number>();
  const [previewWorkerId, setPreviewWorkerId] = useState<number>();
  const [note, setNote] = useState("");
  const { data, isFetching } = useGetAvailableWorkersQuery(
    { scheduleId: schedule.id, search },
    { skip: !open, refetchOnMountOrArgChange: true },
  );
  const [assign, { isLoading }] = useAssignWorkerMutation();
  const [bulkAssign, { isLoading: bulkLoading }] = useBulkAssignMutation();
  const ids = selectedScheduleIds?.length ? selectedScheduleIds : [schedule.id];
  const isBulk = ids.length > 1;
  const previewWorker = data?.results.find((worker) => worker.id === previewWorkerId);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setSearch("");
      setPreviewWorkerId(undefined);
    }
  };

  const selectWorker = (worker: AvailableWorker) => {
    setWorkerId(worker.id);
  };

  const previewProfile = (worker: AvailableWorker) => {
    setPreviewWorkerId(worker.id);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) return;
    try {
      if (isBulk) {
        const result = await bulkAssign({ booking_id: bookingId, schedule_ids: ids, worker_id: workerId, note }).unwrap();
        toast.success(`Đã gán ${result.assigned.length}/${ids.length} buổi.`);
      } else {
        await assign({ bookingId, scheduleId: schedule.id, worker_id: workerId, note }).unwrap();
        toast.success(schedule.current_assignment ? "Đã đổi nhân viên." : "Đã gán nhân viên.");
      }
      setOpen(false);
    } catch (error) {
      toast.error(apiError(error), { duration: 10000 });
    }
  };

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogTrigger asChild><Button size="sm" variant={schedule.current_assignment ? "outline" : "default"}>{isBulk ? `Gán ${ids.length} buổi` : schedule.current_assignment ? "Đổi nhân viên" : "Gán nhân viên"}</Button></DialogTrigger>
    <DialogContent className="max-w-2xl overflow-hidden p-0">
      <DialogHeader className="border-b border-slate-200 px-6 pb-4 pt-6">
        <DialogTitle>{isBulk ? `Phân công hàng loạt ${ids.length} buổi` : `Phân công buổi #${schedule.sequence_no}`}</DialogTitle>
        <DialogDescription>{previewWorker ? "Thông tin hồ sơ nhân viên." : "Chỉ hiển thị nhân viên phù hợp dịch vụ, khu vực, lịch làm và điều kiện số dư."}</DialogDescription>
      </DialogHeader>
      {previewWorker ? (
        <div className="max-h-[calc(90vh-116px)] overflow-y-auto px-6 py-5">
          <Button type="button" variant="ghost" className="mb-4 -ml-2 text-slate-600" onClick={() => setPreviewWorkerId(undefined)}>
            <ArrowLeft className="h-4 w-4" />Quay lại danh sách nhân viên
          </Button>
          <WorkerProfilePanel worker={previewWorker} />
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="px-6 py-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm nhân viên" />
            </div>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {isFetching && <p className="py-6 text-center text-sm text-slate-500">Đang tải nhân viên phù hợp...</p>}
              {data?.results.map((worker) => (
                <div
                  key={worker.id}
                  className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${workerId === worker.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <button type="button" onClick={() => selectWorker(worker)} className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${workerId === worker.id ? "border-blue-600 bg-blue-600 ring-2 ring-blue-100" : "border-slate-300"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{worker.full_name}</span>
                      <span className="block truncate text-xs text-slate-500">⭐ {worker.average_rating ?? "0"} • {worker.total_completed_jobs} việc hoàn thành</span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-2 text-xs text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    onClick={() => previewProfile(worker)}
                  >
                    <Eye className="h-3.5 w-3.5" />Xem
                  </Button>
                </div>
              ))}
              {data && !data.results.length && <p className="py-8 text-center text-sm text-slate-500">Không có nhân viên phù hợp.</p>}
            </div>
            <div className="mt-4">
              <Field label="Ghi chú phân công"><Textarea className="min-h-20 bg-white" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Đóng</Button>
            <Button disabled={!workerId || isLoading || bulkLoading}>{(isLoading || bulkLoading) && <Loader2 className="h-4 w-4 animate-spin" />}Xác nhận phân công</Button>
          </DialogFooter>
          </div>
        </form>
      )}
    </DialogContent>
  </Dialog>;
}

export function RescheduleDialog({ bookingId, schedule }: { bookingId: number; schedule: Schedule }) {
  const local = (value: string) => new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [open, setOpen] = useState(false); const [start, setStart] = useState(local(schedule.scheduled_start)); const [end, setEnd] = useState(local(schedule.scheduled_end)); const [reason, setReason] = useState(""); const [update, { isLoading }] = useUpdateAdminScheduleMutation();
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { await update({ bookingId, scheduleId: schedule.id, data: { scheduled_start: new Date(start).toISOString(), scheduled_end: new Date(end).toISOString(), reason } }).unwrap(); toast.success("Đã đổi lịch buổi làm."); setOpen(false); } catch (error) { toast.error(apiError(error), { duration: 10000 }); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm" variant="outline">Đổi lịch</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Đổi lịch buổi #{schedule.sequence_no}</DialogTitle><DialogDescription>Lịch hiện tại: {dateTime(schedule.scheduled_start)}.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Bắt đầu" required><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required /></Field><Field label="Kết thúc" required><Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required /></Field></div><Field label="Lý do đổi lịch" required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} required /></Field><DialogFooter><Button variant="outline" type="button" onClick={() => setOpen(false)}>Đóng</Button><Button disabled={isLoading}>Lưu lịch mới</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function ScheduleReasonActions({ bookingId, schedule }: { bookingId: number; schedule: Schedule }) {
  const [mode, setMode] = useState<"unassign" | "complete" | null>(null); const [reason, setReason] = useState(""); const [completionNote, setCompletionNote] = useState(""); const [unassign, unassignState] = useUnassignWorkerMutation(); const [complete, completeState] = useCompleteScheduleMutation();
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { if (mode === "unassign") { await unassign({ bookingId, scheduleId: schedule.id, reason }).unwrap(); toast.success("Đã bỏ phân công."); } else { await complete({ bookingId, scheduleId: schedule.id, reason, completion_note: completionNote }).unwrap(); toast.success("Đã xác nhận hoàn thành."); } setMode(null); } catch (error) { toast.error(apiError(error), { duration: 10000 }); } };
  return <><div className="flex gap-2">{schedule.current_assignment && schedule.status === "PENDING" && <Button size="sm" variant="ghost" onClick={() => setMode("unassign")}>Bỏ gán</Button>}{schedule.status === "IN_PROGRESS" && <Button size="sm" onClick={() => setMode("complete")}>Xác nhận hoàn thành</Button>}</div><Dialog open={mode !== null} onOpenChange={(value) => !value && setMode(null)}><DialogContent><DialogHeader><DialogTitle>{mode === "unassign" ? "Bỏ phân công nhân viên" : "Xác nhận hoàn thành thủ công"}</DialogTitle><DialogDescription>Buổi #{schedule.sequence_no} • {dateTime(schedule.scheduled_start)}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label="Lý do" required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>{mode === "complete" && <Field label="Ghi chú hoàn thành"><Textarea value={completionNote} onChange={(e) => setCompletionNote(e.target.value)} /></Field>}<DialogFooter><Button type="button" variant="outline" onClick={() => setMode(null)}>Đóng</Button><Button variant={mode === "unassign" ? "destructive" : "default"} disabled={unassignState.isLoading || completeState.isLoading}>Xác nhận</Button></DialogFooter></form></DialogContent></Dialog></>;
}

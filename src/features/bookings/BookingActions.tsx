"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Heart, Loader2, MapPin, Search, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWithdrawInvitationMutation, useBulkAssignMutation, useCancelAdminBookingMutation, useCompleteScheduleMutation, useGetAvailableWorkersQuery, useUpdateAdminBookingMutation, useReassignWorkersMutation } from "@/services/bookingApi";
import type { AvailableWorker, BookingDetail, Schedule } from "@/types/Booking";
import { apiError, dateTime, Field } from "./booking-ui";
import { WorkerProfilePanel } from "./WorkerProfilePanel";

export function EditBookingDialog({ booking }: { booking: BookingDetail }) {
  const [open, setOpen] = useState(false); const [note, setNote] = useState(booking.note ?? ""); const [addressId, setAddressId] = useState(booking.address.id); const [deliveryId, setDeliveryId] = useState<number | undefined>(booking.delivery_address?.id); const [update, { isLoading }] = useUpdateAdminBookingMutation();
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { await update({ id: booking.id, data: { note, address_id: addressId, delivery_address_id: deliveryId ?? null } }).unwrap(); toast.success("Đã cập nhật đơn."); setOpen(false); } catch (error) { toast.error(apiError(error), { duration: 10000 }); } };
  const addresses = [booking.address, ...(booking.delivery_address && booking.delivery_address.id !== booking.address.id ? [booking.delivery_address] : [])];
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline">Sửa thông tin</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Cập nhật đơn</DialogTitle><DialogDescription>Chỉ cập nhật ghi chú và các địa chỉ an toàn của khách hàng.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label="Địa chỉ thực hiện"><SelectField label="Địa chỉ thực hiện" value={String(addressId ?? "")} onValueChange={(value) => setAddressId(Number(value))} options={addresses.map((a) => ({ value: String(a.id), label: a.label + " — " + a.address_line }))} /></Field><Field label="Địa chỉ giao nhận"><SelectField label="Địa chỉ giao nhận" value={String(deliveryId ?? "none")} onValueChange={(value) => setDeliveryId(value === "none" ? undefined : Number(value))} options={[{ value: "none", label: "Không có" }, ...addresses.map((a) => ({ value: String(a.id), label: a.label + " — " + a.address_line }))]} /></Field><Field label="Ghi chú"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field><DialogFooter><Button variant="outline" type="button" onClick={() => setOpen(false)}>Đóng</Button><Button disabled={isLoading}>{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function CancelBookingDialog({ booking }: { booking: BookingDetail }) {
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [cancel, { isLoading }] = useCancelAdminBookingMutation();
  if (["COMPLETED", "CANCELLED", "FAILED"].includes(booking.status)) return null;
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { await cancel({ id: booking.id, reason }).unwrap(); toast.success("Đã hủy đơn."); setOpen(false); } catch (error) { toast.error(apiError(error), { duration: 10000 }); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="destructive">Hủy đơn</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Hủy đơn <span className="whitespace-nowrap">{booking.booking_code}?</span></DialogTitle><DialogDescription>Thao tác sẽ hủy các buổi còn hiệu lực. Nếu đơn đã thanh toán, yêu cầu hoàn tiền sẽ được tạo theo luồng backend.</DialogDescription></DialogHeader><form onSubmit={submit}><Field label="Lý do hủy" required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} /></Field><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Quay lại</Button><Button variant="destructive" disabled={isLoading}>Xác nhận hủy</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function AssignWorkerDialog({ bookingId, schedule, selectedScheduleIds, selectedSchedules, contextLabel }: { bookingId: number; schedule: Schedule; selectedScheduleIds?: number[]; selectedSchedules?: Schedule[]; contextLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState<AvailableWorker[]>([]);
  const [page, setPage] = useState(1);
  const [group, setGroup] = useState<"suitable" | "favorites" | "requested">("suitable");
  const [previewWorker, setPreviewWorker] = useState<AvailableWorker>();
  const [responseMinutes, setResponseMinutes] = useState(15);
  const { currentData: workers, isFetching, error } = useGetAvailableWorkersQuery(
    schedule.id,
    { skip: !open, refetchOnMountOrArgChange: true, refetchOnFocus: false, refetchOnReconnect: false },
  );
  const [bulkAssign, { isLoading: bulkLoading }] = useBulkAssignMutation();
  const [reassign, { isLoading: reassignLoading }] = useReassignWorkersMutation();
  const [replacementReason, setReplacementReason] = useState("");
  const isReplacement = Boolean(schedule.current_assignment);
  const submitting = bulkLoading || reassignLoading;
  const ids = selectedScheduleIds?.length ? selectedScheduleIds : [schedule.id];
  const isBulk = ids.length > 1;
  const searchText = search.trim().toLocaleLowerCase("vi");
  const filteredWorkers = (workers ?? []).filter((worker) => {
    const matchesGroup = group === "favorites" ? worker.is_customer_favorite : group === "requested" ? worker.is_customer_requested : worker.can_receive_invitation;
    return worker.id !== schedule.current_assignment?.worker.id && matchesGroup && (!searchText || [worker.full_name, worker.username, worker.phone_number].some((value) => value?.toLocaleLowerCase("vi").includes(searchText)));
  });
  const totalPages = Math.max(1, Math.ceil(filteredWorkers.length / 12));
  const currentPage = Math.min(page, totalPages);
  const visibleWorkers = filteredWorkers.slice((currentPage - 1) * 12, currentPage * 12);
  const selectableWorkers = visibleWorkers.filter((worker) => worker.can_receive_invitation);
  const groupLabel = group === "favorites" ? "khách yêu thích" : group === "requested" ? "khách yêu cầu" : "phù hợp";

  const handleOpenChange = (value: boolean) => {
    if (submitting) return;
    setOpen(value);
    if (!value) {
      setReplacementReason("");
      setSearch("");
      setPreviewWorker(undefined);
      setSelectedWorkers([]);
      setPage(1);
      setGroup("suitable");
    }
  };

  const selectWorker = (worker: AvailableWorker) => {
    if (!worker.can_receive_invitation) return;
    setSelectedWorkers((current) => current.some((item) => item.id === worker.id) ? current.filter((item) => item.id !== worker.id) : current.length < 100 ? [...current, worker] : current);
  };

  const previewProfile = (worker: AvailableWorker) => {
    setPreviewWorker(worker);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !selectedWorkers.length) return;
    try {
      if (isReplacement && schedule.current_assignment) {
        if (!replacementReason.trim()) return;
        await reassign({ bookingId, scheduleId: schedule.id, assignment_id: schedule.current_assignment.id,
          worker_ids: selectedWorkers.map((worker) => worker.id), reason: replacementReason.trim(), response_minutes: responseMinutes }).unwrap();
        toast.success("Đã bỏ phân công cũ và gửi lời mời thay nhân viên.");
        // Close directly: the request's loading flag can still be true in this closure.
        setOpen(false);
        setSelectedWorkers([]);
        setReplacementReason("");
        return;
      }
      const result = await bulkAssign({ booking_id: bookingId, schedule_ids: ids, worker_ids: selectedWorkers.map((worker) => worker.id), response_minutes: responseMinutes }).unwrap();
      const sentSessions = new Set(result.assigned.map((item) => item.schedule_id)).size;
      toast.success(`Đã gửi ${result.assigned.length} lời mời cho ${sentSessions}/${ids.length} buổi.`);
      if (result.skipped.length) toast.warning(result.skipped.map((item) => {
        const number = selectedSchedules?.find((s) => s.id === item.schedule_id)?.sequence_no ?? schedule.sequence_no;
        const reason = typeof item.reason === 'object' && item.reason ? Object.values(item.reason).flat().join(' ') : String(item.reason);
        return `Buổi #${number}: ${reason}`;
      }).join('\n'), { duration: 10000 });
      setOpen(false);
      setSelectedWorkers([]);
    } catch (error) {
      toast.error(apiError(error), { duration: 10000 });
    }
  };

  if (schedule.status !== "PENDING" || (!isReplacement && schedule.invitation)) return null;

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogTrigger asChild><Button size="sm">{isReplacement ? "Đổi nhân viên" : isBulk ? `Phân công ${ids.length} buổi` : "Phân công"}</Button></DialogTrigger>
    <DialogContent className="flex h-[90dvh] max-h-[90dvh] w-[calc(100%-2rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="shrink-0 border-b border-slate-200 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
        <DialogTitle>{isReplacement ? `Đổi nhân viên buổi #${schedule.sequence_no}` : isBulk ? `Phân công ${ids.length} buổi` : `Phân công buổi #${schedule.sequence_no}`}</DialogTitle>
        <p className="pr-4 text-xs text-slate-600 sm:text-sm">{contextLabel}</p>
        <p className="text-xs text-slate-500">{dateTime(schedule.scheduled_start)} – {dateTime(schedule.scheduled_end)}</p>
        <DialogDescription className="sr-only sm:not-sr-only">{previewWorker ? "Thông tin hồ sơ nhân viên." : "Nhân viên phù hợp dịch vụ, khu vực, lịch làm và điều kiện số dư."}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] px-4 py-4 sm:px-6 sm:py-5">
          {previewWorker ? <>
            <Button type="button" variant="ghost" className="mb-4 -ml-2 text-slate-600" onClick={() => setPreviewWorker(undefined)}><ArrowLeft className="h-4 w-4" />Danh sách nhân viên</Button>
            <WorkerProfilePanel worker={previewWorker} />
          </> : <>
            {isBulk && <div className="mb-4 max-h-24 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{selectedSchedules?.map((item) => <p key={item.id}>Buổi #{item.sequence_no} · {dateTime(item.scheduled_start)} – {dateTime(item.scheduled_end)}</p>)}</div>}
            <div role="tablist" aria-label="Nhóm nhân viên" className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
              {([{ value: "suitable", label: "Nhân viên phù hợp" }, { value: "favorites", label: "Nhân viên khách yêu thích" }, { value: "requested", label: "Nhân viên khách yêu cầu" }] as const).map((tab) => <button key={tab.value} id={`worker-tab-${schedule.id}-${tab.value}`} type="button" role="tab" aria-selected={group === tab.value} aria-controls={`worker-list-${schedule.id}`} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${group === tab.value ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"}`} onClick={() => { setGroup(tab.value); setPage(1); }}>{tab.label}</button>)}
            </div>
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input aria-label="Tìm nhân viên" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm theo tên hoặc số điện thoại" /></div>
            <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>{filteredWorkers.length} nhân viên {groupLabel}</span>
              <label className="flex cursor-pointer items-center gap-2"><Checkbox disabled={isFetching || !selectableWorkers.length} checked={!!selectableWorkers.length && selectableWorkers.every((worker) => selectedWorkers.some((item) => item.id === worker.id))} onCheckedChange={(value) => {
                const checked = value === true;
                setSelectedWorkers((current) => checked ? [...current, ...selectableWorkers.filter((worker) => !current.some((item) => item.id === worker.id))].slice(0, 100) : current.filter((item) => !selectableWorkers.some((worker) => worker.id === item.id)));
              }} />Chọn tất cả trên trang</label>
            </div>
            {isFetching ? <p className="py-12 text-center text-sm text-slate-500">Đang tải nhân viên...</p> : error ? <p role="alert" className="py-8 text-center text-sm text-red-600">{apiError(error)}</p> : <div id={`worker-list-${schedule.id}`} role="tabpanel" aria-labelledby={`worker-tab-${schedule.id}-${group}`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleWorkers.map((worker) => <InvitationWorkerCard key={worker.id} worker={worker} selected={selectedWorkers.some((item) => item.id === worker.id)} selectionDisabled={!worker.can_receive_invitation || (selectedWorkers.length >= 100 && !selectedWorkers.some((item) => item.id === worker.id))} onSelect={() => selectWorker(worker)} onProfile={() => previewProfile(worker)} />)}
              {workers && !filteredWorkers.length && <p className="py-8 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">{searchText ? "Không tìm thấy nhân viên trong nhóm này." : group === "requested" ? "Khách chưa yêu cầu nhân viên cụ thể cho buổi này." : group === "favorites" ? "Không có nhân viên trong danh sách yêu thích của khách." : "Không có nhân viên phù hợp."}</p>}
            </div>}
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>Trang {currentPage}/{totalPages}</span>
              <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={currentPage === 1 || isFetching} onClick={() => setPage(currentPage - 1)}>Trước</Button><Button type="button" size="sm" variant="outline" disabled={currentPage >= totalPages || isFetching} onClick={() => setPage(currentPage + 1)}>Sau</Button></div>
            </div>
          </>}
        </div>
        {!previewWorker && <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span aria-live="polite" className="font-medium text-blue-700">Đã chọn {selectedWorkers.length} nhân viên{selectedWorkers.length >= 100 && " (tối đa 100)"}</span>
            {selectedWorkers.length > 0 && <button type="button" className="text-blue-600 hover:underline" onClick={() => setSelectedWorkers([])}>Bỏ chọn tất cả</button>}
          </div>
          {isReplacement && <div className="mb-3 space-y-2">
            <p className="text-sm text-amber-700">Nhân viên hiện tại: {schedule.current_assignment?.worker.full_name}. Khi gửi thành công, phân công cũ sẽ được bỏ; người xác nhận lời mời mới đầu tiên sẽ nhận buổi làm. Giữ nguyên thời gian đã đặt.</p>
            <Field label="Lý do đổi nhân viên" required><Textarea value={replacementReason} onChange={(event) => setReplacementReason(event.target.value)} maxLength={500} required /></Field>
          </div>}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Field label="Thời hạn phản hồi"><SelectField label="Thời hạn phản hồi" className="min-w-32" value={String(responseMinutes)} onValueChange={(value) => setResponseMinutes(Number(value))} options={[15, 30, 60].map((minutes) => ({ value: String(minutes), label: minutes + " phút" }))} /></Field>
            <Button disabled={!selectedWorkers.length || submitting || (isReplacement && !replacementReason.trim())}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Gửi lời mời nhận việc{selectedWorkers.length > 0 && ` (${selectedWorkers.length})`}</Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Người xác nhận đầu tiên nhận việc.</p>
        </div>}
      </form>
    </DialogContent>
  </Dialog>;
}

function InvitationWorkerCard({ worker, selected, selectionDisabled, onSelect, onProfile }: { worker: AvailableWorker; selected: boolean; selectionDisabled: boolean; onSelect: () => void; onProfile: () => void }) {
  const initials = worker.full_name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase();
  return <article className={`relative overflow-hidden rounded-xl border transition-colors ${selected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 bg-white hover:border-blue-300"}`}>
    <button type="button" className="absolute inset-0 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:cursor-not-allowed" aria-label={`Chọn thẻ nhân viên ${worker.full_name}`} aria-pressed={selected} disabled={selectionDisabled} onClick={onSelect} />
    <label className="absolute right-3 top-3 z-10 flex cursor-pointer rounded p-1"><span className="sr-only">Chọn {worker.full_name}</span><Checkbox checked={selected} disabled={selectionDisabled} onCheckedChange={onSelect} /></label>
    <div className="pointer-events-none p-4">
      <div className="flex min-h-12 items-center gap-3 pr-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-100 text-sm font-semibold text-blue-700">{initials || "NV"}</span>
        <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{worker.full_name}</span>{worker.is_customer_favorite && <span className="mt-1 inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700"><Heart className="h-3 w-3" />Khách yêu thích</span>}{worker.is_customer_requested && <span className="mt-1 ml-1 inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">Khách yêu cầu</span>}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"><span className="inline-flex items-center gap-1 font-medium text-slate-700"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{worker.average_rating ?? "0"}</span><span className="text-slate-500">{worker.total_completed_jobs} việc hoàn thành</span></div>
      <p className="mt-2 flex items-start gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0" />{worker.working_areas.slice(0, 2).map((area) => area.name).join(" · ") || "Khu vực phù hợp"}{worker.working_areas.length > 2 && ` +${worker.working_areas.length - 2}`}</p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-2 text-xs"><span className={worker.can_receive_invitation ? "text-slate-500" : "text-red-600"}>{worker.can_receive_invitation ? "Lịch trống · Phù hợp dịch vụ" : worker.unavailable_reasons.join(" · ")}</span><button type="button" className="pointer-events-auto relative z-10 inline-flex shrink-0 items-center rounded text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={`Xem hồ sơ ${worker.full_name}`} onClick={onProfile}>Hồ sơ<ChevronRight className="h-3.5 w-3.5" /></button></div>
    </div>
  </article>;
}

export function ScheduleReasonActions({ bookingId, schedule }: { bookingId: number; schedule: Schedule }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [complete, { isLoading }] = useCompleteScheduleMutation();
  if (schedule.status !== "IN_PROGRESS") return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    try {
      await complete({ bookingId, scheduleId: schedule.id, reason, completion_note: completionNote }).unwrap();
      toast.success("Đã xác nhận hoàn thành."); setOpen(false);
    } catch (error) { toast.error(apiError(error)); }
  };
  return <Dialog open={open} onOpenChange={(next) => { if (!isLoading) setOpen(next); }}><DialogTrigger asChild><Button size="sm">Xác nhận hoàn thành</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Xác nhận hoàn thành thủ công</DialogTitle><DialogDescription>Buổi #{schedule.sequence_no}</DialogDescription></DialogHeader><form onSubmit={submit}><Field label="Lý do" required><Textarea value={reason} onChange={(event) => setReason(event.target.value)} required /></Field><Field label="Ghi chú hoàn thành"><Textarea value={completionNote} onChange={(event) => setCompletionNote(event.target.value)} /></Field><DialogFooter><Button disabled={isLoading}>Xác nhận</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function InvitationStatus({ bookingId, schedule }: { bookingId: number; schedule: Schedule }) {
  const [withdraw, { isLoading }] = useWithdrawInvitationMutation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const invitation = schedule.invitation;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const minutes = invitation ? Math.max(0, Math.ceil((new Date(invitation.expires_at).getTime() - now) / 60000)) : 0;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withdraw({ bookingId, scheduleId: schedule.id, reason }).unwrap();
      toast.success("Đã thu hồi lời mời."); setOpen(false);
    } catch (error) { toast.error(apiError(error)); }
  };
    if (!invitation) {
      const latest = schedule.assignment_history.find(
        (a) => a.expired_at && a.assigned_by,
      );
      return latest && !schedule.current_assignment ? (
        <p className="mt-1 text-xs text-slate-500">
          Lời mời gần nhất:{" "}
          {latest.status === "PENDING" ? "Đã hết hạn" : latest.status_label}
          {latest.response_note ? ` · ${latest.response_note}` : ""}
        </p>
      ) : null;
    }
  return <div className="space-y-1">
    <p className="text-sm font-medium text-amber-700">{minutes > 0 ? `Chờ ${invitation.pending_count && invitation.pending_count > 1 ? `${invitation.pending_count} nhân viên` : invitation.worker.full_name} phản hồi · còn ${minutes} phút` : "Lời mời đã hết hạn"}</p>
    <p className="text-xs text-slate-500">{invitation.source === "CUSTOMER" ? "Khách hàng mời" : "Admin mời"} · Hạn {dateTime(invitation.expires_at)}</p>
    {!!invitation.workers?.length && invitation.workers.length > 1 && <details className="text-xs text-slate-500"><summary className="cursor-pointer">Xem nhân viên đã mời</summary><div className="max-h-24 overflow-y-auto py-1">{invitation.workers.map((worker) => <p key={worker.id}>{worker.full_name}</p>)}</div></details>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Thu hồi lời mời</Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>Thu hồi lời mời?</DialogTitle><DialogDescription>Thu hồi toàn bộ lời mời đang chờ của buổi này. Buổi làm sẽ mở cho nhân viên phù hợp khác.</DialogDescription></DialogHeader>
        <form onSubmit={submit}><Field label="Lý do" required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={500}/></Field><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Đóng</Button><Button disabled={isLoading}>Thu hồi</Button></DialogFooter></form>
      </DialogContent>
    </Dialog>
  </div>;
}

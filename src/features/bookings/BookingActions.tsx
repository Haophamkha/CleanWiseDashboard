"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Heart, Loader2, MapPin, Search, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWithdrawInvitationMutation, useBulkAssignMutation, useCancelAdminBookingMutation, useCompleteScheduleMutation, useGetAvailableWorkersQuery, useUnassignWorkerMutation, useUpdateAdminBookingMutation, useUpdateAdminScheduleMutation } from "@/services/bookingApi";
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
  const ids = selectedScheduleIds?.length ? selectedScheduleIds : [schedule.id];
  const isBulk = ids.length > 1;
  const searchText = search.trim().toLocaleLowerCase("vi");
  const filteredWorkers = (workers ?? []).filter((worker) => {
    const matchesGroup = group === "favorites" ? worker.is_customer_favorite : group === "requested" ? worker.is_customer_requested : worker.can_receive_invitation;
    return matchesGroup && (!searchText || [worker.full_name, worker.username, worker.phone_number].some((value) => value?.toLocaleLowerCase("vi").includes(searchText)));
  });
  const totalPages = Math.max(1, Math.ceil(filteredWorkers.length / 12));
  const currentPage = Math.min(page, totalPages);
  const visibleWorkers = filteredWorkers.slice((currentPage - 1) * 12, currentPage * 12);
  const selectableWorkers = visibleWorkers.filter((worker) => worker.can_receive_invitation);
  const groupLabel = group === "favorites" ? "khách yêu thích" : group === "requested" ? "khách yêu cầu" : "phù hợp";

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
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
    if (!selectedWorkers.length) return;
    try {
      const result = await bulkAssign({ booking_id: bookingId, schedule_ids: ids, worker_ids: selectedWorkers.map((worker) => worker.id), response_minutes: responseMinutes }).unwrap();
      const sentSessions = new Set(result.assigned.map((item) => item.schedule_id)).size;
      toast.success(`Đã gửi ${result.assigned.length} lời mời cho ${sentSessions}/${ids.length} buổi.`);
      if (result.skipped.length) toast.warning(result.skipped.map((item) => {
        const number = selectedSchedules?.find((s) => s.id === item.schedule_id)?.sequence_no ?? schedule.sequence_no;
        const reason = typeof item.reason === 'object' && item.reason ? Object.values(item.reason).flat().join(' ') : String(item.reason);
        return `Buổi #${number}: ${reason}`;
      }).join('\n'), { duration: 10000 });
      handleOpenChange(false);
    } catch (error) {
      toast.error(apiError(error), { duration: 10000 });
    }
  };

  if (schedule.current_assignment || schedule.invitation) return null;

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogTrigger asChild><Button size="sm">{isBulk ? `Phân công ${ids.length} buổi` : "Phân công"}</Button></DialogTrigger>
    <DialogContent className="flex h-[90dvh] max-h-[90dvh] w-[calc(100%-2rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="shrink-0 border-b border-slate-200 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
        <DialogTitle>{isBulk ? `Phân công ${ids.length} buổi` : `Phân công buổi #${schedule.sequence_no}`}</DialogTitle>
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
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-blue-600" disabled={isFetching || !selectableWorkers.length} checked={!!selectableWorkers.length && selectableWorkers.every((worker) => selectedWorkers.some((item) => item.id === worker.id))} onChange={(e) => {
                const checked = e.target.checked;
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Field label="Thời hạn phản hồi"><select className={`${selectClass} min-w-32`} value={responseMinutes} onChange={(e) => setResponseMinutes(Number(e.target.value))}><option value={15}>15 phút</option><option value={30}>30 phút</option><option value={60}>60 phút</option></select></Field>
            <Button disabled={!selectedWorkers.length || bulkLoading}>{bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Gửi lời mời nhận việc{selectedWorkers.length > 0 && ` (${selectedWorkers.length})`}</Button>
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
    <label className="absolute right-3 top-3 z-10 flex cursor-pointer rounded p-1"><span className="sr-only">Chọn {worker.full_name}</span><input type="checkbox" checked={selected} disabled={selectionDisabled} onChange={onSelect} className="h-4 w-4 accent-blue-600" /></label>
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
    const latest = schedule.assignment_history.find((a) => a.expired_at && a.assigned_by);
    return latest && !schedule.current_assignment ? <p className="mt-1 text-xs text-slate-500">Lời mời gần nhất: {latest.status === "PENDING" ? "Đã hết hạn" : latest.status_label}</p> : null;
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

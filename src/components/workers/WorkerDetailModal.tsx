"use client";

import Image from "next/image";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, BriefcaseBusiness, CalendarDays, CheckCircle2, FileText, Loader2, LockKeyhole, Mail, Phone, ShieldCheck, Star, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProfileInfoCard as InfoCard } from "@/components/ui/profile-info-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateWorkerStatusMutation } from "@/services/workerApi";
import type { WorkerProfile } from "@/types/Worker";
import WorkerReviewsPanel from "./WorkerReviewsPanel";
import WorkerSchedulePanel from "./WorkerSchedulePanel";
import { workerName, WorkerStatusBadge } from "./worker-ui";

type ActionView = "DETAIL" | "APPROVE" | "REJECT" | "REVOKE" | "SUSPEND" | "REACTIVATE";
type RejectableField = "first_name" | "last_name" | "phone_number" | "gender" | "birth_date" | "bio" | "experience_years" | "identity_number" | "service_id" | "portrait" | "identity_front" | "identity_back" | "certificate_file";

const FIELD_LABELS: Record<RejectableField, string> = {
  first_name: "Tên", last_name: "Họ và tên đệm", phone_number: "Số điện thoại", gender: "Giới tính", birth_date: "Ngày sinh", bio: "Giới thiệu bản thân", experience_years: "Kinh nghiệm", identity_number: "Số CCCD/CMND", service_id: "Dịch vụ đăng ký", portrait: "Ảnh chân dung", identity_front: "CCCD mặt trước", identity_back: "CCCD mặt sau", certificate_file: "Chứng chỉ",
};
const GENDER_LABEL: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

function errorMessage(error: unknown, fallback: string) {
  const data = (error as { data?: { message?: string; errors?: Record<string, string | string[]> } })?.data;
  if (data?.message) return data.message;
  const first = data?.errors && Object.values(data.errors)[0];
  if (Array.isArray(first)) return first[0] ?? fallback;
  return typeof first === "string" ? first : fallback;
}

export default function WorkerDetailModal({ worker, onClose }: { worker: WorkerProfile | null; onClose: () => void }) {
  const [tab, setTab] = useState("profile");
  const [view, setView] = useState<ActionView>("DETAIL");
  const [reason, setReason] = useState("");
  const [rejectedFields, setRejectedFields] = useState<Partial<Record<RejectableField, string>>>({});
  const [updateStatus, { isLoading }] = useUpdateWorkerStatusMutation();

  if (!worker) return null;

  const name = workerName(worker);
  const selectedRejectFields = Object.entries(rejectedFields).filter(([, note]) => note !== undefined);
  const rejectionReady = selectedRejectFields.length > 0 && selectedRejectFields.every(([, note]) => note?.trim());

  const updateWorker = async (status: "DRAFT" | "ACTIVE" | "REJECTED" | "SUSPENDED", payload?: { reason?: string; rejected_fields?: Record<string, string> }) => {
    try {
      await updateStatus({ id: worker.id, status, ...payload }).unwrap();
      const messages = { DRAFT: "Đã thu hồi phê duyệt hồ sơ.", ACTIVE: worker.status === "SUSPENDED" ? "Đã kích hoạt lại hồ sơ nhân viên." : "Đã duyệt hồ sơ nhân viên.", REJECTED: "Đã từ chối hồ sơ nhân viên.", SUSPENDED: "Đã tạm khóa hồ sơ nhân viên." };
      toast.success(messages[status]);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể cập nhật trạng thái nhân viên."));
    }
  };

  const submitReject = () => {
    const fields = Object.fromEntries(selectedRejectFields.map(([key, note]) => [key, note!.trim()]));
    const summary = Object.entries(fields).map(([key, note]) => `${FIELD_LABELS[key as RejectableField]}: ${note}`).join(" | ");
    return updateWorker("REJECTED", { reason: summary, rejected_fields: fields });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0 ${tab === "schedule" && view === "DETAIL" ? "h-[90vh]" : ""}`}>
        <DialogHeader className="mb-0 shrink-0 border-b border-slate-200 px-6 pb-4 pt-6">
          <DialogTitle>{view === "DETAIL" ? "Chi tiết nhân viên" : actionTitle(view)}</DialogTitle>
          <DialogDescription>{view === "DETAIL" ? "Kiểm tra hồ sơ, lịch làm việc, đánh giá và quản lý trạng thái làm việc." : name}</DialogDescription>
        </DialogHeader>

        {view === "DETAIL" ? (
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-slate-200 px-6 py-3">
              <TabsList><TabsTrigger value="profile">Hồ sơ</TabsTrigger><TabsTrigger value="schedule">Lịch làm việc</TabsTrigger><TabsTrigger value="reviews">Đánh giá</TabsTrigger></TabsList>
            </div>
            <TabsContent value="profile" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ProfileContent worker={worker} />
            </TabsContent>
            <TabsContent value="reviews" className="mt-0 min-h-0 flex-1 overflow-hidden">
              <WorkerReviewsPanel worker={worker} />
            </TabsContent>
            <TabsContent value="schedule" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
              {tab === "schedule" && <WorkerSchedulePanel workerId={worker.user_id} />}
            </TabsContent>
            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
              <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
              {tab === "profile" && worker.status === "PENDING" && <><Button type="button" variant="destructive" onClick={() => setView("REJECT")}>Từ chối hồ sơ</Button><Button type="button" onClick={() => setView("APPROVE")}><ShieldCheck className="h-4 w-4" />Duyệt hồ sơ</Button></>}
              {tab === "profile" && worker.status === "ACTIVE" && <><Button type="button" variant="warning" onClick={() => setView("REVOKE")}><ArrowLeft className="h-4 w-4" />Thu hồi phê duyệt</Button><Button type="button" variant="destructive" onClick={() => setView("SUSPEND")}><LockKeyhole className="h-4 w-4" />Tạm khóa hồ sơ</Button></>}
              {tab === "profile" && worker.status === "SUSPENDED" && <Button type="button" onClick={() => setView("REACTIVATE")}><CheckCircle2 className="h-4 w-4" />Kích hoạt lại</Button>}
            </div>
          </Tabs>
        ) : (
          <ActionContent view={view} reason={reason} setReason={setReason} rejectedFields={rejectedFields} setRejectedFields={setRejectedFields} isLoading={isLoading} rejectionReady={rejectionReady} onBack={() => setView("DETAIL")} onApprove={() => updateWorker("ACTIVE")} onReject={submitReject} onRevoke={() => updateWorker("DRAFT", { reason: reason.trim() })} onSuspend={() => updateWorker("SUSPENDED", { reason: reason.trim() })} onReactivate={() => updateWorker("ACTIVE")} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function actionTitle(view: ActionView) {
  return { DETAIL: "Chi tiết nhân viên", APPROVE: "Duyệt hồ sơ", REJECT: "Từ chối hồ sơ", REVOKE: "Thu hồi phê duyệt", SUSPEND: "Tạm khóa hồ sơ", REACTIVATE: "Kích hoạt lại hồ sơ" }[view];
}

function ProfileContent({ worker }: { worker: WorkerProfile }) {
  const isPdf = (url: string | null) => Boolean(url?.toLowerCase().split("?")[0].endsWith(".pdf"));
  return <div className="space-y-5">
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-semibold text-blue-700">
        {worker.portrait ? <Image src={worker.portrait} alt={workerName(worker)} fill sizes="80px" className="object-cover" /> : <UserRound className="h-8 w-8" />}
      </div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-slate-950">{workerName(worker)}</h3><WorkerStatusBadge status={worker.status} /></div><p className="mt-1 text-sm text-slate-500">@{worker.username}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline"><Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />{Number(worker.average_rating).toFixed(1)}</Badge><Badge variant="outline">{worker.total_completed_jobs} việc hoàn thành</Badge><Badge variant="secondary">Hồ sơ {worker.completion_percent}%</Badge></div></div>
    </div>

    {(["DRAFT", "REJECTED", "SUSPENDED"] as const).includes(worker.status as "DRAFT" | "REJECTED" | "SUSPENDED") && worker.rejection_reason && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-red-700"><AlertTriangle className="h-4 w-4" />{worker.status === "SUSPENDED" ? "Lý do tạm khóa hồ sơ" : worker.status === "DRAFT" ? "Lý do thu hồi phê duyệt" : "Lý do từ chối"}</p><p className="mt-1 text-sm leading-6 text-red-700/90">{worker.rejection_reason}</p></div>}

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard icon={Phone} label="Điện thoại" value={worker.phone_number || "Chưa cập nhật"} />
      <InfoCard icon={Mail} label="Email" value={worker.email} />
      <InfoCard icon={CalendarDays} label="Ngày sinh" value={worker.birth_date ? new Date(worker.birth_date).toLocaleDateString("vi-VN") : "Chưa cập nhật"} />
      <InfoCard icon={UserRound} label="Giới tính" value={worker.gender ? GENDER_LABEL[worker.gender] ?? worker.gender : "Chưa cập nhật"} />
      <InfoCard icon={BriefcaseBusiness} label="Kinh nghiệm" value={`${worker.experience_years} năm`} />
      <InfoCard icon={BriefcaseBusiness} label="Dịch vụ" value={worker.registered_service?.name || "Chưa đăng ký"} />
    </div>

    <section className="rounded-xl border border-slate-200 p-4"><h4 className="text-sm font-semibold text-slate-900">Thông tin nghề nghiệp</h4><dl className="mt-3 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-wide text-slate-400">CCCD/CMND</dt><dd className="mt-1 text-sm text-slate-800">{worker.identity_number || "Chưa cập nhật"}</dd></div><div><dt className="text-xs uppercase tracking-wide text-slate-400">Giới thiệu</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{worker.bio || "Chưa cập nhật"}</dd></div></dl></section>

    <section><h4 className="mb-3 text-sm font-semibold text-slate-900">Giấy tờ hồ sơ</h4><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><DocumentCard label="Ảnh chân dung" url={worker.portrait} /><DocumentCard label="CCCD mặt trước" url={worker.identity_front} /><DocumentCard label="CCCD mặt sau" url={worker.identity_back} /><DocumentCard label="Chứng chỉ" url={worker.certificate_file} isPdf={isPdf(worker.certificate_file)} /></div></section>
  </div>;
}

function DocumentCard({ label, url, isPdf }: { label: string; url: string | null; isPdf?: boolean }) {
  return <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"><div className="relative aspect-[1.55] bg-slate-100">{url && !isPdf ? <Image src={url} alt={label} fill sizes="240px" className="object-cover" /> : <div className="flex h-full items-center justify-center"><FileText className="h-7 w-7 text-slate-300" /></div>}</div><div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white p-2.5"><span className="truncate text-xs font-medium text-slate-600">{label}</span>{url ? <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-medium text-blue-600 hover:underline">Mở</a> : <span className="text-xs text-slate-400">Chưa có</span>}</div></div>;
}

function ActionContent({ view, reason, setReason, rejectedFields, setRejectedFields, isLoading, rejectionReady, onBack, onApprove, onReject, onRevoke, onSuspend, onReactivate }: {
  view: Exclude<ActionView, "DETAIL">; reason: string; setReason: (value: string) => void; rejectedFields: Partial<Record<RejectableField, string>>; setRejectedFields: React.Dispatch<React.SetStateAction<Partial<Record<RejectableField, string>>>>; isLoading: boolean; rejectionReady: boolean; onBack: () => void; onApprove: () => void; onReject: () => void; onRevoke: () => void; onSuspend: () => void; onReactivate: () => void;
}) {
  const destructive = view === "REJECT" || view === "REVOKE" || view === "SUSPEND";
  const descriptions = { APPROVE: "Sau khi duyệt, nhân viên có thể nhận việc phù hợp.", REJECT: "Chọn các nội dung chưa hợp lệ và ghi chú để nhân viên chỉnh sửa.", REVOKE: "Hồ sơ sẽ trở về trạng thái chưa hoàn tất để nhân viên cập nhật và gửi duyệt lại. Các phân công hiện tại không tự động bị hủy.", SUSPEND: "Nhân viên vẫn đăng nhập được nhưng không thể tự nhận hoặc được phân công công việc mới. Các phân công hiện tại không tự động bị hủy.", REACTIVATE: "Nhân viên sẽ xuất hiện lại trong danh sách phân công và có thể nhận công việc mới." };
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <Button type="button" variant="ghost" className="mb-4 -ml-2" onClick={onBack}><ArrowLeft className="h-4 w-4" />Quay lại hồ sơ</Button>
      <div className={`rounded-xl border p-4 ${destructive ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}><p className={`flex items-center gap-2 font-medium ${destructive ? "text-red-800" : "text-blue-800"}`}>{destructive ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}{actionTitle(view)}</p><p className={`mt-2 text-sm leading-6 ${destructive ? "text-red-700" : "text-blue-700"}`}>{descriptions[view]}</p></div>
      {(view === "SUSPEND" || view === "REVOKE") && <div className="mt-5"><label className="mb-2 block text-sm font-medium text-slate-800">{view === "REVOKE" ? "Lý do thu hồi" : "Lý do tạm khóa"} <span className="text-red-500">*</span></label><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={view === "REVOKE" ? "Nhập lý do thu hồi phê duyệt..." : "Nhập lý do tạm khóa hồ sơ nhân viên..."} maxLength={1000} /></div>}
      {view === "REJECT" && <div className="mt-5 space-y-3">{(Object.keys(FIELD_LABELS) as RejectableField[]).map((field) => { const checked = rejectedFields[field] !== undefined; return <div key={field} className={`rounded-lg border p-3 ${checked ? "border-red-200 bg-red-50/60" : "border-slate-200"}`}><div className="flex items-center gap-3"><Checkbox checked={checked} onCheckedChange={(value) => setRejectedFields((current) => { const next = { ...current }; if (value) next[field] = ""; else delete next[field]; return next; })} /><span className="text-sm font-medium text-slate-800">{FIELD_LABELS[field]}</span></div>{checked && <Input className="mt-3 bg-white" value={rejectedFields[field] ?? ""} onChange={(event) => setRejectedFields((current) => ({ ...current, [field]: event.target.value }))} placeholder={`Ghi chú lỗi của ${FIELD_LABELS[field].toLowerCase()}...`} />}</div>; })}</div>}
    </div>
    <DialogFooter className="mt-0 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
      <Button type="button" variant="outline" onClick={onBack}>Hủy</Button>
      {view === "APPROVE" && <Button type="button" onClick={onApprove} disabled={isLoading}>{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Xác nhận duyệt</Button>}
      {view === "REJECT" && <Button type="button" variant="destructive" onClick={onReject} disabled={isLoading || !rejectionReady}>{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Xác nhận từ chối</Button>}
      {view === "REVOKE" && <Button type="button" variant="destructive" onClick={onRevoke} disabled={isLoading || reason.trim().length < 3}>{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Xác nhận thu hồi</Button>}
      {view === "SUSPEND" && <Button type="button" variant="destructive" onClick={onSuspend} disabled={isLoading || reason.trim().length < 3}>{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Xác nhận tạm khóa</Button>}
      {view === "REACTIVATE" && <Button type="button" onClick={onReactivate} disabled={isLoading}>{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Kích hoạt lại</Button>}
    </DialogFooter>
  </div>;
}

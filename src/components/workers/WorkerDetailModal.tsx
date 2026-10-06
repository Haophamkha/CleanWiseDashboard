"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { UserWalletPanel } from "@/features/refunds/UserWalletPanel";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileInfoCard as InfoCard } from "@/components/ui/profile-info-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateWorkerStatusMutation } from "@/services/workerApi";
import type { WorkerProfile } from "@/types/Worker";
import WorkerReviewsPanel from "./WorkerReviewsPanel";
import WorkerSchedulePanel from "./WorkerSchedulePanel";
import { workerName, WorkerStatusBadge } from "./worker-ui";
import {
  FIELD_LABELS,
  getProfileSuggestions,
  type RejectableField,
  type ReviewNotes,
} from "./profile-review";

type ActionView =
  | "DETAIL"
  | "APPROVE"
  | "REJECT"
  | "REVOKE"
  | "SUSPEND"
  | "REACTIVATE";
const GENDER_LABEL: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const GENERAL_REASONS = [
  "Hồ sơ chưa đầy đủ, vui lòng bổ sung",
  "Một số thông tin chưa chính xác, vui lòng kiểm tra lại",
  "Giấy tờ không rõ nét, vui lòng chụp lại",
];

const SUSPEND_REASONS = [
  "Nhận nhiều đánh giá thấp từ khách hàng",
  "Có khiếu nại từ khách hàng đang được xử lý",
  "Vi phạm quy định của nền tảng",
  "Hồ sơ cần xác minh lại thông tin",
];

const FIELD_REASONS: Partial<Record<RejectableField, string[]>> = {
  first_name: ["Tên không khớp với CCCD", "Tên chứa ký tự không hợp lệ"],
  last_name: [
    "Họ và tên đệm không khớp với CCCD",
    "Họ và tên đệm chứa ký tự không hợp lệ",
  ],
  phone_number: [
    "Số điện thoại không hợp lệ",
    "Số điện thoại không liên lạc được",
  ],
  birth_date: ["Ngày sinh không khớp với CCCD", "Chưa đủ 18 tuổi"],
  gender: ["Giới tính không khớp với CCCD"],
  experience_years: [
    "Số năm kinh nghiệm chưa hợp lý",
    "Chưa có minh chứng cho kinh nghiệm đã khai",
  ],
  service_id: [
    "Dịch vụ đăng ký chưa phù hợp với kinh nghiệm",
    "Cần đăng ký lại đúng dịch vụ",
  ],
  identity_number: [
    "Số CCCD không khớp với ảnh giấy tờ",
    "Số CCCD không hợp lệ (cần 12 số)",
  ],
  bio: [
    "Giới thiệu quá ngắn, vui lòng bổ sung",
    "Giới thiệu chứa nội dung không phù hợp",
  ],
  portrait: [
    "Ảnh chân dung không rõ mặt",
    "Ảnh chân dung bị che mặt hoặc đeo kính râm",
    "Ảnh không phải ảnh chân dung",
  ],
  identity_front: [
    "Ảnh mặt trước CCCD bị mờ",
    "Ảnh mặt trước CCCD bị mất góc hoặc chói sáng",
    "Ảnh mặt trước CCCD không phải bản gốc",
  ],
  identity_back: [
    "Ảnh mặt sau CCCD bị mờ",
    "Ảnh mặt sau CCCD bị mất góc hoặc chói sáng",
    "Ảnh mặt sau CCCD không phải bản gốc",
  ],
  certificate_file: [
    "Chứng chỉ không rõ nét",
    "Chứng chỉ đã hết hạn",
    "Chứng chỉ không phù hợp với dịch vụ đăng ký",
  ],
};

function QuickReasons({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  if (!options.length) return null;
  const toggle = (text: string) => {
    if (value.includes(text)) {
      onChange(
        value
          .replace(text, "")
          .replace(/(\s*;\s*)+/g, "; ")
          .replace(/^[\s;]+|[\s;]+$/g, ""),
      );
    } else {
      onChange(value.trim() ? `${value.trim()}; ${text}` : text);
    }
  };
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {options.map((text) => {
        const active = value.includes(text);
        return (
          <button
            key={text}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(text)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${active ? "border-red-300 bg-red-100 text-red-700" : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50"}`}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

function errorMessage(error: unknown, fallback: string) {
  const data = (
    error as {
      data?: { message?: string; errors?: Record<string, string | string[]> };
    }
  )?.data;
  if (data?.message) return data.message;
  const first = data?.errors && Object.values(data.errors)[0];
  if (Array.isArray(first)) return first[0] ?? fallback;
  return typeof first === "string" ? first : fallback;
}

export default function WorkerDetailModal({
  worker,
  onClose,
}: {
  worker: WorkerProfile | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("profile");
  const [view, setView] = useState<ActionView>("DETAIL");
  const [reason, setReason] = useState("");
  const [rejectedFields, setRejectedFields] = useState<
    Partial<Record<RejectableField, string>>
  >({});
  const [updateStatus, { isLoading }] = useUpdateWorkerStatusMutation();

  if (!worker) return null;

  const name = workerName(worker);
  const showWorkTabs =
    worker.status === "ACTIVE" || worker.status === "SUSPENDED";
  const rejecting = view === "REJECT" || view === "REVOKE";
  const revoking = view === "REVOKE";
  const visibleTab = showWorkTabs && !rejecting ? tab : "profile";
  const suggestions = getProfileSuggestions(worker);
  const toggleField = (field: RejectableField) =>
    setRejectedFields((current) => {
      const next = { ...current };
      if (next[field] !== undefined) delete next[field];
      else next[field] = suggestions[field] ?? "";
      return next;
    });
  const selectedRejectFields = Object.entries(rejectedFields).filter(
    ([, note]) => note !== undefined,
  );
  const rejectionReady =
    (revoking
      ? reason.trim().length > 0 || selectedRejectFields.length > 0
      : selectedRejectFields.length > 0) &&
    selectedRejectFields.every(([, note]) => note?.trim());

  const updateWorker = async (
    status: "DRAFT" | "ACTIVE" | "REJECTED" | "SUSPENDED",
    payload?: { reason?: string; rejected_fields?: Record<string, string> },
  ) => {
    try {
      await updateStatus({ id: worker.id, status, ...payload }).unwrap();
      const messages = {
        DRAFT: "Đã thu hồi phê duyệt hồ sơ.",
        ACTIVE:
          worker.status === "SUSPENDED"
            ? "Đã kích hoạt lại hồ sơ nhân viên."
            : "Đã duyệt hồ sơ nhân viên.",
        REJECTED: "Đã từ chối hồ sơ nhân viên.",
        SUSPENDED: "Đã tạm khóa hồ sơ nhân viên.",
      };
      toast.success(messages[status]);
      onClose();
    } catch (error) {
      toast.error(
        errorMessage(error, "Không thể cập nhật trạng thái nhân viên."),
      );
    }
  };

  const submitReject = () => {
    const fields = Object.fromEntries(
      selectedRejectFields.map(([key, note]) => [key, note!.trim()]),
    );
    const summary = Object.entries(fields)
      .map(([key, note]) => `${FIELD_LABELS[key as RejectableField]}: ${note}`)
      .join(" | ");
    return updateWorker(revoking ? "DRAFT" : "REJECTED", {
      reason: reason.trim() || summary,
      rejected_fields: fields,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0 ${visibleTab === "schedule" && view === "DETAIL" ? "h-[90vh]" : ""}`}
      >
        <DialogHeader className="mb-0 shrink-0 border-b border-slate-200 px-6 pb-4 pt-6">
          <DialogTitle>
            {view === "DETAIL" || rejecting
              ? "Chi tiết nhân viên"
              : actionTitle(view)}
          </DialogTitle>
          <DialogDescription>
            {view === "DETAIL" || rejecting
              ? "Kiểm tra hồ sơ, lịch làm việc, đánh giá và quản lý trạng thái làm việc."
              : name}
          </DialogDescription>
        </DialogHeader>

        {view === "DETAIL" || rejecting ? (
          <Tabs
            value={visibleTab}
            onValueChange={setTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="shrink-0 border-b border-slate-200 px-6 py-3">
              <TabsList>
                <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
                {showWorkTabs && !rejecting && (
                  <>
                    <TabsTrigger value="schedule">Lịch làm việc</TabsTrigger>
                    <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
                    <TabsTrigger value="wallet">Ví</TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>
            <TabsContent
              value="profile"
              className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-5"
            >
              <ProfileContent
                worker={worker}
                rejecting={rejecting}
                revoking={revoking}
                reason={reason}
                onReason={setReason}
                notes={rejectedFields}
                suggestions={suggestions}
                onToggle={toggleField}
                onNote={(field, note) =>
                  setRejectedFields((current) => ({
                    ...current,
                    [field]: note,
                  }))
                }
                onUseSuggestions={() => {
                  setRejectedFields((current) => ({
                    ...suggestions,
                    ...current,
                  }));
                  setView("REJECT");
                }}
              />
            </TabsContent>
            {showWorkTabs && (
              <>
                <TabsContent
                  value="reviews"
                  className="mt-0 min-h-0 flex-1 overflow-hidden"
                >
                  <WorkerReviewsPanel worker={worker} />
                </TabsContent>
                <TabsContent
                  value="schedule"
                  className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
                >
                  {visibleTab === "schedule" && (
                    <WorkerSchedulePanel workerId={worker.user_id} />
                  )}
                </TabsContent>
                <TabsContent
                  value="wallet"
                  className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-5"
                >
                  {visibleTab === "wallet" && (
                    <UserWalletPanel userId={worker.user_id} />
                  )}
                </TabsContent>
              </>
            )}
            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
              {rejecting ? (
                <>
                  <p className="mr-auto self-center text-sm text-slate-500">
                    {selectedRejectFields.length} trường cần sửa
                  </p>
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => setView("DETAIL")}
                  >
                    {revoking ? "Hủy thu hồi" : "Hủy từ chối"}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isLoading || !rejectionReady}
                    onClick={submitReject}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {revoking ? "Xác nhận thu hồi quyền" : "Xác nhận từ chối"}
                  </Button>
                </>
              ) : (
                <Button type="button" variant="outline" onClick={onClose}>
                  Đóng
                </Button>
              )}
              {!rejecting &&
                visibleTab === "profile" &&
                worker.status === "PENDING" && (
                  <>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setView("REJECT")}
                    >
                      Từ chối hồ sơ
                    </Button>
                    <Button type="button" onClick={() => setView("APPROVE")}>
                      <ShieldCheck className="h-4 w-4" />
                      Duyệt hồ sơ
                    </Button>
                  </>
                )}
              {!rejecting &&
                visibleTab === "profile" &&
                worker.status === "ACTIVE" && (
                  <>
                    <Button
                      type="button"
                      variant="warning"
                      onClick={() => setView("REVOKE")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Thu hồi quyền Nhân viên
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setView("SUSPEND")}
                    >
                      <LockKeyhole className="h-4 w-4" />
                      Tạm khóa hồ sơ
                    </Button>
                  </>
                )}
              {!rejecting &&
                visibleTab === "profile" &&
                worker.status === "SUSPENDED" && (
                  <Button type="button" onClick={() => setView("REACTIVATE")}>
                    <CheckCircle2 className="h-4 w-4" />
                    Kích hoạt lại
                  </Button>
                )}
            </div>
          </Tabs>
        ) : (
          <ActionContent
            view={view}
            reason={reason}
            setReason={setReason}
            isLoading={isLoading}
            onBack={() => setView("DETAIL")}
            onApprove={() => updateWorker("ACTIVE")}
            onSuspend={() =>
              updateWorker("SUSPENDED", { reason: reason.trim() })
            }
            onReactivate={() => updateWorker("ACTIVE")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function actionTitle(view: ActionView) {
  return {
    DETAIL: "Chi tiết nhân viên",
    APPROVE: "Duyệt hồ sơ",
    REJECT: "Từ chối hồ sơ",
    REVOKE: "Thu hồi phê duyệt",
    SUSPEND: "Tạm khóa hồ sơ",
    REACTIVATE: "Kích hoạt lại hồ sơ",
  }[view];
}

type ReviewProps = {
  rejecting: boolean;
  revoking: boolean;
  reason: string;
  onReason: (value: string) => void;
  notes: ReviewNotes;
  suggestions: ReviewNotes;
  onToggle: (field: RejectableField) => void;
  onNote: (field: RejectableField, note: string) => void;
  onUseSuggestions: () => void;
};
function ProfileContent({
  worker,
  ...review
}: { worker: WorkerProfile } & ReviewProps) {
  const [preview, setPreview] = useState<{
    label: string;
    url: string;
    isPdf?: boolean;
  } | null>(null);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const wrap = (field: RejectableField, content: ReactNode) => (
    <ReviewField field={field} review={review}>
      {content}
    </ReviewField>
  );
  const isPdf = (url: string | null) =>
    Boolean(url?.toLowerCase().split("?")[0].endsWith(".pdf"));
  return (
    <div className="space-y-5">
      {review.rejecting && (
        <section className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">
              {review.revoking
                ? "Thu hồi quyền Nhân viên"
                : "Chọn thông tin cần sửa ngay trong hồ sơ"}
            </p>
            <p className="mt-1">
              {review.revoking
                ? "Nhập lý do chung hoặc đánh dấu từng trường cần sửa. Nhân viên cần cập nhật và gửi duyệt lại để nhận việc."
                : "Chọn ít nhất một trường cần sửa và ghi lý do bên dưới."}
            </p>
          </div>
          <div>
            <label
              htmlFor="profile-general-reason"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              {review.revoking ? "Lý do thu hồi chung" : "Lý do từ chối chung"}{" "}
              <span className="font-normal text-slate-500">
                (không bắt buộc nếu đã ghi lý do từng trường)
              </span>
            </label>
            <QuickReasons
              options={GENERAL_REASONS}
              value={review.reason}
              onChange={review.onReason}
            />
            <Textarea
              id="profile-general-reason"
              value={review.reason}
              onChange={(event) => review.onReason(event.target.value)}
              placeholder="Nhập nhận xét chung hoặc hướng dẫn nhân viên cập nhật hồ sơ..."
              maxLength={1000}
            />
          </div>
        </section>
      )}
      {worker.status === "PENDING" && !suggestionsDismissed && (
        <section className="relative rounded-xl border border-amber-200 bg-amber-50 p-4 pr-12">
          <button
            type="button"
            aria-label="Ẩn gợi ý kiểm tra hồ sơ"
            onClick={() => setSuggestionsDismissed(true)}
            className="absolute right-3 top-3 rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-600"
          >
            <X className="h-4 w-4" />
          </button>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Gợi ý kiểm tra hồ sơ
          </h4>
          {Object.keys(review.suggestions).length ? (
            <>
              <p className="mt-1 text-sm text-amber-800">
                Cần kiểm tra:{" "}
                {Object.keys(review.suggestions)
                  .map((field) => FIELD_LABELS[field as RejectableField])
                  .join(", ")}
                .
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 bg-white"
                onClick={review.onUseSuggestions}
              >
                Chọn các gợi ý
              </Button>
            </>
          ) : (
            <p className="mt-1 text-sm text-amber-800">
              Chưa thấy lỗi định dạng. Hãy đối chiếu ảnh giấy tờ.
            </p>
          )}
        </section>
      )}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-semibold text-blue-700">
          {worker.portrait ? (
            <Image
              src={worker.portrait}
              alt={workerName(worker)}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <UserRound className="h-8 w-8" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">
              {workerName(worker)}
            </h3>
            <WorkerStatusBadge status={worker.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">@{worker.username}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">
              <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
              {Number(worker.average_rating).toFixed(1)}
            </Badge>
            <Badge variant="outline">
              {worker.total_completed_jobs} việc hoàn thành
            </Badge>
            <Badge variant="secondary">
              Hồ sơ {worker.completion_percent}%
            </Badge>
          </div>
        </div>
      </div>

      {(["DRAFT", "REJECTED", "SUSPENDED"] as const).includes(
        worker.status as "DRAFT" | "REJECTED" | "SUSPENDED",
      ) &&
        worker.rejection_reason && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {worker.status === "SUSPENDED"
                ? "Lý do tạm khóa hồ sơ"
                : worker.status === "DRAFT"
                  ? "Lý do thu hồi phê duyệt"
                  : "Lý do từ chối"}
            </p>
            <p className="mt-1 text-sm leading-6 text-red-700/90">
              {worker.rejection_reason}
            </p>
          </div>
        )}

      <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {wrap(
          "first_name",
          <InfoCard
            icon={UserRound}
            label="Tên"
            value={worker.first_name || "Chưa cập nhật"}
          />,
        )}
        {wrap(
          "last_name",
          <InfoCard
            icon={UserRound}
            label="Họ và tên đệm"
            value={worker.last_name || "Chưa cập nhật"}
          />,
        )}
        {wrap(
          "phone_number",
          <InfoCard
            icon={Phone}
            label="Điện thoại"
            value={worker.phone_number || "Chưa cập nhật"}
          />,
        )}
        <InfoCard icon={Mail} label="Email" value={worker.email} />
        {wrap(
          "birth_date",
          <InfoCard
            icon={CalendarDays}
            label="Ngày sinh"
            value={
              worker.birth_date
                ? new Date(worker.birth_date).toLocaleDateString("vi-VN")
                : "Chưa cập nhật"
            }
          />,
        )}
        {wrap(
          "gender",
          <InfoCard
            icon={UserRound}
            label="Giới tính"
            value={
              worker.gender
                ? (GENDER_LABEL[worker.gender] ?? worker.gender)
                : "Chưa cập nhật"
            }
          />,
        )}
        {wrap(
          "experience_years",
          <InfoCard
            icon={BriefcaseBusiness}
            label="Kinh nghiệm"
            value={`${worker.experience_years} năm`}
          />,
        )}
        {wrap(
          "service_id",
          <InfoCard
            icon={BriefcaseBusiness}
            label="Dịch vụ"
            value={worker.registered_service?.name || "Chưa đăng ký"}
          />,
        )}
      </div>

      <section>
        <h4 className="mb-3 text-sm font-semibold text-slate-900">
          Thông tin nghề nghiệp
        </h4>
        <div className="grid items-start gap-3 sm:grid-cols-2">
          {wrap(
            "identity_number",
            <InfoCard
              icon={FileText}
              label="CCCD/CMND"
              value={worker.identity_number || "Chưa cập nhật"}
            />,
          )}
          {wrap(
            "bio",
            <InfoCard
              icon={UserRound}
              label="Giới thiệu"
              value={worker.bio || "Chưa cập nhật"}
            />,
          )}
        </div>
      </section>
      <section>
        <h4 className="mb-3 text-sm font-semibold text-slate-900">
          Giấy tờ hồ sơ
        </h4>
        <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              "portrait",
              "identity_front",
              "identity_back",
              "certificate_file",
            ] as const
          ).map((field) => (
            <ReviewField key={field} field={field} review={review} document>
              <DocumentCard
                label={FIELD_LABELS[field]}
                url={worker[field]}
                isPdf={isPdf(worker[field])}
                onOpen={() =>
                  worker[field] &&
                  setPreview({
                    label: FIELD_LABELS[field],
                    url: worker[field]!,
                    isPdf: isPdf(worker[field]),
                  })
                }
              />
            </ReviewField>
          ))}
        </div>
      </section>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="flex max-h-[90dvh] max-w-5xl flex-col overflow-hidden p-0">
          <DialogHeader className="mb-0 border-b p-5 pr-12">
            <DialogTitle>{preview?.label}</DialogTitle>
            <DialogDescription>
              Xem giấy tờ và đối chiếu thông tin hồ sơ.
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-[65dvh] min-h-0 bg-slate-100">
            {preview &&
              (preview.isPdf ? (
                <iframe
                  src={preview.url}
                  title={preview.label}
                  className="h-full w-full"
                />
              ) : (
                <Image
                  src={preview.url}
                  alt={preview.label}
                  fill
                  sizes="90vw"
                  className="object-contain p-3"
                />
              ))}
          </div>
          <DialogFooter className="m-0 border-t px-5 py-3">
            <Button variant="outline" onClick={() => setPreview(null)}>
              Đóng ảnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewField({
  field,
  review,
  children,
  document = false,
}: {
  field: RejectableField;
  review: ReviewProps;
  children: ReactNode;
  document?: boolean;
}) {
  const selected = review.notes[field] !== undefined;
  if (!review.rejecting) return <>{children}</>;
  return (
    <div
      className={`min-w-0 rounded-lg border-2 transition-colors ${selected ? "border-red-400 bg-red-50" : "border-transparent hover:border-red-200"}`}
    >
      {document ? (
        <>
          {children}
          <Button
            type="button"
            variant={selected ? "destructive" : "outline"}
            size="sm"
            className="m-2"
            aria-pressed={selected}
            onClick={() => review.onToggle(field)}
          >
            {selected ? "Đã chọn cần sửa" : "Đánh dấu cần sửa"}
          </Button>
        </>
      ) : (
        <button
          type="button"
          className="flex w-full flex-col gap-2 p-2 text-left"
          aria-label={`Đánh dấu ${FIELD_LABELS[field]} cần sửa`}
          aria-pressed={selected}
          onClick={() => review.onToggle(field)}
        >
          {children}
          <span
            className={`mx-1 inline-flex self-start rounded-md px-2 py-1 text-xs font-medium ${selected ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}
          >
            {selected ? "Đã chọn · Bỏ chọn" : "Đánh dấu cần sửa"}
          </span>
        </button>
      )}
      {selected && (
        <div className="px-3 pb-3">
          <label
            htmlFor={`reason-${field}`}
            className="mb-1.5 block text-xs font-medium text-red-800"
          >
            Lý do cần sửa {FIELD_LABELS[field].toLowerCase()} *
          </label>
          <QuickReasons
            options={FIELD_REASONS[field] ?? []}
            value={review.notes[field] ?? ""}
            onChange={(note) => review.onNote(field, note)}
          />
          <Textarea
            id={`reason-${field}`}
            value={review.notes[field] ?? ""}
            onChange={(event) => review.onNote(field, event.target.value)}
            placeholder="Nêu thông tin chưa đúng và hướng dẫn chỉnh sửa..."
            className="min-h-20 bg-white"
            maxLength={1000}
          />
        </div>
      )}
    </div>
  );
}

function DocumentCard({
  label,
  url,
  isPdf,
  onOpen,
}: {
  label: string;
  url: string | null;
  isPdf?: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={onOpen}
        disabled={!url}
        aria-label={`Xem ${label}`}
        className="relative block aspect-[1.55] w-full bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        {url && !isPdf ? (
          <Image
            src={url}
            alt={label}
            fill
            sizes="240px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-7 w-7 text-slate-300" />
          </div>
        )}
      </button>
      <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white p-2.5">
        <span className="truncate text-xs font-medium text-slate-600">
          {label}
        </span>
        {url ? (
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
          >
            Mở
          </button>
        ) : (
          <span className="text-xs text-slate-400">Chưa có</span>
        )}
      </div>
    </div>
  );
}

function ActionContent({
  view,
  reason,
  setReason,
  isLoading,
  onBack,
  onApprove,
  onSuspend,
  onReactivate,
}: {
  view: Exclude<ActionView, "DETAIL" | "REJECT" | "REVOKE">;
  reason: string;
  setReason: (value: string) => void;
  isLoading: boolean;
  onBack: () => void;
  onApprove: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  const destructive = view === "SUSPEND";
  const descriptions = {
    APPROVE: "Sau khi duyệt, nhân viên có thể nhận việc phù hợp.",
    REJECT: "Chọn các nội dung chưa hợp lệ và ghi chú để nhân viên chỉnh sửa.",
    REVOKE:
      "Hồ sơ sẽ trở về trạng thái chưa hoàn tất để nhân viên cập nhật và gửi duyệt lại. Các phân công hiện tại không tự động bị hủy.",
    SUSPEND:
      "Nhân viên vẫn đăng nhập được nhưng không thể tự nhận hoặc được phân công công việc mới. Các phân công hiện tại không tự động bị hủy.",
    REACTIVATE:
      "Nhân viên sẽ xuất hiện lại trong danh sách phân công và có thể nhận công việc mới.",
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <Button
          type="button"
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại hồ sơ
        </Button>
        <div
          className={`rounded-xl border p-4 ${destructive ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}
        >
          <p
            className={`flex items-center gap-2 font-medium ${destructive ? "text-red-800" : "text-blue-800"}`}
          >
            {destructive ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
            {actionTitle(view)}
          </p>
          <p
            className={`mt-2 text-sm leading-6 ${destructive ? "text-red-700" : "text-blue-700"}`}
          >
            {descriptions[view]}
          </p>
        </div>
        {view === "SUSPEND" && (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Lý do tạm khóa <span className="text-red-500">*</span>
            </label>
            <QuickReasons
              options={SUSPEND_REASONS}
              value={reason}
              onChange={setReason}
            />
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Nhập lý do tạm khóa hồ sơ nhân viên..."
              maxLength={1000}
            />
          </div>
        )}
      </div>
      <DialogFooter className="mt-0 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Hủy
        </Button>
        {view === "APPROVE" && (
          <Button type="button" onClick={onApprove} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Xác nhận
            duyệt
          </Button>
        )}
        {view === "SUSPEND" && (
          <Button
            type="button"
            variant="destructive"
            onClick={onSuspend}
            disabled={isLoading || reason.trim().length < 3}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Xác nhận
            tạm khóa
          </Button>
        )}
        {view === "REACTIVATE" && (
          <Button type="button" onClick={onReactivate} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Kích hoạt
            lại
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}

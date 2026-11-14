"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, CreditCard, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileInfoCard } from "@/components/ui/profile-info-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatComplaintDate } from "./complaint-format";
import {
  useGetComplaintDetailQuery,
  useGetComplaintPreviewQuery,
  useResolveComplaintMutation,
} from "@/services/complaintApi";
import { vnd } from "@/features/refunds/refund-utils";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { ComplaintHistory, ComplaintWorkflowPanel } from "./ComplaintWorkflowPanel";
import { CustomerDetailModal } from "@/features/customers/CustomerDetailModal";
import WorkerDetailModal from "@/components/workers/WorkerDetailModal";
import { useGetWorkerProfileByUserQuery } from "@/services/workerApi";
import { SupportChatPanel } from "@/features/chat/SupportChatPanel";
import type {
  ComplaintOutcome,
  ComplaintReporterRole,
  ResolveComplaintRequest,
} from "@/types/Complaint";

const RESOLVE_ACTIONS: {
  status: ResolveComplaintRequest["status"];
  label: string;
  variant: "outline" | "default" | "destructive";
}[] = [
  {
    status: "IN_REVIEW",
    label: "Đánh dấu đang xem xét",
    variant: "outline",
  },
  {
    status: "RESOLVED",
    label: "Đã xử lý xong",
    variant: "default",
  },
  {
    status: "REJECTED",
    label: "Từ chối khiếu nại",
    variant: "destructive",
  },
];

const OUTCOME_LABEL: Record<Exclude<ComplaintOutcome, "">, string> = {
  REFUND_CUSTOMER: "Đã hoàn tiền cho khách",
  PAY_WORKER: "Đã trả thu nhập cho nhân viên",
  RECOVER_WORKER_EARNING: "Đã xử lý thu hồi tiền công nhân viên",
};

const OUTCOME_OPTIONS: Record<
  ComplaintReporterRole,
  { value: ComplaintOutcome; label: string; hint?: string }[]
> = {
  CUSTOMER: [
    { value: "", label: "Chỉ xử lý, không đụng tiền" },
    {
      value: "REFUND_CUSTOMER",
      label: "Hoàn tiền cho khách",
      hint: "Hoàn đúng phần tiền của buổi này vào ví khách, không vượt phần đã thu và không hoàn trùng.",
    },
    {
      value: "RECOVER_WORKER_EARNING",
      label: "Thu hồi tiền công nhân viên",
      hint: "Chỉ điều chỉnh ví nhân viên theo khiếu nại này. Khoản khách đã thanh toán được giữ nguyên.",
    },
  ],
  WORKER: [
    { value: "", label: "Chỉ xử lý, không đụng tiền" },
    {
      value: "PAY_WORKER",
      label: "Trả thu nhập cho nhân viên",
      hint: "Cộng thu nhập buổi này vào ví nhân viên. Thu hồi từ ví khách tối đa số dư hiện có, phần thiếu do nền tảng chịu.",
    },
  ],
};

const isImageFile = (fileType: string, fileUrl: string) => {
  if (fileType?.startsWith("image/")) {
    return true;
  }

  return /\.(jpe?g|png|webp|gif)$/i.test(fileUrl);
};

/** "+50.000đ" / "−50.000đ" / "—" */
const signed = (value: string | null | undefined) => {
  const n = Number(value ?? 0);
  if (!n) return "—";

  return `${n > 0 ? "+" : "−"}${vnd(Math.abs(n))}`;
};

/**
 * Đọc lỗi từ BE:
 * { message, errors: { field: string | string[] } }
 * hoặc kiểu DRF mặc định.
 */
const readApiError = (err: unknown, fallback: string): string => {
  const data = (err as { data?: Record<string, unknown> } | null)?.data;

  const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

  const fromErrors = data?.errors
    ? first(Object.values(data.errors)[0])
    : undefined;

  return String(
    fromErrors ||
      first(data?.outcome) ||
      first(data?.non_field_errors) ||
      data?.detail ||
      data?.message ||
      fallback,
  );
};

export function ComplaintDetailPage({ complaintId, fromDiscipline }: { complaintId: number; fromDiscipline: boolean }) {
  const [profile, setProfile] = useState<{ role: "customer" | "worker"; id: number; name: string } | null>(null);
  const workerProfile = useGetWorkerProfileByUserQuery(profile?.id ?? 0, { skip: profile?.role !== "worker" });
  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useGetComplaintDetailQuery(complaintId, { refetchOnMountOrArgChange: true });

  const [resolveComplaint, { isLoading: isResolving }] =
    useResolveComplaintMutation();

  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ComplaintOutcome>("");
  const [chargeWorker, setChargeWorker] = useState(true);

  const isWorkerReporter = detail?.reporter_role === "WORKER";
  const relatedWorkerId = detail?.worker;
  const isDiscipline = !!detail?.discipline_case;
  const hasSchedule = !!detail?.schedule;

  const outcomeOptions = OUTCOME_OPTIONS[detail?.reporter_role ?? "CUSTOMER"].filter((option) => {
    if (option.value === "REFUND_CUSTOMER") return !detail?.booking_is_cash && !detail?.service_used;
    if (option.value === "RECOVER_WORKER_EARNING") {
      return !!detail?.service_used && !!detail.worker && !detail.booking_is_cash;
    }
    return true;
  });

  const selectedOption = outcomeOptions.find((o) => o.value === outcome);

  const isOpen = detail?.status === "PENDING" || detail?.status === "IN_REVIEW";
  const usesWorkflow = detail?.reporter_role === "CUSTOMER";

  const previewReady = isOpen && !usesWorkflow && hasSchedule && !isDiscipline && !!selectedOption?.value;

  const preview = useGetComplaintPreviewQuery(
    {
      id: complaintId,
      outcome: outcome as Exclude<ComplaintOutcome, "">,
      charge_worker: outcome === "REFUND_CUSTOMER" ? chargeWorker : undefined,
    },
    {
      skip: !previewReady,
      refetchOnMountOrArgChange: true,
    },
  );

  const previewError = preview.isError
    ? readApiError(preview.error, "Không tính được số tiền.")
    : null;

  const handleResolve = async (status: ResolveComplaintRequest["status"]) => {
    setError(null);

    if (status === "RESOLVED" && outcome !== "" && !isDiscipline) {
      if (!previewReady || preview.isFetching || preview.isError || !preview.currentData) return;
      if (outcome === "RECOVER_WORKER_EARNING" && !note.trim()) {
        setError("Vui lòng nhập căn cứ thu hồi tiền công.");
        return;
      }
    }

    // Tiền chỉ được xử lý kèm "Đã xử lý xong".
    const moneyPart =
      status === "RESOLVED" && !isDiscipline && outcome !== ""
        ? {
            outcome,
            ...(outcome === "REFUND_CUSTOMER"
              ? { charge_worker: chargeWorker }
              : {}),
          }
        : {};

    if (
      "outcome" in moneyPart &&
      !window.confirm(
        `Xác nhận: ${selectedOption?.label}?\nSố tiền do hệ thống tính và không thể hoàn tác.`,
      )
    ) {
      return;
    }

    try {
      await resolveComplaint({
        id: complaintId,
        status,
        resolution_note: note.trim() || undefined,
        ...moneyPart,
      }).unwrap();

    } catch (err) {
      setError(
        readApiError(err, "Xử lý khiếu nại thất bại. Vui lòng thử lại."),
      );
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <Button asChild variant="outline" size="sm">
          <Link href={fromDiscipline ? "/complaints?tab=discipline" : "/complaints"}>
            <ArrowLeft className="size-4" aria-hidden /> Quay lại danh sách
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Chi tiết khiếu nại</h1>
          {detail && <p className="mt-1 text-sm text-slate-500">
            {detail.code ?? `#${detail.id}`} · {detail.issue_type_name}
          </p>}
        </div>
      </header>
      {isLoading && <Skeleton className="h-32 w-full rounded-lg" />}
      {isError && (
        <div className="space-y-3 py-6 text-center">
          <p className="text-sm text-red-600">Không tải được chi tiết khiếu nại.</p>
          <Button variant="outline" onClick={() => void refetch()}>Thử lại</Button>
        </div>
      )}
      {detail && (
        <div className={usesWorkflow ? "grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "space-y-4"}>
          <Card className="min-w-0">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Thông tin hồ sơ</CardTitle>
                <ComplaintStatusBadge status={detail.status} workflowStatus={detail.proposal?.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {isWorkerReporter && <ProfileInfoCard icon={UserRound} label="Nhân viên gửi"
                  value={detail.reporter_name || `#${detail.reporter}`}
                  onClick={() => setProfile({ role: "worker", id: detail.reporter, name: detail.reporter_name })} />}
                <ProfileInfoCard icon={UserRound} label={isWorkerReporter ? "Khách hàng của đơn" : "Khách hàng gửi"}
                  value={detail.customer_name || (!isWorkerReporter ? detail.reporter_name : "") || (detail.customer_id ? `#${detail.customer_id}` : "Chưa xác định")}
                  onClick={detail.customer_id || !isWorkerReporter ? () => setProfile({
                    role: "customer", id: detail.customer_id ?? detail.reporter, name: detail.customer_name || detail.reporter_name,
                  }) : undefined} />
                {(!isWorkerReporter || (relatedWorkerId && relatedWorkerId !== detail.reporter)) && (
                  <ProfileInfoCard icon={UsersRound} label="Nhân viên liên quan"
                    value={detail.worker_name || (relatedWorkerId ? `#${relatedWorkerId}` : "Chưa xác định")}
                    onClick={relatedWorkerId ? () => setProfile({ role: "worker", id: relatedWorkerId, name: detail.worker_name ?? "" }) : undefined} />
                )}
                <ProfileInfoCard icon={CalendarDays} label="Đơn / buổi"
                  value={`${detail.booking_code || `#${detail.booking}`}${detail.schedule_sequence_no ? ` · Buổi ${detail.schedule_sequence_no}` : ""}`} />
                <ProfileInfoCard icon={Clock3} label="Giai đoạn" value={detail.stage_label} />
                {detail.scheduled_start && <ProfileInfoCard icon={CalendarDays} label="Lịch dự kiến" value={formatComplaintDate(detail.scheduled_start)} />}
                {detail.actual_start && <ProfileInfoCard icon={Clock3} label="Bắt đầu thực tế" value={formatComplaintDate(detail.actual_start)} />}
                <ProfileInfoCard icon={CreditCard} label="Thanh toán" value={detail.booking_is_cash ? "Tiền mặt" : "Qua hệ thống"} />
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/bookings/${detail.booking}`}>Xem đơn dịch vụ</Link>
              </Button>
              <div className="space-y-1 border-t border-slate-100 pt-3">
                <h4 className="text-sm font-semibold text-slate-900">Phản ánh của người gửi</h4>
                <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{detail.content || "Chưa có nội dung bổ sung."}</p>
                {detail.requested_resolution_label && (
                  <p className="text-sm text-slate-600">Mong muốn: {detail.requested_resolution_label}</p>
                )}
              </div>
              {detail.attachments.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Ảnh minh chứng ({detail.attachments.length})
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {detail.attachments.map((attachment) =>
                      isImageFile(attachment.file_type, attachment.file) ? (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() => setZoomedImage(attachment.file)}
                          className="group relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={attachment.file}
                            alt={`Đính kèm #${attachment.id}`}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />

                          <span className="absolute inset-0 hidden items-center justify-center bg-black/30 group-hover:flex">
                            <span className="text-xs font-medium text-white">
                              Xem lớn
                            </span>
                          </span>
                        </button>
                      ) : (
                        <a
                          key={attachment.id}
                          href={attachment.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-gray-200 bg-gray-50 p-2 text-center text-xs text-blue-600 underline hover:text-blue-800"
                        >
                          <span>Tệp #{attachment.id}</span>

                          <span className="text-[10px] text-gray-400 no-underline">
                            {attachment.file_type}
                          </span>
                        </a>
                      ),
                    )}
                  </div>
                </div>
              )}

              {detail.resolution_note && (
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-700">
                    Ghi chú xử lý
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {detail.resolution_note}
                  </p>

                  {detail.resolved_by_name && (
                    <p className="mt-2 text-xs text-gray-400">
                      Xử lý bởi: {detail.resolved_by_name}
                    </p>
                  )}
                </div>
              )}

              {detail.outcome && (
                <div className="space-y-1 rounded-md bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">
                    {OUTCOME_LABEL[detail.outcome]}
                  </p>

                  <p className="text-sm text-green-800">
                    Ví khách hàng: <b>{signed(detail.customer_delta)}</b>
                  </p>

                  <p className="text-sm text-green-800">
                    Ví nhân viên: <b>{signed(detail.worker_delta)}</b>
                  </p>

                  {Number(detail.shortfall) > 0 && (
                    <p className="text-xs text-amber-700">
                      Không thu hồi được {vnd(Number(detail.shortfall))} do ví
                      không đủ (nền tảng chịu).
                    </p>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          {usesWorkflow && (
            <Card className="min-w-0">
              <Tabs defaultValue="workflow" className="min-w-0">
                <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
                  <TabsList aria-label="Nội dung xử lý khiếu nại" className="h-auto flex-wrap">
                    <TabsTrigger value="workflow">Xử lý hồ sơ</TabsTrigger>
                    <TabsTrigger value="history">Nhật ký hồ sơ</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="workflow" forceMount className="mt-0 p-4 data-[state=inactive]:hidden sm:p-5">
                  <ComplaintWorkflowPanel key={detail.id} detail={detail} />
                </TabsContent>
                <TabsContent value="history" className="mt-0 p-4 sm:p-5">
                  <ComplaintHistory detail={detail} />
                </TabsContent>
              </Tabs>
            </Card>
          )}

          {!usesWorkflow && isOpen && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <Textarea aria-label="Ghi chú xử lý"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);

                  if (error) {
                    setError(null);
                  }
                }}
                placeholder={isDiscipline ? "Căn cứ xử lý (bắt buộc khi kết luận)" : "Ghi chú xử lý (tùy chọn)"}
                rows={4}
              />

              {isDiscipline ? (
                <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                  Chấp nhận khiếu nại sẽ miễn điểm và tính lại giới hạn nhận việc hoặc quyết định xử lý hồ sơ.
                </p>
              ) : <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">
                  Xử lý tiền
                </p>
                {detail.service_used && !isWorkerReporter ? (
                  <p className="text-xs text-slate-600">
                    Khách đã sử dụng dịch vụ và vẫn thanh toán theo đơn.
                  </p>
                ) : detail.booking_is_cash && !isWorkerReporter && (
                  <p className="text-xs text-amber-700">
                    Đơn tiền mặt: khách đã trả trực tiếp cho nhân viên nên
                    không hoàn qua ví được.
                  </p>
                )}
                {!hasSchedule ? (
                  <p className="text-sm text-slate-600">
                    Khiếu nại chưa gắn buổi làm nên không xử lý tiền được.
                  </p>
                ) : (
                  outcomeOptions.map((option) => (
                    <label
                      key={option.value || "none"}
                      className="flex cursor-pointer items-start gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name="complaint-outcome"
                        className="mt-1"
                        checked={outcome === option.value}
                        onChange={() => {
                          setOutcome(option.value);

                          if (error) {
                            setError(null);
                          }
                        }}
                      />

                      <span>
                        <span className="text-slate-900">{option.label}</span>

                        {option.hint && outcome === option.value && (
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {option.hint}
                          </span>
                        )}
                      </span>
                    </label>
                  ))
                )}

                {outcome === "REFUND_CUSTOMER" && (
                  <label className="flex cursor-pointer items-center gap-2 border-t border-slate-100 pt-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={chargeWorker}
                      onChange={(e) => setChargeWorker(e.target.checked)}
                    />
                    Hủy / thu hồi thu nhập buổi này của nhân viên
                  </label>
                )}

                {previewReady && (
                  <div className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Dự kiến sau khi xác nhận
                    </p>

                    {preview.isFetching ? (
                      <p className="text-slate-500">Đang tính...</p>
                    ) : previewError ? (
                      <p className="text-red-600">{previewError}</p>
                    ) : preview.currentData ? (
                      <div className="space-y-0.5">
                        <p>
                          Ví khách hàng:{" "}
                          <b>{signed(preview.currentData.customer_delta)}</b>
                        </p>

                        <p>
                          Ví nhân viên:{" "}
                          <b>{signed(preview.currentData.worker_delta)}</b>
                        </p>

                        {Number(preview.currentData.shortfall) > 0 && (
                          <p className="text-xs text-amber-700">
                            Không thu hồi được{" "}
                            {vnd(Number(preview.currentData.shortfall))} (nền tảng
                            chịu).
                          </p>
                        )}

                        {preview.currentData.notes.map((note) => (
                          <p key={note} className="text-xs text-slate-500">
                            {note}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  Số tiền do hệ thống tính. Tiền chỉ được xử lý khi bấm
                  &ldquo;Đã xử lý xong&rdquo;.
                </p>
              </div>

              }
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex flex-wrap gap-2">
                {RESOLVE_ACTIONS.map((action) => (
                  <Button
                    key={action.status}
                    variant={action.variant}
                    type="button"
                    disabled={
                      isResolving ||
                      (action.status === "RESOLVED" &&
                        outcome !== "" && !isDiscipline &&
                        (!previewReady || preview.isFetching || preview.isError || !preview.currentData))
                    }
                    onClick={() => handleResolve(action.status)}
                  >
                    {isResolving ? "Đang xử lý..." : isDiscipline && action.status === "RESOLVED" ? "Chấp nhận và miễn điểm" : action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!usesWorkflow && detail.status === "CANCELLED" && (
            <p className="border-t border-gray-100 pt-4 text-sm text-gray-500">
              Khiếu nại đã được người gửi hủy.
            </p>
          )}

          {!usesWorkflow && (detail.status === "RESOLVED" || detail.status === "REJECTED") && (
            <p className="border-t border-gray-100 pt-4 text-sm text-gray-500">
              Khiếu nại này đã kết thúc, không thể xử lý thêm.
            </p>
          )}
        </div>
      )}

      <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
        {zoomedImage && (
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Ảnh minh chứng</DialogTitle>
              <DialogDescription>Ảnh đính kèm của hồ sơ khiếu nại.</DialogDescription>
            </DialogHeader>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomedImage} alt="Ảnh minh chứng phóng to" className="mx-auto max-h-[70dvh] max-w-full rounded-lg object-contain" />
          </DialogContent>
        )}
      </Dialog>
      {profile?.role === "customer" && (
        <CustomerDetailModal key={profile.id} id={profile.id} onClose={() => setProfile(null)} />
      )}
      {profile?.role === "worker" && (
        workerProfile.currentData ? (
          <WorkerDetailModal key={profile.id} worker={workerProfile.currentData} onClose={() => setProfile(null)} />
        ) : (
          <Dialog open onOpenChange={(open) => !open && setProfile(null)}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Chi tiết nhân viên</DialogTitle>
                <DialogDescription>{profile.name || `Nhân viên #${profile.id}`}</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="profile">
                <TabsList>
                  <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
                  <TabsTrigger value="contact">Nhắn tin liên hệ</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-3 py-2">
                  {workerProfile.isFetching ? <Skeleton className="h-16 w-full" /> : workerProfile.isError ? (
                    <>
                      <p className="text-sm text-destructive">Không tải được hồ sơ nhân viên.</p>
                      <Button variant="outline" onClick={() => void workerProfile.refetch()}>Thử lại</Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Hồ sơ nhân viên chưa được tạo.</p>
                  )}
                </TabsContent>
                <TabsContent value="contact" className="h-[min(24rem,55dvh)]">
                  <SupportChatPanel userId={profile.id} name={profile.name || `Nhân viên #${profile.id}`} role="worker" />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )
      )}
    </div>
  );
}

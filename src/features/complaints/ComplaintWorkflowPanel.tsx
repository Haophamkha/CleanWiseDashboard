"use client";

import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarClock, Check, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ProfileInfoCard } from "@/components/ui/profile-info-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatComplaintDate as formatDate } from "./complaint-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/ui/status-pill";
import { BookingDetailLink } from "@/features/bookings/BookingDetailLink";
import { ComplaintOrderLink } from "./ComplaintOrderLink";
import { useDebounced, vnd } from "@/features/refunds/refund-utils";
import { apiError } from "@/lib/api-error";
import { useUpdateComplaintWorkflowMutation } from "@/services/complaintApi";
import { useGetVouchersQuery } from "@/services/voucherApi";
import { useSearchBookingWorkersQuery } from "@/services/bookingApi";
import type { ComplaintDetail, ComplaintWorkflowRequest } from "@/types/Complaint";

const actions = {
  ACK: "Phản hồi khách",
  REQUEST: "Yêu cầu bổ sung thông tin",
  REQUEST_WORKER: "Gửi yêu cầu giải trình",
  VERIFY: "Ghi xác minh",
  OFFER: "Gửi phương án",
  REJECT: "Từ chối khiếu nại",
  COMPLETE: "Hoàn tất phương án",
  SCHEDULE_REDO: "Tạo buổi làm lại",
} as const;

type FormAction = keyof typeof actions;
type ComplaintEvent = NonNullable<ComplaintDetail["events"]>[number];

const workflowSteps = ["Tiếp nhận", "Xác minh", "Phương án", "Kết quả"];

const customerMessageKinds = new Set(["REPLY", "REVISE", "REOPEN"]);
const statementLabels = {
  OPEN: "Chờ nhân viên giải trình",
  SUBMITTED: "Nhân viên đã giải trình",
  EXPIRED: "Đã hết hạn phản hồi",
  CLOSED: "Đã đóng yêu cầu giải trình",
};

function CustomerComplaintMessage({ event }: { event: ComplaintEvent }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-medium text-slate-900">{event.label}</p>
        <time className="text-xs text-slate-600" dateTime={event.created_at}>
          {formatDate(event.created_at)}
        </time>
      </div>
      <p className="whitespace-pre-wrap break-words text-slate-700">{event.message}</p>
    </div>
  );
}

function WorkflowSelect({ label, children, ...props }: {
  label: string;
  children: ReactNode;
} & React.ComponentProps<typeof Select>) {
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium text-slate-700">{label}</p>
      <Select {...props}>
        <SelectTrigger aria-label={label}><SelectValue placeholder="Chọn…" /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function localDateTime(value: string) {
  return value ? new Date(`${value}+07:00`).toISOString() : undefined;
}

export function ComplaintWorkflowPanel({ detail, onPreviewImage }: {
  detail: ComplaintDetail;
  onPreviewImage: (url: string) => void;
}) {
  const [update, { isLoading }] = useUpdateComplaintWorkflowMutation();
  const [action, setAction] = useState<FormAction | null>(null);
  const [service, setService] = useState("");
  const [refund, setRefund] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const workerQuery = useDebounced(workerSearch).trim();
  const { currentData: workers, isFetching: workersLoading } = useSearchBookingWorkersQuery(
    { search: workerQuery, page: 1 }, { skip: action !== "OFFER" || service !== "CHANGE" },
  );
  const [error, setError] = useState("");
  const proposal = detail.proposal;
  const statement = detail.worker_statement;
  const redoEarnings = detail.redo_earnings;
  const supplement = detail.supplement;
  const supplementStatus = supplement && {
    PENDING: { label: "Chờ khách bổ sung", className: "border-blue-200 bg-blue-50 text-blue-900" },
    SUBMITTED: { label: "Khách đã bổ sung", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
    CLOSED: { label: "Yêu cầu đã đóng", className: "border-slate-200 bg-slate-50 text-slate-700" },
  }[supplement.status];
  const [latestCustomerMessage, ...earlierCustomerMessages] = (detail.events ?? [])
    .filter((event) => event.is_public && customerMessageKinds.has(event.kind))
    .reverse();
  const verified = detail.events?.some((event) => event.kind === "VERIFY");
  const acknowledged = detail.events?.some((event) => event.kind === "ACK");
  const canPropose = verified && acknowledged;
  const open = detail.status === "PENDING" || detail.status === "IN_REVIEW";
  const canEdit = open && detail.can_manage_workflow;
  const currentStep = !open ? 3 : proposal?.status === "ACCEPTED" ? 3
    : proposal?.status === "SENT" ? 2 : detail.assigned_to ? 1 : 0;
  const { data: vouchers, isError: voucherError } = useGetVouchersQuery(
    { distribution_type: "ASSIGNED", is_active: true }, { skip: action !== "OFFER" },
  );

  const selectAction = (next: FormAction | null) => {
    setAction(next);
    setService("");
    setRefund("");
    setWorkerSearch("");
    setError("");
  };

  async function send(payload: Omit<ComplaintWorkflowRequest, "id">) {
    setError("");
    try {
      await update({ id: detail.id, ...payload }).unwrap();
      selectAction(null);
    } catch (err) {
      setError(apiError(err));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    const values = new FormData(event.currentTarget);
    const value = (key: string) => String(values.get(key) ?? "").trim();
    const payload: Omit<ComplaintWorkflowRequest, "id"> = { action };
    if (action !== "SCHEDULE_REDO") payload.message = value("message");
    if (action === "ACK") payload.next_update_at = localDateTime(value("next_update_at"));
    if (action === "REQUEST_WORKER") payload.worker_due_at = localDateTime(value("worker_due_at"));
    if (action === "REJECT") {
      payload.basis = value("basis");
      payload.reopen_instructions = value("reopen_instructions");
    }
    if (action === "OFFER") {
      if (service === "REDO" || service === "CHANGE") {
        payload.service_action = service;
        payload.scheduled_start = localDateTime(value("scheduled_start"));
      }
      if (service === "CHANGE") {
        const workerId = Number(value("worker"));
        if (!workerId) {
          setError("Chọn nhân viên dự kiến.");
          return;
        }
        payload.worker = workerId;
      }
      if (value("voucher") && value("voucher") !== "none") payload.voucher = Number(value("voucher"));
      if (refund === "SESSION" || refund === "BOOKING" || refund === "PARTIAL" || refund === "CASH") {
        payload.refund_scope = refund;
        payload.refund_amount = value("refund_amount") || undefined;
      }
    }
    if (["OFFER", "REJECT", "COMPLETE", "SCHEDULE_REDO"].includes(action)) payload.proposal_id = proposal?.id;
    if (action === "SCHEDULE_REDO") {
      payload.recover_worker_earning = values.has("recover_worker_earning");
      if (payload.recover_worker_earning) payload.recovery_basis = value("recovery_basis");
    }
    if (action === "COMPLETE") {
      payload.cash_reference = value("cash_reference") || undefined;
      payload.recover_worker_earning = values.has("recover_worker_earning");
    }
    void send(payload);
  }

  return (
    <section className="@container space-y-4">
      <ol aria-label="Tiến độ xử lý" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {workflowSteps.map((step, index) => (
          <li key={step} aria-current={index === currentStep ? "step" : undefined}
            className={`flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium ${index === currentStep ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"}`}>
            {index < currentStep && <Check className="size-3.5 shrink-0 text-blue-600" aria-hidden />}
            {step}
          </li>
        ))}
      </ol>
      <div className="grid gap-2 sm:grid-cols-2">
        <ProfileInfoCard icon={UserRound} label="Người phụ trách" value={detail.assigned_to_name || "Chưa phân công"} />
        <ProfileInfoCard icon={CalendarClock} label="Thời gian phản hồi" value={detail.next_update_at ? formatDate(detail.next_update_at) : "Chưa xác định"} />
      </div>
      {(supplement || latestCustomerMessage) && (
        <div className={`grid gap-2 ${supplement && latestCustomerMessage ? "@lg:grid-cols-2" : ""}`}>
          {supplement && supplementStatus && (
            <Card className={`min-h-17 min-w-0 rounded-lg shadow-none ${supplementStatus.className}`}>
              <CardContent className="space-y-1 p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <CardTitle className="text-sm text-inherit">{supplementStatus.label}</CardTitle>
                  {supplement.submitted_at && (
                    <time className="text-xs" dateTime={supplement.submitted_at}>
                      {formatDate(supplement.submitted_at)}
                    </time>
                  )}
                </div>
                <p className="whitespace-pre-wrap wrap-anywhere">{supplement.message}</p>
              </CardContent>
            </Card>
          )}
          {latestCustomerMessage && (
            <Card className="min-h-17 min-w-0 rounded-lg border-blue-200 bg-blue-50/60 shadow-none">
              <CardContent className="space-y-1 p-3 text-sm">
                <div aria-live="polite">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <CardTitle className="text-sm">Trao đổi từ khách hàng</CardTitle>
                    <time className="text-xs text-slate-600" dateTime={latestCustomerMessage.created_at}>
                      {formatDate(latestCustomerMessage.created_at)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap wrap-anywhere text-slate-700">
                    <span className="font-medium text-slate-900">{latestCustomerMessage.label}</span>
                    {latestCustomerMessage.message && ` · ${latestCustomerMessage.message}`}
                  </p>
                </div>
                {earlierCustomerMessages.length > 0 && (
                  <details className="border-t border-blue-100 pt-1.5">
                    <summary className="cursor-pointer text-xs font-medium text-blue-800">
                      Xem trao đổi trước đó ({earlierCustomerMessages.length})
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {earlierCustomerMessages.map((event) => (
                        <li key={event.id}>
                          <CustomerComplaintMessage event={event} />
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {statement && (
        <Card className={statement.status === "SUBMITTED" ? "border-emerald-200 bg-emerald-50/60 shadow-none" : "border-slate-200 shadow-none"}>
          <CardHeader><CardTitle className="text-sm">{statementLabels[statement.status]}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Hạn phản hồi {formatDate(statement.due_at)}</p>
            <p className="whitespace-pre-wrap break-words">{statement.request_message}</p>
            {statement.submitted_at && (
              <div className="space-y-1 border-t border-slate-200 pt-2">
                <p className="text-xs text-slate-500">Đã gửi {formatDate(statement.submitted_at)}</p>
                {!!statement.response && <p className="whitespace-pre-wrap break-words">{statement.response}</p>}
                {!!statement.attachments?.length && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold text-slate-600">Ảnh giải trình ({statement.attachments.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {statement.attachments.map(({ id, file }, index) => (
                        <button type="button" key={id} onClick={() => onPreviewImage(file)}
                          aria-label={`Xem ảnh giải trình ${index + 1}`}
                          className="overflow-hidden rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-blue-600">
                          <Image src={file} alt={`Ảnh giải trình ${index + 1}`} width={88} height={88}
                            unoptimized className="size-[88px] object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {proposal && (
        <Card className="shadow-none">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 pb-3">
            <CardTitle className="text-sm">Phương án gần nhất</CardTitle>
            <StatusPill tone={proposal.status === "COMPLETED" ? "emerald" : "blue"}>{proposal.status_label}</StatusPill>
          </CardHeader>
          <CardContent className="space-y-3 break-words text-sm text-slate-700">
            <p className="whitespace-pre-wrap">{proposal.message}</p>
            {proposal.service_action && !proposal.fulfillment_booking && <p>{proposal.service_action_label} · {proposal.scheduled_start ? formatDate(proposal.scheduled_start) : "—"}{proposal.worker_name && ` · ${proposal.worker_name}`}</p>}
            {proposal.refund_amount && <p>{proposal.refund_scope_label} · {vnd(Number(proposal.refund_amount))}{proposal.refund_transaction_code ? ` · ${proposal.refund_transaction_code}` : ""}</p>}
            {proposal.voucher_code && <p>Voucher · {proposal.voucher_code}</p>}
            {proposal.fulfillment_booking && (
              <ComplaintOrderLink redo bookingId={proposal.fulfillment_booking} code={proposal.fulfillment_booking_code} subtitle={[
                proposal.service_action_label,
                proposal.scheduled_start && formatDate(proposal.scheduled_start),
                proposal.worker_name,
              ].filter(Boolean).join(" · ")} />
            )}
            {redoEarnings && proposal.fulfillment_booking && (
              <dl className="grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-3">
                <div><dt className="text-xs text-slate-600">Đã thu hồi</dt><dd className="mt-1 font-semibold tabular-nums">{vnd(Number(redoEarnings.recovered))}</dd></div>
                <div><dt className="text-xs text-slate-600">Đã trả công làm lại</dt><dd className="mt-1 font-semibold tabular-nums">{vnd(Number(redoEarnings.paid))}</dd></div>
                <div><dt className="text-xs text-slate-600">Phần nền tảng bù</dt><dd className="mt-1 font-semibold tabular-nums">{vnd(Number(redoEarnings.platform_cost))}</dd></div>
              </dl>
            )}
          </CardContent>
        </Card>
      )}

      {open && !detail.assigned_to && (
        <Button disabled={isLoading} onClick={() => void send({ action: "CLAIM" })}>Nhận xử lý</Button>
      )}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button variant={acknowledged ? "outline" : "default"} onClick={() => selectAction("ACK")}>Phản hồi khách</Button>
          <Button variant="outline" onClick={() => selectAction("REQUEST")}>Yêu cầu bổ sung</Button>
          {detail.worker && detail.schedule && !statement && (
            <Button variant="outline" onClick={() => selectAction("REQUEST_WORKER")}>Yêu cầu nhân viên giải trình</Button>
          )}
          <Button variant={acknowledged && !verified ? "default" : "outline"} onClick={() => selectAction("VERIFY")}>Ghi xác minh</Button>
          {canPropose && <Button variant={!proposal || proposal.status === "DECLINED" ? "default" : "outline"} onClick={() => selectAction("OFFER")}>
            {proposal?.status === "SENT" || proposal?.status === "ACCEPTED" ? "Cập nhật phương án" : "Đề xuất phương án"}
          </Button>}
          {canPropose && <Button variant="outline" onClick={() => selectAction("REJECT")}>Từ chối</Button>}
          {proposal?.status === "ACCEPTED" && proposal.service_action === "REDO" && !proposal.fulfillment_booking ? (
            <Button disabled={isLoading} onClick={() => selectAction("SCHEDULE_REDO")}>
              Tạo buổi làm lại
            </Button>
          ) : proposal?.status === "ACCEPTED" && <Button onClick={() => selectAction("COMPLETE")}>Hoàn tất phương án</Button>}
          {proposal?.status === "ACCEPTED" && proposal.service_action === "CHANGE" && (
            <BookingDetailLink bookingId={detail.booking} variant="secondary">Mở đơn để đổi lịch hoặc nhân viên</BookingDetailLink>
          )}
        </div>
      )}
      {canEdit && action && (
        <form key={action} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3" onSubmit={submit}>
          <h5 className="font-semibold text-slate-900">{actions[action]}</h5>
          {action === "ACK" && (
            <label className="grid gap-1.5 text-sm">
              <span>Thời gian phản hồi (giờ Việt Nam)</span>
              <Input type="datetime-local" name="next_update_at" required={!acknowledged} />
            </label>
          )}
          {action === "REQUEST_WORKER" && (
            <label className="block space-y-1 text-sm">Hạn phản hồi (giờ Việt Nam)
              <Input type="datetime-local" name="worker_due_at" required />
            </label>
          )}
          {action === "OFFER" && <>
            <WorkflowSelect label="Dịch vụ" value={service || "none"} onValueChange={(key) => setService(key === "none" ? "" : key)}>
              <SelectItem value="none">Không có hạng mục dịch vụ</SelectItem>
              <SelectItem value="REDO" disabled={detail.schedule_status !== "COMPLETED"}>Làm lại miễn phí</SelectItem>
              <SelectItem value="CHANGE" disabled={detail.schedule_status !== "PENDING"}>Đổi lịch hoặc nhân viên</SelectItem>
            </WorkflowSelect>
            {service && <label className="block space-y-1 text-sm">Lịch hẹn (giờ Việt Nam)<Input name="scheduled_start" type="datetime-local" required /></label>}
            {service === "CHANGE" && <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">Tìm nhân viên<Input value={workerSearch} onChange={(event) => setWorkerSearch(event.target.value)} placeholder="Tên, số điện thoại hoặc ID" /></label>
                <WorkflowSelect label="Nhân viên dự kiến" name="worker" required key={workerQuery}>
                  {!workers?.results.length && <SelectItem value="unavailable" disabled>{workersLoading ? "Đang tải..." : "Không tìm thấy nhân viên"}</SelectItem>}
                  {workers?.results.map((worker) => <SelectItem key={worker.id} value={String(worker.id)}>{worker.full_name || worker.username}</SelectItem>)}
                </WorkflowSelect>
              </div>
            </div>}
            <WorkflowSelect label="Voucher" name="voucher" defaultValue="none">
              <SelectItem value="none">Không cấp voucher</SelectItem>
              {vouchers?.data.filter((item) => item.lifecycle_status === "ACTIVE").map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>{item.code} · {item.name}</SelectItem>
              ))}
            </WorkflowSelect>
            {voucherError && <p className="text-sm text-red-600">Không tải được danh sách voucher.</p>}
            <WorkflowSelect label="Hoàn tiền" value={refund || "none"} onValueChange={(key) => setRefund(key === "none" ? "" : key)}>
              <SelectItem value="none">Không hoàn tiền</SelectItem>
              {detail.booking_is_cash ? <SelectItem value="CASH">Đối soát tiền mặt</SelectItem> : <>
                <SelectItem value="SESSION" disabled={!detail.schedule}>Hoàn tiền buổi vào ví</SelectItem>
                <SelectItem value="PARTIAL" disabled={!detail.schedule}>Hoàn một phần tiền buổi vào ví</SelectItem>
                <SelectItem value="BOOKING">Hoàn số tiền còn lại của đơn vào ví</SelectItem>
              </>}
            </WorkflowSelect>
            {(refund === "CASH" || refund === "PARTIAL") && <label className="block space-y-1 text-sm">Số tiền (₫)
              <Input name="refund_amount" type="number" min="1" step="1" required />
            </label>}
          </>}
          {action === "REJECT" && <>
            <label className="block space-y-1 text-sm">Căn cứ đã đối chiếu<Textarea name="basis" required maxLength={1000} /></label>
            <label className="block space-y-1 text-sm">Cách gửi bổ sung<Textarea name="reopen_instructions" required maxLength={500} /></label>
          </>}
          {action === "COMPLETE" && <>
            {proposal?.service_action !== "REDO" && detail.service_used && detail.worker && !detail.booking_is_cash && (
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <Checkbox className="mt-0.5" name="recover_worker_earning" />
                Thu hồi tiền công nhân viên theo căn cứ xác minh
              </label>
            )}
            {proposal?.refund_scope === "CASH" && <label className="block space-y-1 text-sm">Mã hoặc căn cứ xác nhận hoàn tiền mặt
              <Input name="cash_reference" required maxLength={150} />
            </label>}
            {!!proposal?.refund_amount && proposal.refund_scope !== "CASH" && (
              <p className="text-sm text-slate-600">Xác nhận để hoàn {vnd(Number(proposal.refund_amount))} vào Ví CleanWise.</p>
            )}
          </>}
          {action === "SCHEDULE_REDO" && (
            <div className="space-y-3 text-sm">
              <p>Khách trả thêm <strong>0đ</strong>. Sau khi tạo buổi, mở đơn dịch vụ để mời nhân viên.</p>
              {redoEarnings && <p>Tiền công dự kiến của buổi làm lại <strong>{vnd(Number(redoEarnings.expected))}</strong>.</p>}
              {redoEarnings?.recoverable != null && (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <label className="flex items-start gap-2">
                    <Checkbox className="mt-0.5" name="recover_worker_earning" />
                    Thu hồi tiền công buổi gốc khi tạo đơn
                  </label>
                  <p>Có thể thu {vnd(Number(redoEarnings.recoverable))} · Thiếu {vnd(Number(redoEarnings.recovery_shortfall))}</p>
                  <label className="block space-y-1">Căn cứ thu hồi<Textarea name="recovery_basis" maxLength={1000} rows={2} /></label>
                </div>
              )}
            </div>
          )}
          {action !== "SCHEDULE_REDO" && <label className="block space-y-1 text-sm">
            {action === "VERIFY" ? "Nội dung nội bộ" : action === "REQUEST_WORKER" ? "Nội dung gửi nhân viên" : action === "COMPLETE" ? "Kết quả thực hiện gửi khách" : "Nội dung gửi khách"}
            <Textarea name="message" required maxLength={2000} rows={3}
              placeholder={action === "COMPLETE" && proposal?.service_action === "REDO" ? "Ghi lịch, nhân viên và kết quả buổi làm lại đã hoàn thành" : undefined} />
          </label>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isLoading}>{actions[action]}</Button>
            <Button type="button" variant="ghost" onClick={() => selectAction(null)}>Hủy</Button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="whitespace-pre-wrap rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!open && !proposal && <p className="text-sm text-slate-500">Hồ sơ đã kết thúc.</p>}
    </section>
  );
}

export function ComplaintHistory({ detail }: { detail: ComplaintDetail }) {
  const events = [
    { id: 0, label: "Khách đã gửi khiếu nại", created_at: detail.created_at, message: "", is_public: true },
    ...(detail.events ?? []),
  ].reverse();

  return (
    <ol className="ml-1.5 space-y-4 border-l border-slate-200 pl-4 text-sm">
      {events.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-white bg-blue-500 ring-1 ring-blue-200" aria-hidden />
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">{item.label}</p>
            {!item.is_public && <StatusPill tone="slate">Nội bộ</StatusPill>}
          </div>
          <time className="text-xs text-slate-500" dateTime={item.created_at}>{formatDate(item.created_at)}</time>
          {item.message && <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">{item.message}</p>}
        </li>
      ))}
    </ol>
  );
}

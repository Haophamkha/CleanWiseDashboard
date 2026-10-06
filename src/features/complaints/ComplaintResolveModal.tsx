"use client";

import { useState } from "react";
import {
  useGetComplaintDetailQuery,
  useGetComplaintPreviewQuery,
  useResolveComplaintMutation,
} from "@/services/complaintApi";
import { vnd } from "@/features/refunds/refund-utils";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import type {
  ComplaintOutcome,
  ComplaintReporterRole,
  ResolveComplaintRequest,
} from "@/types/Complaint";

interface ComplaintResolveModalProps {
  complaintId: number;
  onClose: () => void;
}

const RESOLVE_ACTIONS: {
  status: ResolveComplaintRequest["status"];
  label: string;
  className: string;
}[] = [
  {
    status: "IN_REVIEW",
    label: "Đánh dấu đang xem xét",
    className: "bg-blue-600 hover:bg-blue-700",
  },
  {
    status: "RESOLVED",
    label: "Đã xử lý xong",
    className: "bg-green-600 hover:bg-green-700",
  },
  {
    status: "REJECTED",
    label: "Từ chối khiếu nại",
    className: "bg-red-600 hover:bg-red-700",
  },
];

const OUTCOME_LABEL: Record<Exclude<ComplaintOutcome, "">, string> = {
  REFUND_CUSTOMER: "Đã hoàn tiền cho khách",
  PAY_WORKER: "Đã trả thu nhập cho nhân viên",
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
const readApiError = (err: any, fallback: string): string => {
  const data = err?.data;

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

export function ComplaintResolveModal({
  complaintId,
  onClose,
}: ComplaintResolveModalProps) {
  const {
    data: detail,
    isLoading,
    isError,
  } = useGetComplaintDetailQuery(complaintId);

  const [resolveComplaint, { isLoading: isResolving }] =
    useResolveComplaintMutation();

  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ComplaintOutcome>("");
  const [chargeWorker, setChargeWorker] = useState(true);

  const isWorkerReporter = detail?.reporter_role === "WORKER";
  const hasSchedule = !!detail?.schedule;

    const outcomeOptions = (
      OUTCOME_OPTIONS[detail?.reporter_role ?? "CUSTOMER"] ?? []
    ).filter(
      (o) => !(o.value === "REFUND_CUSTOMER" && detail?.booking_is_cash),
    );

  const selectedOption = outcomeOptions.find((o) => o.value === outcome);

  const isOpen = detail?.status === "PENDING" || detail?.status === "IN_REVIEW";

  const previewReady = isOpen && hasSchedule && outcome !== "";

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

    // Tiền chỉ được xử lý kèm "Đã xử lý xong".
    const moneyPart =
      status === "RESOLVED" && outcome !== ""
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

      onClose();
    } catch (err: any) {
      setError(
        readApiError(err, "Xử lý khiếu nại thất bại. Vui lòng thử lại."),
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Chi tiết khiếu nại</h3>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {isLoading && <p className="text-sm text-gray-500">Đang tải...</p>}

        {isError && (
          <p className="text-sm text-red-600">Không tải được dữ liệu.</p>
        )}

        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mã khiếu nại</p>

                <p className="font-semibold">#{detail.id}</p>
              </div>

              <ComplaintStatusBadge status={detail.status} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Đơn / buổi</p>

              <p className="text-sm text-gray-600">
                {detail.booking_code || `#${detail.booking}`}
                {detail.schedule_sequence_no
                  ? ` · Buổi ${detail.schedule_sequence_no}`
                  : " · Chưa gắn buổi"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Người gửi</p>

              <p className="text-sm text-gray-600">
                <span
                  className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    isWorkerReporter
                      ? "bg-amber-50 text-amber-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {isWorkerReporter ? "Nhân viên" : "Khách hàng"}
                </span>

                {detail.reporter_name || `#${detail.reporter}`}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">
                Nhân viên liên quan
              </p>

              <p className="text-sm text-gray-600">
                {detail.worker_name ||
                  (detail.worker ? `#${detail.worker}` : "Chưa xác định")}
              </p>
            </div>

            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700">
                Loại khiếu nại
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {detail.issue_type_name}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Mã: {detail.issue_type_code}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Giai đoạn</p>

              <p className="text-sm text-gray-600">{detail.stage_label}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">
                Nội dung người gửi phản ánh
              </p>

              {detail.content ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                  {detail.content}
                </p>
              ) : (
                <p className="mt-1 text-sm italic text-gray-400">
                  Người gửi không nhập nội dung bổ sung.
                </p>
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

            {(detail.status === "PENDING" || detail.status === "IN_REVIEW") && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);

                    if (error) {
                      setError(null);
                    }
                  }}
                  placeholder="Ghi chú xử lý (tùy chọn)"
                  rows={4}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">
                    Xử lý tiền
                  </p>
                  {detail.booking_is_cash && !isWorkerReporter && (
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
                      ) : preview.data ? (
                        <div className="space-y-0.5">
                          <p>
                            Ví khách hàng:{" "}
                            <b>{signed(preview.data.customer_delta)}</b>
                          </p>

                          <p>
                            Ví nhân viên:{" "}
                            <b>{signed(preview.data.worker_delta)}</b>
                          </p>

                          {Number(preview.data.shortfall) > 0 && (
                            <p className="text-xs text-amber-700">
                              Không thu hồi được{" "}
                              {vnd(Number(preview.data.shortfall))} (nền tảng
                              chịu).
                            </p>
                          )}

                          {preview.data.notes.map((note) => (
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

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex flex-wrap gap-2">
                  {RESOLVE_ACTIONS.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={
                        isResolving ||
                        (action.status === "RESOLVED" &&
                          previewReady &&
                          (preview.isFetching || preview.isError))
                      }
                      onClick={() => handleResolve(action.status)}
                      className={`rounded-md px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`}
                    >
                      {isResolving ? "Đang xử lý..." : action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {detail.status === "CANCELLED" && (
              <p className="border-t border-gray-100 pt-4 text-sm text-gray-500">
                Khiếu nại đã được người gửi hủy.
              </p>
            )}

            {(detail.status === "RESOLVED" || detail.status === "REJECTED") && (
              <p className="border-t border-gray-100 pt-4 text-sm text-gray-500">
                Khiếu nại này đã kết thúc, không thể xử lý thêm.
              </p>
            )}
          </div>
        )}
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            type="button"
            onClick={() => setZoomedImage(null)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ✕
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedImage}
            alt="Ảnh minh chứng phóng to"
            className="max-h-full max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

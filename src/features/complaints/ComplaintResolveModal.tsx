"use client";

import { useState } from "react";
import {
  useGetComplaintDetailQuery,
  useResolveComplaintMutation,
} from "@/services/complaintApi";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import type { ResolveComplaintRequest } from "@/types/Complaint";

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

const isImageFile = (fileType: string, fileUrl: string) => {
  if (fileType?.startsWith("image/")) {
    return true;
  }

  return /\.(jpe?g|png|webp|gif)$/i.test(fileUrl);
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

  const handleResolve = async (status: ResolveComplaintRequest["status"]) => {
    setError(null);

    try {
      await resolveComplaint({
        id: complaintId,
        status,
        resolution_note: note.trim() || undefined,
      }).unwrap();

      onClose();
    } catch (err: any) {
      const message =
        err?.data?.status?.[0] ||
        err?.data?.resolution_note?.[0] ||
        err?.data?.detail ||
        err?.data?.message ||
        "Xử lý khiếu nại thất bại. Vui lòng thử lại.";

      setError(String(message));
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
              <p className="text-sm font-medium text-gray-700">Booking</p>

              <p className="text-sm text-gray-600">#{detail.booking}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Khách hàng</p>

              <p className="text-sm text-gray-600">
                {detail.customer_name || `#${detail.customer}`}
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
                Nội dung khách phản ánh
              </p>

              {detail.content ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                  {detail.content}
                </p>
              ) : (
                <p className="mt-1 text-sm italic text-gray-400">
                  Khách không nhập nội dung bổ sung.
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

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex flex-wrap gap-2">
                  {RESOLVE_ACTIONS.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={isResolving}
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
                Khiếu nại đã được khách hàng hủy.
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

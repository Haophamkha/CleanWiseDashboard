"use client";

import { useState } from "react";
import Image from "next/image";
import { useUpdateWorkerStatusMutation } from "@/services/workerApi";
import type { WorkerProfile } from "@/types/Worker";

type FieldKey =
  | "first_name"
  | "last_name"
  | "phone_number"
  | "gender"
  | "birth_date"
  | "bio"
  | "experience_years"
  | "identity_number"
  | "service_id"
  | "portrait"
  | "identity_front"
  | "identity_back"
  | "certificate_file";

const FIELD_REASON_SUGGESTIONS: Record<FieldKey, string[]> = {
  first_name: [
    "Sai chính tả",
    "Không khớp CCCD",
    "Viết hoa/thường không đúng chuẩn",
  ],
  last_name: [
    "Sai chính tả",
    "Không khớp CCCD",
    "Viết hoa/thường không đúng chuẩn",
  ],
  phone_number: ["Sai định dạng", "Không liên lạc được", "Số đã đổi chủ"],
  gender: ["Không khớp CCCD đã tải lên"],
  birth_date: ["Không khớp CCCD đã tải lên", "Nghi ngờ chưa đủ 18 tuổi"],
  bio: ["Nội dung quá sơ sài", "Nội dung không phù hợp"],
  experience_years: ["Không hợp lý so với mô tả/tuổi"],
  identity_number: [
    "Ảnh mờ không đọc được số",
    "Số bị trùng với hồ sơ khác",
    "Không khớp với ảnh CCCD",
  ],
  service_id: ["Không phù hợp với kinh nghiệm khai báo"],
  portrait: [
    "Ảnh mờ/không rõ mặt",
    "Ảnh không nghiêm túc",
    "Nghi ngờ không phải ảnh thật",
  ],
  identity_front: [
    "Ảnh mờ",
    "Bị cắt góc/thiếu thông tin",
    "Nghi ngờ ảnh chỉnh sửa",
  ],
  identity_back: [
    "Ảnh mờ",
    "Bị cắt góc/thiếu thông tin",
    "Nghi ngờ ảnh chỉnh sửa",
  ],
  certificate_file: [
    "Ảnh/file không rõ ràng",
    "Không liên quan dịch vụ đăng ký",
    "Nghi ngờ đã hết hạn",
  ],
};

const FIELD_LABELS: Record<FieldKey, string> = {
  first_name: "Tên",
  last_name: "Họ và tên đệm",
  phone_number: "Số điện thoại",
  gender: "Giới tính",
  birth_date: "Ngày sinh",
  bio: "Giới thiệu bản thân",
  experience_years: "Kinh nghiệm",
  identity_number: "Số CCCD/CMND",
  service_id: "Dịch vụ đăng ký",
  portrait: "Ảnh chân dung",
  identity_front: "CCCD mặt trước",
  identity_back: "CCCD mặt sau",
  certificate_file: "Chứng chỉ",
};

const GENDER_LABEL: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const STATUS_LABEL: Record<
  string,
  {
    label: string;
    color: string;
  }
> = {
  DRAFT: {
    label: "Chưa hoàn tất hồ sơ",
    color: "#DC2626",
  },
  PENDING: {
    label: "Đang chờ duyệt",
    color: "#D97706",
  },
  ACTIVE: {
    label: "Đang làm việc",
    color: "#22C55E",
  },
  REJECTED: {
    label: "Hồ sơ bị từ chối",
    color: "#DC2626",
  },
  SUSPENDED: {
    label: "Tạm khóa",
    color: "#DC2626",
  },
};

type ApiError = {
  data?: {
    message?: string;
  };
};

function getErrorMessage(err: unknown, fallback: string): string {
  const apiError = err as ApiError;

  return apiError.data?.message || fallback;
}

function FlagCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Đánh dấu thông tin này sai"
      className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
        checked
          ? "bg-red-600 border-red-600"
          : "border-gray-300 hover:border-red-400 bg-white"
      }`}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.5L4.5 8.5L9.5 3.5"
            stroke="white"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function NoteBox({
  fieldKey,
  note,
  onNoteChange,
}: {
  fieldKey: FieldKey;
  note: string;
  onNoteChange: (value: string) => void;
}) {
  return (
    <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2.5">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {FIELD_REASON_SUGGESTIONS[fieldKey].map((reason) => (
          <button
            key={reason}
            type="button"
            onClick={() =>
              onNoteChange(note ? `${note}, ${reason.toLowerCase()}` : reason)
            }
            className="rounded-full border border-red-300 bg-white px-2 py-0.5 text-[11px] text-red-600 hover:bg-red-100"
          >
            + {reason}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        rows={2}
        placeholder="Ghi chú lỗi cho nhân viên..."
        className="w-full rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs"
      />
    </div>
  );
}

function TextField({
  fieldKey,
  value,
  half,
  checked,
  onToggle,
  note,
  onNoteChange,
  flaggable = true,
}: {
  fieldKey: FieldKey;
  value: string;
  half?: boolean;
  checked: boolean;
  onToggle: () => void;
  note: string;
  onNoteChange: (v: string) => void;
  flaggable?: boolean;
}) {
  return (
    <div className={half ? "" : "col-span-2"}>
      <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-100">
        <div className="min-w-0">
          <div className="text-[11px] text-gray-400">
            {FIELD_LABELS[fieldKey]}
          </div>
          <div className="text-sm text-gray-900 truncate">{value || "—"}</div>
        </div>
        {flaggable && <FlagCheckbox checked={checked} onToggle={onToggle} />}
      </div>
      {flaggable && checked && (
        <NoteBox fieldKey={fieldKey} note={note} onNoteChange={onNoteChange} />
      )}
    </div>
  );
}
type WorkerDetailModalProps = {
  worker: WorkerProfile | null;
  onClose: () => void;
};

export default function WorkerDetailModal({
  worker,
  onClose,
}: WorkerDetailModalProps) {
  const [updateStatus, { isLoading }] = useUpdateWorkerStatusMutation();

  const [checked, setChecked] = useState<Partial<Record<FieldKey, boolean>>>(
    {},
  );

  const [notes, setNotes] = useState<Partial<Record<FieldKey, string>>>({});

  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  if (!worker) {
    return null;
  }

  const toggle = (key: FieldKey) => {
    setChecked((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };

      if (!next[key]) {
        setNotes((prevNotes) => {
          const rest = { ...prevNotes };
          delete rest[key];
          return rest;
        });
      }

      return next;
    });
  };

  const setNote = (key: FieldKey, value: string) => {
    setNotes((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const hasAnyChecked = Object.values(checked).some(Boolean);

  const checkedKeysMissingNote = (Object.keys(checked) as FieldKey[]).filter(
    (key) => checked[key] && !notes[key]?.trim(),
  );

  const statusInfo = STATUS_LABEL[worker.status] ?? {
    label: worker.status,
    color: "#6B7280",
  };

  const isCertificatePdf =
    !!worker.certificate_file &&
    worker.certificate_file.toLowerCase().split("?")[0].endsWith(".pdf");

  const handleApprove = async () => {
    const confirmed = confirm(
      `Duyệt hồ sơ của ${worker.first_name} ${worker.last_name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await updateStatus({
        id: worker.id,
        status: "ACTIVE",
      }).unwrap();

      onClose();
    } catch (err) {
      alert(getErrorMessage(err, "Duyệt hồ sơ thất bại."));
    }
  };

  const handleReject = async () => {
    const rejectedFields: Record<string, string> = {};

    (Object.keys(checked) as FieldKey[]).forEach((key) => {
      const note = notes[key]?.trim();

      if (checked[key] && note) {
        rejectedFields[key] = note;
      }
    });

    const reasonSummary = Object.entries(rejectedFields)
      .map(([field, note]) => `${FIELD_LABELS[field as FieldKey]}: ${note}`)
      .join(" | ");

    try {
      await updateStatus({
        id: worker.id,
        status: "REJECTED",
        reason: reasonSummary,
        rejected_fields: rejectedFields,
      }).unwrap();

      onClose();
    } catch (err) {
      alert(getErrorMessage(err, "Từ chối hồ sơ thất bại."));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Chi tiết hồ sơ nhân viên
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* PROFILE HEADER */}
          <div className="flex flex-col items-center text-center mb-5">
            <div
              className={`relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-4 flex items-center justify-center mb-2.5 ${
                worker.portrait ? "cursor-zoom-in" : ""
              }`}
              style={{
                borderColor: checked.portrait ? "#DC2626" : "#F3F4F6",
              }}
              onClick={() => worker.portrait && setZoomSrc(worker.portrait)}
            >
              {worker.portrait ? (
                <Image
                  src={worker.portrait}
                  alt="Chân dung"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="text-gray-300 text-2xl">?</span>
              )}
            </div>

            <div className="text-base font-semibold text-gray-900">
              {`${worker.first_name} ${worker.last_name}`.trim() ||
                worker.username}
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${statusInfo.color}1A`,
                  color: statusInfo.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: statusInfo.color,
                  }}
                />

                {statusInfo.label}
              </span>

              <span className="text-xs text-gray-400">
                {worker.completion_percent}% hoàn thiện
              </span>
            </div>

            <label className="flex items-center gap-1.5 mt-2 text-xs text-red-600 cursor-pointer">
              <FlagCheckbox
                checked={!!checked.portrait}
                onToggle={() => toggle("portrait")}
              />
              Đánh dấu ảnh chân dung sai
            </label>

            {checked.portrait && (
              <div className="w-full mt-1">
                <NoteBox
                  fieldKey="portrait"
                  note={notes.portrait || ""}
                  onNoteChange={(value) => setNote("portrait", value)}
                />
              </div>
            )}
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="rounded-xl border border-gray-200 p-4 mb-3">
            <div className="text-xs font-semibold text-gray-500 mb-1">
              Thông tin cá nhân
            </div>

            <div className="grid grid-cols-2 gap-x-4">
              <TextField
                fieldKey="first_name"
                value={worker.first_name}
                half
                checked={!!checked.first_name}
                onToggle={() => toggle("first_name")}
                note={notes.first_name || ""}
                onNoteChange={(value) => setNote("first_name", value)}
              />

              <TextField
                fieldKey="last_name"
                value={worker.last_name}
                half
                checked={!!checked.last_name}
                onToggle={() => toggle("last_name")}
                note={notes.last_name || ""}
                onNoteChange={(value) => setNote("last_name", value)}
              />

              <TextField
                fieldKey="phone_number"
                value={worker.phone_number || ""}
                half
                checked={!!checked.phone_number}
                onToggle={() => toggle("phone_number")}
                note={notes.phone_number || ""}
                onNoteChange={(value) => setNote("phone_number", value)}
              />

              <TextField
                fieldKey="gender"
                value={worker.gender ? GENDER_LABEL[worker.gender] : ""}
                half
                checked={!!checked.gender}
                onToggle={() => toggle("gender")}
                note={notes.gender || ""}
                onNoteChange={(value) => setNote("gender", value)}
              />

              <TextField
                fieldKey="birth_date"
                value={
                  worker.birth_date
                    ? new Date(worker.birth_date).toLocaleDateString("vi-VN")
                    : ""
                }
                half
                checked={!!checked.birth_date}
                onToggle={() => toggle("birth_date")}
                note={notes.birth_date || ""}
                onNoteChange={(value) => setNote("birth_date", value)}
              />

              <TextField
                fieldKey="experience_years"
                value={
                  worker.experience_years !== null &&
                  worker.experience_years !== undefined
                    ? `${worker.experience_years} năm`
                    : ""
                }
                half
                checked={!!checked.experience_years}
                onToggle={() => toggle("experience_years")}
                note={notes.experience_years || ""}
                onNoteChange={(value) => setNote("experience_years", value)}
              />
            </div>
          </div>

          {/* PROFESSIONAL PROFILE */}
          <div className="rounded-xl border border-gray-200 p-4 mb-3">
            <div className="text-xs font-semibold text-gray-500 mb-1">
              Hồ sơ nghề nghiệp
            </div>

            <div className="grid grid-cols-2 gap-x-4">
              <TextField
                fieldKey="bio"
                value={worker.bio || ""}
                checked={!!checked.bio}
                onToggle={() => toggle("bio")}
                note={notes.bio || ""}
                onNoteChange={(value) => setNote("bio", value)}
              />

              <TextField
                fieldKey="service_id"
                value={worker.registered_service?.name || ""}
                half
                checked={!!checked.service_id}
                onToggle={() => toggle("service_id")}
                note={notes.service_id || ""}
                onNoteChange={(v) => setNote("service_id", v)}
                flaggable={false}
              />

              <TextField
                fieldKey="identity_number"
                value={worker.identity_number || ""}
                half
                checked={!!checked.identity_number}
                onToggle={() => toggle("identity_number")}
                note={notes.identity_number || ""}
                onNoteChange={(value) => setNote("identity_number", value)}
              />
            </div>
          </div>

          {/* IDENTITY DOCUMENTS */}
          <div className="rounded-xl border border-gray-200 p-4 mb-3">
            <div className="text-xs font-semibold text-gray-500 mb-2">
              Giấy tờ tùy thân
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(["identity_front", "identity_back"] as const).map((key) => {
                const url =
                  key === "identity_front"
                    ? worker.identity_front
                    : worker.identity_back;

                return (
                  <div key={key}>
                    <div
                      className={`relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-[1.6] ${
                        url ? "cursor-zoom-in" : ""
                      }`}
                      onClick={() => url && setZoomSrc(url)}
                    >
                      {url ? (
                        <Image
                          src={url}
                          alt={FIELD_LABELS[key]}
                          fill
                          sizes="240px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">
                          Chưa có ảnh
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(key);
                        }}
                        className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-md border flex items-center justify-center z-10 ${
                          checked[key]
                            ? "bg-red-600 border-red-600"
                            : "bg-white/90 border-gray-300"
                        }`}
                      >
                        {checked[key] && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2.5 6.5L4.5 8.5L9.5 3.5"
                              stroke="white"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-gray-400 mt-1">
                      {FIELD_LABELS[key]}
                    </div>

                    {checked[key] && (
                      <NoteBox
                        fieldKey={key}
                        note={notes[key] || ""}
                        onNoteChange={(value) => setNote(key, value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* CERTIFICATE */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-400 mb-1.5">
                    {FIELD_LABELS.certificate_file}
                  </div>

                  {worker.certificate_file ? (
                    isCertificatePdf ? (
                      <a
                        href={worker.certificate_file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 underline"
                      >
                        <span>📄</span>
                        Xem file PDF
                      </a>
                    ) : (
                      <div
                        className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-[1.6] w-40 cursor-zoom-in"
                        onClick={() => setZoomSrc(worker.certificate_file!)}
                      >
                        <Image
                          src={worker.certificate_file}
                          alt="Chứng chỉ"
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-gray-900">Không có</div>
                  )}
                </div>

                <FlagCheckbox
                  checked={!!checked.certificate_file}
                  onToggle={() => toggle("certificate_file")}
                />
              </div>

              {checked.certificate_file && (
                <NoteBox
                  fieldKey="certificate_file"
                  note={notes.certificate_file || ""}
                  onNoteChange={(value) => setNote("certificate_file", value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Đóng
          </button>

          {!hasAnyChecked ? (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isLoading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : "Duyệt hồ sơ"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReject}
              disabled={isLoading || checkedKeysMissingNote.length > 0}
              title={
                checkedKeysMissingNote.length > 0
                  ? "Cần ghi chú cho mọi field đã tích"
                  : ""
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : "Từ chối hồ sơ"}
            </button>
          )}
        </div>
      </div>

      {/* IMAGE ZOOM */}
      {zoomSrc && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
          onClick={() => setZoomSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-3xl leading-none"
            onClick={() => setZoomSrc(null)}
          >
            ×
          </button>

          <div
            className="relative w-full h-full max-w-3xl max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={zoomSrc}
              alt="Xem phóng to"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

import type { WorkerProfile } from "@/types/Worker";

export const FIELD_LABELS = {
  first_name: "Tên", last_name: "Họ và tên đệm", phone_number: "Số điện thoại", gender: "Giới tính", birth_date: "Ngày sinh", bio: "Giới thiệu bản thân", experience_years: "Kinh nghiệm", identity_number: "Số CCCD/CMND", service_id: "Dịch vụ đăng ký", portrait: "Ảnh chân dung", identity_front: "CCCD mặt trước", identity_back: "CCCD mặt sau", certificate_file: "Chứng chỉ",
} as const;
export type RejectableField = keyof typeof FIELD_LABELS;
export type ReviewNotes = Partial<Record<RejectableField, string>>;

/** Suggestions flag missing data and format issues; documents still need human review. */
export function getProfileSuggestions(worker: WorkerProfile, today = new Date()): ReviewNotes {
  if (worker.status !== "PENDING") return {};
  const suggestions: ReviewNotes = {};
  for (const field of worker.missing_fields) {
    if (Object.hasOwn(FIELD_LABELS, field)) suggestions[field as RejectableField] = `Vui lòng bổ sung ${FIELD_LABELS[field as RejectableField]}.`;
  }
  if (worker.phone_number && !/^(?:0\d{9}|\+84\d{9})$/.test(worker.phone_number.replace(/[\s.-]/g, ""))) suggestions.phone_number = "Vui lòng kiểm tra và cập nhật số điện thoại đúng định dạng.";
  if (worker.identity_number && !/^(?:\d{9}|\d{12})$/.test(worker.identity_number.trim())) suggestions.identity_number = "Vui lòng kiểm tra số CCCD/CMND (9 hoặc 12 chữ số) và đối chiếu với giấy tờ.";
  if (worker.birth_date) {
    const birthDate = new Date(worker.birth_date);
    if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== worker.birth_date || birthDate > today) suggestions.birth_date = "Vui lòng cập nhật ngày sinh hợp lệ, không ở tương lai.";
  }
  if (!Number.isFinite(worker.experience_years) || worker.experience_years < 0) suggestions.experience_years = "Vui lòng cập nhật số năm kinh nghiệm hợp lệ.";
  return suggestions;
}

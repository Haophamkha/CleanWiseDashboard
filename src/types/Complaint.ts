export type ComplaintStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export type ComplaintStage = "BEFORE_SERVICE" | "IN_SERVICE" | "AFTER_SERVICE";

export type ComplaintReporterRole = "CUSTOMER" | "WORKER";

/** Kết quả xử lý tiền do hệ thống tính. "" = không xử lý tiền. */
export type ComplaintOutcome = "" | "REFUND_CUSTOMER" | "PAY_WORKER";

export interface ComplaintAttachment {
  id: number;
  file: string;
  file_type: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  booking: number;
  booking_code: string;
  schedule: number | null;
  schedule_sequence_no: number | null;

  reporter_role: ComplaintReporterRole;
  reporter_name: string;
  worker: number | null;
  worker_name: string | null;

  issue_type: number;
  issue_type_code: string;
  issue_type_name: string;

  stage: ComplaintStage;
  stage_label: string;

  status: ComplaintStatus;
  status_label: string;

  created_at: string;
}

export interface ComplaintDetail extends Complaint {
  reporter: number;

  content: string;

  resolved_by: number | null;
  resolved_by_name: string | null;

  resolution_note: string | null;
  resolved_at: string | null;

  outcome: ComplaintOutcome;
  /** Số tiền đã hoàn vào ví khách; "0.00" nếu không hoàn. */
  refund_amount: string | null;
  /** + đã cộng / - đã trừ vào ví khách (chỉ admin thấy). */
  customer_delta: string;
  /** + đã cộng / - đã trừ vào ví nhân viên (chỉ admin thấy). */
  worker_delta: string;
  /** Phần không thu hồi được do ví không đủ, nền tảng chịu (chỉ admin thấy). */
  shortfall: string;
  booking_is_cash: boolean;

  attachments: ComplaintAttachment[];
}

export interface GetComplaintsParams {
  status?: ComplaintStatus;
  stage?: ComplaintStage;
  issue_type?: number;
  reporter_role?: ComplaintReporterRole;
  worker?: number;
}

export interface ResolveComplaintRequest {
  id: number;
  status: "IN_REVIEW" | "RESOLVED" | "REJECTED";
  resolution_note?: string;
  /** Chỉ gửi khi status = RESOLVED. Số tiền do BE tự tính, không nhập tay. */
  outcome?: Exclude<ComplaintOutcome, "">;
  /** Chỉ dùng với REFUND_CUSTOMER: true = hủy/thu hồi thu nhập của nhân viên. */
  charge_worker?: boolean;
}

export interface ComplaintPreview {
  customer_delta: string;
  worker_delta: string;
  shortfall: string;
  notes: string[];
}

export interface GetComplaintPreviewParams {
  id: number;
  outcome: "REFUND_CUSTOMER" | "PAY_WORKER";
  charge_worker?: boolean;
}
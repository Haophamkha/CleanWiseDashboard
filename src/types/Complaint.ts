export type ComplaintStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export type ComplaintStage = "BEFORE_SERVICE" | "IN_SERVICE" | "AFTER_SERVICE";

export type ComplaintReporterRole = "CUSTOMER" | "WORKER";

/** Kết quả xử lý tiền do hệ thống tính. "" = không xử lý tiền. */
export type ComplaintOutcome = "" | "REFUND_CUSTOMER" | "PAY_WORKER" | "RECOVER_WORKER_EARNING";

export interface ComplaintAttachment {
  id: number;
  file: string;
  file_type: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  code?: string | null;
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
  workflow_status?: "SENT" | "ACCEPTED" | "DECLINED" | "COMPLETED" | null;

  created_at: string;
}

export interface ComplaintDetail extends Complaint {
  customer_id?: number;
  customer_name?: string;
  discipline_case?: number | null;
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
  service_used: boolean;

  attachments: ComplaintAttachment[];
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  can_manage_workflow?: boolean;
  next_update_at?: string | null;
  requested_resolution_label?: string;
  scheduled_start?: string | null;
  actual_start?: string | null;
  schedule_status?: string | null;
  events?: { id: number; kind: string; label: string; message: string; is_public: boolean; created_at: string }[];
  proposal?: {
    id: number;
    status: "SENT" | "ACCEPTED" | "DECLINED" | "COMPLETED";
    status_label: string;
    message: string;
    service_action: "" | "REDO" | "CHANGE";
    service_action_label: string;
    scheduled_start: string | null;
    worker_name: string | null;
    refund_scope: "" | "SESSION" | "BOOKING" | "PARTIAL" | "CASH";
    refund_scope_label: string;
    refund_amount: string | null;
    refund_transaction_code: string | null;
    voucher_code: string | null;
    fulfillment_booking: number | null;
    fulfillment_booking_code: string | null;
  } | null;
}

export interface ComplaintWorkflowRequest {
  id: number;
  action: "CLAIM" | "ACK" | "REQUEST" | "VERIFY" | "OFFER" | "SCHEDULE_REDO" | "COMPLETE" | "REJECT";
  message?: string;
  basis?: string;
  reopen_instructions?: string;
  next_update_at?: string;
  proposal_id?: number;
  service_action?: "REDO" | "CHANGE";
  scheduled_start?: string;
  worker?: number;
  voucher?: number;
  refund_scope?: "SESSION" | "BOOKING" | "PARTIAL" | "CASH";
  refund_amount?: string;
  cash_reference?: string;
  recover_worker_earning?: boolean;
}

export interface GetComplaintsParams {
  status?: ComplaintStatus;
  workflow_status?: "SENT" | "ACCEPTED";
  stage?: ComplaintStage;
  issue_type?: number;
  reporter_role?: ComplaintReporterRole;
  worker?: number;
  /** Tìm theo mã khiếu nại, mã đơn hoặc tên người gửi */
  search?: string;
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
  outcome: Exclude<ComplaintOutcome, "">;
  charge_worker?: boolean;
}

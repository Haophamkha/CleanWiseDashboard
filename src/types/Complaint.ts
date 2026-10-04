export type ComplaintStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export type ComplaintStage = "BEFORE_SERVICE" | "IN_SERVICE" | "AFTER_SERVICE";

export type ComplaintReporterRole = "CUSTOMER" | "WORKER";

export interface ComplaintAttachment {
  id: number;
  file: string;
  file_type: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  booking: number;

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

  /** Số tiền đã hoàn vào ví khách; "0.00" hoặc null nếu không hoàn. */
  refund_amount: string | null;

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
  /** Chỉ gửi khi status = RESOLVED và người gửi là khách. */
  refund_amount?: string;
}

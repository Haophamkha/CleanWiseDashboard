export type ComplaintStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export type ComplaintStage = "BEFORE_SERVICE" | "IN_SERVICE" | "AFTER_SERVICE";

export interface ComplaintAttachment {
  id: number;
  file: string;
  file_type: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  booking: number;

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
  customer: number;
  customer_name: string;

  content: string;

  resolved_by: number | null;
  resolved_by_name: string | null;

  resolution_note: string | null;
  resolved_at: string | null;

  attachments: ComplaintAttachment[];
}

export interface GetComplaintsParams {
  status?: ComplaintStatus;
  stage?: ComplaintStage;
  issue_type?: number;
}

export interface ResolveComplaintRequest {
  id: number;
  status: "IN_REVIEW" | "RESOLVED" | "REJECTED";
  resolution_note?: string;
}

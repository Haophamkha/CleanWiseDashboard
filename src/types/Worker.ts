export type WorkerStatus =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED";

export type WorkerProfile = {
  id: number;
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  birth_date: string | null;
  role: string;
  status: WorkerStatus;
  bio: string | null;
  experience_years: number;
  identity_number: string | null;
  registered_service: {
    id: number;
    code: string;
    section_code: string;
    name: string;
  } | null;
  requested_service?: { id: number; name: string } | null;
  service_request_token?: string | null;
  portrait: string | null;
  identity_front: string | null;
  identity_back: string | null;
  certificate_file: string | null;
  approved_by: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  approved_at: string | null;
  rejection_reason: string | null;
  rejected_fields: Record<string, string>;
  average_rating: string;
  total_completed_jobs: number;
  is_complete: boolean;
  missing_fields: string[];
  completion_percent: number;
  created_at: string;
  updated_at: string;
};

export type UpdateWorkerStatusRequest = {
  status: "DRAFT" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  reason?: string;
  rejected_fields?: Record<string, string>;
};

export type UpdateWorkerContactRequest = {
  previous_phone_number: string | null;
  phone_number: string;
  reason: string;
  confirmed_with_worker: boolean;
};

export type WorkerReviewAction =
  | "SUBMITTED"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "REACTIVATED"
  | "REVOKED"
  | "SERVICE_REQUESTED"
  | "SERVICE_APPROVED"
  | "SERVICE_REJECTED"
  | "CONTACT_UPDATED";

export type WorkerReviewEvent = {
  id: number;
  action: WorkerReviewAction;
  actor_name: string;
  previous_status: WorkerStatus;
  new_status: WorkerStatus;
  reason: string;
  rejected_fields: Record<string, string>;
  changes?: {
    phone_number?: { before: string | null; after: string };
    service?: { before: string | null; after: string };
  };
  created_at: string;
};

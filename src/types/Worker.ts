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
  status: "ACTIVE" | "REJECTED" | "SUSPENDED";
  reason?: string;
  rejected_fields?: Record<string, string>;
};

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type User = {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  gender?: Gender | null;
  birth_date?: string | null;
  avatar?: string | null;
};

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type CustomerProfile = {
  id: number;
  user_id: number;
  gender: Gender | null;
  birth_date: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type WorkerProfile = {
  id: number;
  user_id: number;
  status: WorkerStatus;
  bio: string | null;
  experience_years: number;
  identity_number: string | null;
  avatar: string | null;
  approved_by_id: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  average_rating: number;
  total_completed_jobs: number;
  created_at: string;
  updated_at: string;
};

export type DocumentType = "IDENTITY_FRONT" | "IDENTITY_BACK" | "OTHER";

export type WorkerVerificationDocument = {
  id: number;
  worker_id: number;
  document_type: DocumentType;
  file: string;
  file_type: string;
  note: string | null;
  created_at: string;
};

export type CustomerMeResponse = User & { profile: CustomerProfile | null };
export type WorkerMeResponse = User & {
  profile: WorkerProfile | null;
  documents?: WorkerVerificationDocument[];
};

export type BookingStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";
export type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";
export type ScheduleStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "MISSED";

export type AdminUser = {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar: string | null;
};
export type Address = {
  id: number;
  label: string;
  receiver_name: string;
  receiver_phone: string;
  address_line: string;
  ward: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  is_default: boolean;
};
export type Worker = AdminUser & {
  average_rating: string | null;
  total_completed_jobs: number;
  registered_service_id: number | null;
};
export type Assignment = {
  id: number;
  worker: Worker;
  assigned_by: AdminUser | null;
  assigned_method: string;
  assigned_method_label: string;
  status: string;
  status_label: string;
  response_note: string | null;
  assigned_at: string;
  responded_at: string | null;
  expired_at: string | null;
  commission_reserved: string;
};
export type ScheduleImage = {
  id: number;
  image_type: string;
  image: string;
  note: string | null;
  sort_order: number;
  created_at: string;
};
export type Schedule = {
  id: number;
  sequence_no: number;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: ScheduleStatus;
  status_label: string;
  note: string | null;
  completion_note: string | null;
  cancel_reason: string | null;
  invitation: { id: number | null; source: 'ADMIN' | 'CUSTOMER'; worker: Worker; workers?: Worker[]; pending_count?: number; expires_at: string } | null;
  current_assignment: Assignment | null;
  assignment_history: Assignment[];
  images: ScheduleImage[];
};
export type Payment = {
  id: number;
  amount: string;
  method: string;
  method_label: string;
  status: PaymentStatus;
  status_label: string;
  transaction_code: string | null;
  paid_at: string | null;
  failure_reason: string | null;
  created_at: string;
};
export type Complaint = {
  id: number;
  schedule_id: number;
  stage: string;
  status: string;
  issue_type: string;
  created_at: string;
};
export type BookingService = {
  id: number;
  code: string;
  section_code?: string;
  name: string;
  form_schema?: Record<string, unknown>;
};

export type BookingListItem = {
  id: number;
  booking_code: string;
  customer: AdminUser;
  service: BookingService;
  status: BookingStatus;
  status_label: string;
  payment_status: PaymentStatus;
  payment_status_label: string;
  total_amount: string;
  total_schedules: number;
  assigned_schedules: number;
  waiting_invitations: number;
  completed_schedules: number;
  next_schedule_start: string | null;
  workers: Worker[];
  created_at: string;
  updated_at: string;
};
export type BookingDetail = {
  id: number;
  booking_code: string;
  customer: AdminUser;
  service: BookingService;
  service_data: Record<string, unknown>;
  address: Address;
  delivery_address: Address | null;
  note: string | null;
  status: BookingStatus;
  status_label: string;
  payment_status: PaymentStatus;
  payment_status_label: string;
  price_breakdown: Record<string, unknown>;
  subtotal_amount: string;
  discount_amount: string;
  total_amount: string;
  refunded_amount?: string;
  voucher: { id: number; code: string; name: string } | null;
  schedules: Schedule[];
  payments: Payment[];
  complaints: Complaint[];
  cancelled_by: number | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
};
export type BookingActivity = {
  id: number;
  event_type: string;
  event_type_label: string;
  message: string;
  actor: AdminUser | null;
  schedule_id: number | null;
  old_data: Record<string, unknown>;
  new_data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type CustomerSearchItem = AdminUser & {
  is_active: boolean;
  addresses: Address[];
};
export type AvailableWorker = Worker & {
  is_customer_favorite: boolean;
  is_customer_requested: boolean;
  can_receive_invitation: boolean;
  unavailable_reasons: string[];
  active_jobs_count: number;
  matched_area: boolean;
  has_time_conflict: boolean;
  cash_balance_eligible: boolean;
  bio: string | null;
  experience_years: number;
  gender: string | null;
  registered_service: { id: number; code: string; name: string } | null;
  working_areas: { id: number; name: string; city: string }[];
};
export type PageResult<T> = {
  results: T[];
  count: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  page_size: number;
};
export type BookingSummary = {
  today_total: number;
  pending: number;
  unassigned_schedules: number;
  in_progress: number;
  completed_today: number;
  failed: number;
};
export type BookingListParams = {
  search?: string;
  status?: string;
  payment_status?: string;
  service_id?: number;
  worker_id?: number;
  unassigned?: boolean;
  invitation_state?: "waiting";
  created_from?: string;
  created_to?: string;
  scheduled_from?: string;
  scheduled_to?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
};
export type CreateBookingPayload = {
  customer_id: number;
  service_id: number;
  address_id: number;
  delivery_address_id?: number | null;
  service_data: Record<string, unknown>;
  note?: string;
  voucher_code?: string;
  payment_method: "CASH" | "BANK_TRANSFER";
};

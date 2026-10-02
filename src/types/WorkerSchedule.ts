import type { Address, AdminUser, ScheduleStatus, ScheduleImage } from "./Booking";

export type WorkerScheduleItem = {
  id: number; schedule_id: number; booking_id: number; booking_code: string;
  sequence_no: number; service_name: string; customer: AdminUser; address: Address;
  scheduled_start: string; scheduled_end: string; actual_start: string | null; actual_end: string | null;
  assignment_status: "PENDING" | "ACCEPTED"; assignment_status_label: string;
  status: ScheduleStatus; status_label: string; note: string | null;
  completion_note: string | null; cancel_reason: string | null; images: ScheduleImage[];
};
export type WorkerSchedule = {
  worker_id: number; start: string; end: string; timezone: string;
  availability: { id: number; weekday: number; start_time: string; end_time: string }[];
  assignments: WorkerScheduleItem[];
};

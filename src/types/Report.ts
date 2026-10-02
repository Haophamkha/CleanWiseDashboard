export type ReportParams = {
  period: "all" | "week" | "month" | "quarter" | "custom";
  date?: string; start?: string; end?: string;
  group_by?: "auto" | "day" | "week" | "month";
};
export type WorkerSort = "orders" | "sessions" | "rating" | "commission";
export type ReportPeriod = { type: ReportParams["period"]; start: string; end: string; group_by: "day" | "week" | "month"; timezone: string };
export type ReportSummary = {
  total_orders: number; total_order_value: string; cancelled_failed_order_value: string; valid_order_value: string;
  order_statuses: Record<string, number>; processing_orders: number; completed_sessions: number;
  completed_service_value: string; cleanwise_revenue: string; worker_income: string;
  cash_commission_owed_in_period: string; cash_commission_owed_current: string;
  active_workers_current: number; orders_today: number; missing_earning_sessions: number;
  completed_sessions_missing_actual_end: number; commission_on_refunded_bookings: string;
};
export type ReportTimeline = { start: string; end: string; orders: number; order_value: string; cleanwise_revenue: string; completed_service_value: string };
export type ReportWorker = {
  rank: number; worker_id: number; name: string; username: string; active_current: boolean; profile_status: string | null;
  completed_orders: number; completed_sessions: number; average_rating: number | null; review_count: number;
  cleanwise_revenue: string; worker_income: string;
};
export type ReportService = {
  service_id: number; code: string; name: string; active_current: boolean; orders: number; order_share_percent: number;
  cancelled_orders: number; failed_orders: number; completed_sessions: number;
  order_value: string; completed_service_value: string; cleanwise_revenue: string;
};
export type ReportBooking = {
  id: number; booking_code: string; created_at: string; customer_name: string; service_id: number; service_name: string;
  status: string; status_label: string; payment_status: string; total_amount: string; workers: {id: number; name: string}[];
};
export type ReportRevenue = {
  id: number; booking_id: number; booking_code: string; schedule_id: number; sequence_no: number;
  worker_id: number; worker_name: string; service_id: number; service_name: string; completed_at: string;
  payment_method: "CASH" | "ONLINE"; gross_amount: string; commission_rate: string;
  commission_amount: string; worker_amount: string; settled_at: string | null; cash_commission_owed: boolean;
  booking_payment_status: string;
};
export type ReportPage<T> = { period: ReportPeriod; results: T[]; count: number; page: number; page_size: number; total_pages: number; has_next: boolean; has_previous: boolean };
export type ReportOverview = { period: ReportPeriod; summary: ReportSummary; timeline: ReportTimeline[]; services: ReportService[]; top_workers: ReportWorker[]; recent_bookings: ReportBooking[] };

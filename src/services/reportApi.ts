import { baseApi, requestBlob } from "@/store/baseApi";
import type { ReportBooking, ReportOverview, ReportPage, ReportParams, ReportRevenue, ReportService, ReportWorker, WorkerSort } from "@/types/Report";

const unwrap = <T,>(response: unknown): T => {
  const first = (response as { data?: unknown })?.data ?? response;
  return ((first as { data?: T })?.data ?? first) as T;
};
const tags = [{ type: "Bookings", id: "LIST" }, "Workers", { type: "Workers", id: "AVAILABLE" }, { type: "Reviews", id: "LIST" }, { type: "Services", id: "LIST" }] as const;
type PageParams = ReportParams & { page?: number; page_size?: number; sort?: WorkerSort };
export const reportApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getReportOverview: builder.query<ReportOverview, ReportParams>({ query: params => ({url: "/api/admin/reports/", method: "GET", params}), transformResponse: unwrap, providesTags: [...tags] }),
    getReportWorkers: builder.query<ReportPage<ReportWorker>, PageParams>({ query: params => ({url: "/api/admin/reports/workers/", method: "GET", params}), transformResponse: unwrap, providesTags: [...tags] }),
    getReportServices: builder.query<ReportPage<ReportService>, PageParams>({ query: params => ({url: "/api/admin/reports/services/", method: "GET", params}), transformResponse: unwrap, providesTags: [...tags] }),
    getReportBookings: builder.query<ReportPage<ReportBooking>, PageParams>({ query: params => ({url: "/api/admin/reports/bookings/", method: "GET", params}), transformResponse: unwrap, providesTags: [...tags] }),
    getReportRevenue: builder.query<ReportPage<ReportRevenue>, PageParams>({ query: params => ({url: "/api/admin/reports/revenue/", method: "GET", params}), transformResponse: unwrap, providesTags: [...tags] }),
  }),
});
export const { useGetReportOverviewQuery, useGetReportWorkersQuery, useGetReportServicesQuery, useGetReportBookingsQuery, useGetReportRevenueQuery } = reportApi;

export async function downloadReport(params: ReportParams, filename: string) {
  const blob = await requestBlob("/api/admin/reports/export/", params);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

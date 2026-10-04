import { baseApi } from "@/store/baseApi";
import type { AdminUser } from "@/types/Booking";
import type { Assignment, AvailableWorker, BookingActivity, BookingDetail, BookingListItem, BookingListParams, BookingSummary, CreateBookingPayload, CustomerSearchItem, PageResult, Schedule } from "@/types/Booking";

const unwrap = <T,>(response: unknown): T => {
  if (response && typeof response === "object" && "data" in response) {
    const first = (response as { data: unknown }).data;
    if (first && typeof first === "object" && "data" in first) return (first as { data: T }).data;
    return first as T;
  }
  return response as T;
};
const mutationHeaders = () => ({ "Idempotency-Key": typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` });
const bookingTags = (id: number) => [{ type: "Bookings" as const, id }, { type: "Bookings" as const, id: "LIST" }, { type: "Bookings" as const, id: "SUMMARY" }];
const availableWorkersTag = { type: "Workers" as const, id: "AVAILABLE" };

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchBookingWorkers: builder.query<PageResult<AdminUser>, { search: string; page: number }>({
      query: (params) => ({ url: "/api/admin/workers/search/", method: "GET", params: { ...params, page_size: 20 } }),
      transformResponse: unwrap,
      providesTags: [{ type: "Workers", id: "AVAILABLE" }],
    }),
    getBookingSummary: builder.query<BookingSummary, void>({ query: () => ({ url: "/api/admin/bookings/summary/", method: "GET" }), transformResponse: unwrap, providesTags: [{ type: "Bookings", id: "SUMMARY" }] }),
    getAdminBookings: builder.query<PageResult<BookingListItem>, BookingListParams>({ query: (params) => ({ url: "/api/admin/bookings/", method: "GET", params }), transformResponse: unwrap, providesTags: (result) => result ? [...result.results.map(({ id }) => ({ type: "Bookings" as const, id })), { type: "Bookings" as const, id: "LIST" }] : [{ type: "Bookings", id: "LIST" }] }),
    getAdminBookingDetail: builder.query<BookingDetail, number>({ query: (id) => ({ url: `/api/admin/bookings/${id}/`, method: "GET" }), transformResponse: unwrap, providesTags: (_r, _e, id) => [{ type: "Bookings", id }] }),
    getBookingTimeline: builder.query<PageResult<BookingActivity>, number>({ query: (id) => ({ url: `/api/admin/bookings/${id}/timeline/`, method: "GET", params: { page_size: 100 } }), transformResponse: unwrap, providesTags: (_r, _e, id) => [{ type: "Bookings", id: `TIMELINE-${id}` }] }),
    getAvailableWorkers: builder.query<PageResult<AvailableWorker>, { scheduleId: number; search?: string }>({ query: ({ scheduleId, search }) => ({ url: `/api/admin/schedules/${scheduleId}/available-workers/`, method: "GET", params: { search, page_size: 100 } }), transformResponse: unwrap, providesTags: [availableWorkersTag] }),
    searchCustomers: builder.query<PageResult<CustomerSearchItem>, string>({ query: (search) => ({ url: "/api/admin/customers/search/", method: "GET", params: { search, page_size: 30 } }), transformResponse: unwrap }),
    createAdminBooking: builder.mutation<BookingDetail, CreateBookingPayload>({ query: (data) => ({ url: "/api/admin/bookings/", method: "POST", data, headers: mutationHeaders() }), transformResponse: unwrap, invalidatesTags: [{ type: "Bookings", id: "LIST" }, { type: "Bookings", id: "SUMMARY" }] }),
    updateAdminBooking: builder.mutation<BookingDetail, { id: number; data: { note?: string; address_id?: number; delivery_address_id?: number | null } }>({ query: ({ id, data }) => ({ url: `/api/admin/bookings/${id}/`, method: "PATCH", data }), transformResponse: unwrap, invalidatesTags: (_r, _e, { id }) => bookingTags(id) }),
    cancelAdminBooking: builder.mutation<BookingDetail, { id: number; reason: string }>({ query: ({ id, reason }) => ({ url: `/api/admin/bookings/${id}/cancel/`, method: "POST", data: { reason }, headers: mutationHeaders() }), transformResponse: unwrap, invalidatesTags: (_r, _e, { id }) => [...bookingTags(id), { type: "Bookings", id: `TIMELINE-${id}` }, availableWorkersTag] }),
    updateAdminSchedule: builder.mutation<Schedule, { bookingId: number; scheduleId: number; data: { scheduled_start?: string; scheduled_end?: string; note?: string; reason?: string } }>({ query: ({ scheduleId, data }) => ({ url: `/api/admin/schedules/${scheduleId}/`, method: "PATCH", data }), transformResponse: unwrap, invalidatesTags: (_r, _e, { bookingId }) => [...bookingTags(bookingId), { type: "Bookings", id: `TIMELINE-${bookingId}` }, availableWorkersTag] }),
    assignWorker: builder.mutation<Assignment, { bookingId: number; scheduleId: number; worker_id: number; note?: string }>({ query: ({ scheduleId, worker_id, note }) => ({ url: `/api/admin/schedules/${scheduleId}/assign/`, method: "POST", data: { worker_id, note }, headers: mutationHeaders() }), transformResponse: unwrap, invalidatesTags: (_r, _e, { bookingId }) => [...bookingTags(bookingId), { type: "Bookings", id: `TIMELINE-${bookingId}` }, availableWorkersTag] }),
    unassignWorker: builder.mutation<Assignment, { bookingId: number; scheduleId: number; reason: string }>({ query: ({ scheduleId, reason }) => ({ url: `/api/admin/schedules/${scheduleId}/unassign/`, method: "POST", data: { reason }, headers: mutationHeaders() }), transformResponse: unwrap, invalidatesTags: (_r, _e, { bookingId }) => [...bookingTags(bookingId), { type: "Bookings", id: `TIMELINE-${bookingId}` }, availableWorkersTag] }),
    completeSchedule: builder.mutation<Schedule, { bookingId: number; scheduleId: number; reason: string; completion_note?: string }>({ query: ({ scheduleId, reason, completion_note }) => ({ url: `/api/admin/schedules/${scheduleId}/complete/`, method: "POST", data: { reason, completion_note }, headers: mutationHeaders() }), transformResponse: unwrap, invalidatesTags: (_r, _e, { bookingId }) => [...bookingTags(bookingId), { type: "Bookings", id: `TIMELINE-${bookingId}` }, availableWorkersTag] }),
    bulkAssign: builder.mutation<{ assigned: { schedule_id: number; assignment_id: number }[]; skipped: unknown[] }, { booking_id: number; schedule_ids: number[]; worker_id: number; note?: string }>({ query: (data) => ({ url: "/api/admin/schedules/bulk-assign/", method: "POST", data, headers: mutationHeaders() }), transformResponse: unwrap, invalidatesTags: (_r, _e, { booking_id }) => [...bookingTags(booking_id), { type: "Bookings", id: `TIMELINE-${booking_id}` }, availableWorkersTag] }),
  }), overrideExisting: false,
});

export const { useSearchBookingWorkersQuery, useGetBookingSummaryQuery, useGetAdminBookingsQuery, useGetAdminBookingDetailQuery, useGetBookingTimelineQuery, useGetAvailableWorkersQuery, useSearchCustomersQuery, useCreateAdminBookingMutation, useUpdateAdminBookingMutation, useCancelAdminBookingMutation, useUpdateAdminScheduleMutation, useAssignWorkerMutation, useUnassignWorkerMutation, useCompleteScheduleMutation, useBulkAssignMutation } = bookingApi;

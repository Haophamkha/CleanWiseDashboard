import { baseApi } from "@/store/baseApi";

import { normalizeNotificationPage, normalizeNotificationSummary, type NotificationPage, type NotificationSummary } from "./notification-response";
export type { AdminNotification } from "./notification-response";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getAdminNotificationSummary: builder.query<NotificationSummary, void>({
      query: () => ({url: "/api/admin/notifications/summary/", method: "GET"}),
      transformResponse: normalizeNotificationSummary,
      providesTags: ["Notifications"],
    }),
    getAdminNotifications: builder.query<NotificationPage, number>({
      query: page => ({url: "/api/notifications/", method: "GET", params: {page}}),
      transformResponse: normalizeNotificationPage,
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation<void, number>({
      query: id => ({url: `/api/notifications/${id}/mark-read/`, method: "POST"}),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({url: "/api/notifications/mark-all-read/", method: "POST"}),
      invalidatesTags: ["Notifications"],
    }),
  }),
});
export const {useGetAdminNotificationSummaryQuery, useGetAdminNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation} = notificationApi;

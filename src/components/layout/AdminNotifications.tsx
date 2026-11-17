"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, ChevronRight, ClipboardList, MessageCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { apiError } from "@/lib/api-error";
import { ENV } from "@/config/env";
import { getAccessToken, getRefreshToken } from "@/utils/authCookies";
import { useAppDispatch } from "@/store/hooks";
import { baseApi } from "@/store/baseApi";
import { CustomerDetailModal } from "@/features/customers/CustomerDetailModal";
import {
  notificationApi,
  useGetAdminNotificationSummaryQuery,
  useGetAdminNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  type AdminNotification,
} from "@/services/notificationApi";

const notificationToaster = "dashboard-notifications";
const notificationIcons = { support_chat: MessageCircle, complaint: ClipboardList };

export default function AdminNotifications() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [chatCustomerId, setChatCustomerId] = useState<number | null>(null);
  const { data: summary } = useGetAdminNotificationSummaryQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data, isFetching, isError, error, refetch } =
    useGetAdminNotificationsQuery(page, { skip: !open });
  const notifications = Array.isArray(data?.results) ? data.results : [];
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: marking }] =
    useMarkAllNotificationsReadMutation();

  useEffect(() => {
    if (!getAccessToken() && !getRefreshToken()) return;
    let stopped = false;
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;
    let attempts = 0;
    const refresh = (workers = false) =>
      dispatch(
        baseApi.util.invalidateTags(
          workers ? ["Notifications", "Workers"] : ["Notifications"],
        ),
      );
    const connect = async () => {
      if (stopped) return;
      if (!getAccessToken() && getRefreshToken()) {
        // A restored Dashboard session can refresh its token before opening the socket.
        await dispatch(notificationApi.endpoints.getAdminNotificationSummary.initiate(
          undefined,
          { forceRefetch: true, subscribe: false },
        ));
      }
      const token = getAccessToken();
      if (stopped || !token) return;
      const url = new URL(ENV.API_URL, window.location.origin);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = "/ws/admin/notifications/";
      url.search = "";
      socket = new WebSocket(url);
      socket.onopen = () =>
        socket?.send(JSON.stringify({ type: "auth", access_token: token }));
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "auth.ok") {
            attempts = 0;
            refresh(true);
            heartbeat = setInterval(() => {
              if (socket?.readyState === WebSocket.OPEN)
                socket.send(JSON.stringify({ type: "ping" }));
            }, 25000);
          } else if (message.type === "profile.review.changed") refresh(true);
          else if (message.type === "complaint.changed") {
            const id = message.payload?.complaint_id ?? message.complaint_id;
            dispatch(baseApi.util.invalidateTags([
              "Notifications", { type: "Complaints", id: "LIST" },
              ...(typeof id === "number" ? [{ type: "Complaints" as const, id }] : ["Complaints" as const]),
            ]));
          } else if (message.type === "notification.unread") {
            const count = message.unread_count;
            if (typeof count === "number" && Number.isInteger(count) && count >= 0) {
              dispatch(notificationApi.util.updateQueryData("getAdminNotificationSummary", undefined, (draft) => {
                draft.unread_count = count;
              }));
            }
            const incoming = message.notification;
            if (typeof incoming?.id === "number" && typeof incoming.title === "string" && incoming.title.trim()) {
              const Icon = incoming.target === "support_chat" || incoming.target === "complaint"
                ? notificationIcons[incoming.target as keyof typeof notificationIcons]
                : Bell;
              toast(incoming.title, {
                id: `admin-notification-${incoming.id}`,
                toasterId: notificationToaster,
                className: "dashboard-notification-toast",
                duration: 5000,
                icon: <Icon className="size-4 text-blue-600" aria-hidden />,
                action: {
                  label: "Xem",
                  onClick: () => {
                    setPage(1);
                    setOpen(true);
                  },
                },
              });
            }
            refresh();
          }
        } catch {
          /* Ignore malformed realtime messages; HTTP remains authoritative. */
        }
      };
      socket.onclose = (event) => {
        clearInterval(heartbeat);
        if (stopped || event.code === 4403) return;
        timer = setTimeout(
          async () => {
            // HTTP refresh handles expired access tokens before reconnecting.
            await dispatch(
              notificationApi.endpoints.getAdminNotificationSummary.initiate(
                undefined,
                { forceRefetch: true, subscribe: false },
              ),
            );
            void connect();
          },
          Math.min(30000, 1000 * 2 ** attempts++) + Math.random() * 500,
        );
      };
    };
    const onFocus = () => refresh(true);
    window.addEventListener("focus", onFocus);
    void connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(heartbeat);
      socket?.close();
      window.removeEventListener("focus", onFocus);
    };
  }, [dispatch]);

  const select = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      try {
        await markRead(notification.id).unwrap();
      } catch (error) {
        toast.error(apiError(error));
      }
    }

    setOpen(false);

    if (notification.target === "support_chat" && notification.related_customer) {
      setChatCustomerId(notification.related_customer);
    } else if (notification.target === "complaint" && notification.related_complaint) {
      router.push(`/complaints/${notification.related_complaint}`);
    } else if (notification.related_worker) {
      router.push(`/workers?worker=${notification.related_worker}`);
    } else if (notification.related_booking) {
      router.push(`/bookings/${notification.related_booking}`);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Toaster
        id={notificationToaster}
        position="top-right"
        offset={{ top: 76, right: 24 }}
        mobileOffset={{ top: 76, right: 12, left: 12 }}
        visibleToasts={2}
        hotkey={[]}
        customAriaLabel="Thông báo mới"
      />
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-slate-500"
          aria-label={`Thông báo${summary?.unread_count ? `, ${summary.unread_count} chưa đọc` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {!!summary?.unread_count && (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] leading-5 text-white">
              {summary.unread_count > 99 ? "99+" : summary.unread_count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="flex max-h-[var(--radix-dropdown-menu-content-available-height)] w-[min(24rem,calc(100vw-2rem))] flex-col p-0"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="font-semibold">Thông báo</h3>
          <Button
            variant="ghost"
            size="sm"
            disabled={marking || !summary?.unread_count}
            onClick={async () => {
              try {
                await markAll().unwrap();
              } catch (error) {
                toast.error(apiError(error));
              }
            }}
          >
            Đọc tất cả
          </Button>
        </div>
        <div className="min-h-0 max-h-[min(24rem,60dvh)] overflow-y-auto">
          {isError ? (
            <div role="alert" className="p-5 text-center text-sm">
              <p>Không tải được thông báo.</p>
              <p className="mt-1 whitespace-pre-line text-slate-500">
                {apiError(error)}
              </p>
              <Button variant="ghost" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          ) : isFetching && !data ? (
            <p className="p-5 text-sm text-slate-500">Đang tải...</p>
          ) : !notifications.length ? (
            <p className="p-6 text-center text-sm text-slate-500">
              Chưa có thông báo.
            </p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                asChild
                className="block rounded-none p-4"
              >
                <button
                  type="button"
                  onClick={() => select(notification)}
                  className={`block w-full border-b border-slate-100 p-4 text-left transition-colors hover:bg-blue-50 ${notification.is_read ? "bg-white" : "bg-blue-50/60"}`}
                >
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {!notification.is_read && (
                      <span className="size-2 shrink-0 rounded-full bg-blue-600" aria-hidden />
                    )}
                    {notification.target === "support_chat" && (
                      <MessageCircle className="size-4 shrink-0 text-blue-600" aria-hidden />
                    )}
                    {notification.target === "complaint" && (
                      <ClipboardList className="size-4 shrink-0 text-blue-600" aria-hidden />
                    )}
                    <span className="min-w-0 break-words">{notification.title}</span>
                  </p>
                  {notification.target !== "support_chat" && notification.message && (
                    <p className="mt-1 break-words text-sm text-slate-600">{notification.message}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(notification.created_at).toLocaleString("vi-VN")}
                  </p>
                </button>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <div className="flex items-center justify-between p-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1 || isFetching}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <span className="text-xs text-slate-500">Trang {page}</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!data?.has_next || isFetching}
            onClick={() => setPage(page + 1)}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DropdownMenuContent>
      {chatCustomerId !== null && (
        <CustomerDetailModal
          key={chatCustomerId}
          id={chatCustomerId}
          initialTab="contact"
          onClose={() => setChatCustomerId(null)}
        />
      )}
    </DropdownMenu>
  );
}

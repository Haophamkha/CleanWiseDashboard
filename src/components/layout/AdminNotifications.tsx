"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { apiError } from "@/lib/api-error";
import { ENV } from "@/config/env";
import { getAccessToken } from "@/utils/authCookies";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { baseApi } from "@/store/baseApi";
import { notificationApi, useGetAdminNotificationSummaryQuery, useGetAdminNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation, type AdminNotification } from "@/services/notificationApi";

export default function AdminNotifications() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(state => state.auth.user?.id);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const {data: summary} = useGetAdminNotificationSummaryQuery(undefined, {pollingInterval: 30000});
  const {data, isFetching, isError, error, refetch} = useGetAdminNotificationsQuery(page, {skip: !open});
  const notifications = Array.isArray(data?.results) ? data.results : [];
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, {isLoading: marking}] = useMarkAllNotificationsReadMutation();

  useEffect(() => {
    if (!userId) return;
    let stopped = false;
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;
    let attempts = 0;
    const refresh = (workers = false) => dispatch(baseApi.util.invalidateTags(workers ? ["Notifications", "Workers"] : ["Notifications"]));
    const connect = () => {
      const token = getAccessToken();
      if (stopped || !token) return;
      const url = new URL(ENV.API_URL, window.location.origin);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = "/ws/admin/notifications/";
      url.search = "";
      socket = new WebSocket(url);
      socket.onopen = () => socket?.send(JSON.stringify({type: "auth", access_token: token}));
      socket.onmessage = event => {
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
          else if (message.type === "complaint.changed") refresh();
          else if (message.type === "notification.unread") refresh();
        } catch { /* Ignore malformed realtime messages; HTTP remains authoritative. */ }
      };
      socket.onclose = event => {
        clearInterval(heartbeat);
        if (stopped || event.code === 4403) return;
        timer = setTimeout(async () => {
          // HTTP refresh handles expired access tokens before reconnecting.
          await dispatch(notificationApi.endpoints.getAdminNotificationSummary.initiate(undefined, {forceRefetch:true, subscribe:false}));
          connect();
        }, Math.min(30000, 1000 * 2 ** attempts++) + Math.random() * 500);
      };
    };
    const onFocus = () => refresh(true);
    window.addEventListener("focus", onFocus);
    connect();
    return () => { stopped = true; clearTimeout(timer); clearInterval(heartbeat); socket?.close(); window.removeEventListener("focus", onFocus); };
  }, [dispatch, userId]);

  const select = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      try { await markRead(notification.id).unwrap(); }
      catch (error) { toast.error(apiError(error)); }
    }
    setOpen(false);
    if (notification.related_worker) router.push(`/workers?worker=${notification.related_worker}`);
    else if (notification.related_booking) router.push(`/bookings/${notification.related_booking}`);
  };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full text-slate-500" aria-label={`Thông báo${summary?.unread_count ? `, ${summary.unread_count} chưa đọc` : ""}`}>
          <Bell className="h-5 w-5" />
          {!!summary?.unread_count && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] leading-5 text-white">{summary.unread_count > 99 ? "99+" : summary.unread_count}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex max-h-[var(--radix-dropdown-menu-content-available-height)] w-[min(24rem,calc(100vw-2rem))] flex-col p-0">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="font-semibold">Thông báo</h3>
          <Button variant="ghost" size="sm" disabled={marking || !summary?.unread_count} onClick={async () => {
            try { await markAll().unwrap(); }
            catch (error) { toast.error(apiError(error)); }
          }}>Đọc tất cả</Button>
        </div>
        <div className="min-h-0 max-h-[min(24rem,60dvh)] overflow-y-auto">
          {isError ? (
            <div role="alert" className="p-5 text-center text-sm">
              <p>Không tải được thông báo.</p>
              <p className="mt-1 whitespace-pre-line text-slate-500">{apiError(error)}</p>
              <Button variant="ghost" onClick={() => refetch()}>Thử lại</Button>
            </div>
          ) : isFetching && !data ? (
            <p className="p-5 text-sm text-slate-500">Đang tải...</p>
          ) : !notifications.length ? (
            <p className="p-6 text-center text-sm text-slate-500">Chưa có thông báo.</p>
          ) : notifications.map(notification => (
            <DropdownMenuItem key={notification.id} asChild className="block rounded-none p-4">
              <button type="button" onClick={() => select(notification)} className={`block w-full border-b border-slate-100 p-4 text-left transition-colors hover:bg-blue-50 ${notification.is_read ? "bg-white" : "bg-blue-50/60"}`}>
                <p className="text-sm font-medium">{!notification.is_read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600" />}{notification.title}</p>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(notification.created_at).toLocaleString("vi-VN")}</p>
              </button>
            </DropdownMenuItem>
          ))}
        </div>
        <div className="flex items-center justify-between p-2">
          <Button variant="ghost" size="sm" disabled={page === 1 || isFetching} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" />Trước</Button>
          <span className="text-xs text-slate-500">Trang {page}</span>
          <Button variant="ghost" size="sm" disabled={!data?.has_next || isFetching} onClick={() => setPage(page + 1)}>Sau<ChevronRight className="h-4 w-4" /></Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Check, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiError } from "@/lib/api-error";
import { useOpenSupportChatMutation, useSupportMessagesQuery, useLazySupportMessagesQuery, useSendSupportMessageMutation, useReadSupportMessagesMutation, type SupportMessage } from "@/services/supportChatApi";
const chatTime = new Intl.DateTimeFormat("vi-VN", {
  timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
});
const chatDay = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
});

export function SupportChatPanel({ userId, name, role }: {
  userId: number; name: string; role: "customer" | "worker";
}) {
  const [open, opening] = useOpenSupportChatMutation();
  const [send, sending] = useSendSupportMessageMutation();
  const [read] = useReadSupportMessagesMutation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [older, setOlder] = useState<SupportMessage[]>([]);
  const [previous, setPrevious] = useState<number | null>();
  const transcript = useRef<HTMLDivElement>(null);
  const shouldFollow = useRef(true);
  const previousScroll = useRef<{ height: number; top: number }>(null);
  const requestKey = useRef<{ message: string; id: string }>(null);
  const thread = opening.data;
  const latest = useSupportMessagesQuery({ id: thread?.id ?? 0 }, {
    skip: !thread, pollingInterval: 3000, refetchOnMountOrArgChange: true,
  });
  const [loadOlder, earlier] = useLazySupportMessagesQuery();
  const last = latest.data?.results.at(-1)?.id;

  useEffect(() => { void open(userId); }, [open, userId]);
  useLayoutEffect(() => {
    const area = transcript.current;
    if (!area) return;
    if (previousScroll.current) {
      const { height, top } = previousScroll.current;
      area.scrollTop = top + area.scrollHeight - height;
      previousScroll.current = null;
    } else if (shouldFollow.current) {
      area.scrollTop = area.scrollHeight;
    }
  }, [last, older]);
  useEffect(() => {
    if (thread?.id && latest.data?.results.some((item) => item.sender_id === userId && !item.is_read)) {
      void read(thread.id);
    }
  }, [latest.data, read, thread?.id, userId]);

  const next = previous === undefined ? latest.data?.next_cursor : previous;
  const messages = [...new Map([...older, ...(latest.data?.results ?? [])].map((item) => [item.id, item])).values()];
  const lastOutgoing = messages.findLast((item) => item.sender_id !== userId);
  const initials = name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0)).join("").toLocaleUpperCase("vi");
  const recipientLabel = role === "worker" ? "Nhân viên CleanWise" : "Khách hàng CleanWise";

  async function loadHistory() {
    if (!thread || !next) return;
    setError("");
    try {
      const page = await loadOlder({ id: thread.id, cursor: next }, true).unwrap();
      const area = transcript.current;
      if (area) previousScroll.current = { height: area.scrollHeight, top: area.scrollTop };
      setOlder((items) => [...page.results, ...items]);
      setPrevious(page.next_cursor);
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = message.trim();
    if (!thread?.can_send || !value || sending.isLoading) return;
    if (requestKey.current?.message !== value) {
      requestKey.current = { message: value, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    }
    setError("");
    try {
      const result = await send({ id: thread.id, message: value, key: requestKey.current.id }).unwrap();
      shouldFollow.current = true;
      if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
      setMessage("");
      requestKey.current = null;
      if (result.moderation?.message) setError(result.moderation.message);
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label={`Nhắn tin với ${name}`}>
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-3 py-2.5 sm:px-4">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">{initials}</span>
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold text-slate-900">{name}</h3>
          <p className="text-xs text-slate-500">{recipientLabel}</p>
        </div>
      </header>
      <div
        ref={transcript}
        onScroll={(event) => {
          const area = event.currentTarget;
          shouldFollow.current = area.scrollHeight - area.scrollTop - area.clientHeight < 64;
        }}
        className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-3 py-3 [overflow-anchor:none] sm:px-4"
        role="log"
        aria-label="Lịch sử tin nhắn"
      >
        {opening.isLoading || latest.isLoading ? <Skeleton className="h-16 w-3/4" /> : null}
        {(opening.isError || latest.isError) && (
          <div className="space-y-2 text-sm">
            <p className="text-red-700">{apiError(opening.error ?? latest.error)}</p>
            <Button size="sm" variant="outline" onClick={() => thread ? void latest.refetch() : void open(userId)}>Thử lại</Button>
          </div>
        )}
        {next && <div className="text-center"><Button size="sm" variant="outline" disabled={earlier.isFetching}
          onClick={() => void loadHistory()}>Xem tin nhắn cũ</Button></div>}
        {latest.data && !messages.length && (
          <div className="flex min-h-full flex-col items-center justify-center gap-2 py-5 text-center">
            <span className="rounded-full bg-blue-100 p-3 text-blue-700"><MessageCircle className="size-4" aria-hidden /></span>
            <p className="text-sm font-medium text-slate-900">Chưa có tin nhắn</p>
            {thread?.can_send && <p className="text-xs text-slate-500">Gửi tin để bắt đầu trò chuyện.</p>}
          </div>
        )}
        {messages.map((item, index) => {
          const outgoing = item.sender_id !== userId;
          const sentAt = new Date(item.created_at);
          const prior = messages[index - 1];
          const priorTime = prior ? new Date(prior.created_at) : null;
          const newDay = !priorTime || chatDay.format(priorTime) !== chatDay.format(sentAt);
          const showTime = newDay || (priorTime !== null && sentAt.getTime() - priorTime.getTime() >= 30 * 60 * 1000);
          const grouped = !showTime && prior?.sender_id === item.sender_id;
          return (
            <div key={item.id}>
              {showTime && (
                <time className="block py-2 text-center text-xs text-slate-500" dateTime={item.created_at}>
                  {chatTime.format(sentAt)}{newDay && ` · ${chatDay.format(sentAt)}`}
                </time>
              )}
              <div className={`flex min-w-0 items-end gap-2 ${outgoing ? "justify-end" : ""} ${grouped ? "" : "pt-1"}`}>
                {!outgoing && (
                  <span aria-hidden="true" className={`grid size-7 shrink-0 place-items-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-800 ${grouped ? "invisible" : ""}`}>{initials}</span>
                )}
                <p className={`max-w-[80%] whitespace-pre-wrap rounded-[18px] px-3 py-2 text-sm [overflow-wrap:anywhere] sm:max-w-[min(76%,28rem)] ${outgoing ? "rounded-br-md bg-blue-700 text-white" : "rounded-bl-md bg-slate-100 text-slate-900"}`}>
                  <span className="sr-only">{outgoing ? "CleanWise" : name}: </span>{item.message}
                </p>
              </div>
              {item.id === lastOutgoing?.id && (
                <p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
                  <Check className="size-3" aria-hidden />{item.is_read ? "Đã xem" : "Đã gửi"}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="shrink-0 border-t border-slate-200 px-3 py-2 sm:px-4">
        {error && <p role="alert" className="mb-2 text-xs text-red-700">{error}</p>}
        {thread && !thread.can_send ? (
          <p className="py-2 text-sm text-slate-500">Cuộc trò chuyện hiện chỉ có thể xem.</p>
        ) : (
          <form className="flex items-end gap-2" onSubmit={submit}>
            <Textarea
              className="max-h-24 min-h-11 field-sizing-content resize-none rounded-3xl bg-slate-100 px-4 py-2.5"
              aria-label="Nội dung tin nhắn"
              placeholder="Nhập tin nhắn…"
              rows={1}
              maxLength={2000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }}
              disabled={!thread}
              readOnly={sending.isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0 rounded-full bg-blue-700 hover:bg-blue-800"
              aria-label="Gửi tin nhắn"
              disabled={!thread || !message.trim() || sending.isLoading}
            >
              <Send className="size-4" aria-hidden />
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

import {
  ArrowDownWideNarrow,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileUp,
  FileX,
  History,
  Loader2,
  LockKeyhole,
  Pencil,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetWorkerReviewHistoryInfiniteQuery } from "@/services/workerApi";
import type { WorkerProfile, WorkerReviewAction, WorkerReviewEvent } from "@/types/Worker";
import { FIELD_LABELS, type RejectableField } from "./profile-review";
import { workerName, WorkerStatusBadge } from "./worker-ui";

const actions = {
  SUBMITTED: { label: "Gửi hồ sơ", actor: "Nhân viên", icon: FileUp, tone: "bg-slate-100 text-slate-600" },
  RESUBMITTED: { label: "Gửi lại hồ sơ", actor: "Nhân viên", icon: FileUp, tone: "bg-slate-100 text-slate-600" },
  APPROVED: { label: "Duyệt hồ sơ", actor: "Quản trị viên", icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Từ chối hồ sơ", actor: "Quản trị viên", icon: FileX, tone: "bg-red-50 text-red-700" },
  SUSPENDED: { label: "Tạm khóa hồ sơ", actor: "Quản trị viên", icon: LockKeyhole, tone: "bg-orange-50 text-orange-700" },
  REACTIVATED: { label: "Kích hoạt lại", actor: "Quản trị viên", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
  REVOKED: { label: "Thu hồi phê duyệt", actor: "Quản trị viên", icon: RotateCcw, tone: "bg-orange-50 text-orange-700" },
  CONTACT_UPDATED: { label: "Sửa số điện thoại", actor: "Quản trị viên", icon: Pencil, tone: "bg-blue-50 text-blue-700" },
  SERVICE_REQUESTED: { label: "Yêu cầu đổi dịch vụ", actor: "Nhân viên", icon: FileUp, tone: "bg-blue-50 text-blue-700" },
  SERVICE_APPROVED: { label: "Duyệt đổi dịch vụ", actor: "Quản trị viên", icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-700" },
  SERVICE_REJECTED: { label: "Từ chối đổi dịch vụ", actor: "Quản trị viên", icon: FileX, tone: "bg-red-50 text-red-700" },
} satisfies Record<WorkerReviewAction, { label: string; actor: string; icon: typeof History; tone: string }>;

const timeZone = "Asia/Ho_Chi_Minh";
const dayFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function HistoryEntry({ event }: { event: WorkerReviewEvent }) {
  const { label, actor, icon: Icon, tone } = actions[event.action];
  const date = new Date(event.created_at);
  const fieldChange = event.changes?.phone_number ?? event.changes?.service;
  const notes = Object.entries(event.rejected_fields);
  const detailLabel = notes.length
    ? event.reason ? "Xem lý do và mục cần sửa" : "Xem mục cần sửa"
    : event.action === "SUSPENDED" ? "Xem lý do tạm khóa" : "Xem lý do";

  return (
    <li className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-3 before:absolute before:-bottom-3 before:left-4 before:top-11 before:w-px before:bg-slate-200 last:before:hidden">
      <span className={cn("relative grid size-8 place-items-center rounded-full", tone)}>
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h4 className="text-sm font-semibold text-slate-950">{label}</h4>
          <time dateTime={event.created_at} className="whitespace-nowrap text-xs tabular-nums text-slate-500">
            {dayFormat.format(date)} · {timeFormat.format(date)}
          </time>
        </div>
        <p className="break-words text-xs text-slate-700">
          {event.actor_name} <span className="text-slate-500">· {actor}</span>
        </p>
        {fieldChange ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs tabular-nums">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{fieldChange.before || "Chưa cập nhật"}</span>
            <ArrowRight aria-hidden="true" className="size-3.5 text-slate-500" />
            <span className="sr-only">sang</span>
            <span className="rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-700">{fieldChange.after}</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <WorkerStatusBadge status={event.previous_status} />
            <ArrowRight aria-hidden="true" className="size-3.5 text-slate-500" />
            <span className="sr-only">sang</span>
            <WorkerStatusBadge status={event.new_status} />
          </div>
        )}
        {(event.reason || notes.length > 0) && (
          <details className="group pt-1 text-sm">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm text-xs font-medium text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
              <ChevronRight aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-90" />
              {detailLabel}
            </summary>
            <div className="mt-2 space-y-2 break-words border-l-2 border-slate-200 pl-3 text-slate-700">
              {event.reason && <p className="whitespace-pre-wrap">{event.reason}</p>}
              {notes.length > 0 && (
                <dl className="space-y-2">
                  {notes.map(([field, note]) => (
                    <div key={field}>
                      <dt className="font-medium text-slate-900">
                        {Object.hasOwn(FIELD_LABELS, field) ? FIELD_LABELS[field as RejectableField] : field}
                      </dt>
                      <dd className="whitespace-pre-wrap">{note}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </details>
        )}
      </div>
    </li>
  );
}

export default function WorkerReviewHistoryPanel({ worker }: { worker: WorkerProfile }) {
  const history = useGetWorkerReviewHistoryInfiniteQuery(worker.id, { refetchOnMountOrArgChange: true });
  const events = history.currentData?.pages.flatMap((page) => page.results) ?? [];
  const initials = (worker.first_name[0] ?? "") + (worker.last_name[0] ?? "");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-semibold uppercase text-blue-700">
          {initials || worker.username.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1 basis-36">
          <h3 className="break-words font-semibold text-slate-950">{workerName(worker)}</h3>
          <p className="break-words text-xs text-slate-600">
            @{worker.username}{worker.registered_service && ` · ${worker.registered_service.name}`}
          </p>
        </div>
        <WorkerStatusBadge status={worker.status} />
      </div>

      <section aria-labelledby="worker-review-history-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="worker-review-history-title" className="font-semibold text-slate-950">Lịch sử duyệt hồ sơ</h3>
          {events.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowDownWideNarrow aria-hidden="true" className="size-3.5" />
              Mới nhất trước
            </span>
          )}
        </div>

        {!history.currentData && history.isFetching ? (
          <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Đang tải lịch sử duyệt…
          </p>
        ) : !history.currentData && history.isError ? (
          <div className="space-y-3 py-10 text-center">
            <p role="alert" className="text-sm text-red-700">Không tải được lịch sử duyệt.</p>
            <Button size="sm" variant="outline" onClick={() => void history.refetch()}>Thử lại</Button>
          </div>
        ) : events.length === 0 ? (
          <div className="space-y-1 py-10 text-center">
            <History aria-hidden="true" className="mx-auto mb-2 size-5 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">Chưa có lịch sử duyệt</p>
            <p className="text-xs text-slate-500">Các lần xử lý được ghi nhận sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <>
            <ol className="mt-1">
              {events.map((event) => <HistoryEntry key={event.id} event={event} />)}
            </ol>
            {(history.hasNextPage || history.isError) && (
              <div className="mt-2 space-y-2 pl-11">
                {history.isError && (
                  <p role="alert" className="text-xs text-red-700">Không cập nhật được lịch sử duyệt.</p>
                )}
                {history.hasNextPage && (
                  <Button size="sm" variant="outline" disabled={history.isFetching} onClick={() => void history.fetchNextPage()}>
                    {history.isFetchingNextPage ? "Đang tải…" : "Xem các mốc cũ hơn"}
                  </Button>
                )}
                {history.isError && !history.hasNextPage && (
                  <Button size="sm" variant="outline" onClick={() => void history.refetch()}>Thử lại</Button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebounced } from "@/features/refunds/refund-utils";
import {
  useDecideDisciplineMutation,
  useGetDisciplineCasesQuery,
  useGetDisciplineDetailQuery,
} from "@/services/disciplineApi";
import type { DisciplineAction, DisciplineCase } from "@/types/Discipline";

const actionLabels: Record<DisciplineAction, string> = {
  CONFIRM: "Xác nhận trừ điểm",
  WAIVE: "Miễn điểm",
  SUSPEND: "Tạm khóa hồ sơ 7 ngày",
  PROPOSE_BAN: "Đề xuất cấm hồ sơ",
  APPROVE_BAN: "Duyệt cấm hồ sơ",
  REJECT_BAN: "Bác đề xuất cấm",
};

function formatTime(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

function DecisionPanel({ id }: { id: number }) {
  const { currentData: item, isError } = useGetDisciplineDetailQuery(id);
  const [decide, { isLoading }] = useDecideDisciplineMutation();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmBan, setConfirmBan] = useState(false);

  if (isError) return <p role="alert">Không tải được hồ sơ vi phạm.</p>;
  if (!item) return <p>Đang tải hồ sơ…</p>;

  const openAppeal = item.appeal_status === "PENDING" || item.appeal_status === "IN_REVIEW";
  const actions: DisciplineAction[] = [];
  if (!openAppeal && item.status !== "WAIVED") actions.push("WAIVE");
  if (!openAppeal && item.status === "PENDING") actions.push("CONFIRM");
  if (item.can_apply_sanction) actions.push("SUSPEND", "PROPOSE_BAN");
  if (item.summary.enforced && item.sanction === "PROPOSED" && item.can_decide_proposal) {
    actions.push("REJECT_BAN");
    if (!openAppeal && item.summary.score === 0) actions.push("APPROVE_BAN");
  }

  async function apply(action: DisciplineAction) {
    setError("");
    try {
      await decide({ id, action, note: note.trim() }).unwrap();
      setNote("");
      setConfirmBan(false);
    } catch (err) {
      const data = (err as { data?: { errors?: Record<string, string[]>; message?: string } }).data;
      setError(data?.errors?.action?.[0] ?? data?.errors?.note?.[0] ?? data?.message ?? "Không xử lý được hồ sơ.");
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900">
            {item.worker_name} · <span className="whitespace-nowrap">{item.booking_code}</span> · Buổi {item.sequence}
          </h2>
          <p className="text-sm text-gray-600">{item.kind_label} · {item.status_label} · {formatTime(item.occurred_at)}</p>
        </div>
        <Badge>{item.summary.score}/{item.summary.max_score} điểm</Badge>
      </div>
      <p className="text-sm text-gray-700">{item.reason || "Chưa có lý do từ nhân viên."}</p>
      {item.review_note && <p className="text-sm text-gray-700">Kết luận xác minh · {item.review_note}</p>}
      {!item.summary.enforced && <p className="rounded bg-amber-50 p-2 text-sm text-amber-900">Đang theo dõi điểm. Giới hạn nhận việc và xử lý hồ sơ chưa bật.</p>}
      {item.summary.enforced && item.summary.restricted_until && <p className="text-sm text-red-700">Tạm dừng nhận việc đến {formatTime(item.summary.restricted_until)}</p>}
      {item.sanction && <p className="text-sm text-red-700">{item.sanction_label} · {item.sanction_note}</p>}
      {item.sanction === "PROPOSED" && !item.can_decide_proposal && <p className="text-sm text-amber-800">Một quản trị viên khác cần duyệt đề xuất.</p>}
      {item.appeal_id !== null && <Button asChild variant="outline"><Link href={`/complaints/${item.appeal_id}?from=discipline`}>Xem khiếu nại và ảnh minh chứng</Link></Button>}
      {actions.length > 0 && (
        <>
          <label className="block text-sm font-medium text-gray-800">
            Lý do và căn cứ xử lý
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} className="mt-1" />
          </label>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action}
                type="button"
                variant={action === "APPROVE_BAN" ? "destructive" : action === "CONFIRM" ? "default" : "outline"}
                disabled={isLoading || !note.trim()}
                onClick={() => action === "APPROVE_BAN" ? setConfirmBan(true) : void apply(action)}
              >
                {actionLabels[action]}
              </Button>
            ))}
          </div>
        </>
      )}
      {error && !confirmBan && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Dialog open={confirmBan} onOpenChange={(open) => {
        if (!isLoading) {
          setConfirmBan(open);
          setError("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt cấm hồ sơ nhân viên?</DialogTitle>
            <DialogDescription>Hồ sơ của {item.worker_name} sẽ bị cấm nhận việc mới.</DialogDescription>
          </DialogHeader>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => setConfirmBan(false)}>Quay lại</Button>
            <Button type="button" variant="destructive" disabled={isLoading || !actions.includes("APPROVE_BAN")} onClick={() => void apply("APPROVE_BAN")}>
              {isLoading ? "Đang xử lý…" : actionLabels.APPROVE_BAN}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function DisciplineInbox() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const query = useDebounced(search).trim();
  const { currentData: data, isFetching, isError, refetch } = useGetDisciplineCasesQuery({ page, pending, search: query });
  const groups = new Map<string, DisciplineCase[]>();
  for (const item of data?.results ?? []) {
    const key = `${item.worker}:${item.booking}`;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Điểm tín nhiệm nhân viên</h1>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          aria-label="Tìm nhân viên hoặc mã đơn"
          placeholder="Tìm nhân viên hoặc mã đơn"
          className="sm:max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={pending} onCheckedChange={(value) => { setPending(value === true); setPage(1); }} />
          Đang chờ xác minh hoặc duyệt
        </label>
      </div>
      {selected !== null && <DecisionPanel key={selected} id={selected} />}
      {isFetching && <p className="text-sm text-gray-600">Đang tải…</p>}
      {isError && <Button type="button" variant="outline" onClick={refetch}>Không tải được hồ sơ. Thử lại</Button>}
      {!isFetching && data?.results.length === 0 && <p className="text-sm text-gray-600">Chưa có hồ sơ phù hợp.</p>}
      {Array.from(groups.entries(), ([key, items]) => (
        <Card key={key} className="overflow-hidden">
          <h2 className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold">
            {items[0].worker_name} · <span className="whitespace-nowrap">{items[0].booking_code}</span>
          </h2>
          {items.map((item) => (
            <Button key={item.id} type="button" variant="ghost" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} className="h-auto w-full flex-wrap justify-between rounded-none border-b border-slate-100 px-4 py-3 text-left whitespace-normal last:border-b-0 aria-pressed:bg-blue-50">
              <span>Buổi {item.sequence} · {item.kind_label}</span>
              <span>{item.sanction ? item.sanction_label : item.status_label} · {item.status === "WAIVED" ? 0 : `−${item.deduction}`} điểm</span>
            </Button>
          ))}
        </Card>
      ))}
      {(page > 1 || data?.next) && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage(page - 1)}>Trang trước</Button>
          <Button type="button" variant="outline" disabled={!data?.next || isFetching} onClick={() => setPage(page + 1)}>Trang sau</Button>
        </div>
      )}
    </div>
  );
}

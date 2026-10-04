"use client";

import { useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminUser, BookingListParams } from "@/types/Booking";
import { WorkerFilter } from "./WorkerFilter";

type AdvancedFilters = Pick<BookingListParams, "worker_id" | "created_from" | "created_to" | "unassigned" | "ordering">;

function advancedValues(filters: BookingListParams): AdvancedFilters {
  return {
    worker_id: filters.worker_id,
    created_from: filters.created_from,
    created_to: filters.created_to,
    unassigned: filters.unassigned,
    ordering: filters.ordering ?? "-created_at",
  };
}

const buttonFeedback = "cursor-pointer transition-all duration-150 hover:shadow-sm active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";
const selectFeedback = "cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50/50 data-[state=open]:border-blue-500 data-[state=open]:bg-blue-50";
const optionFeedback = "cursor-pointer transition-colors focus:bg-blue-50 focus:text-blue-700 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700";

export function AdvancedBookingFilters({ filters, worker, onApply }: {
  filters: BookingListParams;
  worker?: AdminUser;
  onApply: (filters: AdvancedFilters, worker?: AdminUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => advancedValues(filters));
  const [draftWorker, setDraftWorker] = useState(worker);
  const activeCount = Number(Boolean(filters.worker_id)) + Number(Boolean(filters.created_from || filters.created_to))
    + Number(filters.unassigned !== undefined) + Number((filters.ordering ?? "-created_at") !== "-created_at");

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(advancedValues(filters));
      setDraftWorker(worker);
    }
    setOpen(nextOpen);
  };

  return <Dialog open={open} onOpenChange={handleOpen}>
    <DialogTrigger asChild>
      <Button variant="outline" className={`${buttonFeedback} px-3 ${open || activeCount ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" : "hover:border-blue-300 hover:bg-blue-50"}`}>
        <SlidersHorizontal className="h-4 w-4" />Bộ lọc
        {activeCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs text-white" aria-label={`${activeCount} bộ lọc nâng cao đang áp dụng`}>{activeCount}</span>}
      </Button>
    </DialogTrigger>
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl flex-col overflow-hidden p-0">
      <DialogHeader className="mb-0 shrink-0 border-b border-slate-100 px-6 py-5 pr-12">
        <DialogTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-blue-600" />Bộ lọc nâng cao</DialogTitle>
        <DialogDescription>Chọn điều kiện để tìm đơn dịch vụ phù hợp.</DialogDescription>
      </DialogHeader>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => {
        event.preventDefault();
        onApply(draft, draftWorker);
        setOpen(false);
      }}>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-6">
          <WorkerFilter value={draftWorker} onChange={(selected) => {
            setDraftWorker(selected);
            setDraft((current) => ({ ...current, worker_id: selected?.id }));
          }} />
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
            <label className="block min-w-0 space-y-1 text-xs font-medium text-slate-500">
              <span>Từ ngày tạo</span>
              <Input type="date" value={draft.created_from ?? ""} max={draft.created_to || undefined} onKeyDown={(event) => event.stopPropagation()} onChange={(event) => setDraft((current) => ({ ...current, created_from: event.target.value || undefined }))} />
            </label>
            <label className="block min-w-0 space-y-1 text-xs font-medium text-slate-500">
              <span>Đến ngày tạo</span>
              <Input type="date" value={draft.created_to ?? ""} min={draft.created_from || undefined} onKeyDown={(event) => event.stopPropagation()} onChange={(event) => setDraft((current) => ({ ...current, created_to: event.target.value || undefined }))} />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-1">
            <label htmlFor="booking-assignment-filter" className="text-xs font-medium text-slate-500">Phân công</label>
            <Select value={draft.unassigned === undefined ? "all" : String(draft.unassigned)} onValueChange={(value) => setDraft((current) => ({ ...current, unassigned: value === "all" ? undefined : value === "true" }))}>
              <SelectTrigger id="booking-assignment-filter" className={`${selectFeedback} ${draft.unassigned !== undefined ? "border-blue-300 bg-blue-50/50 text-blue-700" : ""}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem className={optionFeedback} value="all">Mọi phân công</SelectItem>
                <SelectItem className={optionFeedback} value="true">Còn buổi chưa gán</SelectItem>
                <SelectItem className={optionFeedback} value="false">Đã gán đầy đủ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1">
            <label htmlFor="booking-ordering-filter" className="text-xs font-medium text-slate-500">Sắp xếp</label>
            <Select value={draft.ordering ?? "-created_at"} onValueChange={(value) => setDraft((current) => ({ ...current, ordering: value }))}>
              <SelectTrigger id="booking-ordering-filter" className={`${selectFeedback} ${draft.ordering !== "-created_at" ? "border-blue-300 bg-blue-50/50 text-blue-700" : ""}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem className={optionFeedback} value="-created_at">Mới nhất</SelectItem>
                <SelectItem className={optionFeedback} value="created_at">Cũ nhất</SelectItem>
                <SelectItem className={optionFeedback} value="-total_amount">Giá trị cao nhất</SelectItem>
                <SelectItem className={optionFeedback} value="next_schedule_start">Lịch gần nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex sm:items-center sm:justify-end">
          <Button type="button" variant="ghost" size="sm" className={`${buttonFeedback} col-span-2 justify-self-start text-slate-500 hover:bg-blue-50 hover:text-blue-700 sm:mr-auto`} onClick={() => {
            setDraft(advancedValues({ ordering: "-created_at" }));
            setDraftWorker(undefined);
          }}>Đặt lại lựa chọn</Button>
          <Button type="button" variant="outline" className={`${buttonFeedback} min-w-0 shrink-0 hover:border-slate-300 hover:bg-slate-100 sm:min-w-20`} onClick={() => setOpen(false)}>Hủy</Button>
          <Button type="submit" className={`${buttonFeedback} active:bg-blue-800`}><Check className="h-4 w-4 shrink-0" />Áp dụng bộ lọc</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

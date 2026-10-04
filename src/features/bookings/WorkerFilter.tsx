"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSearchBookingWorkersQuery } from "@/services/bookingApi";
import type { AdminUser } from "@/types/Booking";

const buttonFeedback = "cursor-pointer transition-all duration-150 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

function WorkerSearch({ value, onSelect, onClose }: {
  value?: number;
  onSelect: (worker?: AdminUser) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [params, setParams] = useState({ search: "", page: 1 });
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentData: data, isFetching, isError, refetch } = useSearchBookingWorkersQuery(params);
  const pending = isFetching || search.trim() !== params.search;
  const options: (AdminUser | undefined)[] = [undefined, ...(!pending && !isError ? data?.results ?? [] : [])];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setParams({ search: search.trim(), page: 1 }), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const select = (worker?: AdminUser) => { onSelect(worker); onClose(); };

  return <div className="flex min-h-0 flex-1 flex-col gap-3">
    <div className="relative shrink-0">
      <Search className="absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
      <Input
        ref={inputRef}
        role="combobox"
        aria-label="Tìm nhân viên theo tên, số điện thoại hoặc mã"
        aria-expanded={true}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 && activeIndex < options.length ? `${listId}-${activeIndex}` : undefined}
        className="pl-8"
        placeholder="Tìm tên, SĐT hoặc mã nhân viên..."
        value={search}
        onChange={(event) => { setSearch(event.target.value); setActiveIndex(-1); }}
        onKeyDown={(event) => {
          // Handle selection keys without submitting the advanced filter form.
          event.stopPropagation();
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => event.key === "ArrowDown"
              ? Math.min(index + 1, options.length - 1)
              : Math.max(index - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (activeIndex >= 0 && activeIndex < options.length) select(options[activeIndex]);
          } else if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
      />
    </div>
    <div ref={listRef} id={listId} role="listbox" aria-label="Nhân viên" aria-busy={pending} className="min-h-0 max-h-80 flex-1 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 p-1">
      {options.map((worker, index) => <button
        key={worker?.id ?? "all"}
        id={`${listId}-${index}`}
        data-index={index}
        type="button"
        role="option"
        aria-selected={value === worker?.id}
        tabIndex={-1}
        className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 motion-reduce:transition-none ${value === worker?.id ? "bg-blue-50 font-medium text-blue-700" : activeIndex === index ? "bg-slate-100" : ""}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => select(worker)}
      >
        <span className="w-4 shrink-0">{value === worker?.id && <Check className="h-4 w-4" />}</span>
        <span className="min-w-0"><span className="block truncate">{worker?.full_name ?? "Tất cả nhân viên"}</span>{worker && <span className="block text-xs text-slate-500">{worker.phone_number ? `${worker.phone_number} · ` : ""}Mã NV: {worker.id}</span>}</span>
      </button>)}
    </div>
    <div role="status" className="shrink-0 text-xs text-slate-500">
      {pending ? "Đang tìm nhân viên..." : isError ? "Không tải được danh sách nhân viên." : !data?.results.length ? "Không tìm thấy nhân viên phù hợp." : `${data.count} nhân viên · Trang ${data.page}/${data.total_pages}`}
    </div>
    {isError && <Button type="button" variant="outline" size="sm" className={buttonFeedback} onClick={() => refetch()}>Thử lại</Button>}
    {!!data && (data.has_previous || data.has_next) && <div className="flex shrink-0 justify-between gap-2">
      <Button type="button" variant="outline" size="sm" className={buttonFeedback} disabled={pending || !data.has_previous} onClick={() => { setActiveIndex(-1); setParams((current) => ({ ...current, page: current.page - 1 })); }}>Trước</Button>
      <Button type="button" variant="outline" size="sm" className={buttonFeedback} disabled={pending || !data.has_next} onClick={() => { setActiveIndex(-1); setParams((current) => ({ ...current, page: current.page + 1 })); }}>Sau</Button>
    </div>}
  </div>;
}

export function WorkerFilter({ value, onChange }: { value?: AdminUser; onChange: (worker?: AdminUser) => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };

  return <Dialog open={open} onOpenChange={setOpen}><div className="space-y-1">
    <label htmlFor="booking-worker-filter" className="text-xs font-medium text-slate-500">Nhân viên</label>
    <div className="flex items-center gap-2">
      <DialogTrigger asChild><Button ref={triggerRef} id="booking-worker-filter" type="button" variant="outline" aria-label="Lọc theo nhân viên" className={`${buttonFeedback} min-w-0 flex-1 justify-between px-3 font-normal ${open || value ? "border-blue-300 bg-blue-50/50 text-blue-700" : ""}`}>
        <span className="truncate">{value?.full_name ?? "Tất cả nhân viên"}</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </Button></DialogTrigger>
      {value && <Button type="button" variant="ghost" size="icon" aria-label="Bỏ lọc nhân viên" className={`${buttonFeedback} h-8 w-8 shrink-0`} onClick={() => onChange(undefined)}><X className="h-4 w-4" /></Button>}
    </div>
  </div>
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden">
      <DialogHeader className="shrink-0 pr-8"><DialogTitle>Chọn nhân viên</DialogTitle><DialogDescription>Tìm theo tên, số điện thoại hoặc mã nhân viên.</DialogDescription></DialogHeader>
      {open && <WorkerSearch value={value?.id} onSelect={onChange} onClose={close} />}
    </DialogContent>
  </Dialog>;
}

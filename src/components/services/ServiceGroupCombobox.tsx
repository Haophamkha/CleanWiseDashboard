"use client";

import { useId, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  value: string;
  onChange: (code: string) => void;
  codes: string[];
  disabled?: boolean;
  loading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
};

export default function ServiceGroupCombobox({ value, onChange, codes, disabled, loading, loadError, onRetry }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const labelId = useId();
  const newCodeId = useId();
  const [newCode, setNewCode] = useState("");
  const candidate = newCode.trim().toUpperCase();
  const options = [...new Set([...codes, value].map((code) => code.trim().toUpperCase()).filter(Boolean))].sort();
  const matches = options.filter((code) => code.includes(search.trim().toUpperCase()));
  const isExisting = options.includes(candidate);
  const select = (code: string) => {
    if (disabled) return;
    onChange(code);
    setOpen(false);
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-sm text-slate-600">
      <span id={labelId}>Mã nhóm dịch vụ</span>
      <Popover modal open={open && !disabled} onOpenChange={(next) => { setOpen(next); if (next) { setSearch(""); setNewCode(""); } }}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-labelledby={labelId} aria-expanded={open && !disabled} disabled={disabled} className="w-full justify-between font-normal">
            <span className={`truncate ${value ? "text-slate-900" : "text-slate-400"}`}>{value || "Chọn hoặc nhập mã nhóm"}</span>
            <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex flex-col max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] overflow-hidden p-0">
          <div className="shrink-0 space-y-2 border-b bg-slate-50 p-3">
            <label htmlFor={newCodeId} className="block text-sm font-medium text-slate-900">
              Nhập mã nhóm mới
            </label>
            <Input
              id={newCodeId}
              value={newCode}
              onChange={(event) => setNewCode(event.target.value)}
              maxLength={150}
              placeholder="Ví dụ: OFFICE_CLEANING"
              disabled={disabled}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.stopPropagation();
                  if (candidate) select(candidate);
                }
              }}
            />
            <Button
              type="button"
              className="w-full"
              disabled={disabled || !candidate}
              onClick={() => select(candidate)}
            >
              {isExisting ? <Check className="size-4 shrink-0" /> : <Plus className="size-4 shrink-0" />}
              {isExisting ? "Chọn mã đã có" : "Dùng mã nhóm mới"}
            </Button>
            {candidate && <p className="break-all text-xs text-slate-500">Mã sẽ dùng: <strong>{candidate}</strong></p>}
          </div>
          <Command shouldFilter={false} className="min-h-0">
            <p className="shrink-0 px-3 pt-3 text-xs font-medium text-slate-500">Hoặc chọn mã nhóm có sẵn</p>
            <CommandInput aria-label="Tìm mã nhóm có sẵn" placeholder="Tìm trong mã nhóm có sẵn…" value={search} onValueChange={setSearch} maxLength={150} />
            {loading && <p role="status" className="px-3 py-2 text-xs text-slate-500">Đang tải mã nhóm…</p>}
            {loadError && <div role="alert" className="px-3 py-2 text-xs text-rose-600">Chưa tải được mã nhóm. <button type="button" className="underline" onClick={onRetry}>Thử lại</button></div>}
            <CommandList className="min-h-0 overscroll-contain">
              <CommandEmpty>{loading ? "Đang tải danh sách…" : "Không có mã phù hợp. Bạn có thể nhập mã mới ở phần trên."}</CommandEmpty>
              {matches.map((code) => <CommandItem key={code} value={code} onSelect={() => select(code)}><Check className={`size-4 shrink-0 ${value.trim().toUpperCase() === code ? "opacity-100" : "opacity-0"}`} /><span className="break-all">{code}</span></CommandItem>)}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-slate-400">Mở danh sách để chọn mã có sẵn hoặc nhập mã nhóm mới.</p>
    </div>
  );
}

"use client";

import type { FieldOption } from "@/types/Service";

export default function FieldOptionsEditor({
  options,
  onChange,
}: {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
}) {
  const update = (index: number, patch: Partial<FieldOption>) => {
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };

  const remove = (index: number) =>
    onChange(options.filter((_, i) => i !== index));

  const add = () => onChange([...options, { label: "", value: "" }]);

  return (
    <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      {options.map((opt, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input
            className="rounded-lg border px-2.5 py-1.5 text-xs"
            placeholder="Nhãn hiển thị"
            value={opt.label}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <input
            className="rounded-lg border px-2.5 py-1.5 text-xs font-mono"
            placeholder="value (mã)"
            value={opt.value}
            onChange={(e) => update(i, { value: e.target.value })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-lg px-2 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            Xoá
          </button>
          <input
            className="col-span-2 rounded-lg border px-2.5 py-1.5 text-xs"
            placeholder="Mô tả (không bắt buộc)"
            value={opt.description ?? ""}
            onChange={(e) =>
              update(i, { description: e.target.value || undefined })
            }
          />
          <input
            className="rounded-lg border px-2.5 py-1.5 text-xs"
            placeholder="URL ảnh (không bắt buộc)"
            value={opt.image ?? ""}
            onChange={(e) => update(i, { image: e.target.value || undefined })}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs font-medium text-blue-600 hover:underline"
      >
        + Thêm lựa chọn
      </button>
    </div>
  );
}

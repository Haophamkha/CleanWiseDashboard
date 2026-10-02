"use client";
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PricingFlatMapEditor({
  entries,
  keySuggestions,
  onChange,
}: {
  entries: Record<string, number>;
  keySuggestions: string[];
  onChange: (entries: Record<string, number>) => void;
}) {
  const rows = Object.entries(entries);
  const listId = useId();

  const updateRow = (index: number, key: string, value: number) => {
    const next = rows.map(([k, v], i) =>
      i === index ? [key, value] : [k, v],
    ) as [string, number][];
    onChange(Object.fromEntries(next));
  };

  const removeRow = (index: number) => {
    onChange(Object.fromEntries(rows.filter((_, i) => i !== index)));
  };

  const addRow = () => onChange({ ...entries, "": 0 });

  return (
    <div className="space-y-1.5">
      <datalist id={listId}>
        {keySuggestions.map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>
      {rows.map(([key, value], i) => (
        <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2">
          <Input
            className="rounded-lg border px-2.5 py-1.5 text-xs font-mono"
            placeholder="key (vd: 2_HOURS)"
            list={listId}
            value={key}
            onChange={(e) => updateRow(i, e.target.value, value)}
          />
          <Input
            type="number"
            className="rounded-lg border px-2.5 py-1.5 text-xs"
            placeholder="giá (VND)"
            value={value}
            onChange={(e) => updateRow(i, key, Number(e.target.value))}
          />
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => removeRow(i)}
            className="rounded-lg px-2 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            Xoá
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={addRow}
        className="text-xs font-medium text-blue-600 hover:underline"
      >
        + Thêm dòng giá
      </Button>
    </div>
  );
}

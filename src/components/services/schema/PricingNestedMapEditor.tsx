"use client";

import PricingFlatMapEditor from "./PricingFlatMapEditor";

export default function PricingNestedMapEditor({
  groups,
  keySuggestions,
  onChange,
}: {
  groups: Record<string, Record<string, number>>;
  keySuggestions: string[];
  onChange: (groups: Record<string, Record<string, number>>) => void;
}) {
  const rows = Object.entries(groups);

  const renameGroup = (index: number, newKey: string) => {
    const next = rows.map(([k, v], i) =>
      i === index ? [newKey, v] : [k, v],
    ) as [string, Record<string, number>][];
    onChange(Object.fromEntries(next));
  };

  const updateGroupEntries = (
    index: number,
    entries: Record<string, number>,
  ) => {
    const next = rows.map(([k, v], i) =>
      i === index ? [k, entries] : [k, v],
    ) as [string, Record<string, number>][];
    onChange(Object.fromEntries(next));
  };

  const removeGroup = (index: number) => {
    onChange(Object.fromEntries(rows.filter((_, i) => i !== index)));
  };

  const addGroup = () => onChange({ ...groups, "": {} });

  return (
    <div className="space-y-3">
      {rows.map(([groupKey, entries], i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-2.5">
          <div className="mb-2 flex items-center gap-2">
            <input
              className="flex-1 rounded-lg border px-2.5 py-1.5 text-xs font-mono font-semibold"
              placeholder="nhóm (vd: WALL_MOUNTED)"
              list={undefined}
              value={groupKey}
              onChange={(e) => renameGroup(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeGroup(i)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
            >
              Xoá nhóm
            </button>
          </div>
          <PricingFlatMapEditor
            entries={entries}
            keySuggestions={keySuggestions}
            onChange={(e) => updateGroupEntries(i, e)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addGroup}
        className="text-xs font-medium text-blue-600 hover:underline"
      >
        + Thêm nhóm
      </button>
    </div>
  );
}

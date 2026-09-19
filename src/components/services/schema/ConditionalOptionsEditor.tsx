"use client";

import type {
  ConditionalOptionGroup,
  FieldOption,
  FormField,
} from "@/types/Service";
import { getFieldOptionValues } from "@/types/Service";
import FieldOptionsEditor from "./FieldOptionsEditor";

export default function ConditionalOptionsEditor({
  field,
  siblingFields,
  onChange,
}: {
  field: FormField;
  siblingFields: FormField[];
  onChange: (patch: Partial<FormField>) => void;
}) {
  const groups = (field.options as ConditionalOptionGroup[]) ?? [];

  // Field nguồn phải là field khác trong cùng nhóm lặp, có sẵn lựa chọn đơn giản
  const sourceCandidates = siblingFields.filter(
    (f) => f.key !== field.key && getFieldOptionValues(f).length > 0,
  );
  const sourceField = siblingFields.find((f) => f.key === field.options_by);
  const sourceOptions: FieldOption[] = sourceField
    ? getFieldOptionValues(sourceField)
    : [];

  const groupForValue = (value: string) =>
    groups.find((g) => g.when[field.options_by ?? ""] === value);

  const updateGroupItems = (value: string, items: FieldOption[]) => {
    const key = field.options_by ?? "";
    const exists = groupForValue(value);
    const nextGroups = exists
      ? groups.map((g) => (g.when[key] === value ? { ...g, items } : g))
      : [...groups, { when: { [key]: value }, items }];
    onChange({ options: nextGroups });
  };

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div>
        <label className="text-[11px] font-medium text-slate-500">
          Phụ thuộc vào field nào (trong cùng nhóm lặp)
        </label>
        <select
          className="mt-1 w-full rounded-lg border px-2.5 py-1.5 text-xs"
          value={field.options_by ?? ""}
          onChange={(e) =>
            onChange({ options_by: e.target.value || undefined })
          }
        >
          <option value="">— chọn field —</option>
          {sourceCandidates.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label || f.key}
            </option>
          ))}
        </select>
      </div>

      {!field.options_by && (
        <p className="text-[11px] text-amber-600">
          Chọn field nguồn trước — lựa chọn của field này sẽ đổi theo giá trị
          field đó.
        </p>
      )}

      {field.options_by && sourceOptions.length === 0 && (
        <p className="text-[11px] text-amber-600">
          Field nguồn chưa có lựa chọn nào — thêm lựa chọn cho field đó trước.
        </p>
      )}

      {field.options_by &&
        sourceOptions.map((opt) => {
          const group = groupForValue(opt.value);
          return (
            <div
              key={opt.value}
              className="rounded-lg border border-slate-200 bg-white p-2.5"
            >
              <div className="mb-1 text-[11px] font-semibold text-slate-600">
                Khi <span className="font-mono">{field.options_by}</span> = "{opt.label}"
              </div>
              <FieldOptionsEditor
                options={group?.items ?? []}
                onChange={(items) => updateGroupItems(opt.value, items)}
              />
            </div>
          );
        })}
    </div>
  );
}

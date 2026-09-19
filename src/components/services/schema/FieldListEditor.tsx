"use client";

import type { FormField, FormFieldType } from "@/types/Service";
import { FIELD_TYPE_LABELS, isConditionalOptions } from "@/types/Service";
import ConditionalOptionsEditor from "./ConditionalOptionsEditor";
import FieldOptionsEditor from "./FieldOptionsEditor";

const OPTION_TYPES: FormFieldType[] = ["SINGLE_SELECT", "MULTI_SELECT"];

const emptyField = (key: string): FormField => ({
  key,
  type: "TEXT",
  label: "",
  required: false,
});

export default function FieldListEditor({
  fields,
  onChange,
  depth = 0,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  depth?: number;
}) {
  const updateField = (index: number, patch: Partial<FormField>) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) =>
    onChange(fields.filter((_, i) => i !== index));

  const addField = () =>
    onChange([...fields, emptyField(`field_${fields.length + 1}`)]);

  return (
    <div className="space-y-3">
      {fields.map((field, i) => {
        const siblingFields = fields.filter((_, si) => si !== i);
        const isConditionalSelect =
          OPTION_TYPES.includes(field.type) &&
          isConditionalOptions(field.options);

        return (
          <div key={i} className="rounded-xl border border-slate-200 p-3">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                className="rounded-lg border px-2.5 py-1.5 text-xs font-mono"
                placeholder="key"
                value={field.key}
                onChange={(e) => updateField(i, { key: e.target.value })}
              />
              <select
                className="rounded-lg border px-2.5 py-1.5 text-xs"
                value={field.type}
                onChange={(e) => {
                  const type = e.target.value as FormFieldType;
                  // đổi loại field thì reset options/item_fields để tránh lẫn shape cũ
                  updateField(i, {
                    type,
                    options: undefined,
                    options_by: undefined,
                    item_fields: type === "REPEATABLE_GROUP" ? [] : undefined,
                  });
                }}
              >
                {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeField(i)}
                className="rounded-lg px-2 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                Xoá field
              </button>
            </div>

            <input
              className="mt-2 w-full rounded-lg border px-2.5 py-1.5 text-xs"
              placeholder="Nhãn hiển thị (label)"
              value={field.label}
              onChange={(e) => updateField(i, { label: e.target.value })}
            />

            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={!!field.required}
                onChange={(e) => updateField(i, { required: e.target.checked })}
              />
              Bắt buộc nhập
            </label>

            {(field.type === "TEXT" || field.type === "TEXTAREA") && (
              <input
                className="mt-2 w-full rounded-lg border px-2.5 py-1.5 text-xs"
                placeholder="Placeholder (không bắt buộc)"
                value={field.placeholder ?? ""}
                onChange={(e) =>
                  updateField(i, { placeholder: e.target.value || undefined })
                }
              />
            )}

            {field.type === "QUANTITY" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="rounded-lg border px-2.5 py-1.5 text-xs"
                  placeholder="Min"
                  value={field.min ?? ""}
                  onChange={(e) =>
                    updateField(i, {
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
                <input
                  type="number"
                  className="rounded-lg border px-2.5 py-1.5 text-xs"
                  placeholder="Max"
                  value={field.max ?? ""}
                  onChange={(e) =>
                    updateField(i, {
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            )}

            {field.type === "DATE" && (
              <input
                type="number"
                className="mt-2 w-full rounded-lg border px-2.5 py-1.5 text-xs"
                placeholder="Số ngày tối thiểu kể từ hôm nay"
                value={field.min_days_from_now ?? ""}
                onChange={(e) =>
                  updateField(i, {
                    min_days_from_now: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            )}

            {OPTION_TYPES.includes(field.type) && depth > 0 && (
              <label className="mt-2 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <input
                  type="checkbox"
                  checked={isConditionalSelect}
                  onChange={(e) =>
                    updateField(i, {
                      options: [],
                      options_by: e.target.checked ? "" : undefined,
                    })
                  }
                />
                Lựa chọn phụ thuộc vào field khác trong nhóm lặp
              </label>
            )}

            {field.type === "WEEKDAY_MULTI_SELECT" && (
              <p className="mt-2 text-[11px] text-slate-400">
                Danh sách 7 ngày trong tuần tự động, không cần cấu hình lựa
                chọn.
              </p>
            )}

            {OPTION_TYPES.includes(field.type) &&
              (isConditionalSelect ? (
                <ConditionalOptionsEditor
                  field={field}
                  siblingFields={siblingFields}
                  onChange={(patch) => updateField(i, patch)}
                />
              ) : (
                <FieldOptionsEditor
                  options={(field.options as any) ?? []}
                  onChange={(options) => updateField(i, { options })}
                />
              ))}

            {field.type === "REPEATABLE_GROUP" && (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-2.5">
                <input
                  type="number"
                  className="mb-2 w-full rounded-lg border px-2.5 py-1.5 text-xs"
                  placeholder="Số lượng mục tối thiểu"
                  value={field.min_items ?? ""}
                  onChange={(e) =>
                    updateField(i, {
                      min_items: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
                <div className="mb-1 text-[11px] font-semibold text-slate-500">
                  Các field bên trong mỗi mục lặp:
                </div>
                <FieldListEditor
                  fields={field.item_fields ?? []}
                  onChange={(itemFields) =>
                    updateField(i, { item_fields: itemFields })
                  }
                  depth={depth + 1}
                />
              </div>
            )}

            {field.type === "TASK_CHECKLIST" && (
              <p className="mt-2 text-[11px] text-slate-400">
                Field neo hiển thị checklist — nội dung checklist khai báo ở
                khung riêng bên dưới.
              </p>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addField}
        className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600"
      >
        + Thêm field{depth > 0 ? " trong nhóm lặp" : ""}
      </button>
    </div>
  );
}

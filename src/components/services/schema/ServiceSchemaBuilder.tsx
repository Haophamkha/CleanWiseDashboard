"use client";

import type { ServiceFormSchema } from "@/types/Service";
import FieldListEditor from "./FieldListEditor";

export default function ServiceSchemaBuilder({
  schema,
  onChange,
}: {
  schema: ServiceFormSchema;
  onChange: (schema: ServiceFormSchema) => void;
}) {
  const hasChecklistField = (schema.fields ?? []).some(
    (f) => f.type === "TASK_CHECKLIST",
  );

  return (
    <div className="space-y-3">
      <FieldListEditor
        fields={schema.fields ?? []}
        onChange={(fields) => onChange({ ...schema, fields })}
      />

      {hasChecklistField && (
        <div className="rounded-xl border border-slate-200 p-3">
          <label className="text-xs font-medium text-gray-500">
            Nội dung checklist công việc (mỗi dòng 1 việc)
          </label>
          <textarea
            className="mt-1 w-full rounded-lg border px-2.5 py-1.5 text-xs"
            rows={5}
            value={schema.task_checklist ?? ""}
            onChange={(e) =>
              onChange({ ...schema, task_checklist: e.target.value })
            }
          />
        </div>
      )}
    </div>
  );
}

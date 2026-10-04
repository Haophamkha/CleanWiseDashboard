import type { FormField } from "@/types/Service";

const LABELS: Record<string, string> = {
  date: "Ngày thực hiện", note: "Ghi chú", duration: "Thời lượng", start_time: "Giờ bắt đầu", additional_services: "Dịch vụ bổ sung",
};
const VALUES: Record<string, string> = { COOKING: "Nấu ăn", WINDOW_CLEANING: "Lau cửa sổ", IRONING: "Ủi đồ" };

export function serviceFieldLabel(key: string, fields: FormField[] = []): string {
  return fields.find(field => field.key === key)?.label || LABELS[key] || key.replaceAll("_", " ");
}

export function serviceFieldValue(key: string, value: unknown, fields: FormField[] = [], data: Record<string, unknown> = {}): string {
  const field = fields.find(field => field.key === key);
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(item => serviceFieldValue(key, item, fields, data)).join(", ") || "Không có";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "object") return Object.entries(value).map(([childKey, childValue]) => `${serviceFieldLabel(childKey, field?.item_fields)}: ${serviceFieldValue(childKey, childValue, field?.item_fields, value as Record<string, unknown>)}`).join(" · ");
  const options = (field?.options ?? []).flatMap(option => "when" in option ? (Object.entries(option.when).every(([dependency, expected]) => String(data[dependency]) === expected) ? option.items : []) : [option]);
  const optionLabel = options.find(option => String(option.value) === String(value))?.label;
  if (optionLabel) return optionLabel;
  if ((field?.type === "DATE" || key === "date") && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  if (key === "duration" && /^\d+_HOURS?$/.test(String(value))) return `${String(value).split("_")[0]} giờ`;
  return (field?.type === "TEXT" || field?.type === "TEXTAREA" || key === "note") ? String(value) : VALUES[String(value)] ?? String(value);
}

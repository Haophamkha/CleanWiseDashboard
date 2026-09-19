export type ServiceImage = {
  id: number;
  image: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type ServiceListItem = {
  id: number;
  code: string;
  section_code: string;
  name: string;
  description: string;
  is_active: boolean;
  primary_image: string | null;
};

export type ServiceDetail = {
  id: number;
  code: string;
  section_code: string;
  name: string;
  description: string;
  form_schema: Record<string, unknown>;
  pricing_config: Record<string, unknown>;
  images: ServiceImage[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FieldOption = {
  label: string;
  value: string;
  description?: string;
  image?: string;
};

export type ConditionalOptionGroup = {
  when: Record<string, string>;
  items: FieldOption[];
};

export type FormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "BOOLEAN"
  | "DATE"
  | "TIME"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "WEEKDAY_MULTI_SELECT"
  | "QUANTITY"
  | "REPEATABLE_GROUP"
  | "TASK_CHECKLIST";


export type ServiceFormSchema = {
  version?: number;
  address_count?: number;
  addresses?: { key: string; label: string; required?: boolean }[];
  task_checklist?: string;
  fields: FormField[];
  [extra: string]: unknown;
};

export const isConditionalOptions = (
  options: FieldOption[] | ConditionalOptionGroup[] | undefined,
): options is ConditionalOptionGroup[] =>
  !!options && options.length > 0 && "when" in options[0];

// Loại field có UI cấu trúc đầy đủ. Còn lại (REPEATABLE_GROUP,
// hoặc SINGLE/MULTI_SELECT có options_by) sẽ fallback JSON thô.
export const isSimpleField = (field: FormField): boolean => {
  if (field.type === "REPEATABLE_GROUP" || field.type === "TASK_CHECKLIST")
    return false;
  if (
    (field.type === "SINGLE_SELECT" ||
      field.type === "MULTI_SELECT" ||
      field.type === "WEEKDAY_MULTI_SELECT") &&
    isConditionalOptions(field.options)
  ) {
    return false;
  }
  return true;
};

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  TEXT: "Văn bản ngắn",
  TEXTAREA: "Văn bản dài",
  BOOLEAN: "Bật/tắt",
  DATE: "Ngày",
  TIME: "Giờ",
  SINGLE_SELECT: "Chọn 1",
  MULTI_SELECT: "Chọn nhiều",
  WEEKDAY_MULTI_SELECT: "Chọn ngày trong tuần",
  QUANTITY: "Số lượng",
  REPEATABLE_GROUP: "Nhóm lặp lại (nâng cao)",
  TASK_CHECKLIST: "Checklist công việc (nâng cao)",
};

export type PricingConfig = {
  currency?: string;
  pricing_type?: "FIXED" | "UNIT" | "FORMULA";
  [key: string]: unknown; // base_prices, price_matrix, unit_prices, additional_services, stairs_surcharge, pump_gas_price, ...
};

const RESERVED_PRICING_KEYS = new Set(["currency", "pricing_type"]);

export type PricingGroupShape =
  | "number"
  | "flat_map"
  | "nested_map"
  | "unknown";

export const detectPricingGroupShape = (value: unknown): PricingGroupShape => {
  if (typeof value === "number") return "number";
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "flat_map";
    if (entries.every(([, v]) => typeof v === "number")) return "flat_map";
    if (
      entries.every(
        ([, v]) =>
          v &&
          typeof v === "object" &&
          !Array.isArray(v) &&
          Object.values(v as Record<string, unknown>).every(
            (n) => typeof n === "number",
          ),
      )
    )
      return "nested_map";
  }
  return "unknown";
};

export const getPricingGroupKeys = (config: PricingConfig): string[] =>
  Object.keys(config).filter((k) => !RESERVED_PRICING_KEYS.has(k));

// Gom mọi option.value xuất hiện trong form_schema, để gợi ý khi nhập key giá
export const collectOptionValuesFromSchema = (
  schema: ServiceFormSchema,
): string[] => {
  const values = new Set<string>();
  const visitOptions = (
    options: FieldOption[] | ConditionalOptionGroup[] | undefined,
  ) => {
    if (!options) return;
    if (isConditionalOptions(options)) {
      options.forEach((g) => g.items.forEach((o) => values.add(o.value)));
    } else {
      options.forEach((o) => values.add(o.value));
    }
  };
  const visitFields = (fields: FormField[] | undefined) => {
    fields?.forEach((f) => {
      visitOptions(f.options as any);
      if (f.item_fields) visitFields(f.item_fields);
    });
  };
  visitFields(schema.fields);
  return Array.from(values);
};

// thêm vào FormField type:
// min_items?: number;  // đã có qua index signature nhưng khai báo rõ cho an toàn kiểu

export type FormField = {
  key: string;
  type: FormFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  min_days_from_now?: number;
  min_items?: number;
  display?: "grid";
  options?: FieldOption[] | ConditionalOptionGroup[];
  options_by?: string;
  item_fields?: FormField[];
  [extra: string]: unknown;
};

// thêm hàm mới:
export const getFieldOptionValues = (field: FormField): FieldOption[] => {
  if (!field.options) return [];
  if (isConditionalOptions(field.options)) return [];
  return field.options;
};
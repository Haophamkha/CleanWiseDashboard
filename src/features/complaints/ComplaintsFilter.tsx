// ComplaintsFilter.tsx
import type { ComplaintStage, ComplaintStatus } from "@/types/Complaint";

const STATUS_OPTIONS: { value: ComplaintStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "IN_REVIEW", label: "Đang xem xét" },
  { value: "RESOLVED", label: "Đã xử lý" },
  { value: "REJECTED", label: "Bị từ chối" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const STAGE_OPTIONS: { value: ComplaintStage | ""; label: string }[] = [
  { value: "", label: "Tất cả giai đoạn" },
  { value: "BEFORE_SERVICE", label: "Trước khi thực hiện" },
  { value: "IN_SERVICE", label: "Đang thực hiện" },
  { value: "AFTER_SERVICE", label: "Sau khi hoàn thành" },
];

interface ComplaintsFilterProps {
  status: ComplaintStatus | "";
  stage: ComplaintStage | "";
  onStatusChange: (value: ComplaintStatus | "") => void;
  onStageChange: (value: ComplaintStage | "") => void;
}

function FilterSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | "";
  options: { value: T | ""; label: string }[];
  onChange: (value: T | "") => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
        className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm outline-none transition hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export function ComplaintsFilter({
  status,
  stage,
  onStatusChange,
  onStageChange,
}: ComplaintsFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterSelect
        value={status}
        options={STATUS_OPTIONS}
        onChange={onStatusChange}
      />
      <FilterSelect
        value={stage}
        options={STAGE_OPTIONS}
        onChange={onStageChange}
      />
    </div>
  );
}

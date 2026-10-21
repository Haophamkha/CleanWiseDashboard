import type {
  ComplaintReporterRole,
  ComplaintStage,
  ComplaintStatus,
} from "@/types/Complaint";

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

const REPORTER_OPTIONS: { value: ComplaintReporterRole | ""; label: string }[] =
  [
    { value: "", label: "Tất cả người gửi" },
    { value: "CUSTOMER", label: "Khách hàng" },
    { value: "WORKER", label: "Nhân viên" },
  ];

interface ComplaintsFilterProps {
  search: string;
  status: ComplaintStatus | "";
  stage: ComplaintStage | "";
  reporterRole: ComplaintReporterRole | "";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ComplaintStatus | "") => void;
  onStageChange: (value: ComplaintStage | "") => void;
  onReporterRoleChange: (value: ComplaintReporterRole | "") => void;
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

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
          clipRule="evenodd"
        />
      </svg>

      <input
        type="text"
        aria-label="Tìm khiếu nại"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Mã KN, mã đơn, người gửi..."
        className="w-64 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />

      {value && (
        <button
          type="button"
          aria-label="Xóa tìm kiếm"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function ComplaintsFilter({
  search,
  status,
  stage,
  reporterRole,
  onSearchChange,
  onStatusChange,
  onStageChange,
  onReporterRoleChange,
}: ComplaintsFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <SearchBox value={search} onChange={onSearchChange} />
      <FilterSelect
        value={reporterRole}
        options={REPORTER_OPTIONS}
        onChange={onReporterRoleChange}
      />
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

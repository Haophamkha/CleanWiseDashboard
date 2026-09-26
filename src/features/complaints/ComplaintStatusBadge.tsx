// ComplaintStatusBadge.tsx
import type { ComplaintStatus } from "@/types/Complaint";

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Chờ xử lý",
    className: "bg-yellow-100 text-yellow-700",
  },
  IN_REVIEW: {
    label: "Đang xem xét",
    className: "bg-blue-100 text-blue-700",
  },
  RESOLVED: {
    label: "Đã xử lý",
    className: "bg-green-100 text-green-700",
  },
  REJECTED: {
    label: "Bị từ chối",
    className: "bg-red-100 text-red-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-gray-100 text-gray-500",
  },
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
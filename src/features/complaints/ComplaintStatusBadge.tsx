// ComplaintStatusBadge.tsx
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import type { ComplaintStatus } from "@/types/Complaint";

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; tone: StatusTone }
> = {
  PENDING: {
    label: "Chờ xử lý",
    tone: "amber",
  },
  IN_REVIEW: {
    label: "Đang xem xét",
    tone: "blue",
  },
  RESOLVED: {
    label: "Đã xử lý",
    tone: "emerald",
  },
  REJECTED: {
    label: "Bị từ chối",
    tone: "red",
  },
  CANCELLED: {
    label: "Đã hủy",
    tone: "slate",
  },
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const config = STATUS_CONFIG[status];

  return <StatusPill tone={config.tone}>{config.label}</StatusPill>;
}

// ComplaintStatusBadge.tsx
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import type { Complaint, ComplaintStatus } from "@/types/Complaint";

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

export function ComplaintStatusBadge({ status, workflowStatus }: {
  status: ComplaintStatus;
  workflowStatus?: Complaint["workflow_status"];
}) {
  if (status === "IN_REVIEW" && workflowStatus === "SENT") return <StatusPill tone="amber">Chờ khách phản hồi</StatusPill>;
  if (status === "IN_REVIEW" && workflowStatus === "ACCEPTED") return <StatusPill tone="blue">Đang thực hiện</StatusPill>;
  const config = STATUS_CONFIG[status];

  return <StatusPill tone={config.tone}>{config.label}</StatusPill>;
}

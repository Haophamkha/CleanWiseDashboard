import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import type { WorkerProfile, WorkerStatus } from "@/types/Worker";

export const WORKER_STATUS: Record<WorkerStatus, { label: string; tone: StatusTone }> = {
  DRAFT: { label: "Chưa hoàn tất", tone: "slate" },
  PENDING: { label: "Chờ duyệt", tone: "amber" },
  ACTIVE: { label: "Đang làm việc", tone: "emerald" },
  REJECTED: { label: "Đã từ chối", tone: "red" },
  SUSPENDED: { label: "Tạm khóa", tone: "orange" },
};

export const workerName = (worker: WorkerProfile) => `${worker.first_name} ${worker.last_name}`.trim() || worker.username;

export function WorkerStatusBadge({ status }: { status: WorkerStatus }) {
  const config = WORKER_STATUS[status];
  return <StatusPill tone={config.tone}>{config.label}</StatusPill>;
}

import { Badge } from "@/components/ui/badge";
import type { WorkerProfile, WorkerStatus } from "@/types/Worker";

export const WORKER_STATUS: Record<WorkerStatus, { label: string; className: string }> = {
  DRAFT: { label: "Chưa hoàn tất", className: "border-slate-200 bg-slate-100 text-slate-600" },
  PENDING: { label: "Chờ duyệt", className: "border-amber-200 bg-amber-50 text-amber-700" },
  ACTIVE: { label: "Đang làm việc", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Đã từ chối", className: "border-red-200 bg-red-50 text-red-700" },
  SUSPENDED: { label: "Tạm khóa", className: "border-orange-200 bg-orange-50 text-orange-700" },
};

export const workerName = (worker: WorkerProfile) => `${worker.first_name} ${worker.last_name}`.trim() || worker.username;

export function WorkerStatusBadge({ status }: { status: WorkerStatus }) {
  const config = WORKER_STATUS[status];
  return <Badge variant="outline" className={`gap-1.5 ${config.className}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{config.label}</Badge>;
}

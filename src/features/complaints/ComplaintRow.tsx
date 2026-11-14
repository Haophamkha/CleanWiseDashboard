import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Complaint } from "@/types/Complaint";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { formatComplaintDate } from "./complaint-format";

export function ComplaintRow({ complaint }: { complaint: Complaint }) {
  const code = complaint.code ?? `#${complaint.id}`;
  return (
    <TableRow>
      <TableCell>
        <p className="font-medium text-slate-900">{complaint.issue_type_name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{code}</p>
        <time className="mt-0.5 block text-xs text-slate-500" dateTime={complaint.created_at}>
          {formatComplaintDate(complaint.created_at)}
        </time>
      </TableCell>
      <TableCell>
        <p className="break-words font-medium text-slate-900">{complaint.booking_code || `#${complaint.booking}`}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {complaint.schedule_sequence_no ? `Buổi ${complaint.schedule_sequence_no} · ` : ""}{complaint.stage_label}
        </p>
      </TableCell>
      <TableCell className="break-words">
        <p className="font-medium text-slate-900">{complaint.reporter_name || "—"}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {complaint.reporter_role === "WORKER" ? "Nhân viên gửi" : "Khách hàng gửi"}
        </p>
        {complaint.reporter_role === "CUSTOMER" && (complaint.worker_name || complaint.worker) && (
          <p className="mt-1 text-xs text-slate-500">NV: {complaint.worker_name || `#${complaint.worker}`}</p>
        )}
      </TableCell>
      <TableCell>
        <ComplaintStatusBadge status={complaint.status} workflowStatus={complaint.workflow_status} />
      </TableCell>
      <TableCell className="text-right">
        <Button asChild variant="outline" size="sm">
          <Link href={`/complaints/${complaint.id}`} aria-label={`Xem hồ sơ ${code}`}>
            Chi tiết <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

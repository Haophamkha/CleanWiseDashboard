// ComplaintsPage.tsx
"use client";

import { useState } from "react";
import { useGetComplaintsQuery } from "@/services/complaintApi";
import { ComplaintsFilter } from "./ComplaintsFilter";
import { ComplaintsTable } from "./ComplaintsTable";
import { ComplaintResolveModal } from "./ComplaintResolveModal";
import type { ComplaintStage, ComplaintStatus } from "@/types/Complaint";

export function ComplaintsPage() {
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [stageFilter, setStageFilter] = useState<ComplaintStage | "">("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const {
    data: complaints,
    isLoading,
    isError,
  } = useGetComplaintsQuery({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(stageFilter ? { stage: stageFilter } : {}),
  });

  const pendingCount =
    complaints?.filter((c) => c.status === "PENDING").length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Quản lý khiếu nại
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isLoading
              ? "Đang tải dữ liệu..."
              : `${complaints?.length ?? 0} khiếu nại${
                  pendingCount > 0 ? ` · ${pendingCount} đang chờ xử lý` : ""
                }`}
          </p>
        </div>

        <ComplaintsFilter
          status={statusFilter}
          stage={stageFilter}
          onStatusChange={setStatusFilter}
          onStageChange={setStageFilter}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          Không tải được danh sách khiếu nại. Vui lòng thử lại.
        </div>
      )}

      {complaints && (
        <ComplaintsTable complaints={complaints} onSelect={setSelectedId} />
      )}

      {selectedId !== null && (
        <ComplaintResolveModal
          complaintId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

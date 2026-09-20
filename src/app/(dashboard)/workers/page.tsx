"use client";

import { useState } from "react";
import { useGetWorkerProfilesQuery } from "@/services/workerApi";
import type { WorkerListFilter } from "@/services/workerApi";
import type { WorkerProfile, WorkerStatus } from "@/types/Worker";
import WorkerDetailModal from "@/components/workers/WorkerDetailModal";

const TABS: { value: WorkerListFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "ACTIVE", label: "Đang làm việc" },
  { value: "REJECTED", label: "Đã từ chối" },
  { value: "SUSPENDED", label: "Tạm khóa" },
  { value: "DRAFT", label: "Chưa hoàn tất" },
];

const STATUS_BADGE: Record<WorkerStatus, { label: string; className: string }> =
  {
    DRAFT: { label: "Chưa hoàn tất", className: "bg-gray-100 text-gray-600" },
    PENDING: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-700" },
    ACTIVE: {
      label: "Đang làm việc",
      className: "bg-green-100 text-green-700",
    },
    REJECTED: { label: "Đã từ chối", className: "bg-red-100 text-red-700" },
    SUSPENDED: { label: "Tạm khóa", className: "bg-red-100 text-red-700" },
  };

export default function WorkersPage() {
  const [tab, setTab] = useState<WorkerListFilter>("ALL");
  const { data: workers, isLoading, isError } = useGetWorkerProfilesQuery(tab);
  const [detailWorker, setDetailWorker] = useState<WorkerProfile | null>(null);

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nhân viên</h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách nhân viên, hồ sơ năng lực và trạng thái duyệt.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Đang tải...
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-red-500">
            Không tải được danh sách nhân viên.
          </div>
        ) : !workers || workers.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Không có nhân viên nào ở trạng thái này.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Họ tên</th>
                <th className="text-left px-4 py-3 font-medium">
                  Số điện thoại
                </th>
                <th className="text-left px-4 py-3 font-medium">Dịch vụ</th>
                <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium">Hoàn thiện</th>
                <th className="text-left px-4 py-3 font-medium">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workers.map((w) => {
                const badge = STATUS_BADGE[w.status];
                return (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {`${w.first_name} ${w.last_name}`.trim() || w.username}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {w.phone_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {w.registered_service?.name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {w.completion_percent}%
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(w.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDetailWorker(w)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <WorkerDetailModal
        worker={detailWorker}
        onClose={() => setDetailWorker(null)}
      />
    </div>
  );
}

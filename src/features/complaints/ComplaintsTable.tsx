// ComplaintsTable.tsx
import type { Complaint } from "@/types/Complaint";
import { ComplaintRow } from "./ComplaintRow";

interface ComplaintsTableProps {
  complaints: Complaint[];
  onSelect: (id: number) => void;
}

export function ComplaintsTable({
  complaints,
  onSelect,
}: ComplaintsTableProps) {
  if (complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
          <svg
            className="h-6 w-6 text-gray-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500">
          Không có khiếu nại nào
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Thử thay đổi bộ lọc để xem thêm kết quả.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Mã
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Booking
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Lý do
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Giai đoạn
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ngày tạo
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {complaints.map((complaint) => (
              <ComplaintRow
                key={complaint.id}
                complaint={complaint}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

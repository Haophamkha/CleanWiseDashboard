// ComplaintRow.tsx
import type { Complaint } from "@/types/Complaint";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";

interface ComplaintRowProps {
  complaint: Complaint;
  onSelect: (id: number) => void;
}

export function ComplaintRow({ complaint, onSelect }: ComplaintRowProps) {
  return (
    <tr
      onClick={() => onSelect(complaint.id)}
      className="cursor-pointer border-b border-gray-100 transition hover:bg-blue-50/40"
    >
      <td className="px-4 py-3.5 text-sm font-medium text-gray-400">
        #{complaint.id}
      </td>

      <td className="px-4 py-3.5 text-sm text-gray-600">
        #{complaint.booking}
      </td>

      <td className="px-4 py-3.5 text-sm">
        <div className="font-medium text-gray-900">
          {complaint.issue_type_name}
        </div>
        <div className="mt-0.5 text-xs text-gray-400">
          {complaint.issue_type_code}
        </div>
      </td>

      <td className="px-4 py-3.5 text-sm text-gray-600">
        {complaint.stage_label}
      </td>

      <td className="px-4 py-3.5">
        <ComplaintStatusBadge status={complaint.status} />
      </td>

      <td className="px-4 py-3.5 text-sm text-gray-500">
        {new Date(complaint.created_at).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>

      <td className="px-4 py-3.5 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(complaint.id);
          }}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
        >
          Xem / Xử lý
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
}

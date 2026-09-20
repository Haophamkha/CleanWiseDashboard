"use client";

import { useState } from "react";
import { useGetUsersQuery } from "@/services/userApi";
import type { User } from "@/types/User";

export default function CustomersPage() {
  const { data: users, isLoading, isError } = useGetUsersQuery();
  const [searchTerm, setSearchTerm] = useState("");

  // Lọc chỉ lấy khách hàng (nếu API trả về chung tất cả các role)
  // Đảm bảo users luôn là mảng bằng cách dùng (users ?? [])
  const customers = (users ?? []).filter((u) => {
    const matchesRole = u.role === "CUSTOMER";
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      fullName.includes(search) ||
      (u.email && u.email.toLowerCase().includes(search)) ||
      (u.phone_number && u.phone_number.includes(search));

    return matchesRole && matchesSearch;
  });

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Khách hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hồ sơ khách hàng, lịch sử đặt dịch vụ và thông tin liên hệ.
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Thêm khách hàng
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Tìm theo tên, email, số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Bảng danh sách */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Đang tải danh sách khách hàng...
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-red-500">
            Không tải được danh sách khách hàng.
          </div>
        ) : !customers || customers.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Không tìm thấy khách hàng nào.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Họ tên</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">
                  Số điện thoại
                </th>
                <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium">
                  Ngày tham gia
                </th>
                <th className="text-right px-4 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {`${c.first_name} ${c.last_name}`.trim() || c.username}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.phone_number || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        c.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.is_active ? "Hoạt động" : "Đã khoá"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(c.date_joined).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        /* Xử lý xem chi tiết khách hàng */
                      }}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

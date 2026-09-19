"use client";

import ServiceFormModal from "@/components/services/ServiceFormModal";
import ServiceStatusToggle from "@/components/services/ServiceStatusToggle";
import {
  useGetServiceDetailQuery,
  useGetServicesQuery,
} from "@/services/servicesApi";
import { useState } from "react";

export default function ServicesPage() {
  const { data, isLoading } = useGetServicesQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: detail } = useGetServiceDetailQuery(editingId ?? 0, {
    skip: editingId === null,
  });

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    setEditingId(id);
    setModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dịch vụ</h1>
          <p className="text-sm text-gray-500">
            Danh mục dịch vụ, bảng giá và trạng thái kinh doanh.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm dịch vụ
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Ảnh</th>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Nhóm</th>
              <th className="px-4 py-3">Hoạt động</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-32 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-6 w-11 rounded-full bg-slate-100" />
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))}

            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Chưa có dịch vụ nào.
                </td>
              </tr>
            )}

            {data?.data.map((service) => (
              <tr
                key={service.id}
                className="transition-colors hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  {service.primary_image ? (
                    <img
                      src={service.primary_image}
                      alt={service.name}
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-100" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {service.code}
                </td>
                <td className="px-4 py-3 text-slate-700">{service.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {service.section_code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ServiceStatusToggle
                    id={service.id}
                    isActive={service.is_active}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(service.id)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ServiceFormModal
        key={
          editingId === null
            ? "create"
            : detail?.data
              ? `edit-${detail.data.id}`
              : "loading"
        }
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingService={editingId !== null ? (detail?.data ?? null) : null}
        isLoadingDetail={editingId !== null && !detail}
      />
    </div>
  );
}

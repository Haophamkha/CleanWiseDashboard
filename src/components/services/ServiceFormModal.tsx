"use client";

import {
  useCreateServiceMutation,
  useUpdateServiceMutation,
} from "@/services/servicesApi";
import type {
  PricingConfig,
  ServiceDetail,
  ServiceFormSchema,
} from "@/types/Service";
import { collectOptionValuesFromSchema } from "@/types/Service";
import PricingConfigBuilder from "./schema/PricingConfigBuilder";
import ServiceSchemaBuilder from "./schema/ServiceSchemaBuilder";
import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  editingService?: ServiceDetail | null;
  isLoadingDetail?: boolean;
};

const getErrorMessage = (error: unknown): string => {
  const data = (error as { data?: unknown })?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const first = Object.values(data as Record<string, unknown>)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === "string") return first;
  }
  return "Có lỗi xảy ra, vui lòng thử lại.";
};

export default function ServiceFormModal({
  open,
  onClose,
  editingService,
  isLoadingDetail,
}: Props) {
  const isEdit = Boolean(editingService);
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();

  const [code, setCode] = useState(editingService?.code ?? "");
  const [sectionCode, setSectionCode] = useState(
    editingService?.section_code ?? "",
  );
  const [name, setName] = useState(editingService?.name ?? "");
  const [description, setDescription] = useState(
    editingService?.description ?? "",
  );
  const [schema, setSchema] = useState<ServiceFormSchema>(
    (editingService?.form_schema as ServiceFormSchema) ?? { fields: [] },
  );
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(
    (editingService?.pricing_config as PricingConfig) ?? {
      currency: "VND",
      pricing_type: "FIXED",
    },
  );
  const [images, setImages] = useState<File[]>([]);
  const [deleteImageIds, setDeleteImageIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Preview cho ảnh MỚI vừa chọn (chưa gửi lên server) — tạo object URL tạm
  // từ File, và tự thu hồi (revoke) khi danh sách ảnh đổi hoặc modal đóng
  // để tránh rò rỉ bộ nhớ.
  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images],
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [imagePreviews]);

  if (!open) return null;

  if (isLoadingDetail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-center text-sm text-slate-400">
          Đang tải dữ liệu dịch vụ...
        </div>
      </div>
    );
  }

  const toggleDeleteImage = (id: number) => {
    setDeleteImageIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    // form_schema và pricing_config đều là object có sẵn từ 2 builder,
    // không cần JSON.parse nữa.
    if (!schema.fields || schema.fields.some((f) => !f.key || !f.label)) {
      setError("Mỗi field trong cấu trúc form cần có key và nhãn hiển thị.");
      return;
    }

    const payload = {
      code,
      section_code: sectionCode,
      name,
      description,
      form_schema: schema,
      pricing_config: pricingConfig,
      images: images.length ? images : undefined,
      delete_image_ids: deleteImageIds.length ? deleteImageIds : undefined,
    };

    try {
      if (isEdit && editingService) {
        await updateService({ id: editingService.id, payload }).unwrap();
      } else {
        await createService(payload).unwrap();
      }
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {isEdit ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Mã dịch vụ (code)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Mã nhóm (section_code)"
            value={sectionCode}
            onChange={(e) => setSectionCode(e.target.value)}
          />
        </div>

        <input
          className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Tên dịch vụ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Mô tả"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">
            Cấu trúc form đặt dịch vụ
          </label>
          <div className="mt-1">
            <ServiceSchemaBuilder schema={schema} onChange={setSchema} />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">
            Cấu hình giá
          </label>
          <div className="mt-1">
            <PricingConfigBuilder
              config={pricingConfig}
              keySuggestions={collectOptionValuesFromSchema(schema)}
              onChange={setPricingConfig}
            />
          </div>
        </div>

        {isEdit && editingService && editingService.images.length > 0 && (
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-500">
              Ảnh hiện có (tick để xoá)
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {editingService.images.map((img) => (
                <label key={img.id} className="relative">
                  <img
                    src={img.image}
                    alt=""
                    className={`h-16 w-16 rounded-lg object-cover ${
                      deleteImageIds.includes(img.id) ? "opacity-40" : ""
                    }`}
                  />
                  <input
                    type="checkbox"
                    className="absolute right-1 top-1"
                    checked={deleteImageIds.includes(img.id)}
                    onChange={() => toggleDeleteImage(img.id)}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">
            Thêm ảnh mới
          </label>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="mt-1 block w-full text-sm"
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          />

          {imagePreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {imagePreviews.map((p, i) => (
                <div key={p.url} className="relative">
                  <img
                    src={p.url}
                    alt={p.file.name}
                    className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting
              ? "Đang lưu..."
              : isEdit
                ? "Lưu thay đổi"
                : "Tạo dịch vụ"}
          </button>
        </div>
      </div>
    </div>
  );
}

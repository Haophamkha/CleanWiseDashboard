"use client";
import { useContext, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { useUploadServiceOptionImageMutation } from "@/services/servicesApi";
import { OptionImageUploadContext } from "../OptionImageUploadContext";
import { apiError } from "@/features/bookings/booking-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { FieldOption } from "@/types/Service";

function OptionImagePreview({ src, label }: { src?: string; label: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const url = src?.trim();
  const canDisplay = url && /^https?:\/\//i.test(url) && failedSource !== url;

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
      {canDisplay ? (
        <Image
          src={url}
          alt={`Ảnh lựa chọn ${label || "chưa đặt tên"}`}
          width={96}
          height={96}
          unoptimized
          className="h-full w-full object-contain"
          onError={() => setFailedSource(url)}
        />
      ) : (
        <div className="flex flex-col items-center gap-1 px-2 text-center text-slate-400">
          <ImageIcon className="h-5 w-5" />
          <span className="text-[10px]">
            {url ? "Không tải được ảnh" : "Chưa có ảnh"}
          </span>
        </div>
      )}
    </div>
  );
}

export default function FieldOptionsEditor({
  options,
  onChange,
}: {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
}) {
  const update = (index: number, patch: Partial<FieldOption>) => {
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };

  const [uploadImage] = useUploadServiceOptionImageMutation();
  const reportUpload = useContext(OptionImageUploadContext);
  const uploadLock = useRef(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<{
    index: number;
    message: string;
  } | null>(null);
  const upload = async (index: number, file: File) => {
    if (uploadLock.current) return;
    setUploadError(null);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setUploadError({
        index,
        message: "Chọn ảnh JPG, PNG hoặc WebP, tối đa 10MB.",
      });
      return;
    }
    uploadLock.current = true;
    setUploadingIndex(index);
    reportUpload(1);
    try {
      const result = await uploadImage(file).unwrap();
      if (!result.url) throw new Error("Máy chủ chưa trả về URL ảnh.");
      onChange(
        options.map((option, i) =>
          i === index ? { ...option, image: result.url } : option,
        ),
      );
    } catch (error) {
      setUploadError({ index, message: apiError(error) });
    } finally {
      uploadLock.current = false;
      setUploadingIndex(null);
      reportUpload(-1);
    }
  };

  const remove = (index: number) =>
    onChange(options.filter((_, i) => i !== index));

  const add = () => onChange([...options, { label: "", value: "" }]);

  return (
    <fieldset
      disabled={uploadingIndex !== null}
      className="mt-2 min-w-0 space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
    >
      {options.map((opt, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-lg border bg-white p-3 sm:flex-row"
        >
          <OptionImagePreview src={opt.image} label={opt.label} />
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              className="rounded-lg border px-2.5 py-1.5 text-xs"
              placeholder="Nhãn hiển thị"
              aria-label={`Nhãn lựa chọn ${i + 1}`}
              value={opt.label}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <Input
              className="rounded-lg border px-2.5 py-1.5 text-xs font-mono"
              placeholder="value (mã)"
              aria-label={`Mã lựa chọn ${i + 1}`}
              value={opt.value}
              onChange={(e) => update(i, { value: e.target.value })}
            />
            <Input
              className="sm:col-span-2 rounded-lg border px-2.5 py-1.5 text-xs"
              placeholder="Mô tả (không bắt buộc)"
              aria-label={`Mô tả lựa chọn ${i + 1}`}
              value={opt.description ?? ""}
              onChange={(e) =>
                update(i, { description: e.target.value || undefined })
              }
            />
            <div className="space-y-2 sm:col-span-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                {uploadingIndex === i ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadingIndex === i
                  ? "Đang tải ảnh…"
                  : opt.image
                    ? "Thay ảnh"
                    : "Chọn ảnh"}
                <input
                  type="file"
                  className="sr-only"
                  aria-label={`Tải ảnh lựa chọn ${opt.label || i + 1}`}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void upload(i, file);
                  }}
                />
              </label>
              {opt.image && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-xs text-rose-500"
                  onClick={() => update(i, { image: undefined })}
                >
                  Bỏ ảnh
                </Button>
              )}
              <p className="text-[11px] text-slate-400">
                JPG, PNG, WebP · Tối đa 10MB
              </p>
              {uploadError?.index === i && (
                <p role="alert" className="text-xs text-rose-600">
                  {uploadError.message}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            aria-label={`Xóa lựa chọn ${opt.label || i + 1}`}
            onClick={() => remove(i)}
            className="shrink-0 rounded-lg px-2 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            Xoá
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={add}
        className="text-xs font-medium text-blue-600 hover:underline"
      >
        + Thêm lựa chọn
      </Button>
    </fieldset>
  );
}

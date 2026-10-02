"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateServiceMutation,
  useUpdateServiceMutation,
} from "@/services/servicesApi";
import type {
  FormField,
  PricingConfig,
  ServiceDetail,
  ServiceFormSchema,
} from "@/types/Service";
import { collectOptionValuesFromSchema } from "@/types/Service";
import { apiError } from "@/features/bookings/booking-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import PricingConfigBuilder from "./schema/PricingConfigBuilder";
import ServiceSchemaBuilder from "./schema/ServiceSchemaBuilder";
import { OptionImageUploadContext } from "./OptionImageUploadContext";

type Props = {
  open: boolean;
  onClose: () => void;
  editingService?: ServiceDetail | null;
  isEditMode?: boolean;
  isLoadingDetail?: boolean;
  detailError?: string;
  onRetry?: () => void;
};
function fieldError(fields: FormField[]): string | null {
  const keys = new Set<string>();
  for (const field of fields) {
    if (
      !field.key?.trim() ||
      (field.type !== "TASK_CHECKLIST" && !field.label?.trim())
    )
      return "Mỗi trường cần mã và nhãn hiển thị (trừ nhãn checklist).";
    if (keys.has(field.key)) return `Mã trường “${field.key}” bị trùng.`;
    keys.add(field.key);
    if (field.item_fields) {
      const error = fieldError(field.item_fields);
      if (error) return error;
    }
  }
  return null;
}
export default function ServiceFormModal({
  open,
  onClose,
  editingService,
  isEditMode,
  isLoadingDetail,
  detailError,
  onRetry,
}: Props) {
  const isEdit = isEditMode ?? Boolean(editingService);
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const [pendingImageUploads, setPendingImageUploads] = useState(0);
  const busy = isCreating || isUpdating || pendingImageUploads > 0;
  const [tab, setTab] = useState("info");
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
  const [iconFile, setIconFile] = useState<File>();
  const [removeIcon, setRemoveIcon] = useState(false);
  const iconPreview = useMemo(
    () => (iconFile ? URL.createObjectURL(iconFile) : null),
    [iconFile],
  );
  useEffect(
    () => () => {
      if (iconPreview) URL.revokeObjectURL(iconPreview);
    },
    [iconPreview],
  );
  const [deleteImageIds, setDeleteImageIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pricingErrors, setPricingErrors] = useState<string[]>([]);
  const previews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images],
  );
  useEffect(
    () => () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    },
    [previews],
  );
  const save = async () => {
    if (busy) return;
    setError(null);
    if (pricingErrors.length) {
      setTab("pricing");
      setError(
        "JSON bảng giá không hợp lệ. Vui lòng kiểm tra các mục: " +
          pricingErrors.join(", "),
      );
      return;
    }
    if (
      !name.trim() ||
      !sectionCode.trim() ||
      !description.trim() ||
      !code.trim()
    ) {
      setTab("info");
      setError("Vui lòng nhập đủ mã, nhóm, tên và mô tả dịch vụ.");
      return;
    }
    if (!Array.isArray(schema.fields)) {
      setTab("schema");
      setError("Form đặt dịch vụ cần danh sách các trường hợp lệ.");
      return;
    }
    const invalid = fieldError(schema.fields);
    if (invalid) {
      setTab("schema");
      setError(invalid);
      return;
    }
    if (isEdit && !editingService) {
      setError("Chưa tải được dữ liệu dịch vụ. Vui lòng thử lại.");
      return;
    }
    const payload = {
      ...(isEdit ? {} : { code: code.trim().toUpperCase() }),
      section_code: sectionCode.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      form_schema: schema,
      pricing_config: pricingConfig,
      images: images.length ? images : undefined,
      icon_file: iconFile,
      remove_icon: removeIcon ? true : undefined,
      delete_image_ids: deleteImageIds.length ? deleteImageIds : undefined,
    };
    try {
      if (isEdit && editingService)
        await updateService({ id: editingService.id, payload }).unwrap();
      else await createService(payload).unwrap();
      toast.success(isEdit ? "Đã lưu thay đổi dịch vụ." : "Đã tạo dịch vụ.");
      onClose();
    } catch (error) {
      setError(apiError(error));
    }
  };
  return (
    <OptionImageUploadContext.Provider
      value={(delta) =>
        setPendingImageUploads((count) => Math.max(0, count + delta))
      }
    >
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !busy) onClose();
        }}
      >
        <DialogContent
          className="flex max-h-[90dvh] max-w-4xl flex-col overflow-hidden p-0"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader className="mb-0 shrink-0 border-b px-6 py-5 pr-12">
            <DialogTitle>
              {isEdit ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? (editingService?.name ?? "Đang tải thông tin dịch vụ…")
                : "Thiết lập thông tin, form đặt dịch vụ và bảng giá."}
            </DialogDescription>
          </DialogHeader>
          {detailError ? (
            <div
              role="alert"
              className="p-10 text-center text-sm text-slate-600"
            >
              <p>{detailError}</p>
              <Button variant="outline" className="mt-4" onClick={onRetry}>
                Thử lại
              </Button>
            </div>
          ) : isLoadingDetail ? (
            <div className="space-y-4 p-6" aria-label="Đang tải dịch vụ">
              <Skeleton className="h-10" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <>
              <Tabs
                value={tab}
                onValueChange={(value) => {
                  if (!busy) setTab(value);
                }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="shrink-0 overflow-x-auto border-b px-6 py-3">
                  <TabsList>
                    <TabsTrigger value="info">Thông tin chung</TabsTrigger>
                    <TabsTrigger value="schema">Form đặt dịch vụ</TabsTrigger>
                    <TabsTrigger value="pricing">Bảng giá</TabsTrigger>
                  </TabsList>
                </div>
                <div className="min-h-0 overflow-y-auto px-6 py-4 [scrollbar-gutter:stable]">
                  <fieldset disabled={busy} className="min-w-0 space-y-4">
                    {error && (
                      <div
                        role="alert"
                        className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                      >
                        {error}
                      </div>
                    )}
                    <TabsContent value="info" className="mt-0 space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5 text-sm text-slate-600">
                          <span>Mã dịch vụ</span>
                          <Input
                            value={code}
                            readOnly={isEdit}
                            maxLength={255}
                            onChange={(event) => setCode(event.target.value)}
                            className={
                              isEdit ? "bg-slate-50 text-slate-500" : ""
                            }
                          />
                          {isEdit && (
                            <p className="text-xs text-slate-400">
                              Mã định danh được giữ cố định.
                            </p>
                          )}
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm text-slate-600">
                          <span>Mã nhóm dịch vụ</span>
                          <Input
                            value={sectionCode}
                            maxLength={150}
                            placeholder="HOME_CLEANING"
                            onChange={(event) =>
                              setSectionCode(event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <label className="flex flex-col gap-1.5 text-sm text-slate-600">
                        <span>Tên dịch vụ</span>
                        <Input
                          value={name}
                          maxLength={255}
                          placeholder="Nhập tên dịch vụ"
                          onChange={(event) => setName(event.target.value)}
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm text-slate-600">
                        <span>Mô tả</span>
                        <Textarea
                          rows={3}
                          value={description}
                          placeholder="Giới thiệu dịch vụ và phạm vi công việc"
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                        />
                      </label>
                      <div className="space-y-3 border-t pt-4">
                        <h3 className="text-sm font-medium text-slate-700">
                          Ảnh đại diện menu dịch vụ
                        </h3>
                        <p className="text-xs text-slate-500">
                          Ảnh tổng quát hiển thị ở danh sách admin và menu ứng
                          dụng. Ảnh của từng lựa chọn nằm trong tab Form đặt
                          dịch vụ.
                        </p>
                        {iconPreview ||
                        (!removeIcon && editingService?.icon) ? (
                          <Image
                            src={iconPreview || editingService!.icon!}
                            alt="Ảnh đại diện menu dịch vụ"
                            width={112}
                            height={96}
                            unoptimized
                            className="h-24 w-28 rounded-lg border object-contain"
                          />
                        ) : (
                          <p className="text-xs text-slate-400">
                            Chưa có ảnh đại diện menu.
                          </p>
                        )}
                        <label className="block space-y-1.5 text-xs text-slate-500">
                          <span>
                            Tải ảnh đại diện JPG, PNG hoặc WebP · Tối đa 10MB
                          </span>
                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (
                                file &&
                                (file.size > 10 * 1024 * 1024 ||
                                  ![
                                    "image/jpeg",
                                    "image/png",
                                    "image/webp",
                                  ].includes(file.type))
                              ) {
                                setError(
                                  "Ảnh đại diện phải là JPG, PNG hoặc WebP, tối đa 10MB.",
                                );
                                event.target.value = "";
                                return;
                              }
                              setIconFile(file);
                              if (file) setRemoveIcon(false);
                            }}
                          />
                        </label>
                        {iconFile && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIconFile(undefined)}
                          >
                            Bỏ ảnh mới chọn
                          </Button>
                        )}
                        {editingService?.icon && !iconFile && (
                          <label className="flex items-center gap-2 text-xs text-slate-500">
                            <Checkbox
                              checked={removeIcon}
                              onCheckedChange={(checked) =>
                                setRemoveIcon(checked === true)
                              }
                            />
                            Xóa ảnh đại diện khi lưu
                          </label>
                        )}
                      </div>
                      <div className="space-y-3 border-t pt-4">
                        <h3 className="text-sm font-medium text-slate-700">
                          Ảnh dịch vụ
                        </h3>
                        {editingService?.images?.length ? (
                          <div className="flex flex-wrap gap-3">
                            {editingService.images.map((image) => (
                              <div
                                key={image.id}
                                className="relative rounded-lg border p-2"
                              >
                                <img
                                  src={image.image}
                                  alt={image.alt_text ?? "Ảnh dịch vụ"}
                                  className={`h-24 w-28 rounded-md object-cover ${deleteImageIds.includes(image.id) ? "opacity-40" : ""}`}
                                />
                                {image.is_primary && (
                                  <Badge className="absolute left-3 top-3 text-[10px]">
                                    Ảnh chính
                                  </Badge>
                                )}
                                <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                  <Checkbox
                                    checked={deleteImageIds.includes(image.id)}
                                    onCheckedChange={(checked) =>
                                      setDeleteImageIds((ids) =>
                                        checked
                                          ? [...ids, image.id]
                                          : ids.filter((id) => id !== image.id),
                                      )
                                    }
                                  />
                                  Xóa khi lưu
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Dịch vụ chưa có ảnh.
                          </p>
                        )}
                        <label className="block space-y-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-2">
                            <ImagePlus className="h-4 w-4" />
                            Thêm ảnh JPG, PNG hoặc WebP · Tối đa 10MB/ảnh
                          </span>
                          <Input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                              const files = Array.from(
                                event.target.files ?? [],
                              );
                              if (
                                files.some(
                                  (file) => file.size > 10 * 1024 * 1024,
                                )
                              ) {
                                setError("Mỗi ảnh tối đa 10MB.");
                                event.target.value = "";
                                return;
                              }
                              setImages(files);
                            }}
                          />
                        </label>
                        {previews.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {previews.map((item, index) => (
                              <div key={item.url} className="relative">
                                <img
                                  src={item.url}
                                  alt={item.file.name}
                                  className="h-24 w-28 rounded-lg object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  aria-label={`Bỏ ảnh ${item.file.name}`}
                                  className="absolute right-1 top-1 h-6 w-6"
                                  onClick={() =>
                                    setImages((files) =>
                                      files.filter((_, i) => i !== index),
                                    )
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="schema" className="mt-0">
                      <p className="mb-4 text-xs leading-5 text-slate-500">
                        Thiết lập các trường khách hàng cần nhập khi đặt dịch
                        vụ. Các cấu hình bổ sung hiện có được giữ lại khi chỉnh
                        sửa.
                      </p>
                      <ServiceSchemaBuilder
                        schema={schema}
                        onChange={setSchema}
                      />
                    </TabsContent>
                    <TabsContent value="pricing" className="mt-0">
                      <p className="mb-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                        Giá mới áp dụng cho đơn đặt sau khi lưu. Giá của đơn đã
                        đặt được giữ nguyên.
                      </p>
                      <PricingConfigBuilder
                        config={pricingConfig}
                        keySuggestions={collectOptionValuesFromSchema(schema)}
                        onChange={setPricingConfig}
                        onValidationChange={(group, invalid) =>
                          setPricingErrors((errors) =>
                            invalid
                              ? [...new Set([...errors, group])]
                              : errors.filter((item) => item !== group),
                          )
                        }
                      />
                      {pricingErrors.length > 0 && (
                        <p role="alert" className="mt-3 text-sm text-rose-600">
                          JSON không hợp lệ: {pricingErrors.join(", ")}. Sửa nội
                          dung trước khi lưu.
                        </p>
                      )}
                    </TabsContent>
                  </fieldset>
                </div>
              </Tabs>
            </>
          )}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-slate-50 px-6 py-4">
            <Button variant="outline" disabled={busy} onClick={onClose}>
              Hủy
            </Button>
            <Button
              disabled={
                busy ||
                !!detailError ||
                !!isLoadingDetail ||
                (isEdit && !editingService)
              }
              onClick={save}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {pendingImageUploads > 0
                ? "Đang tải ảnh…"
                : busy
                  ? "Đang lưu…"
                  : isEdit
                    ? "Lưu thay đổi"
                    : "Tạo dịch vụ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </OptionImageUploadContext.Provider>
  );
}

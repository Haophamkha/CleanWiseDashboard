"use client";

import {
  useCreateVoucherMutation,
  useGetVoucherDetailQuery,
  useUpdateVoucherMutation,
} from "@/services/voucherApi";
import type {
  Voucher,
  VoucherDiscountType,
  VoucherDistributionType,
  VoucherMutationPayload,
} from "@/types/Voucher";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, type FormEvent } from "react";

type VoucherFormModalProps = {
  open: boolean;
  editingId: number | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

type VoucherFormState = {
  code: string;
  name: string;
  description: string;
  distribution_type: VoucherDistributionType;
  discount_type: VoucherDiscountType;
  discount_value: string;
  max_discount_amount: string;
  min_order_amount: string;
  issuance_limit: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
};

type FieldErrors = Partial<Record<keyof VoucherFormState, string>>;

const EMPTY_FORM: VoucherFormState = {
  code: "",
  name: "",
  description: "",
  distribution_type: "CODE_ONLY",
  discount_type: "PERCENT",
  discount_value: "",
  max_discount_amount: "",
  min_order_amount: "0",
  issuance_limit: "",
  start_at: "",
  end_at: "",
  is_active: true,
};

const inputClassName = "w-full";

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const voucherToForm = (voucher: Voucher): VoucherFormState => ({
  code: voucher.code,
  name: voucher.name,
  description: voucher.description ?? "",
  distribution_type: voucher.distribution_type,
  discount_type: voucher.discount_type,
  discount_value: voucher.discount_value,
  max_discount_amount: voucher.max_discount_amount ?? "",
  min_order_amount: voucher.min_order_amount,
  issuance_limit: voucher.issuance_limit?.toString() ?? "",
  start_at: toDateTimeLocal(voucher.start_at),
  end_at: toDateTimeLocal(voucher.end_at),
  is_active: voucher.is_active,
});

const firstErrorText = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstErrorText(item);
      if (message) return message;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const message = firstErrorText(item);
      if (message) return message;
    }
  }
  return undefined;
};

const getApiErrors = (error: unknown) => {
  const data = (error as { data?: unknown })?.data;
  if (!data || typeof data !== "object") {
    return { message: "Không thể lưu voucher. Vui lòng thử lại." };
  }

  const payload = data as {
    message?: string;
    errors?: Record<string, unknown>;
  };
  const fieldErrors: FieldErrors = {};
  if (payload.errors) {
    Object.entries(payload.errors).forEach(([key, value]) => {
      const message = firstErrorText(value);
      if (message && key in EMPTY_FORM) {
        fieldErrors[key as keyof VoucherFormState] = message;
      }
    });
  }

  return {
    message:
      firstErrorText(payload.errors) ??
      payload.message ??
      "Không thể lưu voucher. Vui lòng thử lại.",
    fieldErrors,
  };
};

const validateForm = (form: VoucherFormState): FieldErrors => {
  const errors: FieldErrors = {};
  const discountValue = Number(form.discount_value);
  const maxDiscount = Number(form.max_discount_amount);
  const minOrder = Number(form.min_order_amount);
  const issuanceLimit = Number(form.issuance_limit);

  if (!form.code.trim()) errors.code = "Vui lòng nhập mã voucher.";
  if (!form.name.trim()) errors.name = "Vui lòng nhập tên voucher.";
  if (!form.discount_value || discountValue <= 0) {
    errors.discount_value = "Giá trị giảm phải lớn hơn 0.";
  } else if (form.discount_type === "PERCENT" && discountValue > 100) {
    errors.discount_value = "Mức giảm phần trăm không được vượt quá 100%.";
  }
  if (
    form.discount_type === "PERCENT" &&
    form.max_discount_amount &&
    maxDiscount <= 0
  ) {
    errors.max_discount_amount = "Mức giảm tối đa phải lớn hơn 0.";
  }
  if (!form.min_order_amount || minOrder < 0) {
    errors.min_order_amount = "Giá trị đơn tối thiểu không được âm.";
  }
  if (
    form.issuance_limit &&
    (!Number.isInteger(issuanceLimit) || issuanceLimit <= 0)
  ) {
    errors.issuance_limit = "Giới hạn phát hành phải là số nguyên lớn hơn 0.";
  }
  if (!form.start_at) errors.start_at = "Vui lòng chọn thời gian bắt đầu.";
  if (!form.end_at) errors.end_at = "Vui lòng chọn thời gian kết thúc.";
  if (
    form.start_at &&
    form.end_at &&
    new Date(form.start_at) >= new Date(form.end_at)
  ) {
    errors.end_at = "Thời gian kết thúc phải sau thời gian bắt đầu.";
  }

  return errors;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

export default function VoucherFormModal({
  open,
  editingId,
  onClose,
  onSaved,
}: VoucherFormModalProps) {
  const [formOverrides, setFormOverrides] = useState<
    Partial<VoucherFormState>
  >({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: detail, isFetching: isLoadingDetail, isError: detailError } =
    useGetVoucherDetailQuery(editingId ?? 0, {
      skip: !open || editingId === null,
    });
  const [createVoucher, { isLoading: isCreating }] =
    useCreateVoucherMutation();
  const [updateVoucher, { isLoading: isUpdating }] =
    useUpdateVoucherMutation();

  const isEditing = editingId !== null;
  const isSaving = isCreating || isUpdating;
  const baseForm =
    isEditing && detail?.data ? voucherToForm(detail.data) : EMPTY_FORM;
  const form: VoucherFormState = { ...baseForm, ...formOverrides };

  if (!open) return null;

  const updateField = <K extends keyof VoucherFormState>(
    key: K,
    value: VoucherFormState[K],
  ) => {
    setFormOverrides((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateForm(form);
    setFieldErrors(errors);
    setSubmitError(null);
    if (Object.keys(errors).length > 0) return;

    const payload: VoucherMutationPayload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      distribution_type: form.distribution_type,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_discount_amount:
        form.discount_type === "PERCENT" && form.max_discount_amount
          ? form.max_discount_amount
          : null,
      min_order_amount: form.min_order_amount,
      issuance_limit: form.issuance_limit
        ? Number(form.issuance_limit)
        : null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      is_active: form.is_active,
    };

    try {
      const response = isEditing
        ? await updateVoucher({ id: editingId, data: payload }).unwrap()
        : await createVoucher(payload).unwrap();
      onSaved(
        response.message ||
          (isEditing
            ? "Cập nhật voucher thành công."
            : "Tạo voucher thành công."),
      );
      onClose();
    } catch (error) {
      const apiError = getApiErrors(error);
      setSubmitError(apiError.message);
      if (apiError.fieldErrors) setFieldErrors(apiError.fieldErrors);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value && !isSaving) onClose(); }}>
      <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col overflow-hidden p-0" onEscapeKeyDown={(event) => { if (isSaving) event.preventDefault(); }} onInteractOutside={(event) => { if (isSaving) event.preventDefault(); }}>
        <DialogHeader className="mb-0 shrink-0 border-b border-slate-200 px-6 py-5 pr-12">
          <DialogTitle>{isEditing ? "Chỉnh sửa voucher" : "Thêm voucher"}</DialogTitle>
          <DialogDescription>Thiết lập mức giảm, điều kiện và thời gian áp dụng.</DialogDescription>
        </DialogHeader>

        {isEditing && isLoadingDetail ? (
          <div className="grid min-h-80 place-items-center text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />
              Đang tải thông tin voucher...
            </span>
          </div>
        ) : detailError ? (
          <div className="grid min-h-80 place-items-center px-6 text-center text-sm text-red-600">
            Không tải được thông tin voucher. Vui lòng đóng và thử lại.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="overflow-y-auto px-6 py-5">
              {submitError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Mã voucher <span className="text-red-500">*</span>
                  </span>
                  <Input
                    value={form.code}
                    onChange={(event) =>
                      updateField("code", event.target.value.toUpperCase())
                    }
                    className={inputClassName}
                    placeholder="VD: CLEAN20"
                    maxLength={50}
                  />
                  <FieldError message={fieldErrors.code} />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tên chương trình <span className="text-red-500">*</span>
                  </span>
                  <Input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className={inputClassName}
                    placeholder="Voucher khách hàng mới"
                    maxLength={150}
                  />
                  <FieldError message={fieldErrors.name} />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Mô tả
                  </span>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    className={`${inputClassName} min-h-24 resize-y`}
                    placeholder="Mô tả ngắn về chương trình ưu đãi"
                  />
                  <FieldError message={fieldErrors.description} />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Hình thức phát hành
                  </span>
                  <Select value={form.distribution_type} onValueChange={(value) => updateField("distribution_type", value as VoucherDistributionType)}>
                    <SelectTrigger aria-label="Hình thức phát hành"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Công khai</SelectItem>
                      <SelectItem value="CODE_ONLY">Nhận bằng mã</SelectItem>
                      <SelectItem value="ASSIGNED">Cấp riêng</SelectItem>
                    </SelectContent>
                  </Select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Loại giảm giá
                  </span>
                  <Select value={form.discount_type} onValueChange={(value) => {
                    updateField("discount_type", value as VoucherDiscountType);
                    if (value === "FIXED") updateField("max_discount_amount", "");
                  }}>
                    <SelectTrigger aria-label="Loại giảm giá"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">Theo phần trăm</SelectItem>
                      <SelectItem value="FIXED">Số tiền cố định</SelectItem>
                    </SelectContent>
                  </Select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.discount_value}
                      onChange={(event) =>
                        updateField("discount_value", event.target.value)
                      }
                      className={`${inputClassName} pr-16`}
                      placeholder="0"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                      {form.discount_type === "PERCENT" ? "%" : "đ"}
                    </span>
                  </div>
                  <FieldError message={fieldErrors.discount_value} />
                </label>

                {form.discount_type === "PERCENT" ? (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                      Mức giảm tối đa
                    </span>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.max_discount_amount}
                      onChange={(event) =>
                        updateField("max_discount_amount", event.target.value)
                      }
                      className={inputClassName}
                      placeholder="Không giới hạn"
                    />
                    <FieldError message={fieldErrors.max_discount_amount} />
                  </label>
                ) : (
                  <div />
                )}

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Giá trị đơn tối thiểu
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order_amount}
                    onChange={(event) =>
                      updateField("min_order_amount", event.target.value)
                    }
                    className={inputClassName}
                  />
                  <FieldError message={fieldErrors.min_order_amount} />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Giới hạn phát hành
                  </span>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={form.issuance_limit}
                    onChange={(event) =>
                      updateField("issuance_limit", event.target.value)
                    }
                    className={inputClassName}
                    placeholder="Không giới hạn"
                  />
                  <FieldError message={fieldErrors.issuance_limit} />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Bắt đầu <span className="text-red-500">*</span>
                  </span>
                  <Input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(event) =>
                      updateField("start_at", event.target.value)
                    }
                    className={inputClassName}
                  />
                  <FieldError message={fieldErrors.start_at} />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Kết thúc <span className="text-red-500">*</span>
                  </span>
                  <Input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(event) =>
                      updateField("end_at", event.target.value)
                    }
                    className={inputClassName}
                  />
                  <FieldError message={fieldErrors.end_at} />
                </label>

                <label className="flex items-center gap-3 sm:col-span-2">
                  <Checkbox checked={form.is_active} onCheckedChange={(value) => updateField("is_active", value === true)} aria-label="Cho phép sử dụng voucher" />
                  <span>
                    <span className="block text-sm font-medium text-slate-700">
                      Cho phép sử dụng voucher
                    </span>
                    <span className="block text-xs text-slate-500">
                      Voucher chỉ khả dụng khi được bật và nằm trong thời gian hiệu lực.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <Button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                variant="outline"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="min-w-32"
              >
                {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {isEditing ? "Lưu thay đổi" : "Tạo voucher"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

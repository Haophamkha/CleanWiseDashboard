import { useId, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiError } from "@/lib/api-error";
import { useUpdateWorkerContactMutation } from "@/services/workerApi";
import type { WorkerProfile } from "@/types/Worker";

export default function WorkerContactForm({
  worker,
  onCancel,
  onSaved,
  onRequestReview,
}: {
  worker: WorkerProfile;
  onCancel: () => void;
  onSaved: () => void;
  onRequestReview?: () => void;
}) {
  const phoneId = useId();
  const reasonId = useId();
  const [previousPhone] = useState(worker.phone_number);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [updateContact, { isLoading }] = useUpdateWorkerContactMutation();
  const enteredPhone = phone.trim();
  const samePhone = enteredPhone.replace(/^\+84/, "0") === (previousPhone ?? "").replace(/^\+84/, "0");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || !reason.trim() || samePhone || !confirmed) return;
    if (!/^(?:0|\+84)[0-9]{9}$/.test(enteredPhone)) {
      setError("Nhập số điện thoại Việt Nam hợp lệ.");
      return;
    }
    setError("");
    try {
      await updateContact({
        id: worker.id,
        previous_phone_number: previousPhone,
        phone_number: enteredPhone,
        reason: reason.trim(),
        confirmed_with_worker: confirmed,
      }).unwrap();
      onSaved();
    } catch (failure) {
      setError(apiError(failure));
    }
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-4 overflow-y-auto px-6 py-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Số điện thoại hiện tại</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">{previousPhone || "Chưa cập nhật"}</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={phoneId} className="block text-sm font-medium text-slate-800">Số điện thoại mới</label>
          <Input
            id={phoneId}
            type="tel"
            autoComplete="off"
            maxLength={15}
            required
            disabled={isLoading}
            value={phone}
            onChange={(event) => { setPhone(event.target.value); setError(""); }}
            aria-describedby={`${phoneId}-hint`}
            placeholder="Ví dụ 0912345678"
          />
          <p id={`${phoneId}-hint`} className="text-xs text-slate-600">
            Số mới dùng để đăng nhập. Số nhập với đầu +84 được lưu với đầu 0.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={reasonId} className="block text-sm font-medium text-slate-800">Lý do chỉnh sửa</label>
          <Textarea
            id={reasonId}
            required
            disabled={isLoading}
            maxLength={1000}
            value={reason}
            onChange={(event) => { setReason(event.target.value); setError(""); }}
            placeholder="Ví dụ Nhân viên xác nhận đã nhập nhầm số."
          />
        </div>
        {error && <p role="alert" className="whitespace-pre-line text-sm text-red-700">{error}</p>}
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <Checkbox checked={confirmed} disabled={isLoading} onCheckedChange={(checked) => setConfirmed(checked === true)} />
          Tôi đã xác nhận số điện thoại mới với nhân viên.
        </label>
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-2">
            <p>Họ tên pháp lý, ngày sinh và giấy tờ được xử lý qua luồng cập nhật hồ sơ và xét duyệt.</p>
            <p>Nhân viên gửi yêu cầu đổi dịch vụ trong app. Admin xem yêu cầu ở tab Đổi dịch vụ.</p>
            {onRequestReview && (
              <Button type="button" variant="outline" size="sm" disabled={isLoading} onClick={onRequestReview}>
                Yêu cầu cập nhật hồ sơ
              </Button>
            )}
          </div>
        </div>
      </div>
      <DialogFooter className="m-0 shrink-0 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
        <Button type="button" variant="outline" disabled={isLoading} onClick={onCancel}>Hủy</Button>
        <Button type="submit" disabled={isLoading || !enteredPhone || !reason.trim() || samePhone || !confirmed}>
          {isLoading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          Lưu thay đổi
        </Button>
      </DialogFooter>
    </form>
  );
}

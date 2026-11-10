import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiError } from "@/lib/api-error";
import { useReviewWorkerServiceMutation } from "@/services/workerApi";
import type { WorkerProfile } from "@/types/Worker";

export default function WorkerServiceReview({ worker }: { worker: WorkerProfile }) {
  const reasonId = useId();
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [review, { isLoading }] = useReviewWorkerServiceMutation();
  if (!worker.service_request_token || !worker.requested_service) return null;

  async function confirm() {
    if (!decision || !worker.service_request_token || isLoading) return;
    setError("");
    try {
      await review({
        id: worker.id,
        request_token: worker.service_request_token,
        decision,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      }).unwrap();
      setDecision(null);
      toast.success(decision === "APPROVE" ? "Đã duyệt đổi dịch vụ." : "Đã từ chối đổi dịch vụ.");
    } catch (failure) {
      setError(apiError(failure));
    }
  }

  return (
    <section className="mb-5 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold text-slate-950">Yêu cầu đổi dịch vụ</h3>
      <p className="text-sm text-slate-700">Hiện tại · {worker.registered_service?.name ?? "Chưa đăng ký"}</p>
      <p className="text-sm font-medium text-slate-900">Đề xuất · {worker.requested_service.name}</p>
      {worker.status !== "ACTIVE" && <p className="text-sm text-slate-700">Có thể duyệt khi hồ sơ đang hoạt động.</p>}
      {decision === "REJECT" && (
        <div className="space-y-1.5">
          <label htmlFor={reasonId} className="text-sm font-medium text-slate-900">Lý do từ chối</label>
          <Textarea id={reasonId} value={reason} maxLength={1000} onChange={e => setReason(e.target.value)} disabled={isLoading} />
        </div>
      )}
      {decision === "APPROVE" && <p className="text-sm text-slate-700">Dịch vụ mới sẽ áp dụng khi nhận việc sau khi xác nhận.</p>}
      {error && <p role="alert" className="whitespace-pre-line text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {decision ? (
          <>
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => { setDecision(null); setReason(""); setError(""); }}>Hủy</Button>
            <Button type="button" variant={decision === "REJECT" ? "destructive" : "default"} disabled={isLoading || (decision === "REJECT" && !reason.trim())} onClick={() => void confirm()}>
              {decision === "REJECT" ? "Xác nhận từ chối đổi dịch vụ" : "Xác nhận duyệt đổi dịch vụ"}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={() => setDecision("REJECT")}>Từ chối đổi dịch vụ</Button>
            <Button type="button" disabled={worker.status !== "ACTIVE"} onClick={() => setDecision("APPROVE")}>Duyệt đổi dịch vụ</Button>
          </>
        )}
      </div>
    </section>
  );
}

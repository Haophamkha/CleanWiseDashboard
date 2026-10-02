"use client";
import { useState } from "react";
import { Loader2, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToggleServiceActiveMutation } from "@/services/servicesApi";
import { apiError } from "@/features/bookings/booking-ui";

export default function ServiceStatusToggle({
  id,
  isActive,
  name,
}: {
  id: number;
  isActive: boolean;
  name: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleActive, { isLoading }] = useToggleServiceActiveMutation();
  const update = async (active: boolean) => {
    try {
      const result = await toggleActive({ id, is_active: active }).unwrap();
      setConfirmOpen(false);
      toast.success(result.data.is_active ? "Đã bật dịch vụ." : "Đã tắt dịch vụ.");
    } catch (error) {
      toast.error(apiError(error));
    }
  };
  return (
    <>
      <div className="flex w-44 shrink-0 items-center gap-2">
        <Button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`Trạng thái ${name}`}
          disabled={isLoading}
          onClick={() => (isActive ? setConfirmOpen(true) : update(true))}
          className={`h-6 w-11 shrink-0 rounded-full p-0 ${isActive ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 hover:bg-slate-400"}`}
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isActive ? "translate-x-2.5" : "-translate-x-2.5"}`}
          />
        </Button>
        <span
          aria-live="polite"
          className={`w-28 shrink-0 whitespace-nowrap text-xs ${isActive ? "text-emerald-700" : "text-slate-500"}`}
        >
          {isLoading ? "Đang cập nhật…" : isActive ? "Đang bật" : "Đã tắt"}
        </span>
      </div>
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isLoading) setConfirmOpen(open);
        }}
      >
        <DialogContent
          onEscapeKeyDown={(event) => {
            if (isLoading) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (isLoading) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Tắt dịch vụ?</DialogTitle>
            <DialogDescription>
              Dịch vụ “{name}” sẽ ngừng nhận đơn mới. Các đơn đã đặt vẫn tiếp
              tục xử lý. Bạn có thể bật lại bất cứ lúc nào.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => setConfirmOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="warning"
              disabled={isLoading}
              onClick={() => update(false)}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              Tắt dịch vụ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

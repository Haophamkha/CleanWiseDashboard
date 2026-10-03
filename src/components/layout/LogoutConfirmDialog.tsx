"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { performLogout } from "@/store/baseApi";

type LogoutConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function LogoutConfirmDialog({
  open,
  onOpenChange,
}: LogoutConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    // performLogout xoá token rồi tự chuyển về trang đăng nhập,
    // nên giữ trạng thái loading cho đến khi trang được thay.
    await performLogout();
  }

  return (
    <Dialog
      open={open}
      // Không cho đóng hộp thoại khi đang đăng xuất
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="items-center text-center">
          <span className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-50/60">
            <LogOut className="h-6 w-6" />
          </span>
          <DialogTitle>Đăng xuất khỏi CleanWise?</DialogTitle>
          <DialogDescription>
            Bạn sẽ cần đăng nhập lại để tiếp tục quản lý hệ thống.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={handleConfirm}
            className="h-11 rounded-xl shadow-lg shadow-red-500/25"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Đang đăng xuất" : "Đăng xuất"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

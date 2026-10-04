"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, LogOut, Sparkle, X } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { useGetAdminNotificationSummaryQuery } from "@/services/notificationApi";
import LogoutConfirmDialog from "./LogoutConfirmDialog";

// Bật để xem log trong Console (F12). Xóa/đổi thành false khi đã chạy ổn.
const DEBUG = true;

type SidebarProps = {
  /** Trạng thái mở của drawer trên mobile */
  open: boolean;
  onClose: () => void;
  /** Thu gọn chỉ còn icon (chỉ áp dụng từ màn hình lg trở lên) */
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export default function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const {data: summary} = useGetAdminNotificationSummaryQuery();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (DEBUG) console.log("[Sidebar] collapsed =", collapsed);
  }, [collapsed]);

  const handleToggleClick = () => {
    if (DEBUG) {
      console.log("[Sidebar] đã bấm nút thu gọn", {
        collapsed,
        onToggleCollapse: typeof onToggleCollapse,
      });
    }
    if (typeof onToggleCollapse !== "function") {
      console.error(
        "[Sidebar] Không nhận được onToggleCollapse. DashboardShell đang dùng chưa phải bản mới.",
      );
      return;
    }
    onToggleCollapse();
  };

  const handleLogoutClick = () => {
    onClose();
    setConfirmOpen(true);
  };

  /**
   * Nhãn chữ: luôn nằm trong DOM và co/mờ dần khi thu gọn nên có animation mượt.
   * Chỉ dùng tiền tố lg: cho trạng thái thu gọn, nên drawer mobile luôn đầy đủ chữ.
   */
  const label = `ml-3 max-w-44 overflow-hidden whitespace-nowrap opacity-100 transition-all duration-200 ${
    collapsed ? "lg:ml-0 lg:max-w-0 lg:opacity-0" : ""
  }`;

  // Icon đứng yên tại chỗ, chỉ có chữ và độ rộng sidebar thay đổi
  const itemBase = `flex items-center rounded-xl py-3 text-sm transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
    collapsed ? "px-4 lg:px-[15px]" : "px-4"
  }`;

  return (
    <>
      {/* Lớp phủ cho mobile */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden ${
          open ? "block" : "hidden"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden border-r border-slate-200 bg-slate-100 transition-[width,transform] duration-200 ease-out lg:translate-x-0 ${
          collapsed ? "lg:w-[4.5rem]" : "lg:w-64"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo + nút thu gọn */}
        <div
          className={`flex items-center justify-between py-6 transition-[padding] duration-200 ${
            collapsed
              ? "px-5 lg:flex-col lg:justify-center lg:gap-3 lg:px-4"
              : "px-5"
          }`}
        >
          <Link
            href="/dashboard"
            className="flex items-center"
            onClick={onClose}
            title={collapsed ? "CleanWise" : undefined}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-700 to-sky-600 text-white shadow-md shadow-blue-700/25">
              <Sparkle className="h-5 w-5" />
            </span>
            <span className={`leading-tight ${label}`}>
              <span className="block text-lg font-bold tracking-tight text-slate-900">
                CleanWise
              </span>
              <span className="block text-xs text-slate-500">
                Trang quản trị
              </span>
            </span>
          </Link>

          {/* Desktop: nút < thu gọn / > mở rộng */}
          <button
            type="button"
            onClick={handleToggleClick}
            aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            aria-expanded={!collapsed}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
            className="hidden h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-blue-700 lg:grid"
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform duration-200 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Mobile: nút đóng drawer */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav
          className={`sidebar-scrollbar flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto pb-4 transition-[padding] duration-200 ${
            collapsed ? "px-4 lg:px-3" : "px-4"
          }`}
        >
          {NAV_ITEMS.map(({ label: text, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href === "/workers" ? "/workers?status=PENDING" : href}
                onClick={onClose}
                title={collapsed ? text : undefined}
                aria-label={collapsed ? text : undefined}
                aria-current={active ? "page" : undefined}
                className={`relative ${itemBase} ${
                  active
                    ? "bg-gradient-to-r from-blue-700 to-sky-600 font-medium text-white shadow-md shadow-blue-700/25"
                    : "text-slate-500 hover:bg-white hover:text-blue-700"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className={label}>{text}</span>
                {href === "/workers" && !!summary?.pending_profiles && <span aria-label={`${summary.pending_profiles} hồ sơ chờ duyệt`} className={`ml-auto rounded-full bg-red-500 px-2 text-xs leading-5 text-white ${collapsed ? "lg:absolute lg:right-0 lg:top-0 lg:px-1 lg:text-[10px]" : ""}`}>{summary.pending_profiles > 99 ? "99+" : summary.pending_profiles}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Đăng xuất */}
        <div
          className={`border-t border-slate-200 py-4 transition-[padding] duration-200 ${
            collapsed ? "px-4 lg:px-3" : "px-4"
          }`}
        >
          <button
            type="button"
            onClick={handleLogoutClick}
            title={collapsed ? "Đăng xuất" : undefined}
            aria-label={collapsed ? "Đăng xuất" : undefined}
            className={`${itemBase} w-full bg-red-50 font-medium text-red-600 hover:bg-red-600 hover:text-white`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span className={label}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <LogoutConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} />
    </>
  );
}

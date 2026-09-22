"use client";

import { logout } from "@/services/authApi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Sparkle, X } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";

type SidebarProps = {
  /** Trạng thái mở của drawer trên mobile */
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    onClose();
    router.replace("/login");
  };
  return (
    <>
      {/* Lớp phủ cho mobile */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-900/50 lg:hidden ${
          open ? "block" : "hidden"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
              <Sparkle className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-semibold text-white">
                CleanWise
              </span>
              <span className="block text-xs text-slate-400">
                Trang quản trị
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="sidebar-scrollbar flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                  active
                    ? "bg-blue-600 font-medium text-white"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}

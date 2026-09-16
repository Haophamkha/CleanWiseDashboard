"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
  KeyRound,
} from "lucide-react";
import { findNavItem } from "@/config/navigation";
import { logout } from "@/services/authApi";

type TopbarProps = {
  onOpenSidebar: () => void;
};

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const current = findNavItem(pathname);

  const [openProfile, setOpenProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setOpenProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setOpenProfile(false);
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-8">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Mở menu"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Current page */}
      <span className="text-sm font-medium text-slate-700">
        {current?.label ?? "Trang quản trị"}
      </span>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Thông báo"
          className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setOpenProfile((prev) => !prev)}
            aria-expanded={openProfile}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              AD
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-slate-700">Admin</p>
              <p className="text-xs text-slate-400">Quản trị viên</p>
            </div>

            <ChevronDown
              className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${
                openProfile ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {openProfile && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              {/* Profile header */}
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    AD
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      Admin
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      Quản trị viên
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setOpenProfile(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>Hồ sơ</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setOpenProfile(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Cài đặt</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setOpenProfile(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100 p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

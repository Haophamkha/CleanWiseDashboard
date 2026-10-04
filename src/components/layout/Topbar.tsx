"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  KeyRound,
  LogOut,
  Menu,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/store/hooks";
import type { UserResponse } from "@/types/Response";
import AdminNotifications from "./AdminNotifications";
import LogoutConfirmDialog from "./LogoutConfirmDialog";

type TopbarProps = {
  onOpenSidebar: () => void;
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  STAFF: "Nhân viên",
  CUSTOMER: "Khách hàng",
};

/** Họ tên theo thứ tự Việt Nam (họ + tên), rơi về username rồi "Admin". */
function getDisplayName(user: UserResponse | null): string {
  const full = `${user?.last_name ?? ""} ${user?.first_name ?? ""}`.trim();
  return full || user?.username || "Admin";
}

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AD";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function Avatar({
  src,
  initials,
  className,
}: {
  src?: string | null;
  initials: string;
  className: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${className} object-cover`} />
    );
  }
  return (
    <div
      className={`${className} grid place-items-center bg-gradient-to-br from-blue-500 to-cyan-500 font-semibold text-white shadow-md shadow-blue-500/30`}
    >
      {initials}
    </div>
  );
}

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const user = useAppSelector((state) => state.auth.user);
  const name = getDisplayName(user);
  const initials = getInitials(name);
  const roleLabel = ROLE_LABEL[user?.role ?? "ADMIN"] ?? "Quản trị viên";

  const [openProfile, setOpenProfile] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenProfile(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogoutClick = () => {
    setOpenProfile(false);
    setConfirmOpen(true);
  };

  const menuItem =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-700";

  return (
    <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white px-4 lg:px-8">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Mở menu"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Tìm kiếm (giao diện, chưa gắn chức năng) */}
      <div className="group relative hidden w-full max-w-sm sm:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
        <Input
          type="search"
          placeholder="Tìm kiếm..."
          aria-label="Tìm kiếm"
          className="h-10 rounded-full border-transparent bg-slate-100 pl-11 focus:bg-white"
        />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        <AdminNotifications />

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setOpenProfile((prev) => !prev)}
            aria-expanded={openProfile}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100 sm:pr-3"
          >
            <Avatar
              src={user?.avatar}
              initials={initials}
              className="h-9 w-9 shrink-0 rounded-full text-sm"
            />
            <div className="hidden text-left sm:block">
              <p className="max-w-32 truncate text-sm font-medium text-slate-800">
                {name}
              </p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
            <ChevronDown
              className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${
                openProfile ? "rotate-180" : ""
              }`}
            />
          </button>

          {openProfile && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 origin-top-right animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 duration-150"
            >
              <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 to-cyan-50 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user?.avatar}
                    initials={initials}
                    className="h-11 w-11 shrink-0 rounded-full text-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user?.email || roleLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setOpenProfile(false)}
                  className={menuItem}
                >
                  <UserIcon className="h-4 w-4 text-slate-500" />
                  Hồ sơ
                </button>
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setOpenProfile(false)}
                  className={menuItem}
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  Cài đặt
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setOpenProfile(false)}
                  className={menuItem}
                >
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  Đổi mật khẩu
                </button>
              </div>

              <div className="border-t border-slate-100 p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogoutClick}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LogoutConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} />
    </header>
  );
}

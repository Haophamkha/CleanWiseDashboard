"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    console.log("[Shell] nhận lệnh thu gọn, trạng thái hiện tại:", collapsed);
    setCollapsed(!collapsed);
  };

  return (
    <div className="h-dvh overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div
        className={`flex h-full min-w-0 flex-col transition-[padding] duration-200 ${
          collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64"
        }`}
      >
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 [scrollbar-gutter:stable] lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

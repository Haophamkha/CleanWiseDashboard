import type { Metadata } from "next";
import Image from "next/image";
import { Sparkle, ShieldCheck, Users, BarChart3 } from "lucide-react";
import LoginForm from "@/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập | CleanWise",
  description: "Trang đăng nhập dành cho quản trị viên hệ thống CleanWise.",
};

const highlights = [
  { icon: Users, text: "Phân công nhân viên nhanh chóng" },
  { icon: BarChart3, text: "Đối soát doanh thu theo thời gian thực" },
  { icon: ShieldCheck, text: "Bảo mật dành riêng cho quản trị viên" },
];

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-300 via-teal-300 to-cyan-400 p-4 sm:p-8">
      {/* Ảnh nền + zoom nhẹ (đặt ảnh tại public/images/login-bg.jpg) */}
      <Image
        src="/images/login-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-30 animate-bg-zoom object-cover"
      />

      {/* Lớp phủ gradient để chữ dễ đọc */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-sky-950/50 via-teal-900/25 to-slate-950/60" />

      {/* Đốm sáng mờ trôi nhẹ */}
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-96 w-96 animate-float rounded-full bg-cyan-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 -z-10 h-[28rem] w-[28rem] animate-float-slow rounded-full bg-blue-500/30 blur-3xl" />

      {/* Card kính mờ */}
      <div className="grid w-full max-w-4xl animate-in fade-in zoom-in-95 slide-in-from-bottom-6 overflow-hidden rounded-3xl border border-white/30 bg-white/10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl duration-700 md:grid-cols-2">
        {/* Bên trái: form */}
        <section className="bg-white/80 p-8 backdrop-blur-md sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30">
              <Sparkle className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-slate-900">
              CleanWise{" "}
              <span className="text-xs font-medium text-slate-500">Admin</span>
            </span>
          </div>

          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Đăng nhập
            </h1>
            <p className="text-sm text-slate-500">
              Dùng tài khoản quản trị để vào bảng điều khiển.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-xs text-slate-400">
            © {new Date().getFullYear()} CleanWise. All rights reserved.
          </p>
        </section>

        {/* Bên phải: thương hiệu (ẩn trên mobile) */}
        <section className="hidden flex-col justify-center gap-8 p-10 text-white md:flex">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold leading-snug drop-shadow">
              Điều phối đội vệ sinh trong một màn hình
            </h2>
            <p className="text-sm leading-relaxed text-white/80">
              Theo dõi đơn dịch vụ, phân công nhân viên và đối soát doanh thu
              theo thời gian thực.
            </p>
          </div>

          <ul className="space-y-3">
            {highlights.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                style={{ animationDelay: `${300 + i * 120}ms` }}
                className="flex animate-in fade-in slide-in-from-right-4 items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm duration-500 fill-mode-both hover:bg-white/20"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

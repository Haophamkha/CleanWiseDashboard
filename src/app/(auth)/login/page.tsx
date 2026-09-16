import type { Metadata } from "next";
import { Sparkle } from "lucide-react";
import LoginForm from "@/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập | CleanWise",
  description: "Trang đăng nhập dành cho quản trị viên hệ thống CleanWise.",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel thương hiệu */}
      <div className="hidden flex-col justify-between bg-slate-900 p-12 text-slate-300 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
            <Sparkle className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold text-white">CleanWise</span>
        </div>

        <div className="max-w-sm space-y-4">
          <h2 className="text-3xl font-semibold leading-snug text-white">
            Điều phối đội vệ sinh trong một màn hình
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Theo dõi đơn dịch vụ, phân công nhân viên và đối soát doanh thu theo
            thời gian thực.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} CleanWise
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                <Sparkle className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold text-slate-900">
                CleanWise
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Đăng nhập quản trị
            </h1>
            <p className="text-sm text-slate-500">
              Dùng tài khoản quản trị để vào bảng điều khiển.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}

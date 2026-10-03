"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Sparkle,
  User,
} from "lucide-react";
import { useLoginMutation, saveTokens } from "@/services/authApi";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ADMIN_ROLE = "ADMIN";

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // true sau khi đăng nhập thành công, giữ màn hình loading đến khi chuyển trang
  const [redirecting, setRedirecting] = useState(false);
  // Đổi key mỗi lần lỗi để animation rung chạy lại
  const [errorKey, setErrorKey] = useState(0);

  function fail(message: string) {
    setError(message);
    setErrorKey((k) => k + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      fail("Nhập tên đăng nhập và mật khẩu.");
      return;
    }

    try {
      const result = await login({
        username: username.trim(),
        password,
      }).unwrap();

      // Check role TRƯỚC khi lưu token
      if (result.user?.role !== ADMIN_ROLE) {
        fail("Tài khoản này không có quyền truy cập trang quản trị.");
        return;
      }

      await saveTokens(result.access, result.refresh);
      dispatch(setUser(result.user));
      setRedirecting(true);
      router.replace("/dashboard");
    } catch (e: unknown) {
      const err = e as { status?: number };

      if (err.status === 429) {
        fail("Bạn thử quá nhiều lần, vui lòng đợi một phút rồi thử lại.");
      } else if (!err.status) {
        fail("Không kết nối được máy chủ. Kiểm tra mạng và thử lại.");
      } else {
        fail(
          "Tên đăng nhập hoặc mật khẩu không đúng. Kiểm tra lại và thử lần nữa.",
        );
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div
          key={errorKey}
          role="alert"
          className="flex animate-shake items-start gap-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 px-4 py-3 text-sm text-white shadow-lg shadow-orange-500/30"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-slate-700"
        >
          Tên đăng nhập
        </label>
        <div className="group relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
          <Input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="h-12 rounded-xl border-slate-200/80 bg-white/90 pl-10 shadow-sm transition-shadow focus:shadow-md focus:shadow-blue-500/10"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700"
        >
          Mật khẩu
        </label>
        <div className="group relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="h-12 rounded-xl border-slate-200/80 bg-white/90 pl-10 pr-12 shadow-sm transition-shadow focus:shadow-md focus:shadow-blue-500/10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-blue-600"
          />
          Duy trì đăng nhập
        </label>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline"
        >
          Quên mật khẩu?
        </button>
      </div>

      <Button
        type="submit"
        disabled={isLoading || redirecting}
        size="lg"
        className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-base shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-cyan-600 hover:shadow-xl hover:shadow-blue-500/40 active:translate-y-0"
      >
        {(isLoading || redirecting) && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {isLoading || redirecting ? "Đang đăng nhập" : "Đăng nhập"}
      </Button>

      <p className="text-center text-xs leading-relaxed text-slate-500">
        Tài khoản quản trị do quản lý hệ thống cấp. Liên hệ bộ phận kỹ thuật nếu
        bạn chưa có quyền truy cập.
      </p>
      {/* Màn hình loading sau khi đăng nhập thành công */}
      {redirecting &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-50 flex animate-in fade-in flex-col items-center justify-center gap-8 bg-gradient-to-br from-sky-950/90 via-teal-900/85 to-slate-950/95 backdrop-blur-md duration-500"
          >
            <div className="relative grid h-24 w-24 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/30" />
              <span className="absolute inset-2 animate-pulse rounded-full bg-blue-500/30 blur-md" />
              <span className="relative grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-2xl shadow-blue-500/40">
                <Sparkle className="h-9 w-9" />
              </span>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-2 text-center delay-150 duration-500 fill-mode-both">
              <p className="flex items-center justify-center gap-2 text-lg font-semibold text-white">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Đăng nhập thành công
              </p>
              <p className="text-sm text-white/70">
                Đang chuẩn bị bảng điều khiển CleanWise...
              </p>
            </div>

            <div className="h-1 w-56 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-2/5 animate-progress rounded-full bg-gradient-to-r from-cyan-300 to-blue-400" />
            </div>
          </div>,
          document.body,
        )}
    </form>
  );
}

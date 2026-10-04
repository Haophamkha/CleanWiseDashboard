import { ENV } from "@/config/env";
import { ROUTES } from "@/config/constants";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/utils/authCookies";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { toast } from "sonner";

const axiosInstance = axios.create({
  baseURL: ENV.API_URL,
  // Các mutation admin có thể gồm nhiều cập nhật DB và hoàn tiền. Backend đã
  // tách push notification khỏi request, nhưng vẫn cho một khoảng chờ đủ an toàn
  // để tránh hiển thị Network Error trong khi server đang hoàn tất transaction.
  timeout: 30000,
});

// File downloads use the same authenticated client and token refresh as JSON requests.
export async function requestBlob(url: string, params: unknown): Promise<Blob> {
  try {
    const response = await axiosInstance.get<Blob>(url, { params, responseType: "blob" });
    return response.data;
  } catch (error) {
    const response = (error as AxiosError<Blob>).response;
    if (response?.data instanceof Blob) {
      const message = await response.data.text();
      try { throw { data: JSON.parse(message) }; }
      catch (parsed) { if (parsed instanceof SyntaxError) throw new Error("Không thể tải báo cáo. Vui lòng thử lại."); throw parsed; }
    }
    throw error;
  }
}

const PUBLIC_ENDPOINTS = [
  "/api/auth/login/",
  "/api/auth/token/refresh/",
  "/api/auth/logout/",
];
const REFRESH_URL = "/api/auth/token/refresh/";
const LOGOUT_URL = "/api/auth/logout/";

const isPublicUrl = (url?: string) =>
  PUBLIC_ENDPOINTS.some((p) => url?.includes(p));

/* ---------------- request ---------------- */

axiosInstance.interceptors.request.use((config) => {
  if (!isPublicUrl(config.url)) {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const channel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("cleanwise-admin-auth")
    : null;

if (channel) {
  channel.onmessage = (e) => {
    if (e.data === "logout") window.location.replace(ROUTES.LOGIN);
  };
}

let loggingOut = false;

export const performLogout = async (): Promise<void> => {
  if (loggingOut) return;
  loggingOut = true;

  const refresh = getRefreshToken();
  clearTokens();
  channel?.postMessage("logout");

  if (refresh) {
    try {
      await axios.post(
        `${ENV.API_URL}${LOGOUT_URL}`,
        { refresh },
        { timeout: 3000 },
      );
    } catch {}
  }

  window.location.replace(ROUTES.LOGIN);
};

/* ---------------- refresh (1 promise trong tab, 1 khóa giữa các tab) ---------------- */

const runExclusive = <T>(fn: () => Promise<T>): Promise<T> => {
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request(
      "cleanwise-admin-refresh",
      async () => await fn(),
    ) as Promise<T>;
  }
  return fn();
};

const doRefresh = async (): Promise<string> => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("NO_REFRESH_TOKEN");

  const response = await axios.post(
    `${ENV.API_URL}${REFRESH_URL}`,
    { refresh },
    { timeout: 10000 },
  );

  const data = response.data?.data ?? response.data;
  if (typeof data?.access !== "string") throw new Error("BAD_REFRESH_RESPONSE");

  saveTokens(
    data.access,
    typeof data.refresh === "string" ? data.refresh : refresh,
  );
  return data.access;
};

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = (failedToken: string | null): Promise<string> =>
  (refreshPromise ??= runExclusive(async () => {
    const current = getAccessToken();
    if (current && current !== failedToken) return current;
    return doRefresh();
  }).finally(() => {
    refreshPromise = null;
  }));

// Chỉ logout khi BE TỪ CHỐI refresh token. Mất mạng / timeout / 5xx / 429 thì giữ phiên.
const shouldLogout = (e: unknown): boolean => {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    return status === 400 || status === 401 || status === 403;
  }
  return true; // NO_REFRESH_TOKEN, BAD_REFRESH_RESPONSE
};

const readSentToken = (config: AxiosRequestConfig): string | null => {
  const headers = config.headers;

  if (!headers) return null;

  const value =
    typeof headers.get === "function"
      ? headers.get("Authorization")
      : headers.Authorization;

  return typeof value === "string" && value.startsWith("Bearer ")
    ? value.slice(7)
    : null;
};

/* ---------------- rate limit (429) ---------------- */

let lastRateLimitToastAt = 0;

const showRateLimitToast = (retryAfter?: string) => {
  const now = Date.now();
  if (now - lastRateLimitToastAt < 3000) return; // tránh spam toast
  lastRateLimitToastAt = now;

  const message = retryAfter
    ? `Thao tác quá nhanh. Vui lòng thử lại sau ${retryAfter} giây.`
    : "Thao tác quá nhanh. Vui lòng thử lại sau ít giây.";

    toast.error(message);
};

/* ---------------- response ---------------- */

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalRequest) return Promise.reject(error);

    // Bị giới hạn tần suất: báo người dùng, không refresh, không retry
    if (error.response?.status === 429) {
      showRateLimitToast(
        error.response.headers?.["retry-after"] as string | undefined,
      );
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) return Promise.reject(error);
    if (isPublicUrl(originalRequest.url) || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const token = await refreshAccessToken(readSentToken(originalRequest));
      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as Record<string, string>).Authorization =
        `Bearer ${token}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      if (shouldLogout(refreshError)) await performLogout();
      return Promise.reject(error);
    }
  },
);

/* ---------------- RTK Query ---------------- */

type AxiosBaseQueryArgs = {
  url: string;
  method: AxiosRequestConfig["method"];
  data?: unknown;
  params?: unknown;
  headers?: AxiosRequestConfig["headers"];
};

const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, unknown> =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await axiosInstance({ url, method, data, params, headers });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      const retryAfter = Number(err.response?.headers?.["retry-after"]);
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data ?? err.message,
          ...(retryAfter > 0 && { retryAfter }),
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "Notifications",
    "Profile",
    "Categories",
    "Services",
    "Customers",
    "Workers",
    "Bookings",
    "Users",
    "Vouchers",
    "Reviews",
    "Complaints",
    "Wallets",
  ],
  endpoints: () => ({}),
});

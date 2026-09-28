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

const axiosInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000,
});

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

const runExclusive = <T>(fn: () => Promise<T>): Promise<T> =>
  typeof navigator !== "undefined" && "locks" in navigator
    ? navigator.locks.request("cleanwise-admin-refresh", fn)
    : fn();

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

/* ---------------- response ---------------- */

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalRequest) return Promise.reject(error);
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
};

const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, unknown> =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({ url, method, data, params });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data ?? err.message,
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
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
  ],
  endpoints: () => ({}),
});

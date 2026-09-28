import { COOKIE_KEYS } from "@/config/constants";
import Cookies from "js-cookie";

const options = () => ({
  expires: 7,
  path: "/",
  sameSite: "strict" as const,
  secure:
    typeof window !== "undefined" && window.location.protocol === "https:",
});

export const getAccessToken = () =>
  Cookies.get(COOKIE_KEYS.ACCESS_TOKEN) ?? null;

export const getRefreshToken = () =>
  Cookies.get(COOKIE_KEYS.REFRESH_TOKEN) ?? null;

export const saveTokens = (access: string, refresh: string) => {
  Cookies.set(COOKIE_KEYS.ACCESS_TOKEN, access, options());
  Cookies.set(COOKIE_KEYS.REFRESH_TOKEN, refresh, options());
};

export const setAccessToken = (access: string) => {
  Cookies.set(COOKIE_KEYS.ACCESS_TOKEN, access, options());
};

export const clearTokens = () => {
  Cookies.remove(COOKIE_KEYS.ACCESS_TOKEN, { path: "/" });
  Cookies.remove(COOKIE_KEYS.REFRESH_TOKEN, { path: "/" });
};

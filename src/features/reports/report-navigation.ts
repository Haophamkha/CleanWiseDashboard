import { todayVN } from "./report-utils";
export const reportModules = [
  { id: "overview", label: "Tổng quan" }, { id: "revenue", label: "Doanh thu" },
  { id: "services", label: "Dịch vụ" }, { id: "workers", label: "Nhân viên" },
  { id: "favorites", label: "Yêu thích" }, { id: "vip", label: "Khách VIP" }, { id: "audit", label: "Đối soát" },
] as const;
export type ReportModule = typeof reportModules[number]["id"];
export function reportMonth(value?: string) {
  return value && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(value) ? value : todayVN().slice(0, 7);
}
export function reportHref(module: ReportModule, month: string) {
  return `${module === "overview" ? "/dashboard" : `/dashboard/${module}`}?month=${encodeURIComponent(month)}`;
}

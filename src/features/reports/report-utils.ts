import type { ReportParams } from "@/types/Report";
export const currency = (value: string | number) => Number(value).toLocaleString("vi-VN", {style: "currency", currency: "VND", maximumFractionDigits: 0});
export const count = (value: number) => value.toLocaleString("vi-VN");
export const shortNumber = (value: number) => new Intl.NumberFormat("vi-VN", {notation: "compact", maximumFractionDigits: 1}).format(value);
export const todayVN = () => new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date());
export const shiftDay = (value: string, days: number) => new Date(new Date(`${value}T00:00:00Z`).getTime() + days * 86400000).toISOString().slice(0, 10);
export const displayDate = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString("vi-VN", {timeZone: "UTC"});
export const displayTime = (value: string) => new Date(value).toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"});
export function adjacentPeriod(params: ReportParams, direction: number): ReportParams {
  const date = params.date ?? todayVN();
  if (params.period === "week") return {...params, date: shiftDay(date, direction * 7)};
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(1);
  parsed.setUTCMonth(parsed.getUTCMonth() + direction * (params.period === "quarter" ? 3 : 1));
  return {...params, date: parsed.toISOString().slice(0, 10)};
}

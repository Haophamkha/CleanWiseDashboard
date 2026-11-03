import type { Metadata } from "next";
import ReportsDashboard from "@/features/reports/ReportsDashboard";
import { reportMonth } from "@/features/reports/report-navigation";
export const metadata: Metadata = { title: "Tổng quan | CleanWise" };
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  return <ReportsDashboard month={reportMonth((await searchParams).month)} />;
}

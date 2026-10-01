import type { Metadata } from "next";
import ReportsDashboard from "@/features/reports/ReportsDashboard";
export const metadata: Metadata = { title: "Tổng quan | CleanWise" };
export default function DashboardPage() { return <ReportsDashboard />; }

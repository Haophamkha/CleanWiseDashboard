import { notFound } from "next/navigation";
import ReportsDashboard from "@/features/reports/ReportsDashboard";
import { reportModules, reportMonth, type ReportModule } from "@/features/reports/report-navigation";

export default async function ReportModulePage({ params, searchParams }: {
  params: Promise<{ module: string }>; searchParams: Promise<{ month?: string }>;
}) {
  const { module } = await params;
  if (!reportModules.some(item => item.id === module && item.id !== "overview")) notFound();
  return <ReportsDashboard key={module} module={module as ReportModule} month={reportMonth((await searchParams).month)} />;
}

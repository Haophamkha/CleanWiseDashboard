import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintDetailPage } from "@/features/complaints";

export const metadata: Metadata = { title: "Chi tiết khiếu nại | CleanWise" };

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const complaintId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(complaintId) || complaintId < 1) notFound();
  return <ComplaintDetailPage complaintId={complaintId} fromDiscipline={from === "discipline"} />;
}

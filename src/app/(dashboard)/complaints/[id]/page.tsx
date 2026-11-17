import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintDetailPage } from "@/features/complaints";

export const metadata: Metadata = { title: "Chi tiết khiếu nại | CleanWise" };

export default async function Page({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const complaintId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(complaintId) || complaintId < 1) notFound();
  return <ComplaintDetailPage complaintId={complaintId} />;
}

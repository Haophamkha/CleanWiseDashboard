import type { Metadata } from "next";
import { BookingDetailPage } from "@/features/bookings/BookingDetailPage";

export const metadata: Metadata = { title: "Chi tiết đơn | CleanWise" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetailPage id={Number(id)} />;
}

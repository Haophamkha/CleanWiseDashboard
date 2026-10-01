import type { Metadata } from "next";
import { BookingsPage as BookingsView } from "@/features/bookings/BookingsPage";

export const metadata: Metadata = {
  title: "Đơn dịch vụ | CleanWise",
};

export default function BookingsPage() {
  return <BookingsView />;
}

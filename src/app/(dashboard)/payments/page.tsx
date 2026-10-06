import type { Metadata } from "next";
import { PaymentsPage } from "@/features/payments/PaymentsPage";

export const metadata: Metadata = {
  title: "Thanh toán | CleanWise",
};

export default function Page() {
  return <PaymentsPage />;
}

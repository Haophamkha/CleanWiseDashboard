import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookingDetailLink({ bookingId, children, variant = "default" }: {
  bookingId: number;
  children: ReactNode;
  variant?: "default" | "secondary";
}) {
  return (
    <Button asChild size="sm" variant={variant} className="h-auto min-h-9 max-w-full whitespace-normal px-3 py-2 text-left text-sm">
      <Link href={`/bookings/${bookingId}`}>
        <span>{children}</span>
        <ArrowRight className="size-4 shrink-0" aria-hidden />
      </Link>
    </Button>
  );
}

import type { HTMLAttributes } from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

const tones = {
  slate: ["border-slate-200 bg-slate-50 text-slate-600", "bg-slate-400"],
  amber: ["border-amber-200 bg-amber-50 text-amber-700", "bg-amber-500"],
  blue: ["border-blue-200 bg-blue-50 text-blue-700", "bg-blue-500"],
  violet: ["border-violet-200 bg-violet-50 text-violet-700", "bg-violet-500"],
  emerald: ["border-emerald-200 bg-emerald-50 text-emerald-700", "bg-emerald-500"],
  rose: ["border-rose-200 bg-rose-50 text-rose-700", "bg-rose-500"],
  red: ["border-red-200 bg-red-50 text-red-700", "bg-red-500"],
  orange: ["border-orange-200 bg-orange-50 text-orange-700", "bg-orange-500"],
} as const;
export type StatusTone = keyof typeof tones;

export function StatusPill({ tone = "slate", children, className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) {
  const [style, dot] = tones[tone];
  return (
    <Badge variant="outline" className={cn("h-6 gap-1.5 whitespace-nowrap px-2 font-medium", style, className)} {...props}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      {children}
    </Badge>
  );
}

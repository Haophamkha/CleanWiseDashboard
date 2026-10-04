import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

export function StatCard({ label, value, detail, icon: Icon, color, loading = false }: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: LucideIcon;
  color: string;
  loading?: boolean;
}) {
  return <Card className="shadow-none">
    <CardContent className="flex items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {loading ? <Skeleton className="mt-1 h-8 w-14" /> : <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>}
        <p className="mt-1 text-xs text-slate-400">{detail}</p>
      </div>
      <span className={`shrink-0 rounded-xl p-3 ${color}`}><Icon className="h-5 w-5" /></span>
    </CardContent>
  </Card>;
}

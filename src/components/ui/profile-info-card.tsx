import type { LucideIcon } from "lucide-react";

export function ProfileInfoCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="min-w-0 rounded-lg border border-slate-200 p-3">
    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400"><Icon className="h-3.5 w-3.5 shrink-0" />{label}</p>
    <p className="mt-1.5 break-words text-sm font-medium text-slate-800" title={value}>{value}</p>
  </div>;
}

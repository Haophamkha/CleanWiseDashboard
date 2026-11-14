import type { LucideIcon } from "lucide-react";

export function ProfileInfoCard({ icon: Icon, label, value, onClick }: {
  icon: LucideIcon; label: string; value: string; onClick?: () => void;
}) {
  const content = <>
    <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />{label}
    </span>
    <span className={`mt-1.5 block break-words text-sm font-medium ${onClick ? "text-blue-700 underline underline-offset-2" : "text-slate-800"}`} title={value}>{value}</span>
  </>;
  const className = "min-w-0 rounded-lg border border-slate-200 p-3";
  return onClick
    ? <button type="button" className={`${className} text-left hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500`} onClick={onClick}>{content}</button>
    : <div className={className}>{content}</div>;
}

"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

// shadcn chart composition: config, responsive container and themed tooltip.
export type ChartConfig = Record<string, { label: string; color: string }>;
const ChartContext = React.createContext<ChartConfig>({});
export function ChartContainer({ config, className, children, style, ...props }: React.ComponentProps<"div"> & { config: ChartConfig; children: React.ComponentProps<typeof ResponsiveContainer>["children"] }) {
  const colors = Object.fromEntries(Object.entries(config).map(([key, value]) => [`--color-${key}`, value.color])) as React.CSSProperties;
  return <ChartContext.Provider value={config}><div data-slot="chart" className={cn("min-w-0 text-xs [&_.recharts-cartesian-axis-tick_text]:fill-slate-500 [&_.recharts-cartesian-grid_line]:stroke-slate-200 [&_.recharts-surface]:outline-none", className)} style={{...colors, ...style}} {...props}><ResponsiveContainer width="100%" height="100%" minWidth={0}>{children}</ResponsiveContainer></div></ChartContext.Provider>;
}
export const ChartTooltip = Tooltip;
type TooltipItem = { dataKey?: string | number; name?: string | number; value?: string | number; color?: string };
export function ChartTooltipContent({ active, payload, label, formatter }: {
  active?: boolean; payload?: readonly TooltipItem[]; label?: React.ReactNode;
  formatter?: (value: string | number, key: string) => React.ReactNode;
}) {
  const config = React.useContext(ChartContext);
  if (!active || !payload?.length) return null;
  return <div className="min-w-40 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
    {label !== undefined && <p className="mb-2 font-semibold text-slate-900">{label}</p>}
    <div className="space-y-2">{payload.map((item, index) => {
      const key = String(item.dataKey ?? item.name ?? "");
      return <div key={`${key}-${index}`} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-sm" style={{backgroundColor: item.color ?? config[key]?.color}} />{config[key]?.label ?? item.name}</span><span className="font-semibold tabular-nums text-slate-900">{formatter ? formatter(item.value ?? 0, key) : item.value}</span></div>;
    })}</div>
  </div>;
}

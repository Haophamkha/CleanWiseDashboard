"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive className={cn("flex w-full flex-col overflow-hidden rounded-md bg-white text-slate-900", className)} {...props} />;
}
export function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return <div className="flex items-center gap-2 border-b px-3"><Search className="size-4 shrink-0 text-slate-400" /><CommandPrimitive.Input className={cn("h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:opacity-50", className)} {...props} /></div>;
}
export function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn("max-h-60 overflow-x-hidden overflow-y-auto overscroll-contain p-1", className)} {...props} />;
}
export function CommandEmpty(props: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className="px-2 py-6 text-center text-sm text-slate-500" {...props} />;
}
export function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return <CommandPrimitive.Item className={cn("relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none data-[selected=true]:bg-slate-100 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50", className)} {...props} />;
}

"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  detectPricingGroupShape,
  getPricingGroupKeys,
  type PricingConfig,
} from "@/types/Service";
import PricingFlatMapEditor from "./PricingFlatMapEditor";
import PricingNestedMapEditor from "./PricingNestedMapEditor";

const PRICING_TYPES = ["FIXED", "UNIT", "FORMULA"] as const;

export default function PricingConfigBuilder({
  config,
  keySuggestions,
  onChange,
  onValidationChange,
}: {
  config: PricingConfig;
  keySuggestions: string[];
  onChange: (config: PricingConfig) => void;
  onValidationChange?: (group: string, invalid: boolean) => void;
}) {
  const groupKeys = getPricingGroupKeys(config);

  const updateGroup = (groupName: string, value: unknown) => {
    onChange({ ...config, [groupName]: value });
  };

  const renameGroupName = (oldName: string, newName: string) => {
    if (!newName || newName === oldName) return;
    const { [oldName]: value, ...rest } = config;
    onChange({ ...rest, [newName]: value });
  };

  const removeGroupName = (name: string) => {
    onValidationChange?.(name, false);
    const rest = { ...config };
    delete rest[name];
    onChange(rest);
  };

  const addGroup = (shape: "number" | "flat_map" | "nested_map") => {
    const name = `group_${groupKeys.length + 1}`;
    const initial = shape === "number" ? 0 : {};
    onChange({ ...config, [name]: initial });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Input
          className="rounded-lg border px-2.5 py-1.5 text-xs"
          placeholder="Đơn vị tiền tệ (vd: VND)"
          value={config.currency ?? ""}
          onChange={(e) => onChange({ ...config, currency: e.target.value })}
        />
        <Select
          value={config.pricing_type ?? "FIXED"}
          onValueChange={(value) =>
            onChange({
              ...config,
              pricing_type: value as PricingConfig["pricing_type"],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRICING_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groupKeys.map((groupName) => {
        const value = config[groupName];
        const shape = detectPricingGroupShape(value);

        return (
          <div
            key={groupName}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <Input
                className="flex-1 rounded-lg border px-2.5 py-1.5 text-xs font-mono font-semibold"
                defaultValue={groupName}
                onBlur={(e) => renameGroupName(groupName, e.target.value)}
              />
              <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {shape === "number"
                  ? "Số tiền"
                  : shape === "flat_map"
                    ? "Bảng giá"
                    : shape === "nested_map"
                      ? "Bảng giá theo nhóm"
                      : "Tuỳ chỉnh"}
              </span>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => removeGroupName(groupName)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                Xoá
              </Button>
            </div>

            {shape === "number" && (
              <Input
                type="number"
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs"
                value={value as number}
                onChange={(e) => updateGroup(groupName, Number(e.target.value))}
              />
            )}

            {shape === "flat_map" && (
              <PricingFlatMapEditor
                entries={value as Record<string, number>}
                keySuggestions={keySuggestions}
                onChange={(entries) => updateGroup(groupName, entries)}
              />
            )}

            {shape === "nested_map" && (
              <PricingNestedMapEditor
                groups={value as Record<string, Record<string, number>>}
                keySuggestions={keySuggestions}
                onChange={(groups) => updateGroup(groupName, groups)}
              />
            )}

            {shape === "unknown" && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Cấu trúc chưa được editor hỗ trợ — sửa JSON trực tiếp.
                <Textarea
                  className="mt-2 w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs"
                  rows={4}
                  defaultValue={JSON.stringify(value, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      onValidationChange?.(groupName, false);
                      updateGroup(groupName, parsed);
                    } catch {
                      onValidationChange?.(groupName, true);
                    }
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => addGroup("flat_map")}
          className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600"
        >
          + Bảng giá (vd: base_prices)
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => addGroup("nested_map")}
          className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600"
        >
          + Bảng giá theo nhóm (vd: unit_prices)
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => addGroup("number")}
          className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600"
        >
          + Số tiền đơn (vd: pump_gas_price)
        </Button>
      </div>
    </div>
  );
}

import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComplaintReporterRole, ComplaintStage, ComplaintStatus } from "@/types/Complaint";

export type ComplaintStatusFilter = ComplaintStatus | "SENT" | "ACCEPTED" | "";

const statuses: [ComplaintStatusFilter, string][] = [
  ["", "Tất cả trạng thái"], ["PENDING", "Chờ xử lý"], ["IN_REVIEW", "Đang xem xét"],
  ["SENT", "Chờ khách phản hồi"], ["ACCEPTED", "Đang thực hiện"], ["RESOLVED", "Đã xử lý"],
  ["REJECTED", "Bị từ chối"], ["CANCELLED", "Đã hủy"],
];
const stages: [ComplaintStage | "", string][] = [
  ["", "Tất cả giai đoạn"], ["BEFORE_SERVICE", "Trước khi thực hiện"],
  ["IN_SERVICE", "Đang thực hiện"], ["AFTER_SERVICE", "Sau khi hoàn thành"],
];
const reporters: [ComplaintReporterRole | "", string][] = [
  ["", "Tất cả người gửi"], ["CUSTOMER", "Khách hàng"], ["WORKER", "Nhân viên"],
];

function FilterSelect<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <Select value={value || "all"} onValueChange={(key) => onChange((key === "all" ? "" : key) as T)}>
      <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map(([key, title]) => <SelectItem key={key} value={key || "all"}>{title}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function ComplaintsFilter({
  search, status, stage, reporterRole, refreshing, onSearchChange, onStatusChange,
  onStageChange, onReporterRoleChange, onRefresh,
}: {
  search: string;
  status: ComplaintStatusFilter;
  stage: ComplaintStage | "";
  reporterRole: ComplaintReporterRole | "";
  refreshing: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ComplaintStatusFilter) => void;
  onStageChange: (value: ComplaintStage | "") => void;
  onReporterRoleChange: (value: ComplaintReporterRole | "") => void;
  onRefresh: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-3 sm:grid-cols-3 xl:w-[34rem]">
          <FilterSelect label="Người gửi" value={reporterRole} options={reporters} onChange={onReporterRoleChange} />
          <FilterSelect label="Trạng thái" value={status} options={statuses} onChange={onStatusChange} />
          <FilterSelect label="Giai đoạn dịch vụ" value={stage} options={stages} onChange={onStageChange} />
        </div>
        <div className="flex min-w-0 items-center gap-3 xl:w-96">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" aria-hidden />
            <Input type="search" className="pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)}
              aria-label="Tìm khiếu nại" placeholder="Mã khiếu nại, mã đơn, người gửi..." />
          </div>
          <Button type="button" variant="outline" size="icon" className="shrink-0"
            disabled={refreshing} aria-label="Làm mới danh sách khiếu nại" onClick={onRefresh}>
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

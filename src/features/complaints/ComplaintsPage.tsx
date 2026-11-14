"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetComplaintsQuery } from "@/services/complaintApi";
import { useDebounced } from "@/features/refunds/refund-utils";
import { ComplaintsFilter, type ComplaintStatusFilter } from "./ComplaintsFilter";
import { ComplaintsTable } from "./ComplaintsTable";
import { DisciplineInbox } from "./DisciplineInbox";
import type {
  ComplaintReporterRole,
  ComplaintStage,
} from "@/types/Complaint";

export function ComplaintsPage({ initialTab }: { initialTab: "complaints" | "discipline" }) {
  return (
    <Tabs defaultValue={initialTab} className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-950">Khiếu nại</h1>
        <p className="mt-1 text-sm text-slate-500">Tiếp nhận phản ánh, theo dõi phương án và kết quả xử lý.</p>
      </header>
      <TabsList aria-label="Mục quản lý khiếu nại" className="h-auto flex-wrap">
        <TabsTrigger value="complaints">Khiếu nại</TabsTrigger>
        <TabsTrigger value="discipline">Điểm tín nhiệm nhân viên</TabsTrigger>
      </TabsList>
      <TabsContent value="complaints"><ComplaintInbox /></TabsContent>
      <TabsContent value="discipline"><DisciplineInbox /></TabsContent>
    </Tabs>
  );
}

function ComplaintInbox() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusFilter>("");
  const [stageFilter, setStageFilter] = useState<ComplaintStage | "">("");
  const [reporterFilter, setReporterFilter] = useState<
    ComplaintReporterRole | ""
  >("");
  const debouncedSearch = useDebounced(search).trim();

  const {
    currentData: complaints,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetComplaintsQuery({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter === "SENT" || statusFilter === "ACCEPTED"
      ? { workflow_status: statusFilter }
      : statusFilter ? { status: statusFilter } : {}),
    ...(stageFilter ? { stage: stageFilter } : {}),
    ...(reporterFilter ? { reporter_role: reporterFilter } : {}),
  });

  return (
    <div className="space-y-5">
      <ComplaintsFilter
        search={search}
        status={statusFilter}
        stage={stageFilter}
        reporterRole={reporterFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onStageChange={setStageFilter}
        onReporterRoleChange={setReporterFilter}
        refreshing={isFetching}
        onRefresh={() => void refetch()}
      />
      <ComplaintsTable complaints={complaints ?? []} loading={isLoading || (isFetching && !complaints)}
        failed={isError} onRetry={() => void refetch()} />
    </div>
  );
}

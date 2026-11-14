import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Complaint } from "@/types/Complaint";
import { ComplaintRow } from "./ComplaintRow";

interface ComplaintsTableProps {
  complaints: Complaint[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}

export function ComplaintsTable({ complaints, loading, failed, onRetry }: ComplaintsTableProps) {
  return (
    <Card className="overflow-hidden">
      {!loading && (failed || !complaints.length) ? (
        <div className="py-16 text-center">
          {failed ? (
            <>
              <p className="text-sm font-medium text-red-600">Không tải được danh sách khiếu nại.</p>
              <Button variant="outline" className="mt-3" onClick={onRetry}>Thử lại</Button>
            </>
          ) : (
            <>
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
              <p className="mt-3 text-sm font-medium text-slate-600">Không có khiếu nại phù hợp</p>
              <p className="mt-1 text-xs text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </>
          )}
        </div>
      ) : (
        <Table className="min-w-[760px] table-fixed" aria-label="Danh sách khiếu nại" aria-busy={loading}>
          <TableHeader className="border-b border-slate-200 bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[25%]">Hồ sơ</TableHead>
              <TableHead className="w-[18%]">Đơn / buổi</TableHead>
              <TableHead className="w-[23%]">Người liên quan</TableHead>
              <TableHead className="w-[19%]">Trạng thái</TableHead>
              <TableHead className="w-[15%] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 4 }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                {Array.from({ length: 5 }, (_, column) => (
                  <TableCell key={column}><Skeleton className="h-8 w-3/4" /></TableCell>
                ))}
              </TableRow>
            )) : complaints.map((complaint) => (
              <ComplaintRow key={complaint.id} complaint={complaint} />
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

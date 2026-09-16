import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Lịch làm việc | CleanWise",
};

export default function SchedulesPage() {
  return (
    <PagePlaceholder
      title="Lịch làm việc"
      description="Lịch theo ngày và tuần của từng nhân viên, ca trống và ca đã kín."
      upcoming={[
        "Chế độ xem theo ngày và theo tuần",
        "Lưới ca làm việc của từng nhân viên",
        "Kéo thả để đổi ca hoặc đổi người phụ trách",
        "Cảnh báo trùng ca và quá tải",
      ]}
    />
  );
}

import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Báo cáo | CleanWise",
};

export default function ReportsPage() {
  return (
    <PagePlaceholder
      title="Báo cáo"
      description="Báo cáo doanh thu, hiệu suất nhân viên và cơ cấu dịch vụ theo kỳ."
      upcoming={[
        "Chọn kỳ báo cáo theo tuần, tháng, quý",
        "Biểu đồ doanh thu và số đơn theo thời gian",
        "Xếp hạng nhân viên theo số đơn và điểm đánh giá",
        "Xuất báo cáo ra Excel",
      ]}
    />
  );
}

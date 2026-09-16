import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Tổng quan hệ thống | CleanWise",
};

export default function DashboardPage() {
  return (
    <PagePlaceholder
      title="Tổng quan hệ thống"
      description="Số liệu vận hành trong ngày và các chỉ số chính của hệ thống."
      upcoming={[
        "Thẻ chỉ số: tổng đơn hôm nay, đơn đang xử lý, doanh thu, nhân viên đang hoạt động",
        "Biểu đồ doanh thu 7 ngày gần nhất",
        "Biểu đồ cơ cấu dịch vụ theo tỉ lệ đơn",
        "Bảng đơn hàng gần đây kèm trạng thái và nhân viên phụ trách",
      ]}
      action={
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Tạo đơn mới
        </button>
      }
    />
  );
}

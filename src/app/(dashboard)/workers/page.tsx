import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Nhân viên | CleanWise",
};

export default function WorkersPage() {
  return (
    <PagePlaceholder
      title="Nhân viên"
      description="Danh sách nhân viên, hồ sơ năng lực, đánh giá và hiệu suất làm việc."
      upcoming={[
        "Danh sách nhân viên kèm trạng thái đang rảnh hoặc đang làm",
        "Hồ sơ: kỹ năng, khu vực nhận việc, giấy tờ",
        "Tab đánh giá từ khách hàng theo từng nhân viên",
        "Thống kê số đơn hoàn thành và điểm trung bình",
      ]}
      action={
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm nhân viên
        </button>
      }
    />
  );
}

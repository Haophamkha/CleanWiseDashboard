import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Khiếu nại | CleanWise",
};

export default function ComplaintsPage() {
  return (
    <PagePlaceholder
      title="Khiếu nại"
      description="Phản ánh của khách hàng, tiến độ xử lý và kết quả giải quyết."
      upcoming={[
        "Danh sách khiếu nại theo mức độ ưu tiên",
        "Liên kết tới đơn dịch vụ và nhân viên liên quan",
        "Luồng xử lý: tiếp nhận, đang xử lý, đã giải quyết",
        "Ghi chú nội bộ và phản hồi gửi khách",
      ]}
    />
  );
}

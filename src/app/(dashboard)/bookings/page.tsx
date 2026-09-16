import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Đơn dịch vụ | CleanWise",
};

export default function BookingsPage() {
  return (
    <PagePlaceholder
      title="Đơn dịch vụ"
      description="Toàn bộ đơn đặt dịch vụ: tạo mới, phân công, theo dõi trạng thái."
      upcoming={[
        "Bộ lọc theo trạng thái, dịch vụ, khoảng ngày và nhân viên",
        "Bảng đơn có phân trang và tìm kiếm theo mã đơn",
        "Trang chi tiết đơn với dòng thời gian trạng thái",
        "Thao tác phân công nhân viên và huỷ đơn",
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

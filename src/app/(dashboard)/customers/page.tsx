import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Khách hàng | CleanWise",
};

export default function CustomersPage() {
  return (
    <PagePlaceholder
      title="Khách hàng"
      description="Hồ sơ khách hàng, lịch sử đặt dịch vụ và thông tin liên hệ."
      upcoming={[
        "Danh sách khách hàng kèm tìm kiếm theo tên và số điện thoại",
        "Hồ sơ chi tiết: địa chỉ, ghi chú, hạng khách hàng",
        "Lịch sử đơn và tổng chi tiêu của từng khách",
        "Khoá hoặc mở tài khoản khách hàng",
      ]}
      action={
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm khách hàng
        </button>
      }
    />
  );
}

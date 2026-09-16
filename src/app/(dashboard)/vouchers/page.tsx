import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Voucher | CleanWise",
};

export default function VouchersPage() {
  return (
    <PagePlaceholder
      title="Voucher"
      description="Mã giảm giá và chương trình ưu đãi: điều kiện áp dụng, thời hạn, lượt sử dụng."
      upcoming={[
        "Danh sách voucher đang chạy, sắp diễn ra và đã hết hạn",
        "Tạo mã giảm theo phần trăm hoặc số tiền cố định",
        "Điều kiện áp dụng: dịch vụ, giá trị đơn tối thiểu, thời gian hiệu lực",
        "Giới hạn lượt dùng và thống kê số lượt đã sử dụng",
      ]}
      action={
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Tạo voucher
        </button>
      }
    />
  );
}

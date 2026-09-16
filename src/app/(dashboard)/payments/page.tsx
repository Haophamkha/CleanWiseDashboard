import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Thanh toán | CleanWise",
};

export default function PaymentsPage() {
  return (
    <PagePlaceholder
      title="Thanh toán"
      description="Giao dịch, đối soát doanh thu và tình trạng công nợ của đơn hàng."
      upcoming={[
        "Danh sách giao dịch kèm phương thức thanh toán",
        "Lọc theo trạng thái: đã thu, chờ thu, hoàn tiền",
        "Đối soát doanh thu theo ngày",
        "Xuất file đối soát",
      ]}
    />
  );
}

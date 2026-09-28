import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Hoàn tiền | CleanWise",
};

export default function RefundsPage() {
  return (
    <PagePlaceholder
      title="Hoàn tiền"
      description="Yêu cầu hoàn tiền của khách hàng: duyệt, từ chối và theo dõi trạng thái hoàn."
      upcoming={[
        "Danh sách yêu cầu hoàn tiền theo trạng thái",
        "Xem chi tiết đơn và lý do hoàn tiền",
        "Duyệt hoặc từ chối kèm ghi chú",
        "Theo dõi các khoản đã hoàn và đối soát với thanh toán",
      ]}
    />
  );
}

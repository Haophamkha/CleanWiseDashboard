import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Dịch vụ | CleanWise",
};

export default function ServicesPage() {
  return (
    <PagePlaceholder
      title="Dịch vụ"
      description="Danh mục dịch vụ, bảng giá và cấu hình thời lượng từng gói."
      upcoming={[
        "Danh mục dịch vụ theo nhóm",
        "Bảng giá theo thời lượng hoặc theo khối lượng",
        "Bật tắt trạng thái kinh doanh của từng dịch vụ",
        "Cấu hình số nhân viên cần cho mỗi gói",
      ]}
      action={
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm dịch vụ
        </button>
      }
    />
  );
}

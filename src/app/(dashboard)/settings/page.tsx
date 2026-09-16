import type { Metadata } from "next";
import PagePlaceholder from "@/components/common/PagePlaceholder";

export const metadata: Metadata = {
  title: "Cài đặt | CleanWise",
};

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Cài đặt"
      description="Thông tin doanh nghiệp, phân quyền tài khoản và tuỳ chọn hệ thống."
      upcoming={[
        "Thông tin doanh nghiệp và liên hệ hỗ trợ",
        "Tài khoản quản trị và phân quyền theo vai trò",
        "Cấu hình thông báo gửi khách và gửi nhân viên",
        "Khung giờ nhận đơn và ngày nghỉ lễ",
      ]}
    />
  );
}

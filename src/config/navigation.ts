import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  type LucideIcon,
  MessageSquareWarning,
  Settings,
  Sparkles,
  TicketPercent,
  UserCog,
  Users,
} from "lucide-react";

export type NavItem = {
  /** Nhãn hiển thị trên sidebar */
  label: string;
  /** Đường dẫn route, trùng với thư mục trong src/app/(dashboard) */
  href: string;
  icon: LucideIcon;
  /** Mô tả ngắn, dùng cho tiêu đề trang và tooltip */
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Tổng quan",
    href: "/dashboard",
    icon: LayoutDashboard,
    description:
      "Số liệu vận hành trong ngày và các chỉ số chính của hệ thống.",
  },
  {
    label: "Đơn dịch vụ",
    href: "/bookings",
    icon: ClipboardList,
    description:
      "Toàn bộ đơn đặt dịch vụ: tạo mới, phân công, theo dõi trạng thái.",
  },
  {
    label: "Khách hàng",
    href: "/customers",
    icon: Users,
    description: "Hồ sơ khách hàng, lịch sử đặt dịch vụ và thông tin liên hệ.",
  },
  {
    label: "Nhân viên",
    href: "/workers",
    icon: UserCog,
    description:
      "Danh sách nhân viên, hồ sơ năng lực, đánh giá và hiệu suất làm việc.",
  },
  {
    label: "Dịch vụ",
    href: "/services",
    icon: Sparkles,
    description: "Danh mục dịch vụ, bảng giá và cấu hình thời lượng từng gói.",
  },
  {
    label: "Lịch làm việc",
    href: "/schedules",
    icon: CalendarDays,
    description:
      "Lịch theo ngày và tuần của từng nhân viên, ca trống và ca đã kín.",
  },
  {
    label: "Thanh toán",
    href: "/payments",
    icon: CreditCard,
    description:
      "Giao dịch, đối soát doanh thu và tình trạng công nợ của đơn hàng.",
  },
  {
    label: "Voucher",
    href: "/vouchers",
    icon: TicketPercent,
    description:
      "Mã giảm giá và chương trình ưu đãi: điều kiện áp dụng, thời hạn, lượt sử dụng.",
  },
  {
    label: "Khiếu nại",
    href: "/complaints",
    icon: MessageSquareWarning,
    description:
      "Phản ánh của khách hàng, tiến độ xử lý và kết quả giải quyết.",
  },
  {
    label: "Báo cáo",
    href: "/reports",
    icon: BarChart3,
    description:
      "Báo cáo doanh thu, hiệu suất nhân viên và cơ cấu dịch vụ theo kỳ.",
  },
  {
    label: "Cài đặt",
    href: "/settings",
    icon: Settings,
    description:
      "Thông tin doanh nghiệp, phân quyền tài khoản và tuỳ chọn hệ thống.",
  },
];

/** Tìm mục menu khớp với pathname hiện tại (ưu tiên khớp sâu nhất). */
export function findNavItem(pathname: string): NavItem | undefined {
  return [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
}

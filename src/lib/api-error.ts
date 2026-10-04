const fieldLabels: Record<string, string> = {
  customer_id: "Khách hàng", service_id: "Dịch vụ", address_id: "Địa chỉ thực hiện",
  delivery_address_id: "Địa chỉ giao nhận", service_data: "Thông tin dịch vụ",
  scheduled_start: "Giờ bắt đầu", scheduled_end: "Giờ kết thúc", date: "Ngày làm việc",
  start_time: "Giờ bắt đầu", duration: "Thời lượng", payment_method: "Phương thức thanh toán",
  voucher_code: "Mã giảm giá", note: "Ghi chú", reason: "Lý do", worker_id: "Nhân viên",
  schedule_ids: "Các buổi làm", amount: "Số tiền", phone_number: "Số điện thoại",
  email: "Email", code: "Mã", name: "Tên", non_field_errors: "", detail: "",
};
const metadata = new Set(["success", "status", "status_code", "error_code", "timestamp", "code"]);
const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

function details(value: unknown, path: string[] = []): string[] {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text || /^\s*<(?:!doctype|html|body)/i.test(text)) return [];
    const label = path.map((key) => fieldLabels[key] ?? key.replaceAll("_", " ")).filter(Boolean).join(" / ");
    return [label ? `${label}: ${text}` : text];
  }
  if (Array.isArray(value)) return value.flatMap((item, index) =>
    details(item, record(item) ? [...path, `Mục ${index + 1}`] : path));
  const object = record(value);
  if (!object) return [];
  // API envelopes have a general message and optional field-level validation errors.
  if ("errors" in object || "message" in object || "data" in object) {
    const messages = details(object.detail).concat(details(object.message));
    const fields = details(object.errors).concat(details(object.data));
    return [...messages, ...fields];
  }
  return Object.entries(object).flatMap(([key, item]) =>
    metadata.has(key) && key !== "code" ? [] : details(item, [...path, key]));
}

export function apiError(error: unknown): string {
  const root = record(error);
  const response = record(root?.response);
  const payload = response?.data ?? root?.data ?? error;
  const messages = [...new Set(details(payload))];
  if (messages.length) {
    return messages.map((message) => {
      if (message === "Network Error") return "Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.";
      if (/timeout of \d+ms exceeded/i.test(message)) return "Yêu cầu quá thời gian chờ. Hãy tải lại dữ liệu để kiểm tra kết quả trước khi thử lại.";
      return message;
    }).join("\n");
  }
  if (error instanceof Error && error.message) return error.message;
  const status = response?.status ?? root?.status;
  const fallbacks: Record<string, string> = {
    400: "Dữ liệu nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
    401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    403: "Bạn không có quyền thực hiện thao tác này.",
    404: "Không tìm thấy dữ liệu yêu cầu.",
    409: "Dữ liệu xung đột. Tải lại dữ liệu rồi thử lại.",
    429: "Thao tác quá nhanh. Vui lòng thử lại sau ít giây.",
    500: "Máy chủ gặp lỗi khi xử lý yêu cầu (HTTP 500). Vui lòng thử lại sau.",
    503: "Máy chủ đang bận (HTTP 503). Vui lòng thử lại sau.",
  };
  return fallbacks[String(status)] ?? (typeof status === "number"
    ? `Không thực hiện được yêu cầu (HTTP ${status}). Vui lòng thử lại.`
    : "Không thực hiện được yêu cầu. Vui lòng kiểm tra kết nối rồi thử lại.");
}

export type AdminNotification = {
  id: number;
  title: string;
  message: string;
  related_worker: number | null;
  related_booking: number | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationPage = {
  results: AdminNotification[];
  has_next: boolean;
};

export type NotificationSummary = {
  pending_profiles: number;
  pending_complaints: number;
  unread_count: number;
};

// The notification views and common JSON renderer both wrap their payload in data.
function unwrap(response: unknown): Record<string, unknown> {
  let current = response;

  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      break;
    }

    const object = current as Record<string, unknown>;

    if (!("data" in object)) {
      return object;
    }

    current = object.data;
  }

  throw new Error(
    "Dữ liệu thông báo trả về không hợp lệ. Vui lòng thử tải lại.",
  );
}

export function normalizeNotificationPage(response: unknown): NotificationPage {
  const payload = unwrap(response);

  if (!Array.isArray(payload.results)) {
    throw new Error(
      "Không đọc được danh sách thông báo. Vui lòng thử tải lại.",
    );
  }

  return {
    results: payload.results as AdminNotification[],
    has_next: payload.has_next === true,
  };
}

export function normalizeNotificationSummary(
  response: unknown,
): NotificationSummary {
  const payload = unwrap(response);

  if (
    typeof payload.pending_profiles !== "number" ||
    typeof payload.unread_count !== "number"
  ) {
    throw new Error("Không đọc được số lượng thông báo. Vui lòng thử tải lại.");
  }

  return {
    pending_profiles: payload.pending_profiles,
    pending_complaints:
      typeof payload.pending_complaints === "number"
        ? payload.pending_complaints
        : 0,
    unread_count: payload.unread_count,
  };
}

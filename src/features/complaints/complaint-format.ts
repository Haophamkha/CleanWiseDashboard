const complaintDate = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatComplaintDate(value: string) {
  return complaintDate.format(new Date(value));
}

import { BriefcaseBusiness, Mail, MapPin, Phone, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AvailableWorker } from "@/types/Booking";

const genderLabel: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

export function WorkerProfilePanel({ worker }: { worker: AvailableWorker }) {
  const initials = worker.full_name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-950">Thông tin nhân viên</h3>
        <p className="mt-1 text-sm text-slate-500">Kiểm tra hồ sơ và năng lực trước khi phân công.</p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700">
          {initials || "NV"}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-slate-950">{worker.full_name}</h4>
          <p className="truncate text-sm text-slate-500">@{worker.username}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-white text-amber-700">
              <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
              {worker.average_rating ?? "0.00"}
            </Badge>
            <Badge variant="outline" className="bg-white">{worker.total_completed_jobs} việc hoàn thành</Badge>
            <Badge variant="outline" className="bg-white">{worker.active_jobs_count} việc đang nhận</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ProfileField icon={Phone} label="Điện thoại" value={worker.phone_number || "Chưa cập nhật"} />
        <ProfileField icon={Mail} label="Email" value={worker.email || "Chưa cập nhật"} truncate title={worker.email} />
        <ProfileField
          icon={BriefcaseBusiness}
          label="Kinh nghiệm"
          value={`${worker.experience_years} năm${worker.gender ? ` • ${genderLabel[worker.gender] ?? worker.gender}` : ""}`}
        />
        <ProfileField
          icon={BriefcaseBusiness}
          label="Dịch vụ"
          value={worker.registered_service?.name || "Chưa đăng ký"}
          truncate
          title={worker.registered_service?.name}
        />
      </div>

      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          <MapPin className="h-3.5 w-3.5" />Khu vực hoạt động
        </p>
        <div className="flex flex-wrap gap-2">
          {worker.working_areas.map((area) => <Badge key={`${area.id}-${area.city}`} variant="secondary">{area.name}</Badge>)}
          {!worker.working_areas.length && <span className="text-sm text-slate-500">Chưa cập nhật khu vực.</span>}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">Giới thiệu</p>
        <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          {worker.bio || "Nhân viên chưa cập nhật phần giới thiệu."}
        </p>
      </div>
    </div>
  );
}

function ProfileField({ icon: Icon, label, value, truncate, title }: {
  icon: typeof Phone;
  label: string;
  value: string;
  truncate?: boolean;
  title?: string | null;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 p-3">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" />{label}
      </p>
      <p className={`mt-1.5 text-sm font-medium text-slate-800 ${truncate ? "truncate" : ""}`} title={title ?? undefined}>{value}</p>
    </div>
  );
}

import type { ReactNode } from "react";

type PagePlaceholderProps = {
  title: string;
  description: string;
  /** Các phần sẽ xây ở bước sau, hiển thị dạng danh sách */
  upcoming: string[];
  /** Nút hành động chính của trang, ví dụ "Tạo đơn mới" */
  action?: ReactNode;
};

export default function PagePlaceholder({
  title,
  description,
  upcoming,
  action,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
        {action}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8">
        <p className="text-sm font-medium text-slate-700">
          Màn hình này đang được xây dựng
        </p>
        <p className="mt-1 text-sm text-slate-500">Các phần sẽ có ở đây:</p>
        <ul className="mt-4 space-y-2">
          {upcoming.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-sm text-slate-600"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

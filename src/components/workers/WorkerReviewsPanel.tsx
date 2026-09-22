"use client";

import {
  useGetWorkerReviewsQuery,
  useReplyToReviewMutation,
  useSetReviewVisibilityMutation,
} from "@/services/reviewApi";
import type { Review } from "@/types/Review";
import type { WorkerProfile } from "@/types/Worker";
import {
  Eye,
  EyeOff,
  ImageIcon,
  LoaderCircle,
  MessageSquareReply,
  RotateCw,
  Star,
} from "lucide-react";
import { useState } from "react";

type WorkerReviewsPanelProps = {
  worker: WorkerProfile;
};

type VisibilityFilter = "ALL" | "VISIBLE" | "HIDDEN";

const getPersonName = (person: Review["customer"]) =>
  `${person.first_name} ${person.last_name}`.trim() || person.username;

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "—";

const getErrorMessage = (error: unknown, fallback: string) => {
  const data = (error as { data?: unknown })?.data;
  if (data && typeof data === "object") {
    const payload = data as { message?: string; errors?: unknown };
    if (payload.message) return payload.message;
  }
  return fallback;
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} trên 5 sao`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

export default function WorkerReviewsPanel({ worker }: WorkerReviewsPanelProps) {
  const [rating, setRating] = useState<number | "ALL">("ALL");
  const [visibility, setVisibility] =
    useState<VisibilityFilter>("ALL");
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetWorkerReviewsQuery({
      worker_id: worker.user_id,
      rating: rating === "ALL" ? undefined : rating,
      is_visible:
        visibility === "ALL" ? undefined : visibility === "VISIBLE",
    });
  const [updateReviewVisibility, { isLoading: isUpdatingVisibility }] =
    useSetReviewVisibilityMutation();
  const [replyToReview, { isLoading: isReplying }] =
    useReplyToReviewMutation();
  const reviews = data?.data ?? [];

  const handleVisibility = async (review: Review) => {
    const nextVisible = !review.is_visible;
    if (
      !nextVisible &&
      !window.confirm("Ẩn đánh giá này khỏi các khu vực hiển thị công khai?")
    ) {
      return;
    }

    setFeedback(null);
    try {
      const result = await updateReviewVisibility({
        id: review.id,
        is_visible: nextVisible,
      }).unwrap();
      setFeedback({
        type: "success",
        message:
          result.message ||
          (nextVisible ? "Đã hiển thị đánh giá." : "Đã ẩn đánh giá."),
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error, "Không thể đổi trạng thái đánh giá."),
      });
    }
  };

  const openReply = (review: Review) => {
    setReplyingId(review.id);
    setReplyText(review.admin_reply ?? "");
    setFeedback(null);
  };

  const handleReply = async (reviewId: number) => {
    const reply = replyText.trim();
    if (!reply) {
      setFeedback({
        type: "error",
        message: "Vui lòng nhập nội dung phản hồi.",
      });
      return;
    }

    setFeedback(null);
    try {
      const result = await replyToReview({ id: reviewId, reply }).unwrap();
      setFeedback({
        type: "success",
        message: result.message || "Phản hồi đánh giá thành công.",
      });
      setReplyingId(null);
      setReplyText("");
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error, "Không thể gửi phản hồi."),
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
              <div className="flex items-center gap-1 font-semibold text-amber-700">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {Number(worker.average_rating).toFixed(1)}
              </div>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-amber-600">
                Điểm trung bình
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Đánh giá theo từng buổi làm
              </p>
              <p className="text-xs text-slate-500">
                {isFetching ? "Đang cập nhật..." : `${reviews.length} kết quả`}
              </p>
            </div>
          </div>

          <select
            value={rating}
            onChange={(event) =>
              setRating(
                event.target.value === "ALL"
                  ? "ALL"
                  : Number(event.target.value),
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            aria-label="Lọc theo số sao"
          >
            <option value="ALL">Tất cả số sao</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} sao
              </option>
            ))}
          </select>

          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as VisibilityFilter)
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            aria-label="Lọc trạng thái hiển thị"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="VISIBLE">Đang hiển thị</option>
            <option value="HIDDEN">Đã ẩn</option>
          </select>
        </div>

        {feedback && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      <div className="sidebar-scrollbar flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-white px-5 py-12 text-center">
            <p className="text-sm font-medium text-red-600">
              Không tải được đánh giá của nhân viên.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <RotateCw className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <Star className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Chưa có đánh giá phù hợp
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Đánh giá xuất hiện sau khi khách hàng hoàn tất một buổi làm.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">
                      {getPersonName(review.customer)}
                    </p>
                    <RatingStars rating={review.rating} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        review.is_visible
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {review.is_visible ? "Đang hiển thị" : "Đã ẩn"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {review.booking_code} · Buổi {review.schedule.sequence_no} ·{" "}
                    {formatDateTime(
                      review.schedule.actual_end ?? review.schedule.scheduled_end,
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatDateTime(review.created_at)}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {review.comment || "Khách hàng không để lại nội dung."}
              </p>

              {review.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.images.map((image) => (
                    <a
                      key={image.id}
                      href={image.image}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Mở ảnh đánh giá"
                      title={image.caption ?? "Ảnh đánh giá"}
                      className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 bg-cover bg-center text-slate-400"
                      style={{ backgroundImage: `url(${image.image})` }}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              )}

              {review.admin_reply && replyingId !== review.id && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                    Phản hồi của quản trị viên
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {review.admin_reply}
                  </p>
                  {review.replied_at && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDateTime(review.replied_at)}
                    </p>
                  )}
                </div>
              )}

              {replyingId === review.id && (
                <div className="mt-3">
                  <textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    maxLength={3000}
                    rows={3}
                    placeholder="Nhập phản hồi gửi tới khách hàng..."
                    className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingId(null)}
                      disabled={isReplying}
                      className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReply(review.id)}
                      disabled={isReplying || !replyText.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isReplying && (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Gửi phản hồi
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => openReply(review)}
                  disabled={isReplying}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  <MessageSquareReply className="h-3.5 w-3.5" />
                  {review.admin_reply ? "Sửa phản hồi" : "Phản hồi"}
                </button>
                <button
                  type="button"
                  onClick={() => handleVisibility(review)}
                  disabled={isUpdatingVisibility}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 ${
                    review.is_visible
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {review.is_visible ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {review.is_visible ? "Ẩn đánh giá" : "Hiện đánh giá"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

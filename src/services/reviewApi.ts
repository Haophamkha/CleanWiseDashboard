import { baseApi } from "@/store/baseApi";
import type { Review, ReviewListParams } from "@/types/Review";
import type { ApiMessageResponse } from "@/types/Response";

type ReviewListResponse = ApiMessageResponse<Review[]>;
type ReviewDetailResponse = ApiMessageResponse<Review>;

const getNestedData = (response: unknown): unknown => {
  if (!response || typeof response !== "object") return response;
  const first = (response as { data?: unknown }).data;
  if (!first || typeof first !== "object") return first;
  return "data" in first ? (first as { data?: unknown }).data : first;
};

const getMessage = (response: unknown): string => {
  if (!response || typeof response !== "object") return "";
  const outer = response as { message?: string; data?: unknown };
  if (outer.message) return outer.message;
  if (outer.data && typeof outer.data === "object") {
    return (outer.data as { message?: string }).message ?? "";
  }
  return "";
};

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkerReviews: builder.query<ReviewListResponse, ReviewListParams>({
      query: (params) => ({
        url: "/api/admin/reviews/",
        method: "GET",
        params,
      }),
      transformResponse: (response: unknown) => ({
        message: getMessage(response),
        data: Array.isArray(getNestedData(response))
          ? (getNestedData(response) as Review[])
          : [],
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({
                type: "Reviews" as const,
                id,
              })),
              { type: "Reviews" as const, id: "LIST" },
            ]
          : [{ type: "Reviews" as const, id: "LIST" }],
    }),

    setReviewVisibility: builder.mutation<
      ReviewDetailResponse,
      { id: number; is_visible: boolean }
    >({
      query: ({ id, is_visible }) => ({
        url: `/api/admin/reviews/${id}/visibility/`,
        method: "PATCH",
        data: { is_visible },
      }),
      transformResponse: (response: unknown) => ({
        message: getMessage(response),
        data: getNestedData(response) as Review,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Reviews", id },
        { type: "Reviews", id: "LIST" },
        "Workers",
      ],
    }),

    replyToReview: builder.mutation<
      ReviewDetailResponse,
      { id: number; reply: string }
    >({
      query: ({ id, reply }) => ({
        url: `/api/admin/reviews/${id}/reply/`,
        method: "POST",
        data: { reply },
      }),
      transformResponse: (response: unknown) => ({
        message: getMessage(response),
        data: getNestedData(response) as Review,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Reviews", id },
        { type: "Reviews", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWorkerReviewsQuery,
  useSetReviewVisibilityMutation,
  useReplyToReviewMutation,
} = reviewApi;


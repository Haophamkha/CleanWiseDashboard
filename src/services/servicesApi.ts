import { baseApi } from "@/store/baseApi";
import type {
  ServiceListParams,
  ServiceMutationPayload,
  ServiceQuickToggleRequest,
} from "@/types/Request";
import type {
  ServiceDetailResponse,
  ServiceListResponse,
} from "@/types/Response";

const unwrapListResponse = (response: any): ServiceListResponse => {
  const candidate = response?.data?.data ?? response?.data ?? response;

  return {
    message: response?.message ?? response?.data?.message ?? "",
    data: Array.isArray(candidate) ? candidate : [],
  };
};

const unwrapDetailResponse = (response: any): ServiceDetailResponse => {
  const candidate = response?.data?.data ?? response?.data ?? response;

  return {
    message: response?.message ?? response?.data?.message ?? "",
    data: candidate,
  };
};

const buildServiceFormData = (
  payload: ServiceMutationPayload
): FormData => {
  const formData = new FormData();

  if (payload.code !== undefined) {
    formData.append("code", payload.code);
  }

  if (payload.section_code !== undefined) {
    formData.append("section_code", payload.section_code);
  }

  if (payload.name !== undefined) {
    formData.append("name", payload.name);
  }

  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }

  if (payload.form_schema !== undefined) {
    formData.append(
      "form_schema",
      JSON.stringify(payload.form_schema)
    );
  }

  if (payload.pricing_config !== undefined) {
    formData.append(
      "pricing_config",
      JSON.stringify(payload.pricing_config)
    );
  }

  if (payload.is_active !== undefined) {
    formData.append(
      "is_active",
      String(payload.is_active)
    );
  }

  payload.images?.forEach((file) => {
    formData.append("images", file);
  });

  payload.delete_image_ids?.forEach((id) => {
    formData.append("delete_image_ids", String(id));
  });

  return formData;
};

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<
      ServiceListResponse,
      ServiceListParams | void
    >({
      query: (params) => ({
        url: "/api/admin/services/",
        method: "GET",
        params: params ?? undefined,
      }),

      transformResponse: unwrapListResponse,

      providesTags: (result) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ id }) => ({
                type: "Services" as const,
                id,
              })),
              {
                type: "Services" as const,
                id: "LIST",
              },
            ]
          : [
              {
                type: "Services" as const,
                id: "LIST",
              },
            ],
    }),

    getServiceDetail: builder.query<
      ServiceDetailResponse,
      number
    >({
      query: (id) => ({
        url: `/api/admin/services/${id}/`,
        method: "GET",
      }),

      transformResponse: unwrapDetailResponse,

      providesTags: (_result, _error, id) => [
        {
          type: "Services",
          id,
        },
      ],
    }),

    createService: builder.mutation<
      ServiceDetailResponse,
      ServiceMutationPayload
    >({
      query: (payload) => ({
        url: "/api/admin/services/",
        method: "POST",
        data: buildServiceFormData(payload),
      }),

      transformResponse: unwrapDetailResponse,

      invalidatesTags: [
        {
          type: "Services",
          id: "LIST",
        },
      ],
    }),

    updateService: builder.mutation<
      ServiceDetailResponse,
      {
        id: number;
        payload: ServiceMutationPayload;
      }
    >({
      query: ({ id, payload }) => ({
        url: `/api/admin/services/${id}/`,
        method: "PATCH",
        data: buildServiceFormData(payload),
      }),

      transformResponse: unwrapDetailResponse,

      invalidatesTags: (_result, _error, { id }) => [
        {
          type: "Services",
          id,
        },
        {
          type: "Services",
          id: "LIST",
        },
      ],
    }),

    toggleServiceActive: builder.mutation<
      ServiceDetailResponse,
      ServiceQuickToggleRequest
    >({
      query: ({ id, is_active }) => ({
        url: `/api/admin/services/${id}/`,
        method: "PATCH",
        data: {
          is_active,
        },
      }),

      transformResponse: unwrapDetailResponse,

      onQueryStarted: async (
        { id, is_active },
        { dispatch, queryFulfilled }
      ) => {
        const patch = dispatch(
          servicesApi.util.updateQueryData(
            "getServices",
            undefined,
            (draft) => {
              const item = draft.data.find(
                (service) => service.id === id
              );

              if (item) {
                item.is_active = is_active;
              }
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },

      invalidatesTags: (_result, _error, { id }) => [
        {
          type: "Services",
          id,
        },
      ],
    }),
  }),

  overrideExisting: true,
});

export const {
  useGetServicesQuery,
  useGetServiceDetailQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useToggleServiceActiveMutation,
} = servicesApi;

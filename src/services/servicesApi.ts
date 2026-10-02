import type { RootState } from "@/store/store";
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

type Envelope = { data?: unknown; message?: string };
const unwrapListResponse = (response: unknown): ServiceListResponse => {
  const root = response as Envelope;
  const nested = root?.data as Envelope | undefined;
  const candidate = nested?.data ?? root?.data ?? response;

  return {
    message: root?.message ?? nested?.message ?? "",
    data: Array.isArray(candidate) ? candidate : [],
  };
};

const unwrapDetailResponse = (response: unknown): ServiceDetailResponse => {
  const root = response as Envelope;
  const nested = root?.data as Envelope | undefined;
  const candidate = nested?.data ?? root?.data ?? response;

  return {
    message: root?.message ?? nested?.message ?? "",
    data: candidate as ServiceDetailResponse["data"],
  };
};

const buildServiceFormData = (payload: ServiceMutationPayload): FormData => {
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
    formData.append("form_schema", JSON.stringify(payload.form_schema));
  }

  if (payload.pricing_config !== undefined) {
    formData.append("pricing_config", JSON.stringify(payload.pricing_config));
  }

  if (payload.is_active !== undefined) {
    formData.append("is_active", String(payload.is_active));
  }

  payload.images?.forEach((file) => {
    formData.append("images", file);
  });

  if (payload.icon_file) formData.append("icon_file", payload.icon_file);
  if (payload.remove_icon !== undefined)
    formData.append("remove_icon", String(payload.remove_icon));

  payload.delete_image_ids?.forEach((id) => {
    formData.append("delete_image_ids", String(id));
  });

  return formData;
};

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadServiceOptionImage: builder.mutation<{ url: string }, File>({
      query: (file) => {
        const data = new FormData();
        data.append("image", file);
        return {
          url: "/api/admin/services/option-images/",
          method: "POST",
          data,
        };
      },
      transformResponse: (response: unknown) => {
        const root = response as Envelope;
        const nested = root?.data as Envelope | undefined;
        return (nested?.data ?? root?.data ?? response) as { url: string };
      },
    }),
    getServices: builder.query<ServiceListResponse, ServiceListParams | void>({
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

    getServiceDetail: builder.query<ServiceDetailResponse, number>({
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
        { type: "Services", id: "LIST" },
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
      async queryFn(
        { id, is_active },
        api,
        _extraOptions,
        baseQuery,
      ): Promise<{ data: ServiceDetailResponse } | { error: unknown }> {
        const result = await baseQuery({
          url: `/api/admin/services/${id}/`,
          method: "PATCH",
          data: { is_active },
        });
        if (result.error) return { error: result.error };
        const response = unwrapDetailResponse(result.data);
        const service = response.data;

        // Commit the server-confirmed state before resolving unwrap() and showing success.
        const args = servicesApi.util.selectCachedArgsForQuery(
          api.getState() as RootState,
          "getServices",
        );
        for (const params of args) {
          api.dispatch(
            servicesApi.util.updateQueryData("getServices", params, (draft) => {
              const index = draft.data.findIndex((item) => item.id === id);
              const matches =
                (!params?.section_code ||
                  service.section_code ===
                    params.section_code.trim().toUpperCase()) &&
                (params?.is_active === undefined ||
                  service.is_active === params.is_active) &&
                (!params?.search ||
                  service.name
                    .toLocaleLowerCase("vi")
                    .includes(params.search.toLocaleLowerCase("vi")));
              if (!matches) {
                if (index >= 0) draft.data.splice(index, 1);
              } else if (index >= 0) {
                draft.data[index].is_active = service.is_active;
              } else {
                draft.data.push({
                  id: service.id,
                  code: service.code,
                  section_code: service.section_code,
                  name: service.name,
                  description: service.description,
                  icon: service.icon,
                  is_active: service.is_active,
                  primary_image: service.images[0]?.image ?? null,
                });
                draft.data.sort(
                  (a, b) =>
                    a.section_code.localeCompare(b.section_code) ||
                    a.name.localeCompare(b.name, "vi"),
                );
              }
            }),
          );
        }
        api.dispatch(
          servicesApi.util.updateQueryData("getServiceDetail", id, (draft) => {
            draft.data.is_active = service.is_active;
          }),
        );
        return { data: response };
      },
    }),
  }),

  overrideExisting: true,
});

export const {
  useUploadServiceOptionImageMutation,
  useGetServicesQuery,
  useGetServiceDetailQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useToggleServiceActiveMutation,
} = servicesApi;

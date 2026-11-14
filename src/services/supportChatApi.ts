import { baseApi } from "@/store/baseApi";

export type SupportMessage = {
  id: number;
  sender_id: number | null;
  message: string;
  created_at: string;
  is_read: boolean;
  moderation?: { message?: string } | null;
};

type SupportThread = { id: number; can_send: boolean };
type MessagePage = { results: SupportMessage[]; next_cursor: number | null };

function unwrapChat<T>(response: unknown): T {
  const outer = response as { data?: { data?: T } | T };
  const data = outer.data;
  return (data && typeof data === "object" && "data" in data ? data.data : data ?? response) as T;
}

export const supportChatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    openSupportChat: builder.mutation<SupportThread, number>({
      query: (userId) => ({ url: `/api/chat/support/${userId}/`, method: "POST" }),
      transformResponse: unwrapChat<SupportThread>,
    }),
    supportMessages: builder.query<MessagePage, { id: number; cursor?: number | null }>({
      query: ({ id, cursor }) => ({
        url: "/api/chat/messages/list/", method: "POST",
        data: { conversation_id: id, cursor },
      }),
      transformResponse: unwrapChat<MessagePage>,
    }),
    sendSupportMessage: builder.mutation<SupportMessage, { id: number; message: string; key: string }>({
      query: ({ id, message, key }) => ({
        url: "/api/chat/messages/send/", method: "POST",
        data: { conversation_id: id, message, client_message_id: key },
      }),
      transformResponse: unwrapChat<SupportMessage>,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(supportChatApi.endpoints.supportMessages.initiate({ id }, { forceRefetch: true, subscribe: false }));
        } catch {
          // The composer displays the server error and retains the draft.
        }
      },
    }),
    readSupportMessages: builder.mutation<unknown, number>({
      query: (id) => ({ url: "/api/chat/messages/read/", method: "POST", data: { conversation_id: id } }),
    }),
  }),
});

export const {
  useOpenSupportChatMutation, useSupportMessagesQuery, useLazySupportMessagesQuery, useSendSupportMessageMutation, useReadSupportMessagesMutation,
} = supportChatApi;

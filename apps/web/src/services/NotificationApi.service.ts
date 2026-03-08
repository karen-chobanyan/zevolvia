import api from "@/lib/axios";
import {
  NotificationItem,
  NotificationStreamEvent,
  UnreadCountResponse,
} from "@/types/notification";

type AuthContext = { sub: string; orgId: string };

export const NotificationApi = {
  list: async (): Promise<NotificationItem[]> => {
    const response = await api.get("/notifications");
    return response.data;
  },

  unreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>("/notifications/unread-count");
    return response.data.unreadCount;
  },

  authContext: async (): Promise<AuthContext> => {
    const response = await api.get<AuthContext>("/auth/me");
    return response.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  streamUrl: (): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    return `${baseUrl.replace(/\/$/, "")}/notifications/stream`;
  },

  toNotificationItem: (
    event: NotificationStreamEvent,
    orgId: string,
    userId: string,
  ): NotificationItem => ({
    ...event,
    orgId,
    userId,
  }),
};

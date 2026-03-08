export interface NotificationItem {
  id: string;
  orgId: string;
  userId: string;
  bookingId: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface NotificationStreamEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

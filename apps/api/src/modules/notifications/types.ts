import { NotificationChannel } from "../../common/enums";

export interface BookingCreatedNotificationPayload {
  event: typeof import("./constants").BOOKING_CREATED_EVENT;
  bookingId: string;
  orgId: string;
  channel: NotificationChannel.WebPush;
  clientName: string;
  staffName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  timeZone: string | null;
}

export interface NotificationJobData {
  notificationId: string;
  orgId: string;
  event: string;
}

export interface NotificationDeadLetterJobData {
  notificationId: string;
  orgId: string;
  event: string;
  attempt: number;
  error: string;
}

export interface RenderedPushNotification {
  title: string;
  body: string;
  data: Record<string, unknown>;
  tag: string;
}

export interface WebPushPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface WebPushClient {
  sendNotification(subscription: WebPushPayload, payload: string): Promise<unknown>;
}

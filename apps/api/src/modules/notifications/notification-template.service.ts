import { Injectable } from "@nestjs/common";
import { BookingCreatedNotificationPayload, RenderedPushNotification } from "./types";

@Injectable()
export class NotificationTemplateService {
  renderBookingCreatedPush(payload: BookingCreatedNotificationPayload): RenderedPushNotification {
    const startTime = new Date(payload.startTime);
    const formatter = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: payload.timeZone || "UTC",
    });
    const formattedStart = formatter.format(startTime);

    return {
      title: `New booking: ${payload.serviceName}`,
      body: `${payload.clientName} with ${payload.staffName} on ${formattedStart}`,
      tag: `booking-${payload.bookingId}`,
      data: {
        bookingId: payload.bookingId,
        event: payload.event,
        orgId: payload.orgId,
      },
    };
  }
}

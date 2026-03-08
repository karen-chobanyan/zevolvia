import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NOTIFICATIONS_DLQ_NAME, NOTIFICATIONS_QUEUE_NAME, WEB_PUSH_CLIENT } from "./constants";
import { Notification } from "./entities/notification.entity";
import { PushSubscription } from "./entities/push-subscription.entity";
import { NotificationsDeadLetterProcessor } from "./notifications-dead-letter.processor";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationTemplateService } from "./notification-template.service";
import { NotificationsService } from "./notifications.service";
import { PushDeliveryService } from "./push-delivery.service";
import { WebPushClient, WebPushPayload } from "./types";

type RuntimeWebPushModule = {
  setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  sendNotification(subscription: WebPushPayload, payload: string): Promise<unknown>;
};

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue(
      {
        name: NOTIFICATIONS_QUEUE_NAME,
      },
      {
        name: NOTIFICATIONS_DLQ_NAME,
      },
    ),
    TypeOrmModule.forFeature([Notification, PushSubscription]),
  ],
  providers: [
    NotificationTemplateService,
    NotificationsService,
    NotificationsProcessor,
    NotificationsDeadLetterProcessor,
    PushDeliveryService,
    {
      provide: WEB_PUSH_CLIENT,
      useFactory: (configService: ConfigService): WebPushClient => {
        if (
          (configService.get<string>("PUSH_NOTIFICATIONS_ENABLED") || "").toLowerCase() !== "true"
        ) {
          return {
            sendNotification: async () => undefined,
          };
        }

        const subject = configService.get<string>("PUSH_VAPID_SUBJECT")?.trim();
        const publicKey = configService.get<string>("PUSH_VAPID_PUBLIC_KEY")?.trim();
        const privateKey = configService.get<string>("PUSH_VAPID_PRIVATE_KEY")?.trim();

        if (!subject || !publicKey || !privateKey) {
          throw new Error(
            "Push notifications require PUSH_VAPID_SUBJECT, PUSH_VAPID_PUBLIC_KEY, and PUSH_VAPID_PRIVATE_KEY",
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const webPush = require("web-push") as RuntimeWebPushModule;
        webPush.setVapidDetails(subject, publicKey, privateKey);

        return {
          sendNotification: (subscription, payload) =>
            webPush.sendNotification(subscription, payload),
        };
      },
      inject: [ConfigService],
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

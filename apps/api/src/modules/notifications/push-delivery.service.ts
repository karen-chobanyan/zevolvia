import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { Repository } from "typeorm";
import { PushSubscription } from "./entities/push-subscription.entity";
import { WEB_PUSH_CLIENT } from "./constants";
import { RenderedPushNotification, WebPushClient, WebPushPayload } from "./types";

@Injectable()
export class PushDeliveryService {
  constructor(
    @InjectPinoLogger(PushDeliveryService.name)
    private readonly logger: PinoLogger,
    @Inject(WEB_PUSH_CLIENT)
    private readonly webPushClient: WebPushClient,
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {}

  isEnabled(): boolean {
    const value = this.configService.get<string>("PUSH_NOTIFICATIONS_ENABLED");
    return value?.trim().toLowerCase() === "true";
  }

  getMaxRetries(): number {
    const value = this.configService.get<string>("PUSH_NOTIFICATION_MAX_RETRIES");
    const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
    return 3;
  }

  async sendRenderedNotification(
    orgId: string,
    rendered: RenderedPushNotification,
    subscriptions: PushSubscription[],
  ): Promise<number> {
    let delivered = 0;

    for (const subscription of subscriptions) {
      try {
        await this.webPushClient.sendNotification(
          this.toWebPushPayload(subscription),
          JSON.stringify(rendered),
        );
        delivered += 1;
      } catch (error) {
        const statusCode = this.extractStatusCode(error);

        if (statusCode === 404 || statusCode === 410) {
          await this.pushSubscriptionRepository.delete({
            id: subscription.id,
            orgId,
          });
          this.logger.warn(
            { orgId, subscriptionId: subscription.id, endpoint: subscription.endpoint, statusCode },
            "Removed stale push subscription",
          );
          continue;
        }

        throw error;
      }
    }

    return delivered;
  }

  private toWebPushPayload(subscription: PushSubscription): WebPushPayload {
    return {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime
        ? Number.parseInt(subscription.expirationTime, 10)
        : null,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };
  }

  private extractStatusCode(error: unknown): number | null {
    if (!error || typeof error !== "object") {
      return null;
    }

    const maybeStatusCode = (error as { statusCode?: unknown }).statusCode;
    return typeof maybeStatusCode === "number" ? maybeStatusCode : null;
  }
}

import { Injectable, MessageEvent, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Observable, Subject } from "rxjs";
import { Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";

type NotificationStreamPayload = {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId: string | null;
  data: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class NotificationService {
  private readonly streams = new Map<string, Set<Subject<MessageEvent>>>();

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async listForUser(userId: string, orgId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId, orgId },
      order: { createdAt: "DESC" },
    });
  }

  async unreadCountForUser(userId: string, orgId: string): Promise<number> {
    return this.notificationRepository
      .createQueryBuilder("notification")
      .where("notification.user_id = :userId", { userId })
      .andWhere("notification.org_id = :orgId", { orgId })
      .andWhere("notification.read_at IS NULL")
      .getCount();
  }

  async markAsRead(id: string, userId: string, orgId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId, orgId },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: string, orgId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: () => "CURRENT_TIMESTAMP" })
      .where("user_id = :userId", { userId })
      .andWhere("org_id = :orgId", { orgId })
      .andWhere("read_at IS NULL")
      .execute();

    return { updated: result.affected ?? 0 };
  }

  streamForUser(userId: string, orgId: string): Observable<MessageEvent> {
    const key = this.buildStreamKey(userId, orgId);
    const subject = new Subject<MessageEvent>();
    const set = this.streams.get(key) ?? new Set<Subject<MessageEvent>>();

    set.add(subject);
    this.streams.set(key, set);

    subject.next({ type: "connected", data: { connected: true } });

    return new Observable<MessageEvent>((subscriber) => {
      const subscription = subject.subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        const current = this.streams.get(key);
        if (!current) {
          return;
        }

        current.delete(subject);
        if (current.size === 0) {
          this.streams.delete(key);
        }

        subject.complete();
      };
    });
  }

  broadcastNewNotifications(notifications: Notification[]): void {
    for (const notification of notifications) {
      const key = this.buildStreamKey(notification.userId, notification.orgId);
      const subscribers = this.streams.get(key);
      if (!subscribers?.size) {
        continue;
      }

      const payload = this.toStreamPayload(notification);

      for (const subscriber of subscribers) {
        subscriber.next({ type: "notification", data: payload });
      }
    }
  }

  private buildStreamKey(userId: string, orgId: string): string {
    return `${orgId}:${userId}`;
  }

  private toStreamPayload(notification: Notification): NotificationStreamPayload {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      bookingId: notification.bookingId,
      data: notification.data,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}

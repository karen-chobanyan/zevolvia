import assert from "node:assert/strict";
import { NotificationStatus } from "../../common/enums";
import { Booking } from "../booking/entities/booking.entity";
import { Notification } from "./entities/notification.entity";
import { PushSubscription } from "./entities/push-subscription.entity";
import { NotificationTemplateService } from "./notification-template.service";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationsService } from "./notifications.service";
import { PushDeliveryService } from "./push-delivery.service";
import {
  NotificationDeadLetterJobData,
  NotificationJobData,
  RenderedPushNotification,
  WebPushPayload,
} from "./types";

type Primitive = string | number | boolean | null | undefined;
type FilterValue = Primitive | Record<string, unknown>;
type Filter<T> = Partial<Record<keyof T, FilterValue>>;

class InMemoryRepository<T extends { id: string }> {
  private readonly records = new Map<string, T>();
  private nextId = 1;

  constructor(
    private readonly prefix: string,
    seed: T[] = [],
  ) {
    for (const item of seed) {
      this.records.set(item.id, item);
    }
  }

  create(input: Partial<T>): T {
    return input as T;
  }

  async save(entity: T): Promise<T> {
    const id = entity.id || `${this.prefix}-${this.nextId++}`;
    const nextRecord = {
      ...entity,
      id,
      createdAt: (entity as { createdAt?: Date }).createdAt || new Date(),
      updatedAt: new Date(),
    } as T;
    this.records.set(id, nextRecord);
    return nextRecord;
  }

  async findOne(options: { where: Filter<T> }): Promise<T | null> {
    const record = this.values().find((candidate) => this.matches(candidate, options.where));
    return record || null;
  }

  async find(options?: { where?: Filter<T>; order?: Record<string, "ASC" | "DESC"> }): Promise<T[]> {
    const records = this.values().filter((candidate) =>
      options?.where ? this.matches(candidate, options.where) : true,
    );

    if (!options?.order) {
      return records;
    }

    const [[field, direction]] = Object.entries(options.order);
    return records.sort((left, right) => {
      const leftValue = left[field as keyof T] as Primitive;
      const rightValue = right[field as keyof T] as Primitive;
      if (leftValue === rightValue) {
        return 0;
      }
      if (leftValue === undefined || leftValue === null) {
        return direction === "ASC" ? -1 : 1;
      }
      if (rightValue === undefined || rightValue === null) {
        return direction === "ASC" ? 1 : -1;
      }
      return leftValue < rightValue
        ? direction === "ASC"
          ? -1
          : 1
        : direction === "ASC"
          ? 1
          : -1;
    });
  }

  async update(criteria: Filter<T>, partial: Partial<T>): Promise<void> {
    for (const record of this.values()) {
      if (!this.matches(record, criteria)) {
        continue;
      }

      this.records.set(record.id, {
        ...record,
        ...partial,
      });
    }
  }

  async delete(criteria: Filter<T>): Promise<void> {
    for (const record of this.values()) {
      if (this.matches(record, criteria)) {
        this.records.delete(record.id);
      }
    }
  }

  values(): T[] {
    return Array.from(this.records.values());
  }

  private matches(candidate: T, filter: Filter<T>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      const candidateValue = candidate[key as keyof T];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return this.matchesObject(candidateValue as Record<string, unknown>, value);
      }
      return candidateValue === value;
    });
  }

  private matchesObject(
    candidate: Record<string, unknown> | undefined,
    filter: Record<string, unknown>,
  ): boolean {
    if (!candidate) {
      return false;
    }

    return Object.entries(filter).every(([key, value]) => candidate[key] === value);
  }
}

class InMemoryQueue<T> {
  readonly jobs: Array<{ name: string; data: T; options?: Record<string, unknown> }> = [];

  async add(name: string, data: T, options?: Record<string, unknown>) {
    this.jobs.push({ name, data, options });
    return { id: `${name}-${this.jobs.length}` };
  }
}

class FakeConfigService {
  constructor(private readonly values: Record<string, string | undefined>) {}

  get<T>(key: string): T | undefined {
    return this.values[key] as T | undefined;
  }
}

class FakeWebPushClient {
  readonly sent: Array<{ subscription: WebPushPayload; payload: RenderedPushNotification }> = [];

  constructor(private readonly sendImpl?: () => Promise<void>) {}

  async sendNotification(subscription: WebPushPayload, payload: string): Promise<void> {
    if (this.sendImpl) {
      await this.sendImpl();
    }

    this.sent.push({
      subscription,
      payload: JSON.parse(payload) as RenderedPushNotification,
    });
  }
}

const logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
};

function buildBooking(): Booking {
  return {
    id: "booking-1",
    orgId: "org-1",
    clientId: "client-1",
    clientName: "Ava Client",
    staffId: "user-1",
    serviceId: "service-1",
    startTime: new Date("2026-03-07T09:00:00.000Z"),
    endTime: new Date("2026-03-07T09:30:00.000Z"),
    status: "scheduled",
    notes: null,
    createdAt: new Date("2026-03-07T08:00:00.000Z"),
    updatedAt: new Date("2026-03-07T08:00:00.000Z"),
    client: {
      id: "client-1",
      name: "Ava Client",
    },
    staff: {
      id: "user-1",
      name: "Nia Stylist",
    },
    service: {
      id: "service-1",
      name: "Signature Blowout",
    },
  } as Booking;
}

function buildPushSubscription(overrides: Partial<PushSubscription> = {}): PushSubscription {
  return {
    id: overrides.id || "subscription-1",
    orgId: overrides.orgId || "org-1",
    userId: overrides.userId || "user-1",
    endpoint: overrides.endpoint || "https://push.example.test/subscription-1",
    p256dh: overrides.p256dh || "p256dh-key",
    auth: overrides.auth || "auth-key",
    expirationTime: overrides.expirationTime || null,
    userAgent: overrides.userAgent || "Chrome/Test",
    createdAt: overrides.createdAt || new Date("2026-03-07T08:01:00.000Z"),
    updatedAt: overrides.updatedAt || new Date("2026-03-07T08:01:00.000Z"),
  } as PushSubscription;
}

function buildNotificationServices(args: {
  config: Record<string, string | undefined>;
  webPushClient?: FakeWebPushClient;
  pushSubscriptions?: PushSubscription[];
}) {
  const notificationRepository = new InMemoryRepository<Notification>("notification");
  const pushSubscriptionRepository = new InMemoryRepository<PushSubscription>(
    "subscription",
    args.pushSubscriptions || [],
  );
  const notificationsQueue = new InMemoryQueue<NotificationJobData>();
  const deadLetterQueue = new InMemoryQueue<NotificationDeadLetterJobData>();
  const configService = new FakeConfigService(args.config);
  const webPushClient = args.webPushClient || new FakeWebPushClient();

  const notificationsService = new NotificationsService(
    logger as never,
    notificationsQueue as never,
    notificationRepository as never,
    configService as never,
  );
  const pushDeliveryService = new PushDeliveryService(
    logger as never,
    webPushClient as never,
    pushSubscriptionRepository as never,
    configService as never,
  );
  const notificationsProcessor = new NotificationsProcessor(
    logger as never,
    deadLetterQueue as never,
    notificationRepository as never,
    pushSubscriptionRepository as never,
    new NotificationTemplateService(),
    pushDeliveryService,
  );

  return {
    deadLetterQueue,
    notificationRepository,
    notificationsProcessor,
    notificationsQueue,
    notificationsService,
    pushDeliveryService,
    pushSubscriptionRepository,
    webPushClient,
  };
}

async function runSuccessfulDeliveryScenario(): Promise<void> {
  const {
    notificationRepository,
    notificationsProcessor,
    notificationsQueue,
    notificationsService,
    webPushClient,
  } = buildNotificationServices({
    config: {
      PUSH_NOTIFICATIONS_ENABLED: "true",
      PUSH_NOTIFICATION_MAX_RETRIES: "3",
    },
    pushSubscriptions: [buildPushSubscription()],
  });

  const booking = buildBooking();
  const notification = await notificationsService.queueBookingCreated(booking, "Europe/Brussels");
  assert.equal(notificationsQueue.jobs.length, 1);
  assert.equal(notification.status, NotificationStatus.Pending);

  await notificationsProcessor.process({
    id: "job-1",
    attemptsMade: 0,
    data: notificationsQueue.jobs[0].data,
  } as never);

  const savedNotification = await notificationRepository.findOne({
    where: { id: notification.id, orgId: booking.orgId },
  });
  assert(savedNotification);
  assert.equal(savedNotification.status, NotificationStatus.Delivered);
  assert.equal(savedNotification.attempts, 1);
  assert.equal(savedNotification.error, null);
  assert.equal(webPushClient.sent.length, 1);
  assert.equal(webPushClient.sent[0].payload.title, "New booking: Signature Blowout");
  assert.match(webPushClient.sent[0].payload.body, /Ava Client with Nia Stylist/);
}

async function runDeadLetterScenario(): Promise<void> {
  const failingClient = new FakeWebPushClient(async () => {
    throw new Error("Transient push failure");
  });
  const {
    deadLetterQueue,
    notificationRepository,
    notificationsProcessor,
    notificationsQueue,
    notificationsService,
  } = buildNotificationServices({
    config: {
      PUSH_NOTIFICATIONS_ENABLED: "true",
      PUSH_NOTIFICATION_MAX_RETRIES: "3",
    },
    pushSubscriptions: [buildPushSubscription()],
    webPushClient: failingClient,
  });

  const booking = buildBooking();
  const notification = await notificationsService.queueBookingCreated(booking, "Europe/Brussels");
  const jobData = notificationsQueue.jobs[0].data;

  for (const attempt of [0, 1]) {
    await assert.rejects(
      notificationsProcessor.process({
        id: `job-${attempt + 1}`,
        attemptsMade: attempt,
        data: jobData,
      } as never),
      /Transient push failure/,
    );

    const interimNotification = await notificationRepository.findOne({
      where: { id: notification.id, orgId: booking.orgId },
    });
    assert(interimNotification);
    assert.equal(interimNotification.status, NotificationStatus.Failed);
    assert.equal(interimNotification.attempts, attempt + 1);
    assert.equal(deadLetterQueue.jobs.length, 0);
  }

  await assert.rejects(
    notificationsProcessor.process({
      id: "job-3",
      attemptsMade: 2,
      data: jobData,
    } as never),
    /Transient push failure/,
  );

  const terminalNotification = await notificationRepository.findOne({
    where: { id: notification.id, orgId: booking.orgId },
  });
  assert(terminalNotification);
  assert.equal(terminalNotification.status, NotificationStatus.DeadLettered);
  assert.equal(terminalNotification.attempts, 3);
  assert.equal(deadLetterQueue.jobs.length, 1);
  assert.equal(deadLetterQueue.jobs[0].data.notificationId, notification.id);
}

async function runDisabledFeatureScenario(): Promise<void> {
  const {
    notificationRepository,
    notificationsProcessor,
    notificationsQueue,
    notificationsService,
    webPushClient,
  } = buildNotificationServices({
    config: {
      PUSH_NOTIFICATIONS_ENABLED: "false",
      PUSH_NOTIFICATION_MAX_RETRIES: "3",
    },
    pushSubscriptions: [buildPushSubscription()],
  });

  const booking = buildBooking();
  const notification = await notificationsService.queueBookingCreated(booking, "Europe/Brussels");

  await notificationsProcessor.process({
    id: "job-disabled",
    attemptsMade: 0,
    data: notificationsQueue.jobs[0].data,
  } as never);

  const savedNotification = await notificationRepository.findOne({
    where: { id: notification.id, orgId: booking.orgId },
  });
  assert(savedNotification);
  assert.equal(savedNotification.status, NotificationStatus.Skipped);
  assert.equal(savedNotification.error, "Push notifications disabled");
  assert.equal(webPushClient.sent.length, 0);
}

async function main(): Promise<void> {
  await runSuccessfulDeliveryScenario();
  process.stdout.write("ok - successful notification delivery\n");

  await runDeadLetterScenario();
  process.stdout.write("ok - dead-letter after max retries\n");

  await runDisabledFeatureScenario();
  process.stdout.write("ok - disabled feature flag skips delivery\n");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});

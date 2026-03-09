import assert from "node:assert/strict";
import { AuthService } from "./auth.service";

type AnyRecord = Record<string, unknown> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

class FakeRepository<T extends AnyRecord> {
  private readonly records: T[] = [];
  private seq = 1;

  constructor(initial: T[] = []) {
    this.records = [...initial];
  }

  create(input: Partial<T>): T {
    return input as T;
  }

  async save(entity: T): Promise<T> {
    const next = { ...entity } as T;
    if (!next.id) {
      next.id = `${this.seq++}`;
    }
    const now = new Date();
    if (!next.createdAt) {
      next.createdAt = now;
    }
    next.updatedAt = now;
    this.records.push(next);
    return next;
  }

  async findOne(options: { where: Partial<T> }): Promise<T | null> {
    const record = this.records.find((item) =>
      Object.entries(options.where).every(([key, value]) => item[key] === value),
    );
    return record || null;
  }

  async find(): Promise<T[]> {
    return [];
  }

  get manager() {
    return {
      transaction: async <R>(
        fn: (manager: { withRepository: (repo: unknown) => unknown }) => Promise<R>,
      ) => fn({ withRepository: (repo: unknown) => repo }),
    };
  }
}

class FakeConfigService {
  constructor(private readonly values: Record<string, string | undefined>) {}

  get<T>(key: string): T | undefined {
    return this.values[key] as T | undefined;
  }
}

const logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
};

async function buildAuthService(newUserNotifyEmail?: string) {
  const userRepo = new FakeRepository<AnyRecord>();
  const orgRepo = new FakeRepository<AnyRecord>();
  const roleRepo = new FakeRepository<AnyRecord>();
  const membershipRepo = new FakeRepository<AnyRecord>();
  const rolePermissionRepo = new FakeRepository<AnyRecord>();
  const permissionRepo = new FakeRepository<AnyRecord>();
  const refreshTokenRepo = new FakeRepository<AnyRecord>();
  const passwordResetTokenRepo = new FakeRepository<AnyRecord>();

  const sentEmails: Array<Record<string, string>> = [];
  const emailService = {
    sendEmail: async (options: Record<string, string>) => {
      sentEmails.push(options);
      return true;
    },
    sendPasswordResetEmail: async () => true,
  };

  const service = new AuthService(
    logger as never,
    new FakeConfigService({ NEW_USER_NOTIFY_EMAIL: newUserNotifyEmail }) as never,
    { sign: () => "token" } as never,
    userRepo as never,
    orgRepo as never,
    roleRepo as never,
    membershipRepo as never,
    rolePermissionRepo as never,
    permissionRepo as never,
    refreshTokenRepo as never,
    passwordResetTokenRepo as never,
    emailService as never,
  );

  return { sentEmails, service };
}

async function runSendsNotificationWhenConfigured(): Promise<void> {
  const { service, sentEmails } = await buildAuthService("ops@zevolvia.test");

  const user = await service.register({
    email: "new.user@zevolvia.test",
    password: "StrongPass123!",
    firstName: "New",
    lastName: "User",
    orgName: "Acme Salon",
    country: "US",
  });

  assert.equal(user.email, "new.user@zevolvia.test");
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, "ops@zevolvia.test");
  assert.equal(sentEmails[0].subject, "New user registered — Zevolvia");
  assert.match(sentEmails[0].text, /Name: New User/);
  assert.match(sentEmails[0].text, /Email: new.user@zevolvia.test/);
  assert.match(sentEmails[0].text, /Signup time:/);
  assert.match(sentEmails[0].text, /Org: Acme Salon/);
}

async function runSkipsWhenRecipientMissing(): Promise<void> {
  const { service, sentEmails } = await buildAuthService("   ");

  await service.register({
    email: "skip.user@zevolvia.test",
    password: "StrongPass123!",
    firstName: "Skip",
    lastName: "User",
    country: "US",
  });

  assert.equal(sentEmails.length, 0);
}

async function main(): Promise<void> {
  await runSendsNotificationWhenConfigured();
  process.stdout.write("ok - sends new user notification when configured\n");

  await runSkipsWhenRecipientMissing();
  process.stdout.write("ok - skips notification when NEW_USER_NOTIFY_EMAIL is empty\n");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});

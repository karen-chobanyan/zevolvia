import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import twilio from "twilio";
import { Repository } from "typeorm";
import { BookingStatus } from "../../common/enums";
import { Booking } from "../booking/entities/booking.entity";
import { Client } from "../booking/entities/client.entity";
import { Org } from "../identity/entities/org.entity";
import { SmsMessage } from "./entities/sms-message.entity";
import { SmsRetentionSettings } from "./entities/sms-retention-settings.entity";
import { UpdateSmsRetentionSettingsDto } from "./dto/sms-retention.dto";

const FOLLOW_UP_COOLDOWN_DAYS = 14;

interface ChurningClient {
  id: string;
  name: string;
  phone: string;
  lastBookingAt: Date;
  daysSinceLastBooking: number;
}

@Injectable()
export class SmsRetentionService {
  constructor(
    @InjectRepository(SmsRetentionSettings)
    private readonly settingsRepo: Repository<SmsRetentionSettings>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
    @InjectRepository(SmsMessage)
    private readonly smsRepo: Repository<SmsMessage>,
    private readonly config: ConfigService,
  ) {}

  async getSettings(orgId: string): Promise<SmsRetentionSettings> {
    let settings = await this.settingsRepo.findOne({ where: { orgId } });
    if (!settings) {
      settings = this.settingsRepo.create({ orgId });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(orgId: string, dto: UpdateSmsRetentionSettingsDto) {
    const settings = await this.getSettings(orgId);

    if (dto.churnDays !== undefined && (dto.churnDays < 1 || dto.churnDays > 365)) {
      throw new BadRequestException("churnDays must be between 1 and 365");
    }

    Object.assign(settings, {
      ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
      ...(dto.weMissYouEnabled !== undefined && { weMissYouEnabled: dto.weMissYouEnabled }),
      ...(dto.nextBookingSpecialEnabled !== undefined && {
        nextBookingSpecialEnabled: dto.nextBookingSpecialEnabled,
      }),
      ...(dto.churnDays !== undefined && { churnDays: dto.churnDays }),
    });

    return this.settingsRepo.save(settings);
  }

  async run(orgId: string, dryRun = false) {
    const settings = await this.getSettings(orgId);
    const org = await this.orgRepo.findOne({ where: { id: orgId } });

    if (!org) {
      throw new BadRequestException("Organization not found");
    }

    if (!settings.isEnabled) {
      return { sent: 0, skipped: 0, clients: 0, reason: "retention_disabled" };
    }

    const churningClients = await this.findChurningClients(orgId, settings.churnDays);

    let sent = 0;
    let skipped = 0;

    for (const client of churningClients) {
      if (!client.phone?.trim()) {
        skipped += 1;
        continue;
      }

      const templateType =
        client.daysSinceLastBooking >= settings.churnDays + 15
          ? "next_booking_special"
          : "we_miss_you";

      if (
        (templateType === "we_miss_you" && !settings.weMissYouEnabled) ||
        (templateType === "next_booking_special" && !settings.nextBookingSpecialEnabled)
      ) {
        skipped += 1;
        continue;
      }

      const alreadySent = await this.hasRecentAutomationMessage(
        orgId,
        client.id,
        templateType,
        FOLLOW_UP_COOLDOWN_DAYS,
      );

      if (alreadySent) {
        skipped += 1;
        continue;
      }

      if (!dryRun) {
        const body = this.renderTemplate(templateType, client.name);
        await this.sendRetentionMessage({
          orgId,
          orgPhone: org.phone,
          client,
          body,
          templateType,
        });
      }

      sent += 1;
    }

    if (!dryRun) {
      await this.settingsRepo.update({ id: settings.id }, { lastRunAt: new Date() });
    }

    return {
      sent,
      skipped,
      clients: churningClients.length,
      dryRun,
      churnDays: settings.churnDays,
    };
  }

  async findChurningClients(orgId: string, churnDays: number): Promise<ChurningClient[]> {
    const threshold = new Date(Date.now() - churnDays * 24 * 60 * 60 * 1000);

    const rows = await this.clientRepo
      .createQueryBuilder("client")
      .innerJoin(
        (qb) =>
          qb
            .subQuery()
            .select("booking.client_id", "client_id")
            .addSelect("MAX(booking.start_time)", "last_booking_at")
            .from("bookings", "booking")
            .where("booking.org_id = :orgId", { orgId })
            .andWhere("booking.client_id IS NOT NULL")
            .andWhere("booking.status IN (:...activeStatuses)", {
              activeStatuses: [
                BookingStatus.Completed,
                BookingStatus.Confirmed,
                BookingStatus.InProgress,
                BookingStatus.Scheduled,
              ],
            })
            .andWhere("booking.start_time <= NOW()")
            .groupBy("booking.client_id"),
        "last_booking",
        "last_booking.client_id = client.id",
      )
      .where("client.orgId = :orgId", { orgId })
      .andWhere("client.isWalkIn = false")
      .andWhere("client.phone IS NOT NULL")
      .andWhere("last_booking.last_booking_at < :threshold", { threshold })
      .select([
        "client.id AS id",
        "client.name AS name",
        "client.phone AS phone",
        "last_booking.last_booking_at AS last_booking_at",
      ])
      .orderBy("last_booking.last_booking_at", "ASC")
      .getRawMany<{
        id: string;
        name: string;
        phone: string;
        last_booking_at: string;
      }>();

    return rows.map((row) => {
      const lastBookingAt = new Date(row.last_booking_at);
      const daysSinceLastBooking = Math.floor(
        (Date.now() - lastBookingAt.getTime()) / (24 * 60 * 60 * 1000),
      );

      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        lastBookingAt,
        daysSinceLastBooking,
      };
    });
  }

  private renderTemplate(templateType: "we_miss_you" | "next_booking_special", clientName: string) {
    if (templateType === "next_booking_special") {
      return `Hi ${clientName}, it’s been a while! Book your next visit this week and enjoy a special perk on us. Reply here and we’ll lock your spot.`;
    }

    return `Hi ${clientName}, we miss you at Zevolvia! Ready for your next appointment? Reply to this message and we’ll help you book in minutes.`;
  }

  private async hasRecentAutomationMessage(
    orgId: string,
    clientId: string,
    templateType: "we_miss_you" | "next_booking_special",
    cooldownDays: number,
  ) {
    const since = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);

    const existing = await this.smsRepo
      .createQueryBuilder("sms")
      .where("sms.orgId = :orgId", { orgId })
      .andWhere("sms.clientId = :clientId", { clientId })
      .andWhere("sms.direction = :direction", { direction: "outbound" })
      .andWhere("sms.createdAt >= :since", { since })
      .andWhere("sms.rawPayload ->> 'automationType' = :templateType", { templateType })
      .getOne();

    return Boolean(existing);
  }

  private normalizePhone(raw?: string | null, country?: string | null) {
    if (!raw) return null;

    const trimmed = raw.trim();
    if (!trimmed) return null;

    const defaultCountry = (this.config.get<string>("DEFAULT_PHONE_COUNTRY") || "US")
      .trim()
      .toUpperCase();
    const upperCountry = country?.trim().toUpperCase() || defaultCountry;
    const region = (/^[A-Z]{2}$/.test(upperCountry) ? upperCountry : defaultCountry) as CountryCode;

    const parsed = parsePhoneNumberFromString(trimmed, region);
    if (parsed?.isValid()) {
      return parsed.format("E.164");
    }

    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.length === 10 && region === "US") return `+1${digits}`;
    return `+${digits}`;
  }

  private async sendRetentionMessage(input: {
    orgId: string;
    orgPhone: string | null;
    client: ChurningClient;
    body: string;
    templateType: "we_miss_you" | "next_booking_special";
  }) {
    const authToken = this.config.get<string>("TWILIO_AUTH_TOKEN");
    const accountSid = this.config.get<string>("TWILIO_ACCOUNT_SID");
    if (!authToken || !accountSid) {
      throw new BadRequestException("Twilio credentials are not configured");
    }

    const to = this.normalizePhone(input.client.phone) || input.client.phone;
    const from = this.normalizePhone(input.orgPhone) || input.orgPhone;

    if (!from) {
      throw new BadRequestException(
        "Organization phone number is required for outbound retention SMS",
      );
    }

    const messagingServiceSid = this.config.get<string>("TWILIO_MESSAGING_SERVICE_SID")?.trim();
    const twilioClient = twilio(accountSid, authToken);

    const payload: Record<string, string> = {
      to,
      body: input.body,
    };

    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else {
      payload.from = from;
    }

    const outbound = await twilioClient.messages.create(payload as never);

    await this.smsRepo.save(
      this.smsRepo.create({
        orgId: input.orgId,
        fromNumber: from,
        toNumber: to,
        clientId: input.client.id,
        body: input.body,
        messageSid: outbound.sid,
        accountSid: outbound.accountSid || accountSid,
        messagingServiceSid: outbound.messagingServiceSid || messagingServiceSid || null,
        smsStatus: outbound.status || null,
        direction: "outbound",
        responseToMessageSid: null,
        errorMessage: outbound.errorMessage || null,
        numMedia: 0,
        media: null,
        rawPayload: {
          automationType: input.templateType,
          lastBookingAt: input.client.lastBookingAt.toISOString(),
          daysSinceLastBooking: input.client.daysSinceLastBooking,
        },
      }),
    );
  }
}

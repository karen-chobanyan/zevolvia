import { BadRequestException, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import type { Request } from "express";
import twilio from "twilio";
import { Repository } from "typeorm";
import { Client } from "../booking/entities/client.entity";
import { Org } from "../identity/entities/org.entity";
import { SmsMessage } from "./entities/sms-message.entity";

const TWILIO_SIGNATURE_HEADER = "x-twilio-signature";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(SmsMessage)
    private readonly smsRepo: Repository<SmsMessage>,
    private readonly config: ConfigService,
  ) {}

  private normalizePhone(raw?: string | null, country?: string | null) {
    if (!raw) {
      return null;
    }
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      return null;
    }
    if (digits.length === 10 && country === "US") {
      return `1${digits}`;
    }
    return digits;
  }

  private getPhoneCandidates(raw?: string | null, country?: string | null) {
    const candidates = new Set<string>();
    if (raw) {
      candidates.add(raw);
    }
    const digits = raw ? raw.replace(/\D/g, "") : "";
    if (digits) {
      candidates.add(digits);
      candidates.add(`+${digits}`);
    }
    const normalized = this.normalizePhone(raw, country);
    if (normalized && normalized !== digits) {
      candidates.add(normalized);
      candidates.add(`+${normalized}`);
    }
    return Array.from(candidates);
  }

  private buildWebhookUrl(req: Request) {
    const override = this.config.get<string>("TWILIO_WEBHOOK_URL");
    if (override) {
      return override;
    }

    const baseOverride =
      this.config.get<string>("PUBLIC_API_URL") || this.config.get<string>("API_URL");
    const path = req.originalUrl || req.url || "";
    if (baseOverride) {
      return `${baseOverride.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
    }

    const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    const protoHeader = req.headers["x-forwarded-proto"];
    const proto =
      (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader)?.split(",")[0] ||
      req.protocol ||
      "https";
    const base = host ? `${proto}://${host}` : "";
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }

  private validateTwilioSignature(req: Request, payload: Record<string, unknown>) {
    const validate = this.config.get<string>("TWILIO_VALIDATE_SIGNATURE");
    if (validate && validate.toLowerCase() === "false") {
      return;
    }

    const authToken = this.config.get<string>("TWILIO_AUTH_TOKEN");
    if (!authToken) {
      throw new BadRequestException("TWILIO_AUTH_TOKEN is not configured");
    }

    const signatureHeader = req.headers[TWILIO_SIGNATURE_HEADER];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) {
      throw new ForbiddenException("Missing Twilio signature");
    }

    const url = this.buildWebhookUrl(req);
    const isValid = twilio.validateRequest(
      authToken,
      signature,
      url,
      payload as Record<string, unknown>,
    );
    if (!isValid) {
      throw new ForbiddenException("Invalid Twilio signature");
    }
  }

  private extractMedia(payload: Record<string, unknown>) {
    const numMedia = Number.parseInt(String(payload.NumMedia ?? "0"), 10) || 0;
    if (!numMedia) {
      return { numMedia: 0, media: null as Array<{ url: string; contentType?: string }> | null };
    }
    const media = Array.from({ length: numMedia }, (_, index) => {
      const url = payload[`MediaUrl${index}`];
      const contentType = payload[`MediaContentType${index}`];
      if (!url) {
        return null;
      }
      return {
        url: String(url),
        contentType: contentType ? String(contentType) : undefined,
      };
    }).filter(Boolean) as Array<{ url: string; contentType?: string }>;

    return { numMedia, media: media.length ? media : null };
  }

  private buildClientName(fromNumber: string) {
    const digits = fromNumber.replace(/\D/g, "");
    const suffix = digits ? digits.slice(-4) : "client";
    return `SMS Client ${suffix}`;
  }

  private async findOrCreateClient(orgId: string, fromNumber: string, fromCountry?: string | null) {
    const candidates = this.getPhoneCandidates(fromNumber, fromCountry);
    if (candidates.length) {
      const existing = await this.clientRepo.findOne({
        where: candidates.map((phone) => ({ orgId, phone })),
      });
      if (existing) {
        return existing;
      }
    }

    const client = this.clientRepo.create({
      orgId,
      name: this.buildClientName(fromNumber),
      phone: fromNumber,
      email: null,
      notes: "Created from inbound SMS",
      isWalkIn: false,
    });
    return this.clientRepo.save(client);
  }

  async handleIncomingTwilio(payload: Record<string, unknown>, req: Request) {
    this.validateTwilioSignature(req, payload);

    const toNumber = payload.To ? String(payload.To) : "";
    const fromNumber = payload.From ? String(payload.From) : "";
    const body = payload.Body ? String(payload.Body) : "";
    const messageSid = payload.MessageSid
      ? String(payload.MessageSid)
      : payload.SmsSid
        ? String(payload.SmsSid)
        : "";
    const accountSid = payload.AccountSid ? String(payload.AccountSid) : "";
    const messagingServiceSid = payload.MessagingServiceSid
      ? String(payload.MessagingServiceSid)
      : null;
    const smsStatus = payload.SmsStatus ? String(payload.SmsStatus) : null;
    const toCountry = payload.ToCountry ? String(payload.ToCountry) : null;
    const fromCountry = payload.FromCountry ? String(payload.FromCountry) : null;

    if (!messageSid || !toNumber || !fromNumber) {
      throw new BadRequestException("Missing required SMS fields");
    }

    const candidates = this.getPhoneCandidates(toNumber, toCountry);
    const org = await this.orgRepo.findOne({
      where: candidates.map((phone) => ({ phone })),
    });

    if (!org) {
      this.logger.warn(
        { toNumber, toCountry, messageSid },
        "No organization found for inbound SMS",
      );
      return { handled: false };
    }

    const client = await this.findOrCreateClient(org.id, fromNumber, fromCountry);

    const existing = await this.smsRepo.findOne({ where: { messageSid } });
    if (existing) {
      return { handled: true, messageId: existing.id, duplicate: true };
    }

    const { numMedia, media } = this.extractMedia(payload);

    const entity = this.smsRepo.create({
      orgId: org.id,
      fromNumber,
      toNumber,
      clientId: client?.id ?? null,
      body,
      messageSid,
      accountSid,
      messagingServiceSid,
      smsStatus,
      numMedia,
      media,
      rawPayload: payload,
    });

    const saved = await this.smsRepo.save(entity);
    return { handled: true, messageId: saved.id };
  }
}

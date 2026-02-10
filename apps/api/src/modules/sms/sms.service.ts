import { BadRequestException, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import type { Request } from "express";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import twilio from "twilio";
import { DataSource, EntityManager, Repository } from "typeorm";
import { ChatRole } from "../../common/enums";
import { Client } from "../booking/entities/client.entity";
import { ChatMessage } from "../chat/entities/chat-message.entity";
import { ChatSession } from "../chat/entities/chat-session.entity";
import { ChatService } from "../chat/chat.service";
import { Org } from "../identity/entities/org.entity";
import { SmsMessage } from "./entities/sms-message.entity";

const TWILIO_SIGNATURE_HEADER = "x-twilio-signature";
const CHAT_SOURCE_SMS = "sms";
const MAX_OUTBOUND_SMS_BODY = 1200;

type TwilioWebhookEnvOverride = "TWILIO_WEBHOOK_URL" | "TWILIO_STATUS_CALLBACK_URL";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
    @InjectRepository(SmsMessage)
    private readonly smsRepo: Repository<SmsMessage>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly chatService: ChatService,
  ) {}

  private normalizePhone(raw?: string | null, country?: string | null) {
    if (!raw) {
      return null;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

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
    if (!digits) {
      return null;
    }
    if (digits.length === 10 && region === "US") {
      return `+1${digits}`;
    }
    return `+${digits}`;
  }

  private getPhoneCandidates(raw?: string | null, country?: string | null) {
    const candidates = new Set<string>();
    const trimmed = raw?.trim();
    if (trimmed) {
      candidates.add(trimmed);
    }

    const normalized = this.normalizePhone(raw, country);
    if (normalized) {
      candidates.add(normalized);
      if (normalized.startsWith("+")) {
        candidates.add(normalized.slice(1));
      }
    }

    const digits = raw ? raw.replace(/\D/g, "") : "";
    if (digits) {
      candidates.add(digits);
      candidates.add(`+${digits}`);
    }

    return Array.from(candidates);
  }

  private buildWebhookUrl(req: Request, overrideKey?: TwilioWebhookEnvOverride) {
    const override = overrideKey ? this.config.get<string>(overrideKey) : undefined;
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

  private buildStatusCallbackUrl() {
    const override = this.config.get<string>("TWILIO_STATUS_CALLBACK_URL")?.trim();
    if (override) {
      return override;
    }

    const baseOverride =
      this.config.get<string>("PUBLIC_API_URL") || this.config.get<string>("API_URL");
    if (!baseOverride) {
      return undefined;
    }

    return `${baseOverride.replace(/\/$/, "")}/api/sms/twilio/status`;
  }

  private validateTwilioSignature(
    req: Request,
    payload: Record<string, unknown>,
    overrideKey?: TwilioWebhookEnvOverride,
  ) {
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

    const url = this.buildWebhookUrl(req, overrideKey);
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

  private buildInboundChatContent(body: string, numMedia: number) {
    const trimmed = body.trim();
    if (trimmed) {
      return trimmed;
    }
    if (numMedia > 0) {
      return "[Media message]";
    }
    return "[Empty SMS]";
  }

  private normalizeOutboundBody(content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      return "";
    }
    if (trimmed.length <= MAX_OUTBOUND_SMS_BODY) {
      return trimmed;
    }
    return `${trimmed.slice(0, MAX_OUTBOUND_SMS_BODY - 3)}...`;
  }

  private buildSmsThreadKey(fromNumber: string) {
    return fromNumber.trim();
  }

  private buildSmsSessionTitle(clientName: string, fromNumber: string) {
    const label = clientName?.trim() || fromNumber;
    return `SMS - ${label}`.slice(0, 120);
  }

  private isUniqueViolation(error: unknown) {
    if (!error || typeof error !== "object") {
      return false;
    }
    const dbError = error as { code?: string };
    return dbError.code === "23505";
  }

  private getTwilioClient(accountSidHint?: string | null) {
    const authToken = this.config.get<string>("TWILIO_AUTH_TOKEN");
    if (!authToken) {
      throw new BadRequestException("TWILIO_AUTH_TOKEN is not configured");
    }

    const configuredAccountSid = this.config.get<string>("TWILIO_ACCOUNT_SID")?.trim();
    const accountSid = configuredAccountSid || accountSidHint?.trim();
    if (!accountSid) {
      throw new BadRequestException("TWILIO_ACCOUNT_SID is not configured");
    }

    return {
      accountSid,
      client: twilio(accountSid, authToken),
    };
  }

  private async findOrCreateClient(
    manager: EntityManager,
    orgId: string,
    fromNumber: string,
    fromCountry?: string | null,
  ) {
    const candidates = this.getPhoneCandidates(fromNumber, fromCountry);
    if (candidates.length) {
      const existing = await manager.getRepository(Client).findOne({
        where: candidates.map((phone) => ({ orgId, phone })),
      });
      if (existing) {
        return existing;
      }
    }

    const client = manager.getRepository(Client).create({
      orgId,
      name: this.buildClientName(fromNumber),
      phone: fromNumber,
      email: null,
      notes: "Created from inbound SMS",
      isWalkIn: false,
    });
    return manager.getRepository(Client).save(client);
  }

  private async findOrCreateSmsSession(
    manager: EntityManager,
    orgId: string,
    externalThreadKey: string,
    clientId: string | null,
    title: string,
  ) {
    const sessionRepo = manager.getRepository(ChatSession);
    const existing = await sessionRepo.findOne({
      where: {
        orgId,
        source: CHAT_SOURCE_SMS,
        externalThreadKey,
      },
    });

    if (existing) {
      const updates: { updatedAt: Date; clientId?: string | null; title?: string } = {
        updatedAt: new Date(),
      };
      if (clientId && existing.clientId !== clientId) {
        updates.clientId = clientId;
      }
      if (!existing.title) {
        updates.title = title;
      }

      await sessionRepo.update({ id: existing.id, orgId }, updates);

      return existing;
    }

    const session = sessionRepo.create({
      orgId,
      userId: null,
      source: CHAT_SOURCE_SMS,
      externalThreadKey,
      clientId,
      title,
    });

    try {
      return await sessionRepo.save(session);
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }
      const collided = await sessionRepo.findOne({
        where: {
          orgId,
          source: CHAT_SOURCE_SMS,
          externalThreadKey,
        },
      });
      if (collided) {
        return collided;
      }
      throw error;
    }
  }

  private async sendAssistantReply(input: {
    orgId: string;
    sessionId: string;
    clientId: string | null;
    toNumber: string;
    fromNumber: string;
    replyToMessageSid: string;
    accountSidHint?: string | null;
    content: string;
  }) {
    const body = this.normalizeOutboundBody(input.content);
    if (!body) {
      return;
    }

    const to = this.normalizePhone(input.toNumber) || input.toNumber.trim();
    const from = this.normalizePhone(input.fromNumber) || input.fromNumber.trim();
    const messagingServiceSid = this.config.get<string>("TWILIO_MESSAGING_SERVICE_SID")?.trim();
    const statusCallback = this.buildStatusCallbackUrl();
    const { client, accountSid } = this.getTwilioClient(input.accountSidHint);

    const createPayload: Record<string, string> = {
      to,
      body,
    };

    if (statusCallback) {
      createPayload.statusCallback = statusCallback;
    }

    if (messagingServiceSid) {
      createPayload.messagingServiceSid = messagingServiceSid;
    } else {
      createPayload.from = from;
    }

    const outbound = await client.messages.create(createPayload as never);

    const outboundRecord = this.smsRepo.create({
      orgId: input.orgId,
      fromNumber: from,
      toNumber: to,
      clientId: input.clientId,
      body,
      messageSid: outbound.sid,
      accountSid: outbound.accountSid || accountSid,
      messagingServiceSid: outbound.messagingServiceSid || messagingServiceSid || null,
      smsStatus: outbound.status || null,
      direction: "outbound",
      responseToMessageSid: input.replyToMessageSid,
      errorMessage: outbound.errorMessage || null,
      numMedia: 0,
      media: null,
      rawPayload: {
        outbound: {
          sid: outbound.sid,
          status: outbound.status,
          errorCode: outbound.errorCode,
          errorMessage: outbound.errorMessage,
          numSegments: outbound.numSegments,
          uri: outbound.uri,
          dateCreated: outbound.dateCreated ? outbound.dateCreated.toISOString() : null,
          dateUpdated: outbound.dateUpdated ? outbound.dateUpdated.toISOString() : null,
        },
        sessionId: input.sessionId,
        replyToMessageSid: input.replyToMessageSid,
      },
    });

    try {
      await this.smsRepo.save(outboundRecord);
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  async handleIncomingTwilio(payload: Record<string, unknown>, req: Request) {
    this.validateTwilioSignature(req, payload, "TWILIO_WEBHOOK_URL");

    const toNumberRaw = payload.To ? String(payload.To) : "";
    const fromNumberRaw = payload.From ? String(payload.From) : "";
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

    if (!messageSid || !toNumberRaw || !fromNumberRaw) {
      throw new BadRequestException("Missing required SMS fields");
    }

    const toNumber = this.normalizePhone(toNumberRaw, toCountry) || toNumberRaw.trim();
    const fromNumber = this.normalizePhone(fromNumberRaw, fromCountry) || fromNumberRaw.trim();

    const orgCandidates = this.getPhoneCandidates(toNumber, toCountry);
    if (!orgCandidates.length) {
      this.logger.warn({ toNumberRaw, messageSid }, "No valid recipient number for inbound SMS");
      return { handled: false };
    }

    const matchingOrgs = await this.orgRepo.find({
      where: orgCandidates.map((phone) => ({ phone })),
      select: { id: true, phone: true },
    });

    if (matchingOrgs.length !== 1) {
      this.logger.warn(
        { toNumber, toCountry, messageSid, orgMatches: matchingOrgs.length },
        "Inbound SMS could not be matched to exactly one organization",
      );
      return { handled: false };
    }

    const org = matchingOrgs[0];

    const existing = await this.smsRepo.findOne({ where: { messageSid } });
    if (existing) {
      return { handled: true, messageId: existing.id, duplicate: true };
    }

    const { numMedia, media } = this.extractMedia(payload);
    const inboundContent = this.buildInboundChatContent(body, numMedia);

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const client = await this.findOrCreateClient(manager, org.id, fromNumber, fromCountry);

        const smsEntity = manager.getRepository(SmsMessage).create({
          orgId: org.id,
          fromNumber,
          toNumber,
          clientId: client?.id ?? null,
          body,
          messageSid,
          accountSid,
          messagingServiceSid,
          smsStatus,
          direction: "inbound",
          responseToMessageSid: null,
          errorMessage: null,
          numMedia,
          media,
          rawPayload: payload,
        });

        const savedSms = await manager.getRepository(SmsMessage).save(smsEntity);

        const threadKey = this.buildSmsThreadKey(fromNumber);
        const sessionTitle = this.buildSmsSessionTitle(client.name, fromNumber);

        const session = await this.findOrCreateSmsSession(
          manager,
          org.id,
          threadKey,
          client?.id ?? null,
          sessionTitle,
        );

        const chatMessage = manager.getRepository(ChatMessage).create({
          sessionId: session.id,
          role: ChatRole.User,
          content: inboundContent,
          metadata: {
            channel: "sms",
            provider: "twilio",
            direction: "inbound",
            orgId: org.id,
            clientId: client?.id ?? null,
            smsMessageId: savedSms.id,
            messageSid,
            accountSid,
            messagingServiceSid,
            smsStatus,
            fromNumber,
            toNumber,
            numMedia,
            media,
          },
        });

        await manager.getRepository(ChatMessage).save(chatMessage);

        await manager
          .getRepository(ChatSession)
          .update({ id: session.id, orgId: org.id }, { updatedAt: new Date() });

        return {
          smsMessageId: savedSms.id,
          sessionId: session.id,
          userChatMessageId: chatMessage.id,
          clientId: client?.id ?? null,
          outboundToNumber: fromNumber,
          outboundFromNumber: toNumber,
        };
      });

      void this.chatService
        .ask(
          result.sessionId,
          null,
          org.id,
          { question: inboundContent },
          {
            skipOwnershipCheck: true,
            persistUserMessage: false,
            existingUserMessageId: result.userChatMessageId,
          },
        )
        .then(async (chatResponse) => {
          const assistantContent = chatResponse.assistantMessage?.content?.trim() || "";
          if (!assistantContent) {
            return;
          }

          await this.sendAssistantReply({
            orgId: org.id,
            sessionId: result.sessionId,
            clientId: result.clientId,
            toNumber: result.outboundToNumber,
            fromNumber: result.outboundFromNumber,
            replyToMessageSid: messageSid,
            accountSidHint: accountSid || null,
            content: assistantContent,
          });
        })
        .catch((error) => {
          this.logger.error(
            {
              orgId: org.id,
              sessionId: result.sessionId,
              messageSid,
              error: error instanceof Error ? error.message : String(error),
            },
            "Failed to trigger SMS assistant response",
          );
        });

      return { handled: true, messageId: result.smsMessageId };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const duplicate = await this.smsRepo.findOne({ where: { messageSid } });
        if (duplicate) {
          return { handled: true, messageId: duplicate.id, duplicate: true };
        }
      }
      throw error;
    }
  }

  async handleTwilioStatusCallback(payload: Record<string, unknown>, req: Request) {
    this.validateTwilioSignature(req, payload, "TWILIO_STATUS_CALLBACK_URL");

    const messageSid = payload.MessageSid
      ? String(payload.MessageSid)
      : payload.SmsSid
        ? String(payload.SmsSid)
        : "";
    const messageStatus = payload.MessageStatus
      ? String(payload.MessageStatus)
      : payload.SmsStatus
        ? String(payload.SmsStatus)
        : null;

    if (!messageSid) {
      return { handled: false };
    }

    const existing = await this.smsRepo.findOne({ where: { messageSid } });
    if (!existing) {
      this.logger.warn({ messageSid }, "Twilio status callback did not match any SMS message");
      return { handled: false };
    }

    const errorCode = payload.ErrorCode ? String(payload.ErrorCode) : null;
    const errorMessage = payload.ErrorMessage ? String(payload.ErrorMessage) : null;
    const resolvedError = errorMessage || (errorCode ? `Twilio error ${errorCode}` : null);

    const rawPayload =
      existing.rawPayload && typeof existing.rawPayload === "object" ? existing.rawPayload : {};

    await this.smsRepo.update(
      { id: existing.id, orgId: existing.orgId },
      {
        smsStatus: messageStatus || existing.smsStatus,
        errorMessage: resolvedError ?? existing.errorMessage,
        rawPayload: {
          ...rawPayload,
          statusCallback: payload,
          lastStatusAt: new Date().toISOString(),
        },
      },
    );

    return { handled: true };
  }
}

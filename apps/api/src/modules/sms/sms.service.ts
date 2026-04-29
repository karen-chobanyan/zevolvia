import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import crypto from "crypto";
import type { Request } from "express";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
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
const TELEGRAM_SECRET_HEADER = "x-telegram-bot-api-secret-token";
const MAX_OUTBOUND_MESSAGE_BODY = 1200;

type TwilioWebhookEnvOverride = "TWILIO_WEBHOOK_URL" | "TWILIO_STATUS_CALLBACK_URL";
type MessagingChannel = "sms" | "whatsapp" | "telegram";

type ExistingMessagingSession = Pick<ChatSession, "id" | "clientId" | "title"> | null;

type TwilioOrgConfig = Pick<
  Org,
  "id" | "phone" | "twilioAccountSid" | "twilioAuthToken" | "twilioMessagingServiceSid"
>;

type TelegramOrgConfig = Pick<
  Org,
  "id" | "telegramBotToken" | "telegramBotUsername" | "telegramWebhookSecret"
>;

type TelegramMessagePayload = {
  message_id?: number | string;
  text?: string;
  caption?: string;
  chat?: {
    id?: number | string;
    username?: string;
    first_name?: string;
    last_name?: string;
    title?: string;
    type?: string;
  };
  from?: {
    id?: number | string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  photo?: unknown;
  document?: unknown;
  voice?: unknown;
  audio?: unknown;
  video?: unknown;
};

@Injectable()
export class SmsService {
  constructor(
    @InjectPinoLogger(SmsService.name)
    private readonly logger: PinoLogger,
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

    const trimmed = this.stripTwilioChannelPrefix(raw).trim();
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

  private stripTwilioChannelPrefix(raw?: string | null) {
    const trimmed = raw?.trim() || "";
    const whatsappPrefix = "whatsapp:";
    if (trimmed.toLowerCase().startsWith(whatsappPrefix)) {
      return trimmed.slice(whatsappPrefix.length);
    }
    return trimmed;
  }

  private getPhoneCandidates(raw?: string | null, country?: string | null) {
    const candidates = new Set<string>();
    const trimmed = this.stripTwilioChannelPrefix(raw).trim();
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

    const digits = trimmed ? trimmed.replace(/\D/g, "") : "";
    if (digits) {
      candidates.add(digits);
      candidates.add(`+${digits}`);
    }

    return Array.from(candidates);
  }

  private buildWebhookUrl(req: Request) {
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

  private withDefaultPortVariants(rawUrl: string) {
    const input = rawUrl.trim();
    if (!input) {
      return [];
    }

    const variants = new Set<string>([input]);
    try {
      const parsed = new URL(input);
      const isDefaultPort =
        (parsed.protocol === "https:" && parsed.port === "443") ||
        (parsed.protocol === "http:" && parsed.port === "80");

      if (isDefaultPort) {
        const withoutPort = new URL(parsed.toString());
        withoutPort.port = "";
        variants.add(withoutPort.toString());
      } else if (!parsed.port) {
        const withPort = new URL(parsed.toString());
        if (parsed.protocol === "https:") {
          withPort.port = "443";
          variants.add(withPort.toString());
        } else if (parsed.protocol === "http:") {
          withPort.port = "80";
          variants.add(withPort.toString());
        }
      }
    } catch {
      return Array.from(variants);
    }

    return Array.from(variants);
  }

  private buildTwilioValidationUrls(req: Request, overrideKey?: TwilioWebhookEnvOverride) {
    const urls = new Set<string>();
    const configuredOverride = overrideKey ? this.config.get<string>(overrideKey)?.trim() : "";
    if (configuredOverride) {
      for (const candidate of this.withDefaultPortVariants(configuredOverride)) {
        urls.add(candidate);
      }
    }

    for (const candidate of this.withDefaultPortVariants(this.buildWebhookUrl(req))) {
      urls.add(candidate);
    }

    return {
      configuredOverride: configuredOverride || null,
      urls: Array.from(urls),
    };
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
    authTokenOverride?: string | null,
  ) {
    const validate = this.config.get<string>("TWILIO_VALIDATE_SIGNATURE");
    if (validate && validate.toLowerCase() === "false") {
      return;
    }

    const authToken = authTokenOverride?.trim() || this.config.get<string>("TWILIO_AUTH_TOKEN");
    if (!authToken) {
      throw new BadRequestException("Twilio auth token is not configured for this organization");
    }

    const signatureHeader = req.headers[TWILIO_SIGNATURE_HEADER];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) {
      this.logger.warn(
        {
          overrideKey: overrideKey || null,
          path: req.originalUrl || req.url,
          host: req.headers.host,
          forwardedHost: req.headers["x-forwarded-host"],
          forwardedProto: req.headers["x-forwarded-proto"],
          userAgent: req.headers["user-agent"],
        },
        "Twilio webhook signature header is missing",
      );
      throw new ForbiddenException("Missing Twilio signature");
    }

    const { configuredOverride, urls } = this.buildTwilioValidationUrls(req, overrideKey);
    const isValid = urls.some((url) =>
      twilio.validateRequest(authToken, signature, url, payload as Record<string, unknown>),
    );
    if (!isValid) {
      this.logger.warn(
        {
          overrideKey: overrideKey || null,
          configuredOverride,
          validationUrls: urls,
          path: req.originalUrl || req.url,
          host: req.headers.host,
          forwardedHost: req.headers["x-forwarded-host"],
          forwardedProto: req.headers["x-forwarded-proto"],
          accountSid:
            typeof payload.AccountSid === "string"
              ? payload.AccountSid
              : String(payload.AccountSid || ""),
        },
        "Twilio webhook signature validation failed",
      );
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

  private buildClientName(
    channel: MessagingChannel,
    fromAddress: string,
    displayName?: string | null,
  ) {
    const label = displayName?.trim();
    if (label) {
      return label.slice(0, 120);
    }

    const digits = fromAddress.replace(/\D/g, "");
    const suffix = digits ? digits.slice(-4) : "client";
    return `${this.formatChannelLabel(channel)} Client ${suffix}`;
  }

  private formatChannelLabel(channel: MessagingChannel) {
    switch (channel) {
      case "whatsapp":
        return "WhatsApp";
      case "telegram":
        return "Telegram";
      default:
        return "SMS";
    }
  }

  private buildInboundChatContent(body: string, numMedia: number, channel: MessagingChannel) {
    const trimmed = body.trim();
    if (trimmed) {
      return trimmed;
    }
    if (numMedia > 0) {
      return "[Media message]";
    }
    return `[Empty ${this.formatChannelLabel(channel)} message]`;
  }

  private normalizeOutboundBody(content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      return "";
    }
    if (trimmed.length <= MAX_OUTBOUND_MESSAGE_BODY) {
      return trimmed;
    }
    return `${trimmed.slice(0, MAX_OUTBOUND_MESSAGE_BODY - 3)}...`;
  }

  private buildThreadKey(channel: MessagingChannel, fromAddress: string) {
    return channel === "sms" ? fromAddress.trim() : `${channel}:${fromAddress.trim()}`;
  }

  private buildSessionTitle(channel: MessagingChannel, clientName: string, fromAddress: string) {
    const label = clientName?.trim() || fromAddress;
    return `${this.formatChannelLabel(channel)} - ${label}`.slice(0, 120);
  }

  private isUniqueViolation(error: unknown) {
    if (!error || typeof error !== "object") {
      return false;
    }
    const dbError = error as { code?: string };
    return dbError.code === "23505";
  }

  private getTwilioClient(input: {
    accountSidHint?: string | null;
    accountSidOverride?: string | null;
    authTokenOverride?: string | null;
  }) {
    const authToken =
      input.authTokenOverride?.trim() || this.config.get<string>("TWILIO_AUTH_TOKEN");
    if (!authToken) {
      throw new BadRequestException("Twilio auth token is not configured for this organization");
    }

    const configuredAccountSid = this.config.get<string>("TWILIO_ACCOUNT_SID")?.trim();
    const accountSid =
      input.accountSidOverride?.trim() || configuredAccountSid || input.accountSidHint?.trim();
    if (!accountSid) {
      throw new BadRequestException("Twilio account SID is not configured for this organization");
    }

    return {
      accountSid,
      client: twilio(accountSid, authToken),
    };
  }

  private formatTwilioAddress(channel: MessagingChannel, value: string) {
    const normalized = this.normalizePhone(value) || this.stripTwilioChannelPrefix(value).trim();
    if (channel === "whatsapp") {
      return normalized.toLowerCase().startsWith("whatsapp:")
        ? normalized
        : `whatsapp:${normalized}`;
    }
    return normalized;
  }

  private async sendTelegramMessage(orgId: string, chatId: string, content: string) {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      select: {
        id: true,
        telegramBotToken: true,
      },
    });
    const botToken =
      org?.telegramBotToken?.trim() || this.config.get<string>("TELEGRAM_BOT_TOKEN")?.trim();
    if (!botToken) {
      throw new BadRequestException("Telegram bot token is not configured for this organization");
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: content,
      }),
    });

    const responseBody = (await response.json().catch(() => null)) as {
      ok?: boolean;
      result?: { message_id?: number | string };
      description?: string;
    } | null;

    if (!response.ok || responseBody?.ok === false) {
      throw new BadGatewayException(
        responseBody?.description || `Telegram sendMessage failed with ${response.status}`,
      );
    }

    return responseBody?.result ?? {};
  }

  private async findOrCreateClient(
    manager: EntityManager,
    input: {
      orgId: string;
      channel: MessagingChannel;
      fromAddress: string;
      fromCountry?: string | null;
      displayName?: string | null;
      existingClientId?: string | null;
    },
  ) {
    if (input.existingClientId) {
      const existingClient = await manager.getRepository(Client).findOne({
        where: { id: input.existingClientId, orgId: input.orgId },
      });
      if (existingClient) {
        return existingClient;
      }
    }

    const shouldLookupByPhone = input.channel === "sms" || input.channel === "whatsapp";
    const candidates = shouldLookupByPhone
      ? this.getPhoneCandidates(input.fromAddress, input.fromCountry)
      : [];
    if (shouldLookupByPhone && candidates.length) {
      const existing = await manager.getRepository(Client).findOne({
        where: candidates.map((phone) => ({ orgId: input.orgId, phone })),
      });
      if (existing) {
        return existing;
      }
    }

    const client = manager.getRepository(Client).create({
      orgId: input.orgId,
      name: this.buildClientName(input.channel, input.fromAddress, input.displayName),
      phone: shouldLookupByPhone ? input.fromAddress : null,
      email: null,
      notes: `Created from inbound ${this.formatChannelLabel(input.channel)}`,
      isWalkIn: false,
    });
    return manager.getRepository(Client).save(client);
  }

  private async findMessagingSession(
    manager: EntityManager,
    orgId: string,
    source: MessagingChannel,
    externalThreadKey: string,
  ): Promise<ExistingMessagingSession> {
    return manager.getRepository(ChatSession).findOne({
      where: {
        orgId,
        source,
        externalThreadKey,
      },
      select: {
        id: true,
        clientId: true,
        title: true,
      },
    });
  }

  private async findOrCreateMessagingSession(
    manager: EntityManager,
    orgId: string,
    source: MessagingChannel,
    externalThreadKey: string,
    clientId: string | null,
    title: string,
    existing?: ExistingMessagingSession,
  ) {
    const sessionRepo = manager.getRepository(ChatSession);
    const current =
      existing ??
      (await sessionRepo.findOne({
        where: {
          orgId,
          source,
          externalThreadKey,
        },
      }));

    if (current) {
      const updates: { updatedAt: Date; clientId?: string | null; title?: string } = {
        updatedAt: new Date(),
      };
      if (clientId && current.clientId !== clientId) {
        updates.clientId = clientId;
      }
      if (!current.title) {
        updates.title = title;
      }

      await sessionRepo.update({ id: current.id, orgId }, updates);

      return current;
    }

    const session = sessionRepo.create({
      orgId,
      userId: null,
      source,
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
          source,
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
    channel: MessagingChannel;
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

    if (input.channel === "telegram") {
      const telegramMessage = await this.sendTelegramMessage(input.orgId, input.toNumber, body);
      const messageId = telegramMessage.message_id
        ? String(telegramMessage.message_id)
        : crypto.randomUUID();
      const outboundRecord = this.smsRepo.create({
        orgId: input.orgId,
        fromNumber: input.fromNumber,
        toNumber: input.toNumber,
        channel: input.channel,
        clientId: input.clientId,
        body,
        messageSid: `telegram:${input.orgId}:${input.toNumber}:${messageId}:outbound`,
        accountSid: this.config.get<string>("TELEGRAM_BOT_USERNAME")?.trim() || "telegram",
        messagingServiceSid: null,
        smsStatus: "sent",
        direction: "outbound",
        responseToMessageSid: input.replyToMessageSid,
        errorMessage: null,
        numMedia: 0,
        media: null,
        rawPayload: {
          outbound: telegramMessage,
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
      return;
    }

    const to = this.formatTwilioAddress(input.channel, input.toNumber);
    const from = this.formatTwilioAddress(input.channel, input.fromNumber);
    const org = await this.orgRepo.findOne({
      where: { id: input.orgId },
      select: {
        id: true,
        twilioAccountSid: true,
        twilioAuthToken: true,
        twilioMessagingServiceSid: true,
      },
    });
    const messagingServiceSid =
      org?.twilioMessagingServiceSid?.trim() ||
      this.config.get<string>("TWILIO_MESSAGING_SERVICE_SID")?.trim();
    const statusCallback = this.buildStatusCallbackUrl();
    const { client, accountSid } = this.getTwilioClient({
      accountSidHint: input.accountSidHint,
      accountSidOverride: org?.twilioAccountSid,
      authTokenOverride: org?.twilioAuthToken,
    });

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
      channel: input.channel,
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

  private detectTwilioChannel(fromRaw: string, toRaw: string): MessagingChannel {
    const hasWhatsAppPrefix = [fromRaw, toRaw].some((value) =>
      value.trim().toLowerCase().startsWith("whatsapp:"),
    );
    return hasWhatsAppPrefix ? "whatsapp" : "sms";
  }

  private validateTelegramSecret(req: Request, secretOverride?: string | null) {
    const expected =
      secretOverride?.trim() || this.config.get<string>("TELEGRAM_WEBHOOK_SECRET")?.trim();
    if (!expected) {
      throw new BadRequestException(
        "Telegram webhook secret is not configured for this organization",
      );
    }

    const header = req.headers[TELEGRAM_SECRET_HEADER];
    const actual = Array.isArray(header) ? header[0] : header;
    if (!actual || actual !== expected) {
      throw new ForbiddenException("Invalid Telegram webhook secret");
    }
  }

  private getTelegramMessage(payload: Record<string, unknown>): TelegramMessagePayload | null {
    const message = payload.message ?? payload.edited_message;
    if (!message || typeof message !== "object") {
      return null;
    }
    return message as TelegramMessagePayload;
  }

  private getTelegramDisplayName(message: TelegramMessagePayload) {
    const source = message.from ?? message.chat;
    const parts = [source?.first_name, source?.last_name].filter(Boolean);
    const name = parts.join(" ").trim();
    if (name) {
      return name;
    }
    if (source?.username) {
      return `@${source.username}`;
    }
    if (message.chat?.title) {
      return message.chat.title;
    }
    return null;
  }

  private extractTelegramMedia(message: TelegramMessagePayload) {
    const media: Array<{ url: string; contentType?: string }> = [];
    const mediaFields: Array<[keyof TelegramMessagePayload, string]> = [
      ["photo", "photo"],
      ["document", "document"],
      ["voice", "voice"],
      ["audio", "audio"],
      ["video", "video"],
    ];

    for (const [field, contentType] of mediaFields) {
      if (message[field]) {
        media.push({ url: `telegram:${String(field)}`, contentType });
      }
    }

    return { numMedia: media.length, media: media.length ? media : null };
  }

  private async processIncomingMessage(input: {
    orgId: string;
    channel: MessagingChannel;
    provider: string;
    fromAddress: string;
    toAddress: string;
    body: string;
    messageSid: string;
    accountSid: string;
    messagingServiceSid: string | null;
    status: string | null;
    fromCountry?: string | null;
    numMedia: number;
    media: Array<{ url: string; contentType?: string }> | null;
    rawPayload: Record<string, unknown>;
    displayName?: string | null;
  }) {
    const existing = await this.smsRepo.findOne({ where: { messageSid: input.messageSid } });
    if (existing) {
      return { handled: true, messageId: existing.id, duplicate: true };
    }

    const inboundContent = this.buildInboundChatContent(input.body, input.numMedia, input.channel);

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const threadKey = this.buildThreadKey(input.channel, input.fromAddress);
        const existingSession = await this.findMessagingSession(
          manager,
          input.orgId,
          input.channel,
          threadKey,
        );
        const client = await this.findOrCreateClient(manager, {
          orgId: input.orgId,
          channel: input.channel,
          fromAddress: input.fromAddress,
          fromCountry: input.fromCountry,
          displayName: input.displayName,
          existingClientId: existingSession?.clientId ?? null,
        });

        const messageEntity = manager.getRepository(SmsMessage).create({
          orgId: input.orgId,
          fromNumber: input.fromAddress,
          toNumber: input.toAddress,
          channel: input.channel,
          clientId: client?.id ?? null,
          body: input.body,
          messageSid: input.messageSid,
          accountSid: input.accountSid,
          messagingServiceSid: input.messagingServiceSid,
          smsStatus: input.status,
          direction: "inbound",
          responseToMessageSid: null,
          errorMessage: null,
          numMedia: input.numMedia,
          media: input.media,
          rawPayload: input.rawPayload,
        });

        const savedMessage = await manager.getRepository(SmsMessage).save(messageEntity);
        const sessionTitle = this.buildSessionTitle(input.channel, client.name, input.fromAddress);

        const session = await this.findOrCreateMessagingSession(
          manager,
          input.orgId,
          input.channel,
          threadKey,
          client?.id ?? null,
          sessionTitle,
          existingSession,
        );

        const chatMessage = manager.getRepository(ChatMessage).create({
          sessionId: session.id,
          role: ChatRole.User,
          content: inboundContent,
          metadata: {
            channel: input.channel,
            provider: input.provider,
            direction: "inbound",
            orgId: input.orgId,
            clientId: client?.id ?? null,
            smsMessageId: savedMessage.id,
            messageSid: input.messageSid,
            accountSid: input.accountSid,
            messagingServiceSid: input.messagingServiceSid,
            smsStatus: input.status,
            fromNumber: input.fromAddress,
            toNumber: input.toAddress,
            numMedia: input.numMedia,
            media: input.media,
          },
        });

        await manager.getRepository(ChatMessage).save(chatMessage);

        await manager
          .getRepository(ChatSession)
          .update({ id: session.id, orgId: input.orgId }, { updatedAt: new Date() });

        return {
          messageId: savedMessage.id,
          sessionId: session.id,
          userChatMessageId: chatMessage.id,
          clientId: client?.id ?? null,
          outboundToNumber: input.fromAddress,
          outboundFromNumber: input.toAddress,
        };
      });

      void this.chatService
        .ask(
          result.sessionId,
          null,
          input.orgId,
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
            orgId: input.orgId,
            sessionId: result.sessionId,
            clientId: result.clientId,
            channel: input.channel,
            toNumber: result.outboundToNumber,
            fromNumber: result.outboundFromNumber,
            replyToMessageSid: input.messageSid,
            accountSidHint: input.accountSid || null,
            content: assistantContent,
          });
        })
        .catch((error) => {
          this.logger.error(
            {
              orgId: input.orgId,
              sessionId: result.sessionId,
              messageSid: input.messageSid,
              channel: input.channel,
              error: error instanceof Error ? error.message : String(error),
            },
            "Failed to trigger messaging assistant response",
          );
        });

      return { handled: true, messageId: result.messageId };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const duplicate = await this.smsRepo.findOne({ where: { messageSid: input.messageSid } });
        if (duplicate) {
          return { handled: true, messageId: duplicate.id, duplicate: true };
        }
      }
      throw error;
    }
  }

  async handleIncomingTwilio(payload: Record<string, unknown>, req: Request) {
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
    const channel = this.detectTwilioChannel(fromNumberRaw, toNumberRaw);

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

    const matchingOrgs = (await this.orgRepo.find({
      where: orgCandidates.map((phone) => ({ phone })),
      select: {
        id: true,
        phone: true,
        twilioAccountSid: true,
        twilioAuthToken: true,
        twilioMessagingServiceSid: true,
      },
    })) as TwilioOrgConfig[];

    if (matchingOrgs.length !== 1) {
      this.logger.warn(
        { toNumber, toCountry, messageSid, orgMatches: matchingOrgs.length },
        "Inbound SMS could not be matched to exactly one organization",
      );
      return { handled: false };
    }

    const org = matchingOrgs[0];
    if (org.twilioAccountSid?.trim() && accountSid && org.twilioAccountSid.trim() !== accountSid) {
      this.logger.warn(
        {
          orgId: org.id,
          messageSid,
          accountSid,
          configuredAccountSid: org.twilioAccountSid,
        },
        "Inbound Twilio message account SID does not match organization configuration",
      );
      return { handled: false };
    }

    this.validateTwilioSignature(req, payload, "TWILIO_WEBHOOK_URL", org.twilioAuthToken);

    const { numMedia, media } = this.extractMedia(payload);
    return this.processIncomingMessage({
      orgId: org.id,
      channel,
      provider: "twilio",
      fromAddress: fromNumber,
      toAddress: toNumber,
      body,
      messageSid,
      accountSid,
      messagingServiceSid,
      status: smsStatus,
      fromCountry,
      numMedia,
      media,
      rawPayload: payload,
    });
  }

  async handleIncomingTelegram(orgId: string, payload: Record<string, unknown>, req: Request) {
    if (!orgId) {
      throw new BadRequestException("Organization is required");
    }

    const org = (await this.orgRepo.findOne({
      where: { id: orgId },
      select: {
        id: true,
        telegramBotToken: true,
        telegramBotUsername: true,
        telegramWebhookSecret: true,
      },
    })) as TelegramOrgConfig | null;
    if (!org) {
      this.logger.warn({ orgId }, "Telegram webhook did not match an organization");
      return { handled: false };
    }

    this.validateTelegramSecret(req, org.telegramWebhookSecret);

    const message = this.getTelegramMessage(payload);
    if (!message?.chat?.id || !message.message_id) {
      return { handled: false };
    }

    const chatId = String(message.chat.id);
    const body = message.text
      ? String(message.text)
      : message.caption
        ? String(message.caption)
        : "";
    const messageSid = `telegram:${org.id}:${chatId}:${String(message.message_id)}`;
    const botUsername =
      org.telegramBotUsername?.trim() || this.config.get<string>("TELEGRAM_BOT_USERNAME")?.trim();
    const toAddress = botUsername ? `telegram:${botUsername}` : "telegram:bot";
    const { numMedia, media } = this.extractTelegramMedia(message);

    return this.processIncomingMessage({
      orgId: org.id,
      channel: "telegram",
      provider: "telegram",
      fromAddress: chatId,
      toAddress,
      body,
      messageSid,
      accountSid: botUsername || "telegram",
      messagingServiceSid: null,
      status: null,
      numMedia,
      media,
      rawPayload: payload,
      displayName: this.getTelegramDisplayName(message),
    });
  }

  async handleTwilioStatusCallback(payload: Record<string, unknown>, req: Request) {
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

    const org = (await this.orgRepo.findOne({
      where: { id: existing.orgId },
      select: {
        id: true,
        twilioAccountSid: true,
        twilioAuthToken: true,
      },
    })) as Pick<Org, "id" | "twilioAccountSid" | "twilioAuthToken"> | null;
    const payloadAccountSid = payload.AccountSid ? String(payload.AccountSid) : "";
    if (
      org?.twilioAccountSid?.trim() &&
      payloadAccountSid &&
      org.twilioAccountSid.trim() !== payloadAccountSid
    ) {
      this.logger.warn(
        {
          orgId: existing.orgId,
          messageSid,
          accountSid: payloadAccountSid,
          configuredAccountSid: org.twilioAccountSid,
        },
        "Twilio status callback account SID does not match organization configuration",
      );
      return { handled: false };
    }

    this.validateTwilioSignature(req, payload, "TWILIO_STATUS_CALLBACK_URL", org?.twilioAuthToken);

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

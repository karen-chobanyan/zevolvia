import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { DataSource, Repository } from "typeorm";
import { ChatRole, DocumentStatus } from "../../common/enums";
import { EmbeddingService } from "../ingestion/services/embedding.service";
import { ChatMessage } from "./entities/chat-message.entity";
import { ChatSession } from "./entities/chat-session.entity";
import { AskDto } from "./dto/ask.dto";
import { BOOKING_TOOLS } from "./tools/tool-definitions";
import { buildConversationHistory } from "./tools/conversation-builder";
import { ChatToolExecutor } from "./tools/tool-executor";
import { UserProfile } from "../profile/entities/user-profile.entity";
import { Membership } from "../identity/entities/membership.entity";
import { Org } from "../identity/entities/org.entity";

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;
const MAX_QUESTION_LENGTH = 4000;
const MAX_CONTEXT_CHARS = 8000;
const MAX_CHUNK_CHARS = 1200;
const MAX_TOOL_ITERATIONS = 8;

type RetrievalFilters = {
  knowledgeBaseId?: string;
  documentId?: string;
  fileId?: string;
};

type CitationItem = {
  id: string;
  distance?: number;
  metadata: {
    title: string;
    source?: string;
    file_id?: string;
    doc_id?: string;
    page?: number;
  };
  content: string;
};

type AskExecutionOptions = {
  skipOwnershipCheck?: boolean;
  persistUserMessage?: boolean;
  existingUserMessageId?: string;
};

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;
  private readonly chatModel: string;
  private readonly chatTemperature: number;
  private readonly chatMaxTokens?: number;
  private readonly systemPrompt: string;
  private readonly defaultTimeZone: string = "UTC";

  constructor(
    @InjectPinoLogger(ChatService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
    private readonly embeddingService: EmbeddingService,
    private readonly toolExecutor: ChatToolExecutor,
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      this.logger.error("OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    this.openai = new OpenAI({ apiKey });
    this.chatModel = this.configService.get<string>("CHAT_MODEL") || "gpt-4o-mini";
    const temp = Number(this.configService.get<string>("CHAT_TEMPERATURE") || "0.2");
    this.chatTemperature = Number.isFinite(temp) ? Math.min(Math.max(temp, 0), 2) : 0.2;
    const maxTokens = this.configService.get<string>("CHAT_MAX_TOKENS");
    const parsedMaxTokens = maxTokens ? Number(maxTokens) : NaN;
    this.chatMaxTokens = Number.isFinite(parsedMaxTokens) ? parsedMaxTokens : undefined;
    this.systemPrompt = this.loadSystemPrompt();
    this.defaultTimeZone = this.configService.get<string>("DEFAULT_TIME_ZONE") || "UTC";
  }

  async createSession(userId: string, orgId: string, title?: string) {
    if (!userId || !orgId) {
      throw new BadRequestException("User and org are required.");
    }

    const session = this.sessionRepo.create({
      userId,
      orgId,
      title: title?.trim() || "New chat",
    });

    return this.sessionRepo.save(session);
  }

  async listSessions(orgId: string) {
    if (!orgId) {
      throw new BadRequestException("Org is required.");
    }

    return this.sessionRepo.find({
      where: { orgId },
      order: { updatedAt: "DESC" },
      select: {
        id: true,
        userId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listMessages(sessionId: string, orgId: string) {
    const session = await this.getSessionInOrgOrThrow(sessionId, orgId);
    return this.messageRepo.find({
      where: { sessionId: session.id },
      order: { createdAt: "ASC" },
      select: {
        id: true,
        role: true,
        content: true,
        metadata: true,
        createdAt: true,
      },
    });
  }

  async ask(
    sessionId: string,
    userId: string | null,
    orgId: string,
    dto: AskDto,
    options?: AskExecutionOptions,
  ) {
    const requestStartMs = Date.now();
    this.logger.info({ sessionId, orgId, userId }, "Chat request received");
    const session = options?.skipOwnershipCheck
      ? await this.getSessionInOrgOrThrow(sessionId, orgId)
      : await this.getSessionOrThrow(sessionId, userId, orgId);
    const question = dto?.question?.trim();

    if (!question) {
      throw new BadRequestException("Question is required.");
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      throw new BadRequestException("Question is too long.");
    }

    this.logger.info(
      {
        sessionId,
        orgId,
        questionLength: question.length,
        hasSystemOverride: Boolean(dto?.system?.trim()),
        kbOnly: dto?.kbOnly ?? true,
      },
      "Question validated",
    );

    const shouldPersistUserMessage = options?.persistUserMessage ?? true;
    const userMessage = shouldPersistUserMessage
      ? await this.messageRepo.save(
          this.messageRepo.create({
            sessionId: session.id,
            role: ChatRole.User,
            content: question,
            metadata: null,
          }),
        )
      : null;

    const k = Math.min(Math.max(dto?.k ?? DEFAULT_TOP_K, 1), MAX_TOP_K);
    const filters = this.normalizeFilters(dto?.where);
    let citations: CitationItem[] = [];
    let ragContext = "";

    try {
      const ragStartMs = Date.now();
      citations = await this.retrieveCitations(orgId, question, k, filters);
      ragContext = this.buildContext(citations);
      this.logger.info(
        {
          sessionId,
          orgId,
          citations: citations.length,
          ragChars: ragContext.length,
          k,
          filters,
          ragMs: Date.now() - ragStartMs,
        },
        "RAG context resolved",
      );
    } catch (error) {
      this.logger.error({ err: (error as Error).message }, "Failed to retrieve citations");
    }

    const priorMessages = await this.messageRepo.find({
      where: { sessionId: session.id },
      order: { createdAt: "ASC" },
    });

    const excludedMessageId = userMessage?.id ?? options?.existingUserMessageId;
    const history = excludedMessageId
      ? buildConversationHistory(priorMessages.filter((m) => m.id !== excludedMessageId))
      : buildConversationHistory(priorMessages);

    this.logger.info(
      {
        sessionId,
        orgId,
        historyCount: history.length,
        priorMessageCount: priorMessages.length,
      },
      "Conversation history prepared",
    );

    const timeZone = userId
      ? await this.resolveUserTimeZone(userId, orgId)
      : await this.resolveOrgTimeZone(orgId);
    const dateContext = this.buildDateContext(timeZone);
    const dateBlock = `## Current date\nToday is ${dateContext.dateIso} (${dateContext.dayName}).`;

    const baseSystemContent = `${dto?.system?.trim() || this.systemPrompt}\n\n${dateBlock}`;
    const systemContent = ragContext
      ? `${baseSystemContent}\n\n## Salon context (from documents)\n\n${ragContext}`
      : baseSystemContent;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      ...history,
      { role: "user", content: question },
    ];

    let answer = "I don't know.";
    let usage: OpenAI.CompletionUsage | undefined;

    try {
      this.logger.info({ sessionId, orgId, toolCount: BOOKING_TOOLS.length }, "Starting tool loop");
      const result = await this.executeToolLoop(messages, orgId, {
        timeZone,
      });
      answer = result.answer;
      usage = result.usage;
    } catch (error) {
      const errPayload =
        error instanceof Error ? { message: error.message, stack: error.stack } : { error };
      this.logger.error({ err: errPayload }, "Chat completion failed");
      await this.persistAssistantMessage(
        session.id,
        "Sorry, I could not reach the knowledge service.",
        citations,
        { error: (error as Error).message ?? "Chat completion failed" },
      );
      await this.touchSession(session, question);
      throw new BadGatewayException("Chat service unavailable.");
    }

    const assistantMessage = await this.persistAssistantMessage(
      session.id,
      answer,
      citations,
      usage
        ? {
            model: this.chatModel,
            usage,
          }
        : { model: this.chatModel },
    );

    await this.touchSession(session, question);

    this.logger.info(
      {
        sessionId,
        orgId,
        totalMs: Date.now() - requestStartMs,
        usage,
      },
      "Chat request completed",
    );

    return {
      sessionId: session.id,
      userMessage,
      assistantMessage,
    };
  }

  private async executeToolLoop(
    initialMessages: ReadonlyArray<OpenAI.ChatCompletionMessageParam>,
    orgId: string,
    toolContext: { timeZone?: string },
  ): Promise<{ answer: string; usage?: OpenAI.CompletionUsage }> {
    let messages = [...initialMessages];
    let lastUsage: OpenAI.CompletionUsage | undefined;

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const iterationStartMs = Date.now();
      this.logger.info({ iteration: i + 1, orgId }, "Tool loop iteration");
      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        temperature: this.chatTemperature,
        max_tokens: this.chatMaxTokens,
        messages,
        tools: BOOKING_TOOLS,
      });

      const choice = response.choices?.[0];
      lastUsage = response.usage ?? lastUsage;

      if (!choice) {
        this.logger.warn({ orgId, iteration: i + 1 }, "No completion choice returned");
        return { answer: "I don't know.", usage: lastUsage };
      }

      const assistantMessage = choice.message;
      const toolCalls = assistantMessage.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        const text = assistantMessage.content?.trim() || "I don't know.";
        this.logger.info(
          { orgId, iteration: i + 1, iterationMs: Date.now() - iterationStartMs },
          "Tool loop completed without tool calls",
        );
        return { answer: text, usage: lastUsage };
      }

      messages = [...messages, assistantMessage];

      this.logger.info(
        {
          orgId,
          toolCalls: toolCalls.length,
          tools: toolCalls.map((tc) => tc.function.name),
          iterationMs: Date.now() - iterationStartMs,
        },
        "Executing tool calls",
      );

      const toolResults = await Promise.all(
        toolCalls.map((tc) => {
          const rawArgs = tc.function.arguments;
          let args: Record<string, unknown> = {};
          if (rawArgs && typeof rawArgs === "string") {
            try {
              args = JSON.parse(rawArgs) as Record<string, unknown>;
            } catch (error) {
              this.logger.warn(
                {
                  orgId,
                  functionName: tc.function.name,
                  toolCallId: tc.id,
                  rawArgs,
                  error: error instanceof Error ? error.message : String(error),
                },
                "Invalid tool arguments JSON",
              );
              return {
                toolCallId: tc.id,
                functionName: tc.function.name,
                result: JSON.stringify({
                  error: "Invalid tool arguments JSON",
                }),
              };
            }
          } else if (rawArgs && typeof rawArgs !== "string") {
            this.logger.warn(
              {
                orgId,
                functionName: tc.function.name,
                toolCallId: tc.id,
                rawArgsType: typeof rawArgs,
              },
              "Tool arguments payload is not a string",
            );
            return {
              toolCallId: tc.id,
              functionName: tc.function.name,
              result: JSON.stringify({
                error: "Tool arguments payload is not a string",
              }),
            };
          }

          return this.toolExecutor.execute(tc.id, tc.function.name, args, {
            orgId,
            timeZone: toolContext.timeZone,
          });
        }),
      );

      const toolMessages: OpenAI.ChatCompletionToolMessageParam[] = toolResults.map((tr) => ({
        role: "tool" as const,
        tool_call_id: tr.toolCallId,
        content: tr.result,
      }));

      messages = [...messages, ...toolMessages];
    }

    this.logger.warn("Tool loop reached maximum iterations");
    return {
      answer: "I'm having trouble processing your request. Could you try rephrasing?",
      usage: lastUsage,
    };
  }

  private async getSessionInOrgOrThrow(sessionId: string, orgId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, orgId },
    });
    if (!session) {
      throw new NotFoundException("Chat session not found.");
    }
    return session;
  }

  private async getSessionOrThrow(sessionId: string, userId: string | null, orgId: string) {
    if (!userId) {
      throw new NotFoundException("Chat session not found.");
    }
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId, orgId },
    });
    if (!session) {
      throw new NotFoundException("Chat session not found.");
    }
    return session;
  }

  private loadSystemPrompt(): string {
    const promptPath = path.resolve(__dirname, "system-prompt.md");

    try {
      const content = fs.readFileSync(promptPath, "utf8").trim();
      if (!content) {
        this.logger.error({ path: promptPath }, "System prompt file is empty");
        throw new Error("System prompt file is empty.");
      }

      return content;
    } catch (error) {
      this.logger.error(
        { err: (error as Error).message, path: promptPath },
        "System prompt file is missing or unreadable",
      );
      throw new Error("System prompt file is missing or unreadable.");
    }
  }

  private async retrieveCitations(
    orgId: string,
    question: string,
    k: number,
    filters: RetrievalFilters,
  ): Promise<CitationItem[]> {
    if (!orgId) {
      return [];
    }

    const embedding = await this.embeddingService.generateSingleEmbedding(question);
    if (!embedding?.length) {
      return [];
    }

    const vectorLiteral = `[${embedding.join(",")}]`;
    const params: Array<string | number> = [vectorLiteral, orgId, k];
    const conditions = [`e.org_id = $2`, `d.status = $4`];
    params.push(DocumentStatus.Ready);
    let paramIndex = 5;

    if (filters.knowledgeBaseId) {
      conditions.push(`d.knowledge_base_id = $${paramIndex++}`);
      params.push(filters.knowledgeBaseId);
    }

    if (filters.documentId) {
      conditions.push(`d.id = $${paramIndex++}`);
      params.push(filters.documentId);
    }

    let fileJoin = "LEFT JOIN files f ON f.storage_key = d.source_uri AND f.org_id = e.org_id";
    if (filters.fileId) {
      fileJoin = "JOIN files f ON f.storage_key = d.source_uri AND f.org_id = e.org_id";
      conditions.push(`f.id = $${paramIndex++}`);
      params.push(filters.fileId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await this.dataSource.query(
      `
      SELECT
        c.id AS chunk_id,
        c.content AS chunk_content,
        c.idx AS chunk_index,
        d.id AS document_id,
        d.name AS document_name,
        d.source_uri AS source_uri,
        f.id AS file_id,
        f.original_name AS file_name,
        f.mime_type AS file_mime,
        (e.vector <=> $1::vector) AS distance
      FROM embeddings e
      INNER JOIN chunks c ON c.id = e.chunk_id
      INNER JOIN documents d ON d.id = c.document_id
      ${fileJoin}
      ${whereClause}
      ORDER BY e.vector <=> $1::vector
      LIMIT $3
      `,
      params,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((row: any) => {
      const title = row.file_name || row.document_name || "Source";
      const chunkIndex = Number(row.chunk_index);
      return {
        id: row.chunk_id,
        distance: row.distance,
        content: row.chunk_content,
        metadata: {
          title,
          source: row.document_name,
          file_id: row.file_id || undefined,
          doc_id: row.document_id || undefined,
          page: Number.isFinite(chunkIndex) ? chunkIndex + 1 : undefined,
        },
      };
    });
  }

  private buildContext(citations: CitationItem[]) {
    if (citations.length === 0) {
      return "";
    }

    const parts = citations.map((item, index) => {
      const trimmed = item.content.slice(0, MAX_CHUNK_CHARS);
      return `[${index + 1}] ${item.metadata.title}\n${trimmed}`;
    });

    const context = parts.join("\n\n").slice(0, MAX_CONTEXT_CHARS);
    return context;
  }

  private async persistAssistantMessage(
    sessionId: string,
    content: string,
    citations: CitationItem[],
    extraMetadata?: Record<string, unknown>,
  ) {
    const metadata = {
      citations_raw: citations.map((item) => ({
        id: item.id,
        distance: item.distance,
        metadata: item.metadata,
      })),
      ...extraMetadata,
    };

    return this.messageRepo.save(
      this.messageRepo.create({
        sessionId,
        role: ChatRole.Assistant,
        content,
        metadata,
      }),
    );
  }

  private async touchSession(session: ChatSession, question: string) {
    const nextTitle =
      session.title && session.title !== "New chat" ? session.title : question.slice(0, 80);

    await this.sessionRepo.update({ id: session.id }, { title: nextTitle, updatedAt: new Date() });
  }

  private normalizeFilters(where?: Record<string, unknown>): RetrievalFilters {
    if (!where || typeof where !== "object") {
      return {};
    }

    const knowledgeBaseId =
      typeof where.knowledgeBaseId === "string" ? where.knowledgeBaseId : undefined;
    const documentId = typeof where.documentId === "string" ? where.documentId : undefined;
    const fileId = typeof where.fileId === "string" ? where.fileId : undefined;

    return {
      knowledgeBaseId,
      documentId,
      fileId,
    };
  }

  private async resolveUserTimeZone(userId: string, orgId: string): Promise<string> {
    const membership = await this.membershipRepo.findOne({
      where: { userId, orgId },
      select: { id: true },
    });

    if (!membership) {
      return this.defaultTimeZone;
    }

    const profile = await this.userProfileRepo
      .createQueryBuilder("profile")
      .innerJoin(
        Membership,
        "membership",
        "membership.userId = profile.userId AND membership.orgId = :orgId",
        { orgId },
      )
      .where("profile.userId = :userId", { userId })
      .select(["profile.timeZone"])
      .getOne();

    const candidate = profile?.timeZone?.trim();
    if (candidate && this.isValidTimeZone(candidate)) {
      return candidate;
    }

    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      select: ["timeZone"],
    });
    const orgTimeZone = org?.timeZone?.trim();
    if (orgTimeZone && this.isValidTimeZone(orgTimeZone)) {
      return orgTimeZone;
    }

    return this.defaultTimeZone;
  }

  private async resolveOrgTimeZone(orgId: string): Promise<string> {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      select: ["timeZone"],
    });
    const orgTimeZone = org?.timeZone?.trim();
    if (orgTimeZone && this.isValidTimeZone(orgTimeZone)) {
      return orgTimeZone;
    }
    return this.defaultTimeZone;
  }

  private isValidTimeZone(value: string) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
      return true;
    } catch {
      return false;
    }
  }

  private buildDateContext(timeZone: string) {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
    }).formatToParts(now);

    const year = parts.find((p) => p.type === "year")?.value ?? "1970";
    const month = parts.find((p) => p.type === "month")?.value ?? "01";
    const day = parts.find((p) => p.type === "day")?.value ?? "01";
    const dayName = parts.find((p) => p.type === "weekday")?.value ?? "Unknown";

    return {
      timeZone,
      dateIso: `${year}-${month}-${day}`,
      dayName,
    };
  }
}

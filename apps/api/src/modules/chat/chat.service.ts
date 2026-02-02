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
import { DataSource, Repository } from "typeorm";
import { ChatRole, DocumentStatus } from "../../common/enums";
import { EmbeddingService } from "../ingestion/services/embedding.service";
import { ChatMessage } from "./entities/chat-message.entity";
import { ChatSession } from "./entities/chat-session.entity";
import { AskDto } from "./dto/ask.dto";

const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful assistant. Use ONLY the provided context. If the answer is not in the context, say you don't know.";
const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;
const MAX_QUESTION_LENGTH = 4000;
const MAX_CONTEXT_CHARS = 8000;
const MAX_CHUNK_CHARS = 1200;

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

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;
  private readonly chatModel: string;
  private readonly chatTemperature: number;
  private readonly chatMaxTokens?: number;

  constructor(
    @InjectPinoLogger(ChatService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
    private readonly embeddingService: EmbeddingService,
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
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

  async listSessions(userId: string, orgId: string) {
    if (!userId || !orgId) {
      throw new BadRequestException("User and org are required.");
    }

    return this.sessionRepo.find({
      where: { userId, orgId },
      order: { updatedAt: "DESC" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listMessages(sessionId: string, userId: string, orgId: string) {
    const session = await this.getSessionOrThrow(sessionId, userId, orgId);
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

  async ask(sessionId: string, userId: string, orgId: string, dto: AskDto) {
    const session = await this.getSessionOrThrow(sessionId, userId, orgId);
    const question = dto?.question?.trim();

    if (!question) {
      throw new BadRequestException("Question is required.");
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      throw new BadRequestException("Question is too long.");
    }

    const userMessage = await this.messageRepo.save(
      this.messageRepo.create({
        sessionId: session.id,
        role: ChatRole.User,
        content: question,
        metadata: null,
      }),
    );

    const k = Math.min(Math.max(dto?.k ?? DEFAULT_TOP_K, 1), MAX_TOP_K);
    const filters = this.normalizeFilters(dto?.where);
    let citations: CitationItem[] = [];
    let context = "";

    try {
      citations = await this.retrieveCitations(orgId, question, k, filters);
      context = this.buildContext(citations);
    } catch (error) {
      this.logger.error({ err: (error as Error).message }, "Failed to retrieve citations");
    }

    const shouldUseContextOnly = dto?.kbOnly ?? true;
    if (shouldUseContextOnly && citations.length === 0) {
      const assistantMessage = await this.persistAssistantMessage(
        session.id,
        "I don't know.",
        citations,
      );
      await this.touchSession(session, question);

      return {
        sessionId: session.id,
        userMessage,
        assistantMessage,
      };
    }

    let answer = "I don't know.";
    let usage: OpenAI.CompletionUsage | undefined;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        temperature: this.chatTemperature,
        max_tokens: this.chatMaxTokens,
        messages: [
          {
            role: "system",
            content: dto?.system?.trim() || DEFAULT_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: context ? `Context:\n${context}\n\nQuestion:\n${question}` : question,
          },
        ],
      });

      answer = response.choices?.[0]?.message?.content?.trim() || "I don't know.";
      usage = response.usage;
    } catch (error) {
      this.logger.error({ err: (error as Error).message }, "Chat completion failed");
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

    return {
      sessionId: session.id,
      userMessage,
      assistantMessage,
    };
  }

  private async getSessionOrThrow(sessionId: string, userId: string, orgId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId, orgId },
    });
    if (!session) {
      throw new NotFoundException("Chat session not found.");
    }
    return session;
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
}

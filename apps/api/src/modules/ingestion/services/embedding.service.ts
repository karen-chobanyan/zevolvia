import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import OpenAI from "openai";

const BATCH_SIZE = 2048;

@Injectable()
export class EmbeddingService {
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(
    @InjectPinoLogger(EmbeddingService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      this.logger.error("OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    this.openai = new OpenAI({ apiKey });
    this.model = this.configService.get<string>("EMBEDDING_MODEL") || "text-embedding-3-small";
    this.logger.info({ model: this.model }, "EmbeddingService initialized");
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      this.logger.debug("No texts provided for embedding generation");
      return [];
    }

    this.logger.debug({ textCount: texts.length, model: this.model }, "Generating embeddings");

    const allEmbeddings: number[][] = [];
    const batchCount = Math.ceil(texts.length / BATCH_SIZE);

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
      const batch = texts.slice(i, i + BATCH_SIZE);

      this.logger.debug(
        { batch: batchIndex, totalBatches: batchCount, batchSize: batch.length },
        "Processing embedding batch",
      );

      const batchEmbeddings = await this.generateBatch(batch);
      allEmbeddings.push(...batchEmbeddings);
    }

    this.logger.debug(
      { totalEmbeddings: allEmbeddings.length, dimensions: allEmbeddings[0]?.length },
      "Embeddings generated successfully",
    );

    return allEmbeddings;
  }

  private async generateBatch(texts: string[]): Promise<number[][]> {
    const startTime = Date.now();

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
      });

      const duration = Date.now() - startTime;
      this.logger.debug(
        { textCount: texts.length, duration, tokensUsed: response.usage?.total_tokens },
        "OpenAI embedding batch completed",
      );

      return response.data
        .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
        .map((item: { embedding: number[] }) => item.embedding);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          textCount: texts.length,
          duration,
          error: {
            message: (error as Error).message,
            name: (error as Error).name,
          },
        },
        "Failed to generate embeddings from OpenAI",
      );
      throw new Error("Failed to generate embeddings from OpenAI");
    }
  }

  async generateSingleEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }
}

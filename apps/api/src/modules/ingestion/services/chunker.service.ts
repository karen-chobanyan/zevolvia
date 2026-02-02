import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { get_encoding, Tiktoken } from "tiktoken";
import { ChunkResult } from "../dto/ingestion-job.dto";

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

@Injectable()
export class ChunkerService implements OnModuleDestroy {
  private readonly defaultChunkSize: number;
  private readonly defaultChunkOverlap: number;
  private encoder: Tiktoken | null = null;

  constructor(private readonly configService: ConfigService) {
    this.defaultChunkSize = parseInt(this.configService.get<string>("CHUNK_SIZE") || "500", 10);
    this.defaultChunkOverlap = parseInt(
      this.configService.get<string>("CHUNK_OVERLAP") || "50",
      10,
    );
  }

  onModuleDestroy(): void {
    if (this.encoder) {
      this.encoder.free();
      this.encoder = null;
    }
  }

  private getEncoder(): Tiktoken {
    if (!this.encoder) {
      this.encoder = get_encoding("cl100k_base");
    }
    return this.encoder;
  }

  chunk(text: string, options?: ChunkOptions): ChunkResult[] {
    const chunkSize = options?.chunkSize ?? this.defaultChunkSize;
    const chunkOverlap = options?.chunkOverlap ?? this.defaultChunkOverlap;

    const encoder = this.getEncoder();
    const tokens = encoder.encode(text);

    if (tokens.length <= chunkSize) {
      return [
        {
          content: text,
          idx: 0,
          tokens: tokens.length,
        },
      ];
    }

    const chunks: ChunkResult[] = [];
    let start = 0;
    let idx = 0;

    while (start < tokens.length) {
      const end = Math.min(start + chunkSize, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      const content = new TextDecoder().decode(encoder.decode(chunkTokens));

      chunks.push({
        content,
        idx,
        tokens: chunkTokens.length,
      });

      if (end >= tokens.length) {
        break;
      }

      start = end - chunkOverlap;
      idx++;
    }

    return chunks;
  }

  countTokens(text: string): number {
    const encoder = this.getEncoder();
    return encoder.encode(text).length;
  }
}

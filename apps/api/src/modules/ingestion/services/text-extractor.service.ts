import { Injectable, Logger } from "@nestjs/common";

import pdfParse from "pdf-parse";
import mammoth from "mammoth";

@Injectable()
export class TextExtractorService {
  private readonly logger = new Logger(TextExtractorService.name);

  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case "application/pdf":
        return this.extractFromPdf(buffer);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return this.extractFromDocx(buffer);
      case "text/plain":
      case "text/markdown":
        return this.extractFromText(buffer);
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  private async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logger.error("Failed to extract text from PDF", error);
      throw new Error("Failed to extract text from PDF");
    }
  }

  private async extractFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.error("Failed to extract text from DOCX", error);
      throw new Error("Failed to extract text from DOCX");
    }
  }

  private extractFromText(buffer: Buffer): string {
    return buffer.toString("utf-8");
  }
}

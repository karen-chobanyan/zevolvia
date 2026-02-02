import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

@Injectable()
export class TextExtractorService {
  constructor(
    @InjectPinoLogger(TextExtractorService.name)
    private readonly logger: PinoLogger,
  ) {}

  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    this.logger.debug({ mimeType, size: buffer.length }, "Extracting text from file");

    switch (mimeType) {
      case "application/pdf":
        return this.extractFromPdf(buffer);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return this.extractFromDocx(buffer);
      case "text/plain":
      case "text/markdown":
        return this.extractFromText(buffer);
      default:
        this.logger.warn({ mimeType }, "Unsupported file type");
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  private async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      this.logger.debug({ size: buffer.length }, "Parsing PDF");
      const data = await pdfParse(buffer);
      this.logger.debug(
        { pages: data.numpages, textLength: data.text.length },
        "PDF parsed successfully",
      );
      return data.text;
    } catch (error) {
      this.logger.error(
        { error: { message: (error as Error).message, name: (error as Error).name } },
        "Failed to extract text from PDF",
      );
      throw new Error("Failed to extract text from PDF");
    }
  }

  private async extractFromDocx(buffer: Buffer): Promise<string> {
    try {
      this.logger.debug({ size: buffer.length }, "Parsing DOCX");
      const result = await mammoth.extractRawText({ buffer });
      this.logger.debug({ textLength: result.value.length }, "DOCX parsed successfully");
      return result.value;
    } catch (error) {
      this.logger.error(
        { error: { message: (error as Error).message, name: (error as Error).name } },
        "Failed to extract text from DOCX",
      );
      throw new Error("Failed to extract text from DOCX");
    }
  }

  private extractFromText(buffer: Buffer): string {
    const text = buffer.toString("utf-8");
    this.logger.debug({ textLength: text.length }, "Text file read successfully");
    return text;
  }
}

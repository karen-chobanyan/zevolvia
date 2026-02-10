import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";
import * as crypto from "crypto";
import { Readable } from "stream";

export interface UploadResult {
  bucket: string;
  storageKey: string;
  checksum: string;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>("MINIO_ENDPOINT", "localhost"),
      port: parseInt(this.configService.get<string>("MINIO_PORT", "9000"), 10),
      useSSL: this.configService.get<string>("MINIO_USE_SSL", "false") === "true",
      accessKey: this.configService.get<string>("MINIO_ACCESS_KEY", "minioadmin"),
      secretKey: this.configService.get<string>("MINIO_SECRET_KEY", "minioadmin"),
    });
    this.bucket = this.configService.get<string>("MINIO_BUCKET", "zevolvia-files");
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created bucket: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize MinIO bucket: ${error}`);
      throw error;
    }
  }

  generateStorageKey(orgId: string, fileId: string, originalName: string): string {
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 100);
    return `orgs/${orgId}/files/${fileId}-${sanitizedName}`;
  }

  async upload(storageKey: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    await this.client.putObject(this.bucket, storageKey, buffer, buffer.length, {
      "Content-Type": mimeType,
    });

    return {
      bucket: this.bucket,
      storageKey,
      checksum,
    };
  }

  async getObject(storageKey: string): Promise<Readable> {
    return this.client.getObject(this.bucket, storageKey);
  }

  async getPresignedUrl(storageKey: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, storageKey, expirySeconds);
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.client.removeObject(this.bucket, storageKey);
  }

  async objectExists(storageKey: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, storageKey);
      return true;
    } catch {
      return false;
    }
  }
}

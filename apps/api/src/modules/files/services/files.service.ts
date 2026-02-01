import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { File } from "../entities/file.entity";
import { MinioService } from "./minio.service";
import {
  FileStatus,
  FileRagStatus,
  ALLOWED_FILE_TYPES,
  AllowedFileType,
} from "../../../common/enums";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface UploadFileInput {
  orgId: string;
  uploadedById: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  knowledgeBaseId?: string;
}

export interface ListFilesOptions {
  orgId: string;
  knowledgeBaseId?: string;
  status?: FileStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedFiles {
  items: File[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly minioService: MinioService,
  ) {}

  async upload(input: UploadFileInput): Promise<File> {
    const { orgId, uploadedById, file, knowledgeBaseId } = input;

    if (!ALLOWED_FILE_TYPES.includes(file.mimetype as AllowedFileType)) {
      throw new BadRequestException(`File type not allowed. Allowed types: PDF, DOCX, TXT, MD`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    const fileId = uuidv4();
    const storageKey = this.minioService.generateStorageKey(orgId, fileId, file.originalname);

    const uploadResult = await this.minioService.upload(storageKey, file.buffer, file.mimetype);

    const fileEntity = this.fileRepository.create({
      id: fileId,
      orgId,
      uploadedById,
      knowledgeBaseId: knowledgeBaseId ?? null,
      bucket: uploadResult.bucket,
      storageKey: uploadResult.storageKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      checksum: uploadResult.checksum,
      status: FileStatus.Uploaded,
      ragStatus: FileRagStatus.Pending,
    });

    return this.fileRepository.save(fileEntity);
  }

  async findById(id: string, orgId: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id, orgId },
      relations: ["knowledgeBase", "uploadedBy"],
    });

    if (!file) {
      throw new NotFoundException(`File not found`);
    }

    return file;
  }

  async list(options: ListFilesOptions): Promise<PaginatedFiles> {
    const { orgId, knowledgeBaseId, status, page = 1, limit = 20 } = options;

    const queryBuilder = this.fileRepository
      .createQueryBuilder("file")
      .leftJoinAndSelect("file.knowledgeBase", "knowledgeBase")
      .leftJoinAndSelect("file.uploadedBy", "uploadedBy")
      .where("file.orgId = :orgId", { orgId })
      .andWhere("file.status != :deletedStatus", {
        deletedStatus: FileStatus.Deleted,
      });

    if (knowledgeBaseId) {
      queryBuilder.andWhere("file.knowledgeBaseId = :knowledgeBaseId", {
        knowledgeBaseId,
      });
    }

    if (status) {
      queryBuilder.andWhere("file.status = :status", { status });
    }

    const [items, total] = await queryBuilder
      .orderBy("file.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string, orgId: string): Promise<void> {
    const file = await this.findById(id, orgId);

    try {
      await this.minioService.deleteObject(file.storageKey);
    } catch (error) {
      throw new BadRequestException(`Failed to delete file from storage: ${error}`);
    }

    await this.fileRepository.update({ id }, { status: FileStatus.Deleted });
  }

  async getDownloadUrl(id: string, orgId: string): Promise<string> {
    const file = await this.findById(id, orgId);
    return this.minioService.getPresignedUrl(file.storageKey);
  }

  async updateRagStatus(
    id: string,
    ragStatus: FileRagStatus,
    errorMessage?: string,
  ): Promise<File> {
    const updateData: Partial<File> = { ragStatus };
    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    await this.fileRepository.update({ id }, updateData);
    return this.fileRepository.findOneOrFail({ where: { id } });
  }

  async linkToKnowledgeBase(
    id: string,
    orgId: string,
    knowledgeBaseId: string | null,
  ): Promise<File> {
    const file = await this.findById(id, orgId);

    await this.fileRepository.update({ id: file.id }, { knowledgeBaseId });

    return this.findById(id, orgId);
  }
}

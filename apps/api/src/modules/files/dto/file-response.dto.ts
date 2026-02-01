import { File } from "../entities/file.entity";
import { FileStatus, FileRagStatus } from "../../../common/enums";

export class FileResponseDto {
  id: string;
  orgId: string;
  knowledgeBaseId: string | null;
  knowledgeBaseName: string | null;
  uploadedById: string | null;
  uploadedByEmail: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  status: FileStatus;
  ragStatus: FileRagStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;

  private constructor(data: FileResponseDto) {
    this.id = data.id;
    this.orgId = data.orgId;
    this.knowledgeBaseId = data.knowledgeBaseId;
    this.knowledgeBaseName = data.knowledgeBaseName;
    this.uploadedById = data.uploadedById;
    this.uploadedByEmail = data.uploadedByEmail;
    this.originalName = data.originalName;
    this.mimeType = data.mimeType;
    this.size = data.size;
    this.status = data.status;
    this.ragStatus = data.ragStatus;
    this.errorMessage = data.errorMessage;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromEntity(file: File): FileResponseDto {
    return new FileResponseDto({
      id: file.id,
      orgId: file.orgId,
      knowledgeBaseId: file.knowledgeBaseId,
      knowledgeBaseName: file.knowledgeBase?.name ?? null,
      uploadedById: file.uploadedById,
      uploadedByEmail: file.uploadedBy?.email ?? null,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
      status: file.status,
      ragStatus: file.ragStatus,
      errorMessage: file.errorMessage,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    });
  }
}

export class PaginatedFilesResponseDto {
  items: FileResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  private constructor(data: PaginatedFilesResponseDto) {
    this.items = data.items;
    this.total = data.total;
    this.page = data.page;
    this.limit = data.limit;
    this.totalPages = data.totalPages;
  }

  static fromPaginatedFiles(data: {
    items: File[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }): PaginatedFilesResponseDto {
    return new PaginatedFilesResponseDto({
      items: data.items.map((file) => FileResponseDto.fromEntity(file)),
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    });
  }
}

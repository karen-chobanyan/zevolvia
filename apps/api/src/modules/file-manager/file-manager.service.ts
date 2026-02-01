import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Folder } from "./entities/folder.entity";
import { File } from "../files/entities/file.entity";
import { MinioService } from "../files/services/minio.service";
import { FileStatus, FileRagStatus } from "../../common/enums";

export interface CreateFolderInput {
  orgId: string;
  name: string;
  parentId: string | null;
}

export interface UploadFilesInput {
  orgId: string;
  uploadedById: string;
  folderId: string | null;
  files: Array<{
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }>;
}

export interface FileResponse {
  id: string;
  key: string;
  name: string;
  size: number;
  url: string | null;
  createdAt: string;
  mimeType: string;
  folderId: string | null;
  status: string;
}

@Injectable()
export class FileManagerService {
  constructor(
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly minioService: MinioService,
  ) {}

  async listFolders(orgId: string, parentId: string | null): Promise<Folder[]> {
    return this.folderRepository.find({
      where: {
        orgId,
        parentId: parentId === null ? IsNull() : parentId,
      },
      order: { name: "ASC" },
    });
  }

  async createFolder(input: CreateFolderInput): Promise<Folder> {
    const { orgId, name, parentId } = input;

    if (parentId) {
      const parent = await this.folderRepository.findOne({
        where: { id: parentId, orgId },
      });
      if (!parent) {
        throw new NotFoundException("Parent folder not found");
      }
    }

    const folder = this.folderRepository.create({
      orgId,
      name,
      parentId,
    });

    return this.folderRepository.save(folder);
  }

  async renameFolder(id: string, orgId: string, name: string): Promise<Folder> {
    const folder = await this.folderRepository.findOne({
      where: { id, orgId },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    await this.folderRepository.update({ id }, { name });
    return this.folderRepository.findOneOrFail({ where: { id } });
  }

  async deleteFolder(id: string, orgId: string): Promise<void> {
    const folder = await this.folderRepository.findOne({
      where: { id, orgId },
    });

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    // Delete all files in this folder from MinIO
    const files = await this.fileRepository.find({
      where: { folderId: id, orgId },
    });

    for (const file of files) {
      try {
        await this.minioService.deleteObject(file.storageKey);
      } catch (error) {
        // Log but continue - file might already be deleted
      }
    }

    // Cascade delete will handle files and child folders
    await this.folderRepository.delete({ id });
  }

  async listFiles(orgId: string): Promise<FileResponse[]> {
    const files = await this.fileRepository.find({
      where: {
        orgId,
        status: FileStatus.Uploaded,
      },
      order: { createdAt: "DESC" },
    });

    return Promise.all(
      files.map(async (file) => {
        let url: string | null = null;
        try {
          url = await this.minioService.getPresignedUrl(file.storageKey, 3600);
        } catch {
          // File might not exist in storage
        }

        return {
          id: file.id,
          key: file.storageKey,
          name: file.originalName,
          size: Number(file.size),
          url,
          createdAt: file.createdAt.toISOString(),
          mimeType: file.mimeType,
          folderId: file.folderId,
          status: file.status,
        };
      }),
    );
  }

  async uploadFiles(input: UploadFilesInput): Promise<FileResponse[]> {
    const { orgId, uploadedById, folderId, files } = input;

    // Validate folder if provided
    if (folderId) {
      const folder = await this.folderRepository.findOne({
        where: { id: folderId, orgId },
      });
      if (!folder) {
        throw new NotFoundException("Folder not found");
      }
    }

    const results: FileResponse[] = [];

    for (const file of files) {
      const fileId = uuidv4();
      const storageKey = this.minioService.generateStorageKey(orgId, fileId, file.originalname);

      const uploadResult = await this.minioService.upload(storageKey, file.buffer, file.mimetype);

      const fileEntity = this.fileRepository.create({
        id: fileId,
        orgId,
        uploadedById,
        folderId,
        knowledgeBaseId: null,
        bucket: uploadResult.bucket,
        storageKey: uploadResult.storageKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        checksum: uploadResult.checksum,
        status: FileStatus.Uploaded,
        ragStatus: FileRagStatus.Pending,
      });

      const savedFile = await this.fileRepository.save(fileEntity);

      let url: string | null = null;
      try {
        url = await this.minioService.getPresignedUrl(storageKey, 3600);
      } catch {
        // Ignore
      }

      results.push({
        id: savedFile.id,
        key: savedFile.storageKey,
        name: savedFile.originalName,
        size: Number(savedFile.size),
        url,
        createdAt: savedFile.createdAt.toISOString(),
        mimeType: savedFile.mimeType,
        folderId: savedFile.folderId,
        status: savedFile.status,
      });
    }

    return results;
  }

  async updateFile(
    id: string,
    orgId: string,
    updates: { folderId?: string | null },
  ): Promise<FileResponse> {
    const file = await this.fileRepository.findOne({
      where: { id, orgId },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    if (updates.folderId !== undefined) {
      if (updates.folderId !== null) {
        const folder = await this.folderRepository.findOne({
          where: { id: updates.folderId, orgId },
        });
        if (!folder) {
          throw new BadRequestException("Target folder not found");
        }
      }
      await this.fileRepository.update({ id }, { folderId: updates.folderId });
    }

    const updatedFile = await this.fileRepository.findOneOrFail({
      where: { id },
    });

    let url: string | null = null;
    try {
      url = await this.minioService.getPresignedUrl(updatedFile.storageKey, 3600);
    } catch {
      // Ignore
    }

    return {
      id: updatedFile.id,
      key: updatedFile.storageKey,
      name: updatedFile.originalName,
      size: Number(updatedFile.size),
      url,
      createdAt: updatedFile.createdAt.toISOString(),
      mimeType: updatedFile.mimeType,
      folderId: updatedFile.folderId,
      status: updatedFile.status,
    };
  }

  async deleteFile(id: string, orgId: string): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id, orgId },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    try {
      await this.minioService.deleteObject(file.storageKey);
    } catch (error) {
      // Log but continue
    }

    await this.fileRepository.update({ id }, { status: FileStatus.Deleted });
  }
}

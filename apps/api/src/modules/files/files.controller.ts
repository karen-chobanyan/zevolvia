import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtPayload } from "../auth/types/jwt-payload";
import { FilesService } from "./services/files.service";
import { FileResponseDto, PaginatedFilesResponseDto } from "./dto/file-response.dto";
import { ListFilesQueryDto, LinkKnowledgeBaseDto } from "./dto/list-files-query.dto";

@Controller("files")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @Permissions("files:upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: JwtPayload },
    @Body("knowledgeBaseId") knowledgeBaseId?: string,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const uploadedFile = await this.filesService.upload({
      orgId: req.user.orgId,
      uploadedById: req.user.sub,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      knowledgeBaseId,
    });

    return FileResponseDto.fromEntity(uploadedFile);
  }

  @Get()
  @Permissions("files:read")
  async list(
    @Request() req: { user: JwtPayload },
    @Query() query: ListFilesQueryDto,
  ): Promise<PaginatedFilesResponseDto> {
    const result = await this.filesService.list({
      orgId: req.user.orgId,
      knowledgeBaseId: query.knowledgeBaseId,
      status: query.status,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });

    return PaginatedFilesResponseDto.fromPaginatedFiles(result);
  }

  @Get(":id")
  @Permissions("files:read")
  async findById(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<FileResponseDto> {
    const file = await this.filesService.findById(id, req.user.orgId);
    return FileResponseDto.fromEntity(file);
  }

  @Get(":id/download")
  @Permissions("files:read")
  async getDownloadUrl(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{ url: string }> {
    const url = await this.filesService.getDownloadUrl(id, req.user.orgId);
    return { url };
  }

  @Delete(":id")
  @Permissions("files:delete")
  async delete(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{ ok: boolean }> {
    await this.filesService.delete(id, req.user.orgId);
    return { ok: true };
  }

  @Post(":id/link-knowledge-base")
  @Permissions("files:write")
  async linkKnowledgeBase(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
    @Body() body: LinkKnowledgeBaseDto,
  ): Promise<FileResponseDto> {
    const file = await this.filesService.linkToKnowledgeBase(
      id,
      req.user.orgId,
      body.knowledgeBaseId,
    );
    return FileResponseDto.fromEntity(file);
  }
}

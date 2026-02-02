import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtPayload } from "../auth/types/jwt-payload";
import { FileManagerService } from "./file-manager.service";

@Controller("file-manager")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  @Get("folders")
  @Permissions("files:read")
  async listFolders(@Request() req: { user: JwtPayload }, @Query("parentId") parentId?: string) {
    const resolvedParentId = parentId === "root" || !parentId ? null : parentId;
    return this.fileManagerService.listFolders(req.user.orgId, resolvedParentId);
  }

  @Post("folders")
  @Permissions("files:write")
  async createFolder(
    @Request() req: { user: JwtPayload },
    @Body() body: { name: string; parentId?: string | null },
  ) {
    if (!body.name?.trim()) {
      throw new BadRequestException("Folder name is required");
    }

    return this.fileManagerService.createFolder({
      orgId: req.user.orgId,
      name: body.name.trim(),
      parentId: body.parentId ?? null,
    });
  }

  @Patch("folders/:id")
  @Permissions("files:write")
  async renameFolder(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
    @Body() body: { name: string },
  ) {
    if (!body.name?.trim()) {
      throw new BadRequestException("Folder name is required");
    }

    return this.fileManagerService.renameFolder(id, req.user.orgId, body.name.trim());
  }

  @Delete("folders/:id")
  @Permissions("files:delete")
  async deleteFolder(@Param("id") id: string, @Request() req: { user: JwtPayload }) {
    await this.fileManagerService.deleteFolder(id, req.user.orgId);
    return { ok: true };
  }

  @Get("files")
  @Permissions("files:read")
  async listFiles(@Request() req: { user: JwtPayload }) {
    return this.fileManagerService.listFiles(req.user.orgId);
  }

  @Get("files/:id/pdf")
  @Permissions("files:read")
  async getPdf(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
    @Res() res: Response,
    @Query("download") download?: string,
  ) {
    const { stream, file } = await this.fileManagerService.getPdfStream(id, req.user.orgId);
    const safeName = (file.originalName || "document.pdf").replace(/[/\\"]/g, "_");
    const disposition = download ? "attachment" : "inline";

    res.setHeader("Content-Type", file.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `${disposition}; filename="${safeName}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    stream.pipe(res);
  }

  @Post("upload")
  @Permissions("files:upload")
  @UseInterceptors(
    FilesInterceptor("file", 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: { user: JwtPayload },
    @Body("folderId") folderId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    const results = await this.fileManagerService.uploadFiles({
      orgId: req.user.orgId,
      uploadedById: req.user.sub,
      folderId: folderId ?? null,
      files: files.map((file) => ({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      })),
    });

    // Return single file or array based on upload count
    return results.length === 1 ? results[0] : results;
  }

  @Patch("files/:id")
  @Permissions("files:write")
  async updateFile(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
    @Body() body: { folderId?: string | null },
  ) {
    return this.fileManagerService.updateFile(id, req.user.orgId, {
      folderId: body.folderId,
    });
  }

  @Delete("files/:id")
  @Permissions("files:delete")
  async deleteFile(@Param("id") id: string, @Request() req: { user: JwtPayload }) {
    await this.fileManagerService.deleteFile(id, req.user.orgId);
    return { ok: true };
  }
}

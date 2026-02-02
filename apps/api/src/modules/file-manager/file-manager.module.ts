import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { FilesModule } from "../files/files.module";
import { IngestionModule } from "../ingestion/ingestion.module";
import { Folder } from "./entities/folder.entity";
import { FileManagerController } from "./file-manager.controller";
import { FileManagerService } from "./file-manager.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Folder]),
    AuthModule,
    FilesModule,
    forwardRef(() => IngestionModule),
  ],
  controllers: [FileManagerController],
  providers: [FileManagerService],
  exports: [FileManagerService],
})
export class FileManagerModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { File } from "./entities/file.entity";
import { FilesController } from "./files.controller";
import { FilesService } from "./services/files.service";
import { MinioService } from "./services/minio.service";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([File]), AuthModule],
  controllers: [FilesController],
  providers: [FilesService, MinioService],
  exports: [FilesService, MinioService, TypeOrmModule],
})
export class FilesModule {}

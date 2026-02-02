import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeOrmConfig } from "./config/typeorm.config";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { FileManagerModule } from "./modules/file-manager/file-manager.module";
import { FilesModule } from "./modules/files/files.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { IngestionModule } from "./modules/ingestion/ingestion.module";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "apps/api/.env"],
    }),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmConfig }),
    AuthModule,
    DashboardModule,
    FileManagerModule,
    FilesModule,
    IdentityModule,
    IngestionModule,
    KnowledgeModule,
  ],
})
export class AppModule {}

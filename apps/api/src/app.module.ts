import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { typeOrmConfig } from "./config/typeorm.config";
import { loggerConfig, LoggingInterceptor } from "./common/logger";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ChatModule } from "./modules/chat/chat.module";
import { FileManagerModule } from "./modules/file-manager/file-manager.module";
import { FilesModule } from "./modules/files/files.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { IngestionModule } from "./modules/ingestion/ingestion.module";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module";
import { BookingModule } from "./modules/booking/booking.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "apps/api/.env"],
    }),
    LoggerModule.forRoot(loggerConfig()),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmConfig }),
    AuthModule,
    ChatModule,
    DashboardModule,
    FileManagerModule,
    FilesModule,
    IdentityModule,
    IngestionModule,
    KnowledgeModule,
    BookingModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

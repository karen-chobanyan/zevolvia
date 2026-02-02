import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { IngestionModule } from "../ingestion/ingestion.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatMessage } from "./entities/chat-message.entity";
import { ChatSession } from "./entities/chat-session.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessage]), AuthModule, IngestionModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

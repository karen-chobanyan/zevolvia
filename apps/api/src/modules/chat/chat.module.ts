import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { BookingModule } from "../booking/booking.module";
import { IngestionModule } from "../ingestion/ingestion.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatMessage } from "./entities/chat-message.entity";
import { ChatSession } from "./entities/chat-session.entity";
import { ChatToolExecutor } from "./tools/tool-executor";
import { UserProfile } from "../profile/entities/user-profile.entity";
import { Membership } from "../identity/entities/membership.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, UserProfile, Membership]),
    AuthModule,
    BookingModule,
    IngestionModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatToolExecutor],
})
export class ChatModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Org } from "../identity/entities/org.entity";
import { Client } from "../booking/entities/client.entity";
import { SmsController } from "./sms.controller";
import { SmsService } from "./sms.service";
import { SmsMessage } from "./entities/sms-message.entity";
import { ChatSession } from "../chat/entities/chat-session.entity";
import { ChatMessage } from "../chat/entities/chat-message.entity";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Org, Client, SmsMessage, ChatSession, ChatMessage]),
    ChatModule,
  ],
  controllers: [SmsController],
  providers: [SmsService],
})
export class SmsModule {}

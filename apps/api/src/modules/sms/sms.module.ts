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
import { SmsRetentionSettings } from "./entities/sms-retention-settings.entity";
import { Booking } from "../booking/entities/booking.entity";
import { SmsRetentionService } from "./sms-retention.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Org,
      Client,
      Booking,
      SmsMessage,
      SmsRetentionSettings,
      ChatSession,
      ChatMessage,
    ]),
    ChatModule,
  ],
  controllers: [SmsController],
  providers: [SmsService, SmsRetentionService],
  exports: [SmsRetentionService],
})
export class SmsModule {}

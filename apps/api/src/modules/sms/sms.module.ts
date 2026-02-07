import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Org } from "../identity/entities/org.entity";
import { Client } from "../booking/entities/client.entity";
import { SmsController } from "./sms.controller";
import { SmsService } from "./sms.service";
import { SmsMessage } from "./entities/sms-message.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Org, Client, SmsMessage])],
  controllers: [SmsController],
  providers: [SmsService],
})
export class SmsModule {}

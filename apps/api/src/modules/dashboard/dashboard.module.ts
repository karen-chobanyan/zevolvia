import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { Membership } from "../identity/entities/membership.entity";
import { Document } from "../knowledge/entities/document.entity";
import { SmsModule } from "../sms/sms.module";

@Module({
  imports: [TypeOrmModule.forFeature([Membership, Document]), SmsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

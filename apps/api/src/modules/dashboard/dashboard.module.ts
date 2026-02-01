import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { Membership } from "../identity/entities/membership.entity";
import { Document } from "../knowledge/entities/document.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Membership, Document])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

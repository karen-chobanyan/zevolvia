import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Membership } from "../identity/entities/membership.entity";
import { Org } from "../identity/entities/org.entity";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { BillingCustomer } from "./entities/billing-customer.entity";
import { BillingSubscription } from "./entities/billing-subscription.entity";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([BillingCustomer, BillingSubscription, Membership, Org]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

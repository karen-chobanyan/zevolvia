import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Service } from "./entities/service.entity";
import { Client } from "./entities/client.entity";
import { Booking } from "./entities/booking.entity";
import { StaffService } from "./entities/staff-service.entity";
import { ServicesService } from "./services/services.service";
import { ClientsService } from "./services/clients.service";
import { StaffAvailabilityService } from "./services/staff-availability.service";
import { BookingsService } from "./services/bookings.service";
import { StaffServicesService } from "./services/staff-services.service";
import { ServicesController } from "./controllers/services.controller";
import { ClientsController } from "./controllers/clients.controller";
import { StaffAvailabilityController } from "./controllers/staff-availability.controller";
import { BookingsController } from "./controllers/bookings.controller";
import { StaffServicesController } from "./controllers/staff-services.controller";
import { AuthModule } from "../auth/auth.module";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    TypeOrmModule.forFeature([Service, Client, Booking, StaffService]),
  ],
  controllers: [
    ServicesController,
    ClientsController,
    StaffAvailabilityController,
    BookingsController,
    StaffServicesController,
  ],
  providers: [
    ServicesService,
    ClientsService,
    StaffAvailabilityService,
    BookingsService,
    StaffServicesService,
  ],
  exports: [
    ServicesService,
    ClientsService,
    StaffAvailabilityService,
    BookingsService,
    StaffServicesService,
  ],
})
export class BookingModule {}

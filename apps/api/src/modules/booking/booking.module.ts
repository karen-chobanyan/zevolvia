import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Service } from "./entities/service.entity";
import { Client } from "./entities/client.entity";
import { StaffAvailability } from "./entities/staff-availability.entity";
import { Booking } from "./entities/booking.entity";
import { ServicesService } from "./services/services.service";
import { ClientsService } from "./services/clients.service";
import { StaffAvailabilityService } from "./services/staff-availability.service";
import { BookingsService } from "./services/bookings.service";
import { ServicesController } from "./controllers/services.controller";
import { ClientsController } from "./controllers/clients.controller";
import { StaffAvailabilityController } from "./controllers/staff-availability.controller";
import { BookingsController } from "./controllers/bookings.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Service, Client, StaffAvailability, Booking])],
  controllers: [
    ServicesController,
    ClientsController,
    StaffAvailabilityController,
    BookingsController,
  ],
  providers: [ServicesService, ClientsService, StaffAvailabilityService, BookingsService],
  exports: [ServicesService, ClientsService, StaffAvailabilityService, BookingsService],
})
export class BookingModule {}

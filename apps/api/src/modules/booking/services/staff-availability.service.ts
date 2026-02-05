import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StaffAvailability } from "../entities/staff-availability.entity";
import { SetStaffAvailabilityDto, AvailableSlotDto } from "../dto/staff-availability.dto";
import { Booking } from "../entities/booking.entity";
import { BookingStatus } from "../../../common/enums";

@Injectable()
export class StaffAvailabilityService {
  constructor(
    @InjectRepository(StaffAvailability)
    private readonly availabilityRepository: Repository<StaffAvailability>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async findAll(orgId: string): Promise<StaffAvailability[]> {
    return this.availabilityRepository
      .createQueryBuilder("availability")
      .leftJoinAndSelect("availability.user", "user")
      .where("availability.orgId = :orgId", { orgId })
      .orderBy("availability.userId", "ASC")
      .addOrderBy("availability.dayOfWeek", "ASC")
      .getMany();
  }

  async findByStaff(orgId: string, userId: string): Promise<StaffAvailability[]> {
    return this.availabilityRepository
      .createQueryBuilder("availability")
      .leftJoinAndSelect("availability.user", "user")
      .where("availability.orgId = :orgId", { orgId })
      .andWhere("availability.userId = :userId", { userId })
      .orderBy("availability.dayOfWeek", "ASC")
      .getMany();
  }

  async setSchedule(
    orgId: string,
    userId: string,
    schedules: SetStaffAvailabilityDto[],
  ): Promise<StaffAvailability[]> {
    // Validate schedules
    for (const schedule of schedules) {
      if (schedule.startTime >= schedule.endTime) {
        throw new BadRequestException(
          `Invalid time range for day ${schedule.dayOfWeek}: start time must be before end time`,
        );
      }
    }

    // Delete existing availability for this user
    await this.availabilityRepository
      .createQueryBuilder()
      .delete()
      .where("orgId = :orgId", { orgId })
      .andWhere("userId = :userId", { userId })
      .execute();

    // Create new availability records
    const availabilities = schedules.map((schedule) =>
      this.availabilityRepository.create({
        orgId,
        userId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isAvailable: schedule.isAvailable ?? true,
      }),
    );

    return this.availabilityRepository.save(availabilities);
  }

  async getAvailableSlots(
    orgId: string,
    staffId: string,
    date: string,
    durationMinutes: number,
    slotIntervalMinutes = 15,
  ): Promise<AvailableSlotDto[]> {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get staff availability for this day
    const availability = await this.availabilityRepository.findOne({
      where: {
        orgId,
        userId: staffId,
        dayOfWeek,
        isAvailable: true,
      },
    });

    if (!availability) {
      return [];
    }

    // Parse working hours
    const [startHour, startMin] = availability.startTime.split(":").map(Number);
    const [endHour, endMin] = availability.endTime.split(":").map(Number);

    const workStart = new Date(targetDate);
    workStart.setHours(startHour, startMin, 0, 0);

    const workEnd = new Date(targetDate);
    workEnd.setHours(endHour, endMin, 0, 0);

    // Get existing bookings for this staff on this day
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingBookings = await this.bookingRepository
      .createQueryBuilder("booking")
      .where("booking.staffId = :staffId", { staffId })
      .andWhere("booking.startTime >= :dayStart", { dayStart })
      .andWhere("booking.endTime <= :dayEnd", { dayEnd })
      .andWhere("booking.status NOT IN (:...excluded)", {
        excluded: [BookingStatus.Cancelled, BookingStatus.NoShow],
      })
      .orderBy("booking.startTime", "ASC")
      .getMany();

    // Generate available slots
    const slots: AvailableSlotDto[] = [];
    let currentTime = new Date(workStart);

    while (currentTime < workEnd) {
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);

      if (slotEnd > workEnd) {
        break;
      }

      // Check if slot overlaps with any existing booking
      const hasConflict = existingBookings.some((booking) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        return currentTime < bookingEnd && slotEnd > bookingStart;
      });

      if (!hasConflict) {
        slots.push(new AvailableSlotDto(currentTime.toISOString(), slotEnd.toISOString()));
      }

      // Move to next slot
      currentTime = new Date(currentTime.getTime() + slotIntervalMinutes * 60 * 1000);
    }

    return slots;
  }
}

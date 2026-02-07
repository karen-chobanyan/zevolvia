import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AvailableSlotDto, WorkingHoursDto } from "../dto/staff-availability.dto";
import { Booking } from "../entities/booking.entity";
import { BookingStatus } from "../../../common/enums";

@Injectable()
export class StaffAvailabilityService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  private static readonly WORK_START = "09:00";
  private static readonly WORK_END = "20:00";

  async getAvailableSlots(
    orgId: string,
    staffId: string,
    date: string,
    durationMinutes: number,
    slotIntervalMinutes = 15,
  ): Promise<AvailableSlotDto[]> {
    const targetDate = new Date(date);
    if (!date || Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException("Invalid date format. Use YYYY-MM-DD.");
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new BadRequestException("durationMinutes must be a positive number.");
    }

    if (!Number.isFinite(slotIntervalMinutes) || slotIntervalMinutes <= 0) {
      throw new BadRequestException("slotIntervalMinutes must be a positive number.");
    }

    const { workStart, workEnd } = this.buildWorkingWindow(targetDate);
    const durationMs = durationMinutes * 60 * 1000;
    const intervalMs = slotIntervalMinutes * 60 * 1000;

    const workWindowMs = workEnd.getTime() - workStart.getTime();
    if (workEnd.getTime() <= workStart.getTime() || durationMs > workWindowMs) {
      return [];
    }

    const existingBookings = await this.bookingRepository
      .createQueryBuilder("booking")
      .where("booking.orgId = :orgId", { orgId })
      .andWhere("booking.staffId = :staffId", { staffId })
      .andWhere("booking.status NOT IN (:...excluded)", {
        excluded: [BookingStatus.Cancelled, BookingStatus.NoShow],
      })
      .andWhere("booking.startTime < :workEnd", { workEnd })
      .andWhere("booking.endTime > :workStart", { workStart })
      .orderBy("booking.startTime", "ASC")
      .getMany();

    const blockedIntervals = this.mergeIntervals(
      existingBookings.map((booking) => ({
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
      })),
    );

    const slots: AvailableSlotDto[] = [];
    let currentTime = new Date(workStart);
    let blockedIndex = 0;

    while (currentTime.getTime() + durationMs <= workEnd.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + durationMs);

      while (
        blockedIndex < blockedIntervals.length &&
        blockedIntervals[blockedIndex].end.getTime() <= currentTime.getTime()
      ) {
        blockedIndex += 1;
      }

      const blocked = blockedIntervals[blockedIndex];
      const hasConflict =
        blocked &&
        currentTime.getTime() < blocked.end.getTime() &&
        slotEnd.getTime() > blocked.start.getTime();

      if (!hasConflict) {
        slots.push(new AvailableSlotDto(currentTime.toISOString(), slotEnd.toISOString()));
      }

      currentTime = new Date(currentTime.getTime() + intervalMs);
    }

    return slots;
  }

  getWorkingHours(_orgId: string, staffId?: string): WorkingHoursDto[] {
    // TODO: replace fixed hours with org/staff-specific working schedules.
    return this.buildDefaultWorkingHours(staffId);
  }

  private buildDefaultWorkingHours(staffId?: string): WorkingHoursDto[] {
    return Array.from({ length: 7 }, (_, dayOfWeek) => ({
      staffId,
      dayOfWeek,
      startTime: StaffAvailabilityService.WORK_START,
      endTime: StaffAvailabilityService.WORK_END,
      isAvailable: true,
    }));
  }

  private buildWorkingWindow(targetDate: Date): { workStart: Date; workEnd: Date } {
    const workStart = new Date(targetDate);
    const [startHour, startMinute] = StaffAvailabilityService.WORK_START.split(":").map(Number);
    workStart.setHours(startHour, startMinute, 0, 0);

    const workEnd = new Date(targetDate);
    const [endHour, endMinute] = StaffAvailabilityService.WORK_END.split(":").map(Number);
    workEnd.setHours(endHour, endMinute, 0, 0);

    return { workStart, workEnd };
  }

  private mergeIntervals(
    intervals: Array<{ start: Date; end: Date }>,
  ): Array<{ start: Date; end: Date }> {
    if (intervals.length <= 1) {
      return intervals;
    }

    const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());

    const merged: Array<{ start: Date; end: Date }> = [sorted[0]];

    for (let i = 1; i < sorted.length; i += 1) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      if (current.start.getTime() <= last.end.getTime()) {
        if (current.end.getTime() > last.end.getTime()) {
          last.end = current.end;
        }
      } else {
        merged.push(current);
      }
    }

    return merged;
  }
}

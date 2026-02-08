import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { isValid, parseISO } from "date-fns";
import { AvailableSlotDto, WorkingHoursDto } from "../dto/staff-availability.dto";
import { Booking } from "../entities/booking.entity";
import { BookingStatus } from "../../../common/enums";
import { Org } from "../../identity/entities/org.entity";

@Injectable()
export class StaffAvailabilityService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Org)
    private readonly orgRepository: Repository<Org>,
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
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException("Invalid date format. Use YYYY-MM-DD.");
    }
    const targetDate = parseISO(date);
    if (!isValid(targetDate)) {
      throw new BadRequestException("Invalid date format. Use YYYY-MM-DD.");
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new BadRequestException("durationMinutes must be a positive number.");
    }

    if (!Number.isFinite(slotIntervalMinutes) || slotIntervalMinutes <= 0) {
      throw new BadRequestException("slotIntervalMinutes must be a positive number.");
    }

    const { startTime, endTime, timeZone } = await this.getOrgWorkingHours(orgId);
    const { workStart, workEnd } = this.buildWorkingWindow(
      date,
      targetDate,
      startTime,
      endTime,
      timeZone,
    );
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

  async getWorkingHours(orgId: string, staffId?: string): Promise<WorkingHoursDto[]> {
    // TODO: replace fixed hours with org/staff-specific working schedules.
    const { startTime, endTime } = await this.getOrgWorkingHours(orgId);
    return this.buildDefaultWorkingHours(staffId, startTime, endTime);
  }

  private buildDefaultWorkingHours(
    staffId: string | undefined,
    startTime: string,
    endTime: string,
  ): WorkingHoursDto[] {
    return Array.from({ length: 7 }, (_, dayOfWeek) => ({
      staffId,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable: true,
    }));
  }

  private buildWorkingWindow(
    dateIso: string,
    targetDate: Date,
    startTime: string,
    endTime: string,
    timeZone?: string | null,
  ): { workStart: Date; workEnd: Date } {
    if (timeZone) {
      try {
        return {
          workStart: this.buildZonedDate(dateIso, startTime, timeZone),
          workEnd: this.buildZonedDate(dateIso, endTime, timeZone),
        };
      } catch {
        // Fall back to local time if timezone conversion fails.
      }
    }

    const workStart = new Date(targetDate);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    workStart.setHours(startHour, startMinute, 0, 0);

    const workEnd = new Date(targetDate);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    workEnd.setHours(endHour, endMinute, 0, 0);

    return { workStart, workEnd };
  }

  private buildZonedDate(dateIso: string, time: string, timeZone: string): Date {
    const [year, month, day] = dateIso.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
    const tzDateString = utcDate.toLocaleString("en-US", { timeZone });
    const tzDate = new Date(tzDateString);
    const offsetMs = utcDate.getTime() - tzDate.getTime();
    return new Date(utcDate.getTime() + offsetMs);
  }

  private async getOrgWorkingHours(
    orgId: string,
  ): Promise<{ startTime: string; endTime: string; timeZone?: string | null }> {
    const org = await this.orgRepository.findOne({
      where: { id: orgId },
      select: ["workingHoursStart", "workingHoursEnd", "timeZone"],
    });

    const normalizeTime = (value?: string) => {
      if (!value) {
        return value;
      }
      const parts = value.split(":");
      if (parts.length < 2) {
        return value;
      }
      const hours = parts[0].padStart(2, "0");
      const minutes = parts[1].padStart(2, "0");
      return `${hours}:${minutes}`;
    };

    return {
      startTime: normalizeTime(org?.workingHoursStart) ?? StaffAvailabilityService.WORK_START,
      endTime: normalizeTime(org?.workingHoursEnd) ?? StaffAvailabilityService.WORK_END,
      timeZone: org?.timeZone ?? null,
    };
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

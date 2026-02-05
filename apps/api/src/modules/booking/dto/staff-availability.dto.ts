import { StaffAvailability } from "../entities/staff-availability.entity";

export interface SetStaffAvailabilityDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface BulkSetStaffAvailabilityDto {
  userId: string;
  schedule: SetStaffAvailabilityDto[];
}

export interface GetAvailableSlotsDto {
  staffId: string;
  date: string;
  durationMinutes: number;
}

export class StaffAvailabilityResponseDto {
  id: string;
  orgId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;

  private constructor(data: StaffAvailabilityResponseDto) {
    this.id = data.id;
    this.orgId = data.orgId;
    this.userId = data.userId;
    this.userName = data.userName;
    this.userEmail = data.userEmail;
    this.dayOfWeek = data.dayOfWeek;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.isAvailable = data.isAvailable;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromEntity(availability: StaffAvailability): StaffAvailabilityResponseDto {
    return new StaffAvailabilityResponseDto({
      id: availability.id,
      orgId: availability.orgId,
      userId: availability.userId,
      userName: availability.user?.name ?? null,
      userEmail: availability.user?.email ?? "",
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isAvailable: availability.isAvailable,
      createdAt: availability.createdAt,
      updatedAt: availability.updatedAt,
    });
  }
}

export class AvailableSlotDto {
  startTime: string;
  endTime: string;

  constructor(startTime: string, endTime: string) {
    this.startTime = startTime;
    this.endTime = endTime;
  }
}

export interface GetAvailableSlotsDto {
  staffId: string;
  date: string;
  durationMinutes: number;
}

export interface WorkingHoursDto {
  staffId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export class AvailableSlotDto {
  startTime: string;
  endTime: string;

  constructor(startTime: string, endTime: string) {
    this.startTime = startTime;
    this.endTime = endTime;
  }
}

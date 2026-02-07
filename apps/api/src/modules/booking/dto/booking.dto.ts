import { BookingStatus } from "../../../common/enums";
import { Booking } from "../entities/booking.entity";

export interface CreateBookingDto {
  clientId?: string;
  clientName?: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  notes?: string;
}

export interface UpdateBookingDto {
  clientId?: string;
  clientName?: string;
  staffId?: string;
  serviceId?: string;
  startTime?: string;
  status?: BookingStatus;
  notes?: string;
}

export interface CheckAvailabilityDto {
  orgId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  excludeBookingId?: string;
}

export class BookingResponseDto {
  id: string;
  orgId: string;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  staffId: string;
  staffName: string | null;
  staffEmail: string;
  serviceId: string;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  serviceColor: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  private constructor(data: BookingResponseDto) {
    this.id = data.id;
    this.orgId = data.orgId;
    this.clientId = data.clientId;
    this.clientName = data.clientName;
    this.clientEmail = data.clientEmail;
    this.clientPhone = data.clientPhone;
    this.staffId = data.staffId;
    this.staffName = data.staffName;
    this.staffEmail = data.staffEmail;
    this.serviceId = data.serviceId;
    this.serviceName = data.serviceName;
    this.serviceDurationMinutes = data.serviceDurationMinutes;
    this.servicePrice = data.servicePrice;
    this.serviceColor = data.serviceColor;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.status = data.status;
    this.notes = data.notes;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromEntity(booking: Booking): BookingResponseDto {
    return new BookingResponseDto({
      id: booking.id,
      orgId: booking.orgId,
      clientId: booking.clientId,
      clientName: booking.client?.name ?? booking.clientName,
      clientEmail: booking.client?.email ?? null,
      clientPhone: booking.client?.phone ?? null,
      staffId: booking.staffId,
      staffName: booking.staff?.name ?? null,
      staffEmail: booking.staff?.email ?? "",
      serviceId: booking.serviceId,
      serviceName: booking.service?.name ?? "",
      serviceDurationMinutes: booking.service?.durationMinutes ?? 0,
      servicePrice: Number(booking.service?.price ?? 0),
      serviceColor: booking.service?.color ?? "#3b82f6",
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    });
  }
}

export class CalendarEventDto {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    bookingId: string;
    clientId: string | null;
    clientName: string | null;
    staffId: string;
    staffName: string | null;
    serviceId: string;
    serviceName: string;
    status: BookingStatus;
    notes: string | null;
  };

  private constructor(data: CalendarEventDto) {
    this.id = data.id;
    this.title = data.title;
    this.start = data.start;
    this.end = data.end;
    this.color = data.color;
    this.extendedProps = data.extendedProps;
  }

  static fromBooking(booking: Booking): CalendarEventDto {
    const clientName = booking.client?.name ?? booking.clientName ?? "Walk-in";
    const serviceName = booking.service?.name ?? "Service";

    return new CalendarEventDto({
      id: booking.id,
      title: `${clientName} - ${serviceName}`,
      start: booking.startTime.toISOString(),
      end: booking.endTime.toISOString(),
      color: booking.service?.color ?? "#3b82f6",
      extendedProps: {
        bookingId: booking.id,
        clientId: booking.clientId,
        clientName,
        staffId: booking.staffId,
        staffName: booking.staff?.name ?? null,
        serviceId: booking.serviceId,
        serviceName,
        status: booking.status,
        notes: booking.notes,
      },
    });
  }
}

export enum BookingStatus {
  Scheduled = "scheduled",
  Confirmed = "confirmed",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
  NoShow = "no_show",
}

export type Service = {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  orgId: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isWalkIn: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
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
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEvent = {
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
};

export type AvailableSlot = {
  startTime: string;
  endTime: string;
};

export type StaffMember = {
  id: string;
  name: string | null;
  email: string;
};

export type CreateServiceDto = {
  name: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  color?: string;
  isActive?: boolean;
};

export type UpdateServiceDto = Partial<CreateServiceDto>;

export type CreateClientDto = {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  isWalkIn?: boolean;
};

export type UpdateClientDto = Partial<CreateClientDto>;

export type CreateBookingDto = {
  clientId?: string;
  clientName?: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  notes?: string;
};

export type UpdateBookingDto = {
  clientId?: string;
  clientName?: string;
  staffId?: string;
  serviceId?: string;
  startTime?: string;
  status?: BookingStatus;
  notes?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

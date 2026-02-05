import api from "@/lib/axios";
import {
  Service,
  Client,
  Booking,
  CalendarEvent,
  StaffAvailability,
  AvailableSlot,
  StaffMember,
  CreateServiceDto,
  UpdateServiceDto,
  CreateClientDto,
  UpdateClientDto,
  CreateBookingDto,
  UpdateBookingDto,
  SetStaffAvailabilityDto,
  PaginatedResponse,
} from "@/types/booking";

export const BookingApi = {
  // Services
  getServices: async (includeInactive = false): Promise<Service[]> => {
    const response = await api.get(`/services?includeInactive=${includeInactive}`);
    return response.data;
  },

  getService: async (id: string): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  createService: async (dto: CreateServiceDto): Promise<Service> => {
    const response = await api.post("/services", dto);
    return response.data;
  },

  updateService: async (id: string, dto: UpdateServiceDto): Promise<Service> => {
    const response = await api.patch(`/services/${id}`, dto);
    return response.data;
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },

  // Clients
  getClients: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Client>> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set("search", params.search);
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    const response = await api.get(`/clients?${queryParams.toString()}`);
    return response.data;
  },

  searchClients: async (query: string, limit = 10): Promise<Client[]> => {
    const response = await api.get(`/clients/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  getClient: async (id: string): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  createClient: async (dto: CreateClientDto): Promise<Client> => {
    const response = await api.post("/clients", dto);
    return response.data;
  },

  updateClient: async (id: string, dto: UpdateClientDto): Promise<Client> => {
    const response = await api.patch(`/clients/${id}`, dto);
    return response.data;
  },

  deleteClient: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },

  // Staff Availability
  getStaffAvailability: async (): Promise<StaffAvailability[]> => {
    const response = await api.get("/staff-availability");
    return response.data;
  },

  getStaffAvailabilityByUser: async (userId: string): Promise<StaffAvailability[]> => {
    const response = await api.get(`/staff-availability/staff/${userId}`);
    return response.data;
  },

  setStaffAvailability: async (
    userId: string,
    schedules: SetStaffAvailabilityDto[],
  ): Promise<StaffAvailability[]> => {
    const response = await api.put(`/staff-availability/staff/${userId}`, schedules);
    return response.data;
  },

  getAvailableSlots: async (
    staffId: string,
    date: string,
    durationMinutes: number,
    slotInterval = 15,
  ): Promise<AvailableSlot[]> => {
    const response = await api.get(
      `/staff-availability/slots?staffId=${staffId}&date=${date}&durationMinutes=${durationMinutes}&slotInterval=${slotInterval}`,
    );
    return response.data;
  },

  // Bookings
  getBookings: async (params?: {
    staffId?: string;
    clientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Booking>> => {
    const queryParams = new URLSearchParams();
    if (params?.staffId) queryParams.set("staffId", params.staffId);
    if (params?.clientId) queryParams.set("clientId", params.clientId);
    if (params?.status) queryParams.set("status", params.status);
    if (params?.startDate) queryParams.set("startDate", params.startDate);
    if (params?.endDate) queryParams.set("endDate", params.endDate);
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    const response = await api.get(`/bookings?${queryParams.toString()}`);
    return response.data;
  },

  getCalendarEvents: async (
    startDate: string,
    endDate: string,
    staffId?: string,
  ): Promise<CalendarEvent[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    if (staffId) params.set("staffId", staffId);
    const response = await api.get(`/bookings/calendar?${params.toString()}`);
    return response.data;
  },

  getBooking: async (id: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  createBooking: async (dto: CreateBookingDto): Promise<Booking> => {
    const response = await api.post("/bookings", dto);
    return response.data;
  },

  updateBooking: async (id: string, dto: UpdateBookingDto): Promise<Booking> => {
    const response = await api.patch(`/bookings/${id}`, dto);
    return response.data;
  },

  cancelBooking: async (id: string): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data;
  },

  checkAvailability: async (
    staffId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<{ available: boolean }> => {
    const params = new URLSearchParams({ staffId, startTime, endTime });
    if (excludeBookingId) params.set("excludeBookingId", excludeBookingId);
    const response = await api.get(`/bookings/check-availability?${params.toString()}`);
    return response.data;
  },

  // Staff members (using identity API)
  getStaffMembers: async (): Promise<StaffMember[]> => {
    const response = await api.get("/identity/users");
    return response.data.map((u: { id: string; name: string | null; email: string }) => ({
      id: u.id,
      name: u.name,
      email: u.email,
    }));
  },
};

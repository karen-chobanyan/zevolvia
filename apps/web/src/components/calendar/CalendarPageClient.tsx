"use client";

import { useCallback, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import { BookingApi } from "@/services/BookingApi.service";
import { CalendarEvent, Service, StaffMember, Booking, BookingStatus } from "@/types/booking";
import BookingModal from "./BookingModal";
import BookingDetailModal from "./BookingDetailModal";
import { useModal } from "@/hooks/useModal";

type Notice = {
  type: "success" | "error";
  message: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      fallback
    );
  }
  return fallback;
};

const statusColors: Record<BookingStatus, string> = {
  [BookingStatus.Scheduled]: "#3b82f6",
  [BookingStatus.Confirmed]: "#10b981",
  [BookingStatus.InProgress]: "#f59e0b",
  [BookingStatus.Completed]: "#6b7280",
  [BookingStatus.Cancelled]: "#ef4444",
  [BookingStatus.NoShow]: "#dc2626",
};

export default function CalendarPageClient() {
  const bookingModal = useModal();
  const detailModal = useModal();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      const [servicesData, staffData] = await Promise.all([
        BookingApi.getServices(),
        BookingApi.getStaffMembers(),
      ]);
      setServices(servicesData);
      setStaff(staffData);
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to load data") });
    }
  }, []);

  const loadEvents = useCallback(async () => {
    if (!dateRange) return;

    setLoading(true);
    try {
      const eventsData = await BookingApi.getCalendarEvents(
        dateRange.start.toISOString(),
        dateRange.end.toISOString(),
        selectedStaffId || undefined,
      );
      setEvents(eventsData);
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to load calendar events") });
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedStaffId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
    setSelectedBookingId(null);
    bookingModal.openModal();
  };

  const handleEventClick = async (clickInfo: EventClickArg) => {
    const bookingId = clickInfo.event.extendedProps.bookingId;
    setSelectedBookingId(bookingId);

    try {
      const booking = await BookingApi.getBooking(bookingId);
      setSelectedBooking(booking);
      detailModal.openModal();
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to load booking details") });
    }
  };

  const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
    setDateRange({ start: dateInfo.start, end: dateInfo.end });
  };

  const handleBookingCreated = () => {
    bookingModal.closeModal();
    loadEvents();
    setNotice({ type: "success", message: "Booking created successfully" });
  };

  const handleBookingUpdated = () => {
    detailModal.closeModal();
    loadEvents();
    setNotice({ type: "success", message: "Booking updated successfully" });
  };

  const handleBookingCancelled = async () => {
    if (!selectedBookingId) return;

    try {
      await BookingApi.cancelBooking(selectedBookingId);
      detailModal.closeModal();
      loadEvents();
      setNotice({ type: "success", message: "Booking cancelled successfully" });
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to cancel booking") });
    }
  };

  const renderEventContent = (eventContent: EventContentArg) => {
    const status = eventContent.event.extendedProps.status as BookingStatus;
    const bgColor = statusColors[status] || eventContent.event.backgroundColor;

    return (
      <div
        className="px-1.5 py-0.5 rounded text-xs text-white overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        <div className="font-medium truncate">{eventContent.event.title}</div>
        <div className="opacity-80 truncate">{eventContent.timeText}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            notice.type === "success"
              ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/40 dark:bg-success-500/10 dark:text-success-300"
              : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300"
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Appointments</h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Staff</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setSelectedBookingId(null);
                bookingModal.openModal();
              }}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              New Booking
            </button>
          </div>
        </div>

        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            slotDuration="00:15:00"
            allDaySlot={false}
            nowIndicator={true}
            height="auto"
            loading={(isLoading) => setLoading(isLoading)}
          />
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        )}
      </div>

      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={bookingModal.closeModal}
        onCreated={handleBookingCreated}
        services={services}
        staff={staff}
        initialDate={selectedDate}
      />

      <BookingDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        booking={selectedBooking}
        onUpdated={handleBookingUpdated}
        onCancel={handleBookingCancelled}
        services={services}
        staff={staff}
      />

      <style jsx global>{`
        .calendar-wrapper .fc {
          --fc-border-color: rgb(229 231 235);
          --fc-button-bg-color: rgb(59 130 246);
          --fc-button-border-color: rgb(59 130 246);
          --fc-button-hover-bg-color: rgb(37 99 235);
          --fc-button-hover-border-color: rgb(37 99 235);
          --fc-button-active-bg-color: rgb(29 78 216);
          --fc-button-active-border-color: rgb(29 78 216);
          --fc-today-bg-color: rgba(59, 130, 246, 0.1);
        }
        .dark .calendar-wrapper .fc {
          --fc-border-color: rgb(55 65 81);
          --fc-page-bg-color: rgb(17 24 39);
          --fc-neutral-bg-color: rgb(31 41 55);
          --fc-today-bg-color: rgba(59, 130, 246, 0.2);
        }
        .calendar-wrapper .fc .fc-button {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }
        .calendar-wrapper .fc .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 600;
        }
        .calendar-wrapper .fc-theme-standard td,
        .calendar-wrapper .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }
        .calendar-wrapper .fc .fc-col-header-cell-cushion,
        .calendar-wrapper .fc .fc-daygrid-day-number {
          color: inherit;
        }
        .dark .calendar-wrapper .fc .fc-col-header-cell-cushion,
        .dark .calendar-wrapper .fc .fc-daygrid-day-number {
          color: rgb(229 231 235);
        }
      `}</style>
    </div>
  );
}

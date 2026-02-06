"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

// Distinct color palette for staff members
const STAFF_COLORS = [
  { bg: "#8b5cf6", border: "#7c3aed", text: "#ffffff" }, // Purple
  { bg: "#06b6d4", border: "#0891b2", text: "#ffffff" }, // Cyan
  { bg: "#f59e0b", border: "#d97706", text: "#ffffff" }, // Amber
  { bg: "#ec4899", border: "#db2777", text: "#ffffff" }, // Pink
  { bg: "#10b981", border: "#059669", text: "#ffffff" }, // Emerald
  { bg: "#3b82f6", border: "#2563eb", text: "#ffffff" }, // Blue
  { bg: "#ef4444", border: "#dc2626", text: "#ffffff" }, // Red
  { bg: "#84cc16", border: "#65a30d", text: "#ffffff" }, // Lime
  { bg: "#f97316", border: "#ea580c", text: "#ffffff" }, // Orange
  { bg: "#6366f1", border: "#4f46e5", text: "#ffffff" }, // Indigo
];

const statusBadgeColors: Record<BookingStatus, { bg: string; text: string }> = {
  [BookingStatus.Scheduled]: { bg: "rgba(255,255,255,0.2)", text: "#ffffff" },
  [BookingStatus.Confirmed]: { bg: "rgba(16,185,129,0.3)", text: "#ffffff" },
  [BookingStatus.InProgress]: { bg: "rgba(245,158,11,0.3)", text: "#ffffff" },
  [BookingStatus.Completed]: { bg: "rgba(107,114,128,0.3)", text: "#ffffff" },
  [BookingStatus.Cancelled]: { bg: "rgba(239,68,68,0.3)", text: "#ffffff" },
  [BookingStatus.NoShow]: { bg: "rgba(220,38,38,0.3)", text: "#ffffff" },
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

  // Create a map of staff ID to color
  const staffColorMap = useMemo(() => {
    const map = new Map<string, (typeof STAFF_COLORS)[0]>();
    staff.forEach((member, index) => {
      map.set(member.id, STAFF_COLORS[index % STAFF_COLORS.length]);
    });
    return map;
  }, [staff]);

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

  // Transform events to include staff colors
  const coloredEvents = useMemo(() => {
    return events.map((event) => {
      const staffId = event.extendedProps?.staffId;
      const color = staffColorMap.get(staffId) || STAFF_COLORS[0];
      return {
        ...event,
        backgroundColor: color.bg,
        borderColor: color.border,
        textColor: color.text,
      };
    });
  }, [events, staffColorMap]);

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

  const handleStaffFilter = (staffId: string) => {
    setSelectedStaffId(staffId === selectedStaffId ? "" : staffId);
  };

  const renderEventContent = (eventContent: EventContentArg) => {
    const { event } = eventContent;
    const status = (event.extendedProps?.status as BookingStatus) || BookingStatus.Scheduled;
    const serviceName = event.extendedProps?.serviceName || "";
    const clientName = event.extendedProps?.clientName || "";
    const staffName = event.extendedProps?.staffName || "";
    const statusBadge = statusBadgeColors[status] || statusBadgeColors[BookingStatus.Scheduled];

    // Build tooltip text
    const tooltipParts = [serviceName || event.title];
    if (clientName) tooltipParts.push(`Client: ${clientName}`);
    if (staffName) tooltipParts.push(`Staff: ${staffName}`);
    tooltipParts.push(eventContent.timeText);
    if (status !== BookingStatus.Scheduled) {
      tooltipParts.push(`Status: ${status}`);
    }
    const tooltipText = tooltipParts.join("\n");

    return (
      <div className="h-full w-full overflow-hidden p-1" title={tooltipText}>
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold leading-tight">
              {serviceName || event.title}
            </div>
            {clientName && (
              <div className="truncate text-[10px] opacity-90 leading-tight">{clientName}</div>
            )}
          </div>
          {status !== BookingStatus.Scheduled && (
            <span
              className="shrink-0 rounded px-1 text-[9px] font-medium uppercase"
              style={{ backgroundColor: statusBadge.bg }}
            >
              {status === BookingStatus.Confirmed && "✓"}
              {status === BookingStatus.InProgress && "●"}
              {status === BookingStatus.Completed && "Done"}
              {status === BookingStatus.Cancelled && "✗"}
              {status === BookingStatus.NoShow && "NS"}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-80">
          <span>{eventContent.timeText}</span>
          {!selectedStaffId && staffName && (
            <>
              <span>•</span>
              <span className="truncate">{staffName}</span>
            </>
          )}
        </div>
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
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Appointments</h2>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setSelectedBookingId(null);
              bookingModal.openModal();
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Booking
          </button>
        </div>

        {/* Staff Filter Chips */}
        {staff.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
              Staff:
            </span>
            <button
              onClick={() => setSelectedStaffId("")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                !selectedStaffId
                  ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              All
            </button>
            {staff.map((member, index) => {
              const color = STAFF_COLORS[index % STAFF_COLORS.length];
              const isSelected = selectedStaffId === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => handleStaffFilter(member.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900"
                      : "hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: isSelected ? color.bg : `${color.bg}20`,
                    color: isSelected ? color.text : color.bg,
                    borderColor: color.border,
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color.bg }} />
                  {member.name || member.email}
                </button>
              );
            })}
          </div>
        )}

        {/* Calendar */}
        <div className="calendar-wrapper relative">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={coloredEvents}
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
            slotLabelInterval="01:00:00"
            allDaySlot={false}
            nowIndicator={true}
            height="auto"
            expandRows={true}
            stickyHeaderDates={true}
            eventMinHeight={50}
            slotEventOverlap={false}
            loading={(isLoading) => setLoading(isLoading)}
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">Status:</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            Scheduled
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Confirmed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-500" />
            Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Cancelled
          </span>
        </div>
      </div>

      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={bookingModal.closeModal}
        onCreated={handleBookingCreated}
        services={services}
        staff={staff}
        initialDate={selectedDate}
        initialStaffId={selectedStaffId || undefined}
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
          --fc-today-bg-color: rgba(59, 130, 246, 0.05);
          --fc-now-indicator-color: rgb(239 68 68);
        }
        .dark .calendar-wrapper .fc {
          --fc-border-color: rgb(55 65 81);
          --fc-page-bg-color: rgb(17 24 39);
          --fc-neutral-bg-color: rgb(31 41 55);
          --fc-today-bg-color: rgba(59, 130, 246, 0.1);
        }
        .calendar-wrapper .fc .fc-button {
          font-size: 0.8125rem;
          padding: 0.5rem 0.875rem;
          border-radius: 0.5rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        .calendar-wrapper .fc .fc-button-group {
          gap: 0.25rem;
        }
        .calendar-wrapper .fc .fc-button-group .fc-button {
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
        .calendar-wrapper .fc .fc-col-header-cell-cushion {
          padding: 0.75rem 0.5rem;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .calendar-wrapper .fc .fc-timegrid-slot-label-cushion {
          font-size: 0.75rem;
          color: rgb(107 114 128);
        }
        .dark .calendar-wrapper .fc .fc-col-header-cell-cushion,
        .dark .calendar-wrapper .fc .fc-daygrid-day-number {
          color: rgb(229 231 235);
        }
        .dark .calendar-wrapper .fc .fc-timegrid-slot-label-cushion {
          color: rgb(156 163 175);
        }
        .calendar-wrapper .fc .fc-timegrid-event {
          border-radius: 0.375rem;
          border-width: 0;
          border-left-width: 3px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          cursor: pointer;
        }
        .calendar-wrapper .fc .fc-timegrid-event .fc-event-main {
          padding: 0;
        }
        .calendar-wrapper .fc .fc-daygrid-event {
          border-radius: 0.375rem;
          border-width: 0;
          border-left-width: 3px;
          padding: 0.125rem 0.375rem;
        }
        .calendar-wrapper .fc .fc-now-indicator-line {
          border-width: 2px;
          border-color: var(--fc-now-indicator-color);
        }
        .calendar-wrapper .fc .fc-now-indicator-arrow {
          border-color: var(--fc-now-indicator-color);
          border-width: 6px;
        }
        .calendar-wrapper .fc .fc-timegrid-now-indicator-container {
          overflow: visible;
        }
        .calendar-wrapper .fc .fc-highlight {
          background: rgba(59, 130, 246, 0.15);
        }
        .calendar-wrapper .fc .fc-timegrid-col-events {
          margin: 0 2px;
        }
      `}</style>
    </div>
  );
}

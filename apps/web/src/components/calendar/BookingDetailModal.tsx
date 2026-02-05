"use client";

import { useState } from "react";
import { Modal } from "@/ui/modal";
import { BookingApi } from "@/services/BookingApi.service";
import { Booking, BookingStatus, Service, StaffMember } from "@/types/booking";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onUpdated: () => void;
  onCancel: () => void;
  services: Service[];
  staff: StaffMember[];
};

const statusLabels: Record<BookingStatus, string> = {
  [BookingStatus.Scheduled]: "Scheduled",
  [BookingStatus.Confirmed]: "Confirmed",
  [BookingStatus.InProgress]: "In Progress",
  [BookingStatus.Completed]: "Completed",
  [BookingStatus.Cancelled]: "Cancelled",
  [BookingStatus.NoShow]: "No Show",
};

const statusColors: Record<BookingStatus, string> = {
  [BookingStatus.Scheduled]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [BookingStatus.Confirmed]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [BookingStatus.InProgress]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [BookingStatus.Completed]: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  [BookingStatus.Cancelled]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [BookingStatus.NoShow]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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

export default function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  onUpdated,
  onCancel,
}: Props) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusChange = async (newStatus: BookingStatus) => {
    setUpdating(true);
    setError(null);
    try {
      await BookingApi.updateBooking(booking.id, { status: newStatus });
      onUpdated();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update status"));
    } finally {
      setUpdating(false);
    }
  };

  const canChangeStatus = booking.status !== BookingStatus.Cancelled;
  const canCancel =
    booking.status === BookingStatus.Scheduled || booking.status === BookingStatus.Confirmed;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[500px] m-5 sm:m-0 rounded-3xl bg-white p-6 lg:p-8 dark:bg-gray-900"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Booking Details
          </h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status]}`}
          >
            {statusLabels[booking.status]}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Service */}
        <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: booking.serviceColor }} />
          <div>
            <h4 className="font-medium text-gray-800 dark:text-white">{booking.serviceName}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {booking.serviceDurationMinutes} min • ${booking.servicePrice}
            </p>
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Time</label>
          <p className="mt-1 text-gray-800 dark:text-white">
            {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
          </p>
        </div>

        {/* Client */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Client</label>
          <p className="mt-1 text-gray-800 dark:text-white">{booking.clientName || "Walk-in"}</p>
          {booking.clientEmail && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{booking.clientEmail}</p>
          )}
          {booking.clientPhone && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{booking.clientPhone}</p>
          )}
        </div>

        {/* Staff */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Staff</label>
          <p className="mt-1 text-gray-800 dark:text-white">
            {booking.staffName || booking.staffEmail}
          </p>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</label>
            <p className="mt-1 text-gray-800 dark:text-white">{booking.notes}</p>
          </div>
        )}

        {/* Status Change */}
        {canChangeStatus && (
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Update Status
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(BookingStatus)
                .filter((status) => status !== BookingStatus.Cancelled)
                .map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updating || booking.status === status}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      booking.status === status
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-300 text-gray-700 hover:border-brand-300 dark:border-gray-600 dark:text-gray-300"
                    } disabled:opacity-50`}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {canCancel && (
            <button
              onClick={onCancel}
              disabled={updating}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-error-300 bg-white px-4 text-sm font-medium text-error-700 hover:bg-error-50 disabled:opacity-70 dark:border-error-700 dark:bg-gray-800 dark:text-error-400"
            >
              Cancel Booking
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

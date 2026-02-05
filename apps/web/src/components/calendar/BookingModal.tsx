"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "@/ui/modal";
import { BookingApi } from "@/services/BookingApi.service";
import { Service, StaffMember, Client, AvailableSlot } from "@/types/booking";

type Notice = {
  type: "success" | "error";
  message: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  services: Service[];
  staff: StaffMember[];
  initialDate: Date | null;
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

export default function BookingModal({
  isOpen,
  onClose,
  onCreated,
  services,
  staff,
  initialDate,
}: Props) {
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientName, setClientName] = useState("");
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selectedService = services.find((s) => s.id === serviceId);

  useEffect(() => {
    if (isOpen && initialDate) {
      setSelectedDate(initialDate.toISOString().split("T")[0]);
    }
  }, [isOpen, initialDate]);

  useEffect(() => {
    if (!isOpen) {
      setStaffId("");
      setServiceId("");
      setClientSearch("");
      setSelectedClient(null);
      setClientName("");
      setIsWalkIn(false);
      setSelectedDate("");
      setSelectedSlot(null);
      setNotes("");
      setClients([]);
      setAvailableSlots([]);
      setNotice(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchClients = async () => {
      if (clientSearch.length < 2) {
        setClients([]);
        return;
      }
      try {
        const results = await BookingApi.searchClients(clientSearch);
        setClients(results);
      } catch {
        setClients([]);
      }
    };

    const debounce = setTimeout(searchClients, 300);
    return () => clearTimeout(debounce);
  }, [clientSearch]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!staffId || !selectedDate || !selectedService) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const slots = await BookingApi.getAvailableSlots(
          staffId,
          selectedDate,
          selectedService.durationMinutes,
        );
        setAvailableSlots(slots);
      } catch {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [staffId, selectedDate, selectedService]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setClients([]);
    setIsWalkIn(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!staffId || !serviceId || !selectedSlot) {
      setNotice({ type: "error", message: "Please fill in all required fields" });
      return;
    }

    if (!selectedClient && !clientName.trim() && !isWalkIn) {
      setNotice({ type: "error", message: "Please select a client or enter a name" });
      return;
    }

    setSubmitting(true);
    try {
      await BookingApi.createBooking({
        staffId,
        serviceId,
        startTime: selectedSlot.startTime,
        clientId: selectedClient?.id,
        clientName: isWalkIn ? "Walk-in" : !selectedClient ? clientName.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to create booking") });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[600px] m-5 sm:m-0 rounded-3xl bg-white p-6 lg:p-8 dark:bg-gray-900"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">New Booking</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Schedule a new appointment</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Staff Selection */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Staff Member *
          </label>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Select staff...</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name || member.email}
              </option>
            ))}
          </select>
        </div>

        {/* Service Selection */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Service *
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Select service...</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.durationMinutes} min - ${service.price})
              </option>
            ))}
          </select>
        </div>

        {/* Client Selection */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Client
          </label>
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={isWalkIn}
                onChange={(e) => {
                  setIsWalkIn(e.target.checked);
                  if (e.target.checked) {
                    setSelectedClient(null);
                    setClientSearch("");
                    setClientName("");
                  }
                }}
                className="rounded border-gray-300"
              />
              Walk-in
            </label>
          </div>
          {!isWalkIn && (
            <div className="relative">
              <input
                type="text"
                value={selectedClient ? selectedClient.name : clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setSelectedClient(null);
                }}
                placeholder="Search clients..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              {clients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="font-medium text-gray-800 dark:text-white">{client.name}</div>
                      {client.email && <div className="text-xs text-gray-500">{client.email}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isWalkIn && !selectedClient && clientSearch.length >= 2 && clients.length === 0 && (
            <div className="mt-2">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                Client not found? Enter name:
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Date Selection */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Date *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot(null);
            }}
            min={new Date().toISOString().split("T")[0]}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {/* Time Slot Selection */}
        {staffId && serviceId && selectedDate && (
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Available Times *
            </label>
            {loadingSlots ? (
              <div className="text-sm text-gray-500">Loading available times...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-sm text-gray-500">No available times for this date</div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      selectedSlot?.startTime === slot.startTime
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-300 text-gray-700 hover:border-brand-300 dark:border-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional notes..."
            className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {/* Notice */}
        {notice && (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              notice.type === "success"
                ? "border-success-200 bg-success-50 text-success-700"
                : "border-error-200 bg-error-50 text-error-700"
            }`}
          >
            {notice.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-70"
          >
            {submitting ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { DateTimePicker } from "@mantine/dates";
import dayjs from "dayjs";
import { Modal } from "@/ui/modal";
import { BookingApi } from "@/services/BookingApi.service";
import { Service, StaffMember, Client } from "@/types/booking";

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
  initialStaffId?: string;
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
  initialStaffId,
}: Props) {
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientInput, setClientInput] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const clientInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedService = services.find((s) => s.id === serviceId);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setSelectedDateTime(initialDate);
      }
      if (initialStaffId) {
        setStaffId(initialStaffId);
      }
    }
  }, [isOpen, initialDate, initialStaffId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStaffId("");
      setServiceId("");
      setClientInput("");
      setSelectedClient(null);
      setIsWalkIn(false);
      setSelectedDateTime(null);
      setNotes("");
      setClients([]);
      setShowClientDropdown(false);
      setNotice(null);
    }
  }, [isOpen]);

  // Search clients with debounce
  useEffect(() => {
    const searchClients = async () => {
      if (clientInput.length < 2 || selectedClient) {
        setClients([]);
        return;
      }
      try {
        const results = await BookingApi.searchClients(clientInput);
        setClients(results);
        setShowClientDropdown(results.length > 0);
      } catch {
        setClients([]);
      }
    };

    const debounce = setTimeout(searchClients, 300);
    return () => clearTimeout(debounce);
  }, [clientInput, selectedClient]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientInput(client.name);
    setShowClientDropdown(false);
    setIsWalkIn(false);
  };

  const handleClientInputChange = (value: string) => {
    setClientInput(value);
    setSelectedClient(null);
  };

  const handleClearClient = () => {
    setClientInput("");
    setSelectedClient(null);
    setShowClientDropdown(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!staffId) {
      setNotice({ type: "error", message: "Please select a staff member" });
      return;
    }

    if (!serviceId) {
      setNotice({ type: "error", message: "Please select a service" });
      return;
    }

    if (!selectedDateTime) {
      setNotice({ type: "error", message: "Please select date and time" });
      return;
    }

    if (!selectedClient && !clientInput.trim() && !isWalkIn) {
      setNotice({ type: "error", message: "Please select a client or enter a name" });
      return;
    }

    setSubmitting(true);
    try {
      await BookingApi.createBooking({
        staffId,
        serviceId,
        startTime: selectedDateTime.toISOString(),
        clientId: selectedClient?.id,
        clientName: isWalkIn ? "Walk-in" : !selectedClient ? clientInput.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to create booking") });
    } finally {
      setSubmitting(false);
    }
  };

  // Get minimum datetime (now, rounded to next 15 min)
  const getMinDateTime = () => {
    const now = dayjs();
    const minutes = now.minute();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    return now.minute(roundedMinutes).second(0).toDate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[500px] m-5 sm:m-0 rounded-3xl bg-white p-6 lg:p-8 dark:bg-gray-900"
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
          {selectedService && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Duration: {selectedService.durationMinutes} minutes
            </p>
          )}
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
                    setClientInput("");
                    setShowClientDropdown(false);
                  }
                }}
                className="rounded border-gray-300"
              />
              Walk-in
            </label>
          </div>
          {!isWalkIn && (
            <div className="relative">
              <div className="relative">
                <input
                  ref={clientInputRef}
                  type="text"
                  value={clientInput}
                  onChange={(e) => handleClientInputChange(e.target.value)}
                  onFocus={() => {
                    if (clients.length > 0 && !selectedClient) {
                      setShowClientDropdown(true);
                    }
                  }}
                  placeholder="Search or enter client name..."
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 pr-10 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                {clientInput && (
                  <button
                    type="button"
                    onClick={handleClearClient}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {selectedClient && (
                <p className="mt-1 text-xs text-success-600 dark:text-success-400">
                  Selected: {selectedClient.name}{" "}
                  {selectedClient.email ? `(${selectedClient.email})` : ""}
                </p>
              )}
              {!selectedClient && clientInput.length >= 2 && clients.length === 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  No matching clients. &quot;{clientInput}&quot; will be used as client name.
                </p>
              )}
              {showClientDropdown && clients.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 max-h-48 overflow-y-auto"
                >
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectClient(client);
                      }}
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
        </div>

        {/* Date and Time Selection */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Date & Time *
          </label>
          <DateTimePicker
            value={selectedDateTime}
            onChange={(date: any) => setSelectedDateTime(date)}
            minDate={getMinDateTime()}
            placeholder="Select date and time..."
            valueFormat="MMMM D, YYYY h:mm A"
            size="md"
            radius="md"
            classNames={{
              input:
                "h-11 border-gray-300 bg-transparent text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white",
            }}
            styles={{
              input: {
                height: "44px",
              },
            }}
            popoverProps={{
              withinPortal: true,
              zIndex: 200000,
            }}
          />
        </div>

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
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-70"
          >
            {submitting ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

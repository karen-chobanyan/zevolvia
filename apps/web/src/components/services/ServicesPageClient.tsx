"use client";

import { FormEvent, useEffect, useState } from "react";
import { BookingApi } from "@/services/BookingApi.service";
import { Service, CreateServiceDto } from "@/types/booking";
import { Modal } from "@/ui/modal";
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

const DEFAULT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export default function ServicesPageClient() {
  const serviceModal = useModal();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState(0);
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formNotice, setFormNotice] = useState<Notice | null>(null);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await BookingApi.getServices(true);
      setServices(data);
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to load services") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setName("");
    setDescription("");
    setDurationMinutes(30);
    setPrice(0);
    setColor(DEFAULT_COLORS[0]);
    setIsActive(true);
    setFormNotice(null);
    serviceModal.openModal();
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || "");
    setDurationMinutes(service.durationMinutes);
    setPrice(service.price);
    setColor(service.color);
    setIsActive(service.isActive);
    setFormNotice(null);
    serviceModal.openModal();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormNotice(null);

    if (!name.trim()) {
      setFormNotice({ type: "error", message: "Service name is required" });
      return;
    }

    setSubmitting(true);
    try {
      const dto: CreateServiceDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        durationMinutes,
        price,
        color,
        isActive,
      };

      if (editingService) {
        await BookingApi.updateService(editingService.id, dto);
        setNotice({ type: "success", message: "Service updated successfully" });
      } else {
        await BookingApi.createService(dto);
        setNotice({ type: "success", message: "Service created successfully" });
      }

      serviceModal.closeModal();
      loadServices();
    } catch (err) {
      setFormNotice({ type: "error", message: getErrorMessage(err, "Failed to save service") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return;
    }

    try {
      await BookingApi.deleteService(service.id);
      setNotice({ type: "success", message: "Service deleted successfully" });
      loadServices();
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to delete service") });
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Service Catalog</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage the services offered by your salon
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add Service
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No services yet. Add your first service to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Service
                  </th>
                  <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Duration
                  </th>
                  <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Price
                  </th>
                  <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Status
                  </th>
                  <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg"
                          style={{ backgroundColor: service.color }}
                        />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">
                            {service.name}
                          </div>
                          {service.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600 dark:text-gray-300">
                      {service.durationMinutes} min
                    </td>
                    <td className="py-4 text-gray-600 dark:text-gray-300">${service.price}</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          service.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => openEditModal(service)}
                        className="text-sm text-brand-500 hover:text-brand-600 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="text-sm text-error-500 hover:text-error-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={serviceModal.isOpen}
        onClose={serviceModal.closeModal}
        className="relative w-full max-w-[500px] m-5 sm:m-0 rounded-3xl bg-white p-6 lg:p-8 dark:bg-gray-900"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {editingService ? "Edit Service" : "Add Service"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Service Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Haircut, Massage"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of the service"
              className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                min={5}
                max={480}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Price ($) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-lg transition ${
                    color === c ? "ring-2 ring-offset-2 ring-brand-500" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Active (available for booking)
            </label>
          </div>

          {formNotice && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                formNotice.type === "error"
                  ? "border-error-200 bg-error-50 text-error-700"
                  : "border-success-200 bg-success-50 text-success-700"
              }`}
            >
              {formNotice.message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={serviceModal.closeModal}
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
              {submitting ? "Saving..." : editingService ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

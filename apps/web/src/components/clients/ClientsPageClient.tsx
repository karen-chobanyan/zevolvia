"use client";

import { FormEvent, useEffect, useState } from "react";
import { BookingApi } from "@/services/BookingApi.service";
import { Client, CreateClientDto, PaginatedResponse } from "@/types/booking";
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

export default function ClientsPageClient() {
  const clientModal = useModal();
  const [clientsData, setClientsData] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formNotice, setFormNotice] = useState<Notice | null>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await BookingApi.getClients({
        search: searchQuery || undefined,
        page,
        limit: 20,
      });
      setClientsData(data);
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to load clients") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [page, searchQuery]);

  const openCreateModal = () => {
    setEditingClient(null);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setFormNotice(null);
    clientModal.openModal();
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setNotes(client.notes || "");
    setFormNotice(null);
    clientModal.openModal();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormNotice(null);

    if (!name.trim()) {
      setFormNotice({ type: "error", message: "Client name is required" });
      return;
    }

    setSubmitting(true);
    try {
      const dto: CreateClientDto = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (editingClient) {
        await BookingApi.updateClient(editingClient.id, dto);
        setNotice({ type: "success", message: "Client updated successfully" });
      } else {
        await BookingApi.createClient(dto);
        setNotice({ type: "success", message: "Client created successfully" });
      }

      clientModal.closeModal();
      loadClients();
    } catch (err) {
      setFormNotice({ type: "error", message: getErrorMessage(err, "Failed to save client") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete "${client.name}"?`)) {
      return;
    }

    try {
      await BookingApi.deleteClient(client.id);
      setNotice({ type: "success", message: "Client deleted successfully" });
      loadClients();
    } catch (err) {
      setNotice({ type: "error", message: getErrorMessage(err, "Failed to delete client") });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Client Database</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your client information
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-10 w-full sm:w-64 rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <button
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap"
            >
              Add Client
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : !clientsData || clientsData.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "No clients found matching your search."
              : "No clients yet. Add your first client to get started."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Name
                    </th>
                    <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Email
                    </th>
                    <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Phone
                    </th>
                    <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Type
                    </th>
                    <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientsData.items.map((client) => (
                    <tr key={client.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4">
                        <div className="font-medium text-gray-800 dark:text-white">
                          {client.name}
                        </div>
                        {client.notes && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {client.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-gray-600 dark:text-gray-300">
                        {client.email || "-"}
                      </td>
                      <td className="py-4 text-gray-600 dark:text-gray-300">
                        {client.phone || "-"}
                      </td>
                      <td className="py-4">
                        {client.isWalkIn && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            Walk-in
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => openEditModal(client)}
                          className="text-sm text-brand-500 hover:text-brand-600 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
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

            {/* Pagination */}
            {clientsData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(page - 1) * clientsData.limit + 1} to{" "}
                  {Math.min(page * clientsData.limit, clientsData.total)} of {clientsData.total}{" "}
                  clients
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(clientsData.totalPages, p + 1))}
                    disabled={page === clientsData.totalPages}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={clientModal.isOpen}
        onClose={clientModal.closeModal}
        className="relative w-full max-w-[500px] m-5 sm:m-0 rounded-3xl bg-white p-6 lg:p-8 dark:bg-gray-900"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {editingClient ? "Edit Client" : "Add Client"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client name"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Additional notes about the client"
              className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
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
              onClick={clientModal.closeModal}
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
              {submitting ? "Saving..." : editingClient ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

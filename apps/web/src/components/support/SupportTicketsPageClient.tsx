"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import SupportMetrics from "@/components/support/SupportMetrics";
import SupportTicketsList from "@/components/support/SupportList";
import { Modal } from "@/ui/modal";
import { useModal } from "@/hooks/useModal";

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  category?: string | null;
  status: "PENDING" | "SOLVED";
  createdAt: string;
  requester: {
    name: string | null;
    email: string;
  };
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

export default function SupportTicketsPageClient() {
  const ticketModal = useModal();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<Notice | null>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formNotice, setFormNotice] = useState<Notice | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/support/tickets");
      setTickets(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load support tickets."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openTicketModal = () => {
    setFormNotice(null);
    ticketModal.openModal();
  };

  const closeTicketModal = () => {
    setFormNotice(null);
    ticketModal.closeModal();
  };

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    const trimmedCategory = category.trim();

    if (!trimmedSubject) {
      setFormNotice({ type: "error", message: "Subject is required." });
      return;
    }
    if (!trimmedMessage) {
      setFormNotice({ type: "error", message: "Message is required." });
      return;
    }

    setSubmitting(true);
    setFormNotice(null);
    try {
      const response = await api.post("/support/tickets", {
        subject: trimmedSubject,
        message: trimmedMessage,
        category: trimmedCategory || undefined,
      });
      const ticket = response.data as SupportTicket;
      setTickets((prev) => [ticket, ...prev]);
      setSubject("");
      setCategory("");
      setMessage("");
      setPageNotice({ type: "success", message: "Support ticket created." });
      closeTicketModal();
    } catch (err: any) {
      setFormNotice({
        type: "error",
        message: getErrorMessage(err, "Failed to create support ticket."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const metrics = useMemo(() => {
    const solved = tickets.filter((ticket) => ticket.status === "SOLVED").length;
    const pending = tickets.length - solved;
    return {
      total: tickets.length,
      pending,
      solved,
    };
  }, [tickets]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}

      {pageNotice && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            pageNotice.type === "success"
              ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/40 dark:bg-success-500/10 dark:text-success-300"
              : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300"
          }`}
        >
          {pageNotice.message}
        </div>
      )}

      <SupportMetrics
        total={metrics.total}
        pending={metrics.pending}
        solved={metrics.solved}
        loading={loading}
      />
      <SupportTicketsList tickets={tickets} loading={loading} onCreateTicket={openTicketModal} />

      <Modal
        isOpen={ticketModal.isOpen}
        onClose={closeTicketModal}
        className="relative w-full max-w-[720px] m-5 sm:m-0 rounded-3xl bg-white p-6 lg:p-8 dark:bg-gray-900"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Create a support ticket
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tell us what you need help with and we will follow up soon.
          </p>
        </div>
        <form onSubmit={handleCreateTicket} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Brief summary"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Billing, account, integrations..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Message
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Share the details so we can help faster."
              className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {formNotice ? (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  formNotice.type === "success"
                    ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/40 dark:bg-success-500/10 dark:text-success-300"
                    : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300"
                }`}
              >
                {formNotice.message}
              </div>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                We typically respond within 1 business day.
              </span>
            )}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={closeTicketModal}
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Sending..." : "Create ticket"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

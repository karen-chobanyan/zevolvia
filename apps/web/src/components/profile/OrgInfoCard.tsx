"use client";
import { useEffect, useState } from "react";
import { useModal } from "@/hooks/useModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/ui/Button";
import { Modal } from "@/ui/modal";

export type OrgInfo = {
  id?: string;
  name?: string | null;
  slug?: string | null;
  phone?: string | null;
  timeZone?: string | null;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  twilioAccountSid?: string | null;
  twilioMessagingServiceSid?: string | null;
  twilioAuthTokenConfigured?: boolean;
  telegramBotUsername?: string | null;
  telegramBotTokenConfigured?: boolean;
  telegramWebhookSecretConfigured?: boolean;
  ownerUserId?: string | null;
  createdAt?: string | Date | null;
};

export type MembershipInfo = {
  role?: string | null;
  joinedAt?: string | Date | null;
};

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Sao_Paulo", label: "Sao Paulo" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Amsterdam", label: "Amsterdam" },
  { value: "Europe/Stockholm", label: "Stockholm" },
  { value: "Africa/Johannesburg", label: "Johannesburg" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Australia/Sydney", label: "Sydney" },
];

type OrgInfoCardProps = {
  org: OrgInfo | null;
  membership?: MembershipInfo | null;
  canEdit: boolean;
  onSave: (payload: {
    name?: string;
    phone?: string | null;
    timeZone?: string | null;
    workingHoursStart?: string;
    workingHoursEnd?: string;
    twilioAccountSid?: string | null;
    twilioAuthToken?: string | null;
    twilioMessagingServiceSid?: string | null;
    telegramBotToken?: string | null;
    telegramBotUsername?: string | null;
    telegramWebhookSecret?: string | null;
  }) => Promise<void>;
};

const SECRET_PLACEHOLDER = "********";

function getDisplayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "-";
}

function getTimeZoneLabel(value?: string | null) {
  if (!value?.trim()) {
    return "-";
  }
  const match = TIMEZONE_OPTIONS.find((option) => option.value === value);
  return match?.label ?? value;
}

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "-";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString();
}

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  );
}

export default function OrgInfoCard({ org, membership, canEdit, onSave }: OrgInfoCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    timeZone: "",
    workingHoursStart: "",
    workingHoursEnd: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioMessagingServiceSid: "",
    telegramBotToken: "",
    telegramBotUsername: "",
    telegramWebhookSecret: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      name: org?.name ?? "",
      phone: org?.phone ?? "",
      timeZone: org?.timeZone ?? "",
      workingHoursStart: org?.workingHoursStart ?? "09:00",
      workingHoursEnd: org?.workingHoursEnd ?? "20:00",
      twilioAccountSid: org?.twilioAccountSid ?? "",
      twilioAuthToken: org?.twilioAuthTokenConfigured ? SECRET_PLACEHOLDER : "",
      twilioMessagingServiceSid: org?.twilioMessagingServiceSid ?? "",
      telegramBotToken: org?.telegramBotTokenConfigured ? SECRET_PLACEHOLDER : "",
      telegramBotUsername: org?.telegramBotUsername ?? "",
      telegramWebhookSecret: org?.telegramWebhookSecretConfigured ? SECRET_PLACEHOLDER : "",
    });
  }, [org]);

  const handleSave = async () => {
    if (!org) {
      return;
    }
    const nextName = form.name.trim();
    const nextPhone = form.phone.trim();
    const nextTimeZone = form.timeZone.trim();
    const nextWorkingHoursStart = form.workingHoursStart.trim();
    const nextWorkingHoursEnd = form.workingHoursEnd.trim();
    const nextTwilioAccountSid = form.twilioAccountSid.trim();
    const nextTwilioAuthToken = form.twilioAuthToken.trim();
    const nextTwilioMessagingServiceSid = form.twilioMessagingServiceSid.trim();
    const nextTelegramBotToken = form.telegramBotToken.trim();
    const nextTelegramBotUsername = form.telegramBotUsername.trim();
    const nextTelegramWebhookSecret = form.telegramWebhookSecret.trim();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: nextName || undefined,
        phone: nextPhone || null,
        timeZone: nextTimeZone || null,
        workingHoursStart: nextWorkingHoursStart || undefined,
        workingHoursEnd: nextWorkingHoursEnd || undefined,
        twilioAccountSid: nextTwilioAccountSid || null,
        twilioAuthToken: nextTwilioAuthToken || null,
        twilioMessagingServiceSid: nextTwilioMessagingServiceSid || null,
        telegramBotToken: nextTelegramBotToken || null,
        telegramBotUsername: nextTelegramBotUsername || null,
        telegramWebhookSecret: nextTelegramWebhookSecret || null,
      });
      closeModal();
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to update organization."));
    } finally {
      setSaving(false);
    }
  };

  const editDisabled = !canEdit || !org;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Organization
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Organization Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getDisplayValue(org?.name)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Slug</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getDisplayValue(org?.slug)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getDisplayValue(org?.phone)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Time Zone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getTimeZoneLabel(org?.timeZone)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Working Hours
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getDisplayValue(org?.workingHoursStart)} - {getDisplayValue(org?.workingHoursEnd)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getDisplayValue(membership?.role ?? null)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Member since
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {formatDate(membership?.joinedAt ?? null)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Organization ID
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-all">
                {getDisplayValue(org?.id)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                WhatsApp/Twilio
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {org?.twilioAccountSid || org?.twilioAuthTokenConfigured
                  ? "Configured"
                  : "Not configured"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Telegram
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {org?.telegramBotUsername || org?.telegramBotTokenConfigured
                  ? "Configured"
                  : "Not configured"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={openModal}
            disabled={editDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
          {!canEdit && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only organization owners can edit these details.
            </p>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Organization
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Update your organization details.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="grid grid-cols-1 gap-5 px-2 pb-2">
              <div>
                <Label>Organization Name</Label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>

              <div>
                <Label>Slug</Label>
                <Input type="text" value={org?.slug ?? ""} readOnly />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  type="text"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </div>

              <div>
                <Label>Time Zone (IANA)</Label>
                <select
                  value={form.timeZone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, timeZone: event.target.value }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">Select time zone</option>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Working Hours Start</Label>
                <Input
                  type="time"
                  value={form.workingHoursStart}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, workingHoursStart: event.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Working Hours End</Label>
                <Input
                  type="time"
                  value={form.workingHoursEnd}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, workingHoursEnd: event.target.value }))
                  }
                />
              </div>

              <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
                <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  WhatsApp / Twilio
                </h5>
              </div>

              <div>
                <Label>Twilio Account SID</Label>
                <Input
                  type="text"
                  value={form.twilioAccountSid}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, twilioAccountSid: event.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Twilio Auth Token</Label>
                <Input
                  type="password"
                  value={form.twilioAuthToken}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, twilioAuthToken: event.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Twilio Messaging Service SID</Label>
                <Input
                  type="text"
                  value={form.twilioMessagingServiceSid}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      twilioMessagingServiceSid: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
                <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">Telegram</h5>
              </div>

              <div>
                <Label>Telegram Bot Token</Label>
                <Input
                  type="password"
                  value={form.telegramBotToken}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, telegramBotToken: event.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Telegram Bot Username</Label>
                <Input
                  type="text"
                  value={form.telegramBotUsername}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, telegramBotUsername: event.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Telegram Webhook Secret</Label>
                <Input
                  type="password"
                  value={form.telegramWebhookSecret}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, telegramWebhookSecret: event.target.value }))
                  }
                />
              </div>
            </div>

            {error && <p className="px-2 text-sm text-error-500 dark:text-error-400">{error}</p>}

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

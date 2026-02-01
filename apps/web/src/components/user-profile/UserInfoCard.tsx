"use client";
import { useEffect, useState } from "react";
import { useModal } from "@/hooks/useModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "../../ui/modal";
import Button from "../../ui/Button";

export type UserProfileData = {
  id?: string;
  email?: string | null;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    locale?: string | null;
    timeZone?: string | null;
  } | null;
};

export type UserProfileUpdate = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  locale?: string | null;
  timeZone?: string | null;
};

export type PasswordChangePayload = {
  currentPassword: string;
  newPassword: string;
};

const LOCALE_OPTIONS = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "en-CA", label: "English (Canada)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "es-MX", label: "Spanish (Mexico)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "de-DE", label: "German (Germany)" },
  { value: "it-IT", label: "Italian (Italy)" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "nl-NL", label: "Dutch (Netherlands)" },
  { value: "sv-SE", label: "Swedish (Sweden)" },
  { value: "ja-JP", label: "Japanese (Japan)" },
  { value: "ko-KR", label: "Korean (South Korea)" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
];

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

type UserInfoCardProps = {
  user: UserProfileData | null;
  onSave: (payload: UserProfileUpdate) => Promise<void>;
  onChangePassword: (payload: PasswordChangePayload) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
};

function getDisplayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "-";
}

function getLocaleLabel(value?: string | null) {
  if (!value?.trim()) {
    return "-";
  }
  const match = LOCALE_OPTIONS.find((option) => option.value === value);
  return match?.label ?? value;
}

function getTimeZoneLabel(value?: string | null) {
  if (!value?.trim()) {
    return "-";
  }
  const match = TIMEZONE_OPTIONS.find((option) => option.value === value);
  return match?.label ?? value;
}

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  );
}

export default function UserInfoCard({
  user,
  onSave,
  onChangePassword,
  onForgotPassword,
}: UserInfoCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const passwordModal = useModal();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    locale: "",
    timeZone: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      firstName: user?.profile?.firstName ?? "",
      lastName: user?.profile?.lastName ?? "",
      phone: user?.profile?.phone ?? "",
      locale: user?.profile?.locale ?? "",
      timeZone: user?.profile?.timeZone ?? "",
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        locale: form.locale,
        timeZone: form.timeZone,
      });
      closeModal();
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  };

  const canEdit = Boolean(user);
  const localeOptions = LOCALE_OPTIONS.some((option) => option.value === form.locale)
    ? LOCALE_OPTIONS
    : form.locale
      ? [{ value: form.locale, label: `${form.locale} (current)` }, ...LOCALE_OPTIONS]
      : LOCALE_OPTIONS;
  const timeZoneOptions = TIMEZONE_OPTIONS.some((option) => option.value === form.timeZone)
    ? TIMEZONE_OPTIONS
    : form.timeZone
      ? [{ value: form.timeZone, label: `${form.timeZone} (current)` }, ...TIMEZONE_OPTIONS]
      : TIMEZONE_OPTIONS;

  const openPasswordModal = () => {
    setPasswordError(null);
    setPasswordMessage(null);
    setForgotMessage(null);
    setForgotError(null);
    setForgotSending(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    passwordModal.openModal();
  };

  const handlePasswordSave = async () => {
    if (!user) {
      return;
    }
    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different.");
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await onChangePassword({ currentPassword, newPassword });
      passwordModal.closeModal();
      setPasswordMessage("Password updated.");
    } catch (err: any) {
      setPasswordError(getErrorMessage(err, "Failed to update password."));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      setForgotError("Email is not available for this account.");
      return;
    }
    setForgotSending(true);
    setForgotError(null);
    setForgotMessage(null);
    try {
      await onForgotPassword(user.email);
      setForgotMessage(`Reset link sent to ${user.email}.`);
    } catch (err: any) {
      setForgotError(getErrorMessage(err, "Failed to send reset link."));
    } finally {
      setForgotSending(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getDisplayValue(user?.profile?.firstName)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getDisplayValue(user?.profile?.lastName)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getDisplayValue(user?.email ?? undefined)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getDisplayValue(user?.profile?.phone)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Locale</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getLocaleLabel(user?.profile?.locale)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Time zone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getTimeZoneLabel(user?.profile?.timeZone)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
          <button
            onClick={openModal}
            disabled={!canEdit}
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
          <button
            onClick={openPasswordModal}
            disabled={!canEdit}
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
                d="M9 1.5C7.13604 1.5 5.625 3.01104 5.625 4.875V7.125H4.5C3.67157 7.125 3 7.79657 3 8.625V14.25C3 15.0784 3.67157 15.75 4.5 15.75H13.5C14.3284 15.75 15 15.0784 15 14.25V8.625C15 7.79657 14.3284 7.125 13.5 7.125H12.375V4.875C12.375 3.01104 10.864 1.5 9 1.5ZM7.125 4.875C7.125 3.83947 7.96447 3 9 3C10.0355 3 10.875 3.83947 10.875 4.875V7.125H7.125V4.875ZM4.5 8.625H13.5V14.25H4.5V8.625Z"
                fill=""
              />
            </svg>
            Change password
          </button>
        </div>
      </div>
      {passwordMessage && (
        <p className="mt-4 text-sm text-success-600 dark:text-success-400">{passwordMessage}</p>
      )}

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-2 pb-3 lg:grid-cols-2">
              <div>
                <Label>First Name</Label>
                <Input
                  type="text"
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input type="text" value={user?.email ?? ""} readOnly />
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
                <Label>Locale</Label>
                <select
                  value={form.locale}
                  onChange={(event) => setForm((prev) => ({ ...prev, locale: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">Select locale</option>
                  {localeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Time zone</Label>
                <select
                  value={form.timeZone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, timeZone: event.target.value }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">Select time zone</option>
                  {timeZoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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

      <Modal
        isOpen={passwordModal.isOpen}
        onClose={passwordModal.closeModal}
        className="max-w-[520px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[520px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Change Password
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Use a strong password you have not used before.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="grid grid-cols-1 gap-5 px-2 pb-2">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {passwordError && (
              <p className="px-2 text-sm text-error-500 dark:text-error-400">{passwordError}</p>
            )}
            {(forgotError || forgotMessage) && (
              <p
                className={`px-2 text-sm ${
                  forgotError
                    ? "text-error-500 dark:text-error-400"
                    : "text-success-600 dark:text-success-400"
                }`}
              >
                {forgotError ?? forgotMessage}
              </p>
            )}

            <div className="px-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotSending}
                className="text-sm font-medium text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {forgotSending ? "Sending reset link..." : "Forgot password?"}
              </button>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={passwordModal.closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handlePasswordSave} disabled={passwordSaving}>
                {passwordSaving ? "Saving..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

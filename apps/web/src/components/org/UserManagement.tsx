"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type Member = {
  userId: string;
  email: string;
  role?: string;
  joinedAt?: string;
};

type Invite = {
  id: string;
  email: string;
  role?: string;
  invitedBy?: string;
  expiresAt?: string;
};

const ROLE_OPTIONS = [
  { key: "OWNER", label: "Owner" },
  { key: "ADMIN", label: "Admin" },
  { key: "MEMBER", label: "Member" },
] as const;

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
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

export default function UserManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        api.get("/org/members"),
        api.get("/org/invites"),
      ]);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : []);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteMessage("Please enter an email.");
      return;
    }
    setInviteSubmitting(true);
    setInviteMessage(null);
    try {
      const response = await api.post("/org/invites", {
        email: inviteEmail.trim(),
        roleKey: inviteRole,
      });
      const invite = response.data;
      setInvites((prev) => [invite, ...prev]);
      setInviteEmail("");
      setInviteRole("MEMBER");
      setInviteMessage("Invite sent.");
    } catch (err: any) {
      setInviteMessage(getErrorMessage(err, "Failed to send invite."));
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCancelInvite = async (invite: Invite) => {
    setBusyInviteId(invite.id);
    try {
      await api.post(`/org/invites/${invite.id}/cancel`);
      setInvites((prev) => prev.filter((item) => item.id !== invite.id));
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to cancel invite."));
    } finally {
      setBusyInviteId(null);
    }
  };

  const handleRoleChange = async (member: Member, roleKey: string) => {
    const previousRole = member.role;
    setBusyMemberId(member.userId);
    setMembers((prev) =>
      prev.map((item) => (item.userId === member.userId ? { ...item, role: roleKey } : item)),
    );
    try {
      await api.patch(`/org/members/${member.userId}`, { roleKey });
    } catch (err: any) {
      setMembers((prev) =>
        prev.map((item) =>
          item.userId === member.userId ? { ...item, role: previousRole } : item,
        ),
      );
      setError(getErrorMessage(err, "Failed to update role."));
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (!window.confirm(`Remove ${member.email} from the organization?`)) {
      return;
    }
    setBusyMemberId(member.userId);
    try {
      await api.delete(`/org/members/${member.userId}`);
      setMembers((prev) => prev.filter((item) => item.userId !== member.userId));
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to remove member."));
    } finally {
      setBusyMemberId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Invite a teammate
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add users to your organization with role-based access.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.6fr]">
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="name@company.com"
              className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.key} value={role.key}>
                  {role.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviteSubmitting}
              className="h-11 w-full rounded-lg bg-brand-500 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {inviteSubmitting ? "Sending..." : "Send invite"}
            </button>
          </div>
          {inviteMessage && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{inviteMessage}</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Pending invites
          </h3>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : invites.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No pending invites.</p>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200/70 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white/90">{invite.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {invite.role || "Member"} • Expires {formatDate(invite.expiresAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancelInvite(invite)}
                    disabled={busyInviteId === invite.id}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-70 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    {busyInviteId === invite.id ? "Canceling..." : "Cancel"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Team members</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage access and roles for your organization.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-theme-xs transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  User
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Role
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Joined
                </th>
                <th className="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-2 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-2 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isOwner = member.role === "OWNER";
                  return (
                    <tr
                      key={member.userId}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-2 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white/90">
                            {member.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.userId}
                          </p>
                        </div>
                      </td>
                      <td className="px-2 py-4">
                        <select
                          value={member.role ?? "MEMBER"}
                          onChange={(event) => handleRoleChange(member, event.target.value)}
                          disabled={isOwner || busyMemberId === member.userId}
                          className="h-9 w-full rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role.key} value={role.key}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-4 text-gray-500 dark:text-gray-400">
                        {formatDate(member.joinedAt)}
                      </td>
                      <td className="px-2 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          disabled={isOwner || busyMemberId === member.userId}
                          className="text-xs font-semibold text-error-600 hover:text-error-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-error-400 dark:hover:text-error-300"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

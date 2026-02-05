"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type Member = {
  userId: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role?: string;
  roleId?: string;
  joinedAt?: string;
};

type Invite = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role?: string;
  invitedBy?: string | null;
  expiresAt?: string;
};

type Role = {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
};

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type StaffWithServices = {
  userId: string;
  user: { id: string; email: string; name: string | null };
  services: Service[];
};

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

function getErrorMessage(error: unknown, fallback: string) {
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
}

export default function UserManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffServices, setStaffServices] = useState<StaffWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [editingServicesFor, setEditingServicesFor] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [savingServices, setSavingServices] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, invitesRes, rolesRes, servicesRes, staffServicesRes] = await Promise.all([
        api.get("/org/members"),
        api.get("/org/invites"),
        api.get("/org/roles"),
        api.get("/services"),
        api.get("/staff-services"),
      ]);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : []);
      const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : [];
      setRoles(rolesData);
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
      setStaffServices(Array.isArray(staffServicesRes.data) ? staffServicesRes.data : []);
      if (rolesData.length > 0 && !inviteRole) {
        const memberRole = rolesData.find((r: Role) => r.name === "Member");
        setInviteRole(memberRole?.name || rolesData[0].name);
      }
    } catch (err) {
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
      setInviteMessage({ type: "error", text: "Please enter an email." });
      return;
    }
    if (!inviteRole) {
      setInviteMessage({ type: "error", text: "Please select a role." });
      return;
    }
    setInviteSubmitting(true);
    setInviteMessage(null);
    try {
      const response = await api.post("/org/invites", {
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        phone: invitePhone.trim() || undefined,
        roleKey: inviteRole,
      });
      const invite = response.data;
      setInvites((prev) => [invite, ...prev]);
      setInviteName("");
      setInviteEmail("");
      setInvitePhone("");
      setInviteMessage({ type: "success", text: "Invite sent successfully!" });
    } catch (err) {
      setInviteMessage({ type: "error", text: getErrorMessage(err, "Failed to send invite.") });
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCancelInvite = async (invite: Invite) => {
    setBusyInviteId(invite.id);
    try {
      await api.post(`/org/invites/${invite.id}/cancel`);
      setInvites((prev) => prev.filter((item) => item.id !== invite.id));
    } catch (err) {
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
    } catch (err) {
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
    if (!window.confirm(`Remove ${member.name || member.email} from the organization?`)) {
      return;
    }
    setBusyMemberId(member.userId);
    try {
      await api.delete(`/org/members/${member.userId}`);
      setMembers((prev) => prev.filter((item) => item.userId !== member.userId));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove member."));
    } finally {
      setBusyMemberId(null);
    }
  };

  const getServicesForMember = (userId: string): Service[] => {
    const staffService = staffServices.find((ss) => ss.userId === userId);
    return staffService?.services || [];
  };

  const handleEditServices = (member: Member) => {
    const currentServices = getServicesForMember(member.userId);
    setSelectedServices(currentServices.map((s) => s.id));
    setEditingServicesFor(member.userId);
  };

  const handleSaveServices = async () => {
    if (!editingServicesFor) return;
    setSavingServices(true);
    try {
      await api.put(`/staff-services/staff/${editingServicesFor}`, {
        serviceIds: selectedServices,
      });
      // Reload staff services
      const staffServicesRes = await api.get("/staff-services");
      setStaffServices(Array.isArray(staffServicesRes.data) ? staffServicesRes.data : []);
      setEditingServicesFor(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update services."));
    } finally {
      setSavingServices(false);
    }
  };

  const handleToggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
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
            Invite a staff member
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add staff to your salon with role-based access.
          </p>
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                placeholder="Full name"
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="Email address *"
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="tel"
                value={invitePhone}
                onChange={(event) => setInvitePhone(event.target.value)}
                placeholder="Phone number"
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviteSubmitting}
              className="h-11 w-full rounded-lg bg-brand-500 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {inviteSubmitting ? "Sending invite..." : "Send invite"}
            </button>
          </div>
          {inviteMessage && (
            <p
              className={`mt-3 text-sm ${
                inviteMessage.type === "success"
                  ? "text-success-600 dark:text-success-400"
                  : "text-error-600 dark:text-error-400"
              }`}
            >
              {inviteMessage.text}
            </p>
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
                    <p className="font-medium text-gray-900 dark:text-white/90">
                      {invite.name || invite.email}
                    </p>
                    {invite.name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{invite.email}</p>
                    )}
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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Staff members
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage access and roles for your team.
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
                  Name
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Email
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Role
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Services
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
                    colSpan={7}
                    className="px-2 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isOwner = member.role === "Owner";
                  return (
                    <tr
                      key={member.userId}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-2 py-4">
                        <p className="font-medium text-gray-900 dark:text-white/90">
                          {member.name || "-"}
                        </p>
                      </td>
                      <td className="px-2 py-4 text-gray-600 dark:text-gray-300">{member.email}</td>
                      <td className="px-2 py-4 text-gray-600 dark:text-gray-300">
                        {member.phone || "-"}
                      </td>
                      <td className="px-2 py-4">
                        <select
                          value={member.role ?? "Member"}
                          onChange={(event) => handleRoleChange(member, event.target.value)}
                          disabled={isOwner || busyMemberId === member.userId}
                          className="h-9 w-full rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.name}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap gap-1">
                            {getServicesForMember(member.userId)
                              .slice(0, 2)
                              .map((service) => (
                                <span
                                  key={service.id}
                                  className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                                >
                                  {service.name}
                                </span>
                              ))}
                            {getServicesForMember(member.userId).length > 2 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{getServicesForMember(member.userId).length - 2} more
                              </span>
                            )}
                            {getServicesForMember(member.userId).length === 0 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditServices(member)}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                          >
                            Edit
                          </button>
                        </div>
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

      {/* Services Edit Modal */}
      {editingServicesFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Assign Services
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select services this staff member can provide.
            </p>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {services.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No services available. Create services first.
                </p>
              ) : (
                services.map((service) => (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => handleToggleService(service.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white/90">
                        {service.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {service.duration} min • ${service.price}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingServicesFor(null)}
                disabled={savingServices}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-70 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveServices}
                disabled={savingServices}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-70"
              >
                {savingServices ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

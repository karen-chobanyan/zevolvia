"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import UserInfoCard, {
  PasswordChangePayload,
  UserProfileData,
  UserProfileUpdate,
} from "@/components/user-profile/UserInfoCard";
import OrgInfoCard, { MembershipInfo, OrgInfo } from "@/components/profile/OrgInfoCard";

type ProfileResponse = {
  user: UserProfileData;
  org: OrgInfo;
  membership?: MembershipInfo | null;
  isOwner?: boolean;
};

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  );
}

export default function ProfilePageClient() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/profile");
      setProfile(response.data ?? null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUserSave = async (payload: UserProfileUpdate) => {
    if (!profile) {
      await loadProfile();
      return;
    }
    const response = await api.patch("/profile", payload);
    const updatedUser = response.data?.user ?? response.data;
    setProfile((prev) => (prev ? { ...prev, user: updatedUser } : prev));
  };

  const handleOrgSave = async (payload: { name: string }) => {
    if (!profile) {
      await loadProfile();
      return;
    }
    const response = await api.patch("/profile/org", payload);
    const updatedOrg = response.data?.org ?? response.data;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            org: updatedOrg,
            isOwner: updatedOrg?.ownerUserId === prev.user?.id,
          }
        : prev,
    );
  };

  const handlePasswordChange = async (payload: PasswordChangePayload) => {
    await api.post("/auth/change-password", payload);
  };

  const handleForgotPassword = async (email: string) => {
    await api.post("/auth/forgot-password", { email });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</p>
      ) : profile ? (
        <>
          <UserInfoCard
            user={profile.user}
            onSave={handleUserSave}
            onChangePassword={handlePasswordChange}
            onForgotPassword={handleForgotPassword}
          />
          <OrgInfoCard
            org={profile.org}
            membership={profile.membership ?? null}
            canEdit={Boolean(profile.isOwner)}
            onSave={handleOrgSave}
          />
        </>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Profile data is not available.</p>
      )}
    </div>
  );
}

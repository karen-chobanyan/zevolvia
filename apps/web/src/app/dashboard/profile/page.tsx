import ProfilePageClient from "@/components/profile/ProfilePageClient";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your KitchenDocs profile and account settings.",
};

export default function Profile() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Account settings
        </h3>
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white/90">Theme Selector</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose light or dark mode for your dashboard.
              </p>
            </div>
            <ThemeToggleButton />
          </div>
        </div>
        <ProfilePageClient />
      </div>
    </div>
  );
}

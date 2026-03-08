"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { Dropdown } from "@/ui/dropdown/Dropdown";
import { DropdownItem } from "@/ui/dropdown/DropdownItem";
import { NotificationItem } from "@/types/notification";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const getNotificationHref = (notification: NotificationItem) => {
  const fromPayload = notification.data?.bookingId;
  const bookingId = typeof fromPayload === "string" ? fromPayload : notification.bookingId;

  if (bookingId) {
    return `/dashboard/calendar?bookingId=${bookingId}`;
  }

  return "/dashboard";
};

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, hasUnread, loading, markAsRead } = useNotifications();

  const latest = useMemo(() => notifications.slice(0, 20), [notifications]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const onNotificationClick = async (notification: NotificationItem) => {
    if (!notification.readAt) {
      try {
        await markAsRead(notification.id);
      } catch {
        // best effort, navigation should still happen
      }
    }

    closeDropdown();
    router.push(getNotificationHref(notification));
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label="Open notifications"
      >
        {hasUnread && (
          <>
            <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400" />
            <span className="absolute right-0 top-0.5 z-0 h-2 w-2 rounded-full bg-orange-400 animate-ping" />
          </>
        )}

        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Loading...</li>
          ) : latest.length === 0 ? (
            <li className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
              No notifications yet.
            </li>
          ) : (
            latest.map((notification) => (
              <li key={notification.id}>
                <DropdownItem
                  onClick={() => onNotificationClick(notification)}
                  className="flex items-start gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      notification.readAt ? "bg-gray-300 dark:bg-gray-600" : "bg-brand-500"
                    }`}
                  />
                  <span className="block min-w-0">
                    <span className="mb-1 block text-theme-sm font-medium text-gray-800 dark:text-white/90 truncate">
                      {notification.title}
                    </span>
                    <span className="mb-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </span>
                    <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}

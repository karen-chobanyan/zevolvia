"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NotificationApi } from "@/services/NotificationApi.service";
import { NotificationItem, NotificationStreamEvent } from "@/types/notification";

const toTime = (value: string) => new Date(value).getTime();

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const notificationIdsRef = useRef<Set<string>>(new Set());

  const upsertNotification = useCallback((incoming: NotificationItem) => {
    setNotifications((prev) => {
      const filteredByOrg = prev.filter((item) => item.orgId === incoming.orgId);
      const idx = filteredByOrg.findIndex((item) => item.id === incoming.id);

      if (idx >= 0) {
        const copy = [...filteredByOrg];
        copy[idx] = incoming;
        return copy.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
      }

      return [incoming, ...filteredByOrg].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
    });
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      const updated = await NotificationApi.markAsRead(id);
      upsertNotification(updated);
      if (updated.readAt) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return updated;
    },
    [upsertNotification],
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [list, unread, auth] = await Promise.all([
          NotificationApi.list(),
          NotificationApi.unreadCount(),
          NotificationApi.authContext(),
        ]);

        if (!isMounted) return;

        const first = list[0];
        setOrgId(first?.orgId ?? auth.orgId ?? null);
        setUserId(first?.userId ?? auth.sub ?? null);
        setNotifications(list);
        setUnreadCount(unread);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    notificationIdsRef.current = new Set(notifications.map((item) => item.id));
  }, [notifications]);

  useEffect(() => {
    if (loading) return;

    const source = new EventSource(NotificationApi.streamUrl(), { withCredentials: true });
    eventSourceRef.current = source;

    source.addEventListener("notification", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as NotificationStreamEvent;

      if (!orgId || !userId) {
        return;
      }

      const nextItem = NotificationApi.toNotificationItem(payload, orgId, userId);
      const exists = notificationIdsRef.current.has(nextItem.id);
      upsertNotification(nextItem);
      if (!nextItem.readAt && !exists) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [loading, orgId, userId, upsertNotification]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  return {
    notifications,
    unreadCount,
    hasUnread,
    loading,
    markAsRead,
  };
};

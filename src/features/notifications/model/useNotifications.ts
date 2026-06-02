import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from '@/shared/api/apiClient';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';

export type NotificationType =
  | "new_opportunity"
  | "opportunity_closed"
  | "offer_accepted"
  | "offer_declined"
  | "offer_created"
  | "offer_withdrawn"
  | "offer_expiring"
  | "interview_scheduled"
  | "interview_rescheduled"
  | "interview_completed"
  | "interview_reminder"
  | "pipeline_stage_changed"
  | "candidate_shortlisted"
  | "candidate_rejected"
  | "new_application"
  | "learner_verification_required"
  | "assignment_submitted"
  | "class_activity_pending"
  | "learner_achievement"
  | "new_learner_enrolled"
  | "attendance_reminder"
  | "course_added"
  | "course_updated"
  | "new_message"
  | "message_reply"
  | "approval_required"
  | "system_alert"
  | "system_maintenance"
  | string;

export type Notification = {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

async function resolveUserId(identifier: string): Promise<string | null> {
  if (!identifier) return null;

  const response: any = await apiPost('/notifications', {
    action: 'resolve-users',
    identifiers: [identifier],
  });

  const data = response?.data ?? response;
  return data?.resolved?.[identifier] ?? null;
}

type UseNotificationsReturn = {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  connectionStatus: string;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useNotifications(
  userIdentifier?: string | null
): UseNotificationsReturn {
  const PAGE_SIZE = 20;
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const lastCursorRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resolve = async () => {
      if (!userIdentifier) {
        setUserId(null);
        setItems([]);
        setLoading(false);
        return;
      }
      const id = await resolveUserId(userIdentifier);
      setUserId(id);
    };
    resolve();
  }, [userIdentifier]);

  const fetchNotifications = async (reset = true) => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);

      let path = `/notifications?limit=${PAGE_SIZE}`;
      if (!reset && lastCursorRef.current) {
        path += `&before=${encodeURIComponent(lastCursorRef.current)}`;
      }

      const response: any = await apiGet(path);
      const data: Notification[] = response?.data?.notifications ?? response?.notifications ?? [];

      if (reset) setItems(data);
      else setItems((prev) => [...prev, ...data]);

      setHasMore(data.length === PAGE_SIZE);
      if (data.length > 0) {
        lastCursorRef.current = data[data.length - 1].created_at;
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    let isSubscribed = true;

    const sseClient = getSSEClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to notifications changes
    const unsub = sseClient.subscribe(
      'notifications',
      { event: '*', filter: `recipient_id=eq.${userId}` },
      (event) => {
        if (event.type === 'change') {
          const row = event.payload as Notification;

          if (event.event === 'INSERT') {
            setItems((prev) => [row, ...prev]);
          } else if (event.event === 'UPDATE') {
            setItems((prev) =>
              prev.map((n) => (n.id === row.id ? row : n))
            );
          } else if (event.event === 'DELETE') {
            setItems((prev) => prev.filter((n) => n.id !== row.id));
          }
        }
      }
    );
    unsubscribers.push(unsub);

    setConnectionStatus('SUBSCRIBED');

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      unsubscribers.forEach(unsub => unsub());
      setConnectionStatus('disconnected');
    };
  }, [userId]);

  useEffect(() => {
    if (userId) fetchNotifications(true);
  }, [userId]);

  const markRead = async (id: string) => {
    await apiPost('/notifications', { action: 'mark-read', ids: [id] });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await apiPost('/notifications', { action: 'mark-all-read' });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const remove = async (id: string) => {
    await apiPost('/notifications', { action: 'delete', ids: [id] });
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const loadMore = async () => fetchNotifications(false);
  const refresh = async () => fetchNotifications(true);

  const unreadCount = items.filter((n) => !n.read).length;

  return {
    items,
    unreadCount,
    loading,
    error,
    hasMore,
    connectionStatus,
    loadMore,
    markRead,
    markAllRead,
    remove,
    refresh,
  };
}
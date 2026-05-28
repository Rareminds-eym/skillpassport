import { useEffect, useRef, useState } from "react";
import { supabase } from '@/shared/api/supabaseClient';
import { apiGet, apiPost } from '@/shared/api/apiClient';

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

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function resolveUserId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (isUUID(identifier)) return identifier;

  const { data: learnerData } = await supabase
    .from("learners")
    .select("user_id")
    .ilike("email", identifier)
    .maybeSingle();

  if (learnerData?.user_id) return learnerData.user_id;

  const { data: educatorData } = await supabase
    .from("school_educators")
    .select("user_id")
    .ilike("email", identifier)
    .maybeSingle();

  if (educatorData?.user_id) return educatorData.user_id;

  const { data: recruiterData } = await supabase
    .from("recruiters")
    .select("user_id")
    .eq("email", identifier)
    .maybeSingle();

  if (recruiterData?.user_id) return recruiterData.user_id;

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .ilike("email", identifier)
    .maybeSingle();

  return userData?.id ?? null;
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
  const channelRef = useRef<any | null>(null);
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
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const setupSubscription = () => {
      if (!isSubscribed) return;

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as Notification;

            if (payload.eventType === "INSERT") {
              setItems((prev) => [row, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setItems((prev) =>
                prev.map((n) => (n.id === row.id ? row : n))
              );
            } else if (payload.eventType === "DELETE") {
              const oldRow = payload.old as Notification;
              setItems((prev) => prev.filter((n) => n.id !== oldRow.id));
            }
          }
        )
        .subscribe((status) => {
          setConnectionStatus(status);

          if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            if (isSubscribed && retryCount < MAX_RETRIES) {
              retryCount++;
              reconnectTimeoutRef.current = setTimeout(() => {
                setupSubscription();
              }, 2000 * retryCount);
            }
          } else if (status === "SUBSCRIBED") {
            retryCount = 0;
          }
        });

      channelRef.current = channel;
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnectionStatus("disconnected");
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

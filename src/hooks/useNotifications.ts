/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type NotificationType =
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
  | "system_maintenance"
  | string;

export type Notification = {
  id: string;
  recruiter_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

// ✅ Validate UUID format
function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ✅ Resolve recruiterId from email or uuid
async function resolveRecruiterId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (isUUID(identifier)) return identifier;

  const { data, error } = await supabase
    .from("recruiters")
    .select("id")
    .ilike("email", identifier)
    .maybeSingle();

  if (error) return null;
  return data?.id ?? null;
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

export function useNotifications(recruiterEmail?: string | null): UseNotificationsReturn {
  const PAGE_SIZE = 20;
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [recruiterId, setRecruiterId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const lastCursorRef = useRef<string | null>(null);
  const channelRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Step 1: Resolve recruiter ID from email
  useEffect(() => {
    const resolve = async () => {
      if (!recruiterEmail) {
        setRecruiterId(null);
        setItems([]);
        setLoading(false);
        return;
      }
      const id = await resolveRecruiterId(recruiterEmail);
      setRecruiterId(id);
    };
    resolve();
  }, [recruiterEmail]);

  // ✅ Step 2: Fetch notifications
  const fetchNotifications = async (reset = true) => {
    if (!recruiterId) return;
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("notifications")
        .select("*")
        .eq("recruiter_id", recruiterId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (!reset && lastCursorRef.current) {
        query = query.lt("created_at", lastCursorRef.current);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (reset) setItems(data || []);
      else setItems((prev) => [...prev, ...(data || [])]);

      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      if (data && data.length > 0) {
        lastCursorRef.current = data[data.length - 1].created_at;
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 3: Setup realtime updates
  useEffect(() => {
    if (!recruiterId) return;
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
        .channel(`notifications-${recruiterId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recruiter_id=eq.${recruiterId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newRow = payload.new as Notification;
              setItems((prev) => [newRow, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              const updatedRow = payload.new as Notification;
              setItems((prev) =>
                prev.map((n) => (n.id === updatedRow.id ? updatedRow : n))
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
  }, [recruiterId]);

  // ✅ Auto refresh when recruiterId changes
  useEffect(() => {
    if (recruiterId) fetchNotifications(true);
  }, [recruiterId]);

  // ✅ Actions
  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("recruiter_id", recruiterId);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
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

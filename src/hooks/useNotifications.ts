/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Notification types used across the UI
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
  recruiter_id: string; // UUID
  actor_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

// ✅ Helper to validate UUID
function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// 🔹 Resolve recruiterId (UUID or email → UUID)
async function resolveRecruiterId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (isUUID(identifier)) return identifier;

  const { data, error } = await supabase
    .from("recruiters")
    .select("id")
    .eq("email", identifier)
    .maybeSingle();

  if (error) {
    console.error("Error resolving recruiter:", error);
    return null;
  }
  return data?.id ?? null;
}

// 🔹 Helper to create a new notification
export const createNotification = async (
  recruiterIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) => {
  try {
    const recruiterId = await resolveRecruiterId(recruiterIdentifier);
    if (!recruiterId) return { success: false, error: "Recruiter not found" };

    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          recruiter_id: recruiterId,
          type,
          title,
          message,
          read: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error creating notification:", err);
    return { success: false, error: err.message };
  }
};

// Hook return shape
type UseNotificationsReturn = {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useNotifications(
  recruiterIdentifier?: string | null
): UseNotificationsReturn {
  const PAGE_SIZE = 20;
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [resolvedRecruiterId, setResolvedRecruiterId] = useState<string | null>(
    null
  );

  const lastCursorRef = useRef<string | null>(null);
  const channelRef = useRef<any | null>(null);

  // 🔹 Resolve recruiter UUID
  useEffect(() => {
    const resolve = async () => {
      if (!recruiterIdentifier) {
        setResolvedRecruiterId(null);
        setItems([]);
        setLoading(false);
        return;
      }
      const uuid = await resolveRecruiterId(recruiterIdentifier);
      setResolvedRecruiterId(uuid);
    };
    resolve();
  }, [recruiterIdentifier]);

  // 🔹 Fetch notifications
  const fetchNotifications = async (reset = true) => {
    if (!resolvedRecruiterId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("notifications")
        .select("*")
        .eq("recruiter_id", resolvedRecruiterId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (!reset && lastCursorRef.current) {
        query = query.lt("created_at", lastCursorRef.current);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const fetched = data ?? [];
      setItems((prev) => (reset ? fetched : [...prev, ...fetched]));
      setHasMore(fetched.length === PAGE_SIZE);
      lastCursorRef.current =
        fetched.length > 0
          ? fetched[fetched.length - 1].created_at
          : lastCursorRef.current;
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError(err?.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Load initial
  useEffect(() => {
    if (resolvedRecruiterId) {
      fetchNotifications(true);
    }
  }, [resolvedRecruiterId]);

  // 🔹 Realtime subscription
  useEffect(() => {
    if (!resolvedRecruiterId) return;

    // cleanup old
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notifications-${resolvedRecruiterId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          const newRow = payload.new as Notification;
          const oldRow = payload.old as Notification;

          // ✅ Only handle rows for this recruiter
          if (
            (newRow && newRow.recruiter_id === resolvedRecruiterId) ||
            (oldRow && oldRow.recruiter_id === resolvedRecruiterId)
          ) {
            if (payload.eventType === "INSERT" && newRow) {
              setItems((prev) =>
                prev.some((n) => n.id === newRow.id) ? prev : [newRow, ...prev]
              );
            }
            if (payload.eventType === "UPDATE" && newRow) {
              setItems((prev) =>
                prev.map((n) => (n.id === newRow.id ? newRow : n))
              );
            }
            if (payload.eventType === "DELETE" && oldRow) {
              setItems((prev) => prev.filter((n) => n.id !== oldRow.id));
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [resolvedRecruiterId]);

  const loadMore = async () => fetchNotifications(false);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch (err) {
      console.error("markRead error:", err);
    }
  };

  const markAllRead = async () => {
    if (!resolvedRecruiterId) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recruiter_id", resolvedRecruiterId)
        .eq("read", false);
    } catch (err) {
      console.error("markAllRead error:", err);
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await supabase.from("notifications").delete().eq("id", id);
    } catch (err) {
      console.error("remove error:", err);
    }
  };

  const refresh = async () => {
    if (resolvedRecruiterId) {
      await fetchNotifications(true);
    }
  };

  const unreadCount = items.filter((i) => !i.read).length;

  return {
    items,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    remove,
    refresh,
  };
}

export default useNotifications;

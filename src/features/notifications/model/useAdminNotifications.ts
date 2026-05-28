import { useEffect, useRef, useState } from "react";
import { supabase } from '@/shared/api/supabaseClient';
import { apiGet, apiPost } from '@/shared/api/apiClient';

export type AdminNotificationType =
  | "training_submitted"
  | "training_approved"
  | "training_rejected"
  | "experience_submitted"
  | "experience_approved"
  | "experience_rejected"
  | "project_submitted"
  | "project_approved"
  | "project_rejected"
  | "assessment_completed"
  | "assessment_submitted"
  | "learner_enrolled"
  | "learner_achievement"
  | "assignment_submitted"
  | "class_activity_pending"
  | "attendance_reminder"
  | "system_alert"
  | "approval_required"
  | "verification_required"
  | string;

export type AdminNotification = {
  id: string;
  recipient_id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function resolveAdminContext(identifier: string): Promise<{
  userId: string | null;
  schoolId: string | null;
  collegeId: string | null;
  adminType: string | null;
}> {
  if (!identifier) return { userId: null, schoolId: null, collegeId: null, adminType: null };

  let userId = identifier;
  if (!isUUID(identifier)) {
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .ilike("email", identifier)
      .maybeSingle();

    if (!userData?.id) return { userId: null, schoolId: null, collegeId: null, adminType: null };
    userId = userData.id;
  }

  const { data: schoolAdmin } = await supabase
    .from("school_educators")
    .select("school_id, role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (schoolAdmin) {
    return {
      userId,
      schoolId: schoolAdmin.school_id,
      collegeId: null,
      adminType: "school_admin"
    };
  }

  const { data: collegeAdmin } = await supabase
    .from("users")
    .select("id, organizationId")
    .eq("id", userId)
    .eq("role", "college_admin")
    .maybeSingle();

  if (collegeAdmin) {
    return {
      userId,
      schoolId: null,
      collegeId: collegeAdmin.organizationId,
      adminType: "college_admin"
    };
  }

  const { data: universityAdmin } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .eq("role", "university_admin")
    .maybeSingle();

  if (universityAdmin) {
    return {
      userId,
      schoolId: null,
      collegeId: null,
      adminType: "university_admin"
    };
  }

  return { userId, schoolId: null, collegeId: null, adminType: null };
}

type UseAdminNotificationsReturn = {
  items: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  connectionStatus: string;
  adminContext: {
    userId: string | null;
    schoolId: string | null;
    collegeId: string | null;
    adminType: string | null;
  };
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useAdminNotifications(
  userIdentifier?: string | null
): UseAdminNotificationsReturn {
  const PAGE_SIZE = 20;
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [adminContext, setAdminContext] = useState<{
    userId: string | null;
    schoolId: string | null;
    collegeId: string | null;
    adminType: string | null;
  }>({ userId: null, schoolId: null, collegeId: null, adminType: null });
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const lastCursorRef = useRef<string | null>(null);
  const channelRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resolve = async () => {
      if (!userIdentifier) {
        setAdminContext({ userId: null, schoolId: null, collegeId: null, adminType: null });
        setItems([]);
        setLoading(false);
        return;
      }
      const context = await resolveAdminContext(userIdentifier);
      setAdminContext(context);
    };
    resolve();
  }, [userIdentifier]);

  const fetchNotifications = async (reset = true) => {
    if (!adminContext.userId) return;
    try {
      setLoading(true);
      setError(null);

      let path = `/notifications?limit=${PAGE_SIZE}`;
      if (!reset && lastCursorRef.current) {
        path += `&before=${encodeURIComponent(lastCursorRef.current)}`;
      }

      const response: any = await apiGet(path);
      const data: AdminNotification[] = response?.data?.notifications ?? response?.notifications ?? [];

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
    if (!adminContext.userId) return;
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
        .channel(`admin-notifications-${adminContext.userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${adminContext.userId}`,
          },
          (payload) => {
            const row = payload.new as AdminNotification;

            if (payload.eventType === "INSERT") {
              setItems((prev) => [row, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setItems((prev) =>
                prev.map((n) => (n.id === row.id ? row : n))
              );
            } else if (payload.eventType === "DELETE") {
              const oldRow = payload.old as AdminNotification;
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
  }, [adminContext.userId]);

  useEffect(() => {
    if (adminContext.userId) fetchNotifications(true);
  }, [adminContext.userId]);

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
    adminContext,
    loadMore,
    markRead,
    markAllRead,
    remove,
    refresh,
  };
}

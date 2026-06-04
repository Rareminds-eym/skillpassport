import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from '@/shared/api/apiClient';
import { getWSClient } from '@/shared/api/wsRealtimeClient';

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

async function resolveAdminContext(identifier: string): Promise<{
  userId: string | null;
  schoolId: string | null;
  collegeId: string | null;
  adminType: string | null;
}> {
  if (!identifier) return { userId: null, schoolId: null, collegeId: null, adminType: null };

  const response: any = await apiPost('/notifications', {
    action: 'resolve-admin-context',
    identifier,
  });

  const data = response?.data ?? response;
  return {
    userId: data?.userId ?? null,
    schoolId: data?.schoolId ?? null,
    collegeId: data?.collegeId ?? null,
    adminType: data?.adminType ?? null,
  };
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
  const unsubscribeRef = useRef<(() => void) | null>(null);

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

    const wsClient = getWSClient();

    const unsubInsert = wsClient.subscribe('notifications', {
      event: 'INSERT',
      filter: `recipient_id=eq.${adminContext.userId}`,
    }, (event) => {
      if (event.type !== 'change') return;
      const row = event.payload as AdminNotification;
      if (event.event === 'INSERT') {
        setItems((prev) => [row, ...prev]);
      }
    });

    const unsubUpdate = wsClient.subscribe('notifications', {
      event: 'UPDATE',
      filter: `recipient_id=eq.${adminContext.userId}`,
    }, (event) => {
      if (event.type !== 'change') return;
      const row = event.payload as AdminNotification;
      setItems((prev) => prev.map((n) => (n.id === row.id ? row : n)));
    });

    const unsubDelete = wsClient.subscribe('notifications', {
      event: 'DELETE',
      filter: `recipient_id=eq.${adminContext.userId}`,
    }, (event) => {
      if (event.type !== 'change') return;
      const oldRow = event.payload as AdminNotification;
      setItems((prev) => prev.filter((n) => n.id !== oldRow.id));
    });

    setConnectionStatus('connected');
    unsubscribeRef.current = () => { unsubInsert(); unsubUpdate(); unsubDelete(); };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setConnectionStatus('disconnected');
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
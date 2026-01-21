/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export type AdminNotificationType =
  // Training notifications
  | 'training_submitted'
  | 'training_approved'
  | 'training_rejected'
  // Experience notifications
  | 'experience_submitted'
  | 'experience_approved'
  | 'experience_rejected'
  // Project notifications
  | 'project_submitted'
  | 'project_approved'
  | 'project_rejected'
  // Assessment notifications
  | 'assessment_completed'
  | 'assessment_submitted'
  // Student notifications
  | 'student_enrolled'
  | 'student_achievement'
  | 'assignment_submitted'
  | 'class_activity_pending'
  | 'attendance_reminder'
  // System notifications
  | 'system_alert'
  | 'approval_required'
  | 'verification_required'
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

// ✅ Validate UUID format
function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ✅ Resolve admin user ID and get school/college context
async function resolveAdminContext(identifier: string): Promise<{
  userId: string | null;
  schoolId: string | null;
  collegeId: string | null;
  adminType: string | null;
}> {
  if (!identifier) return { userId: null, schoolId: null, collegeId: null, adminType: null };

  let userId = identifier;
  if (!isUUID(identifier)) {
    // Try to resolve email to user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .ilike('email', identifier)
      .maybeSingle();

    if (!userData?.id) return { userId: null, schoolId: null, collegeId: null, adminType: null };
    userId = userData.id;
  }

  // Check if user is a school admin
  const { data: schoolAdmin } = await supabase
    .from('school_educators')
    .select('school_id, role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (schoolAdmin) {
    return {
      userId,
      schoolId: schoolAdmin.school_id,
      collegeId: null,
      adminType: 'school_admin',
    };
  }

  // Check if user is a college admin
  const { data: collegeAdmin } = await supabase
    .from('users')
    .select('id, organizationId')
    .eq('id', userId)
    .eq('role', 'college_admin')
    .maybeSingle();

  if (collegeAdmin) {
    return {
      userId,
      schoolId: null,
      collegeId: collegeAdmin.organizationId,
      adminType: 'college_admin',
    };
  }

  // Check if user is a university admin
  const { data: universityAdmin } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .eq('role', 'university_admin')
    .maybeSingle();

  if (universityAdmin) {
    return {
      userId,
      schoolId: null,
      collegeId: null,
      adminType: 'university_admin',
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

export function useAdminNotifications(userIdentifier?: string | null): UseAdminNotificationsReturn {
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
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const lastCursorRef = useRef<string | null>(null);
  const channelRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Step 1: Resolve admin context
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

  // ✅ Step 2: Fetch notifications
  const fetchNotifications = async (reset = true) => {
    if (!adminContext.userId) {
      return;
    }
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', adminContext.userId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (!reset && lastCursorRef.current) {
        query = query.lt('created_at', lastCursorRef.current);
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
      console.error('❌ [useAdminNotifications] Error:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 3: Setup realtime updates
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
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${adminContext.userId}`,
          },
          (payload) => {
            const row = payload.new as AdminNotification;

            if (payload.eventType === 'INSERT') {
              setItems((prev) => [row, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setItems((prev) => prev.map((n) => (n.id === row.id ? row : n)));
            } else if (payload.eventType === 'DELETE') {
              const oldRow = payload.old as AdminNotification;
              setItems((prev) => prev.filter((n) => n.id !== oldRow.id));
            }
          }
        )
        .subscribe((status) => {
          setConnectionStatus(status);

          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            if (isSubscribed && retryCount < MAX_RETRIES) {
              retryCount++;
              reconnectTimeoutRef.current = setTimeout(() => {
                setupSubscription();
              }, 2000 * retryCount);
            }
          } else if (status === 'SUBSCRIBED') {
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
      setConnectionStatus('disconnected');
    };
  }, [adminContext.userId]);

  // ✅ Auto refresh when admin context changes
  useEffect(() => {
    if (adminContext.userId) fetchNotifications(true);
  }, [adminContext.userId]);

  // ✅ Actions
  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', adminContext.userId);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const remove = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
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

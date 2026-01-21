/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export type NotificationType =
  // Opportunity notifications
  | 'new_opportunity'
  | 'opportunity_closed'
  | 'offer_accepted'
  | 'offer_declined'
  | 'offer_created'
  | 'offer_withdrawn'
  | 'offer_expiring'
  // Interview notifications
  | 'interview_scheduled'
  | 'interview_rescheduled'
  | 'interview_completed'
  | 'interview_reminder'
  // Pipeline notifications
  | 'pipeline_stage_changed'
  | 'candidate_shortlisted'
  | 'candidate_rejected'
  | 'new_application'
  // Educator notifications
  | 'student_verification_required'
  | 'assignment_submitted'
  | 'class_activity_pending'
  | 'student_achievement'
  | 'new_student_enrolled'
  | 'attendance_reminder'
  // Course notifications
  | 'course_added'
  | 'course_updated'
  // Message notifications
  | 'new_message'
  | 'message_reply'
  // Admin notifications
  | 'approval_required'
  | 'system_alert'
  // General
  | 'system_maintenance'
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

// ✅ Validate UUID format
function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ✅ Resolve user ID from email or UUID
async function resolveUserId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (isUUID(identifier)) return identifier;

  // Try educators first
  const { data: educatorData } = await supabase
    .from('school_educators')
    .select('id')
    .ilike('email', identifier)
    .maybeSingle();

  if (educatorData?.id) return educatorData.id;

  // Try students
  const { data: studentData } = await supabase
    .from('students')
    .select('id')
    .ilike('email', identifier)
    .maybeSingle();

  if (studentData?.id) return studentData.id;

  // Try recruiters
  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('id')
    .eq('email', identifier)
    .maybeSingle();
  if (recruiter?.id) return recruiter.id;

  // Try users (admins)
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .ilike('email', identifier)
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

export function useNotifications(userIdentifier?: string | null): UseNotificationsReturn {
  const PAGE_SIZE = 20;
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const lastCursorRef = useRef<string | null>(null);
  const channelRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Step 1: Resolve user ID from email
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

  // ✅ Step 2: Fetch notifications
  const fetchNotifications = async (reset = true) => {
    if (!userId) {
      return;
    }
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
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
      console.error('❌ [useNotifications] Error:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 3: Setup realtime updates
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
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as Notification;

            if (payload.eventType === 'INSERT') {
              setItems((prev) => [row, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setItems((prev) => prev.map((n) => (n.id === row.id ? row : n)));
            } else if (payload.eventType === 'DELETE') {
              const oldRow = payload.old as Notification;
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
  }, [userId]);

  // ✅ Auto refresh when userId changes
  useEffect(() => {
    if (userId) fetchNotifications(true);
  }, [userId]);

  // ✅ Actions
  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('recipient_id', userId);
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
    loadMore,
    markRead,
    markAllRead,
    remove,
    refresh,
  };
}

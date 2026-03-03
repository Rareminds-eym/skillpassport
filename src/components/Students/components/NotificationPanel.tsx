import React, { useState, useEffect, useRef } from "react";
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import {
  useNotifications,
  NotificationType,
} from "../../../hooks/useNotifications";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabaseClient";

import { useNavigate } from "react-router-dom";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  studentEmail?: string;
}

type FilterKey = "all" | "unread" | "opportunities" | "interviews" | "courses" | "messages";

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  studentEmail,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Use email from props, auth user, or fallback
  // Prefer email to resolve to Profile ID, otherwise fallback to user ID
  const userIdToUse = studentEmail || user?.email || user?.id || null;



  const {
    items: notifications,
    unreadCount,
    markRead,
    markAllRead,
    remove,
    hasMore,
    loadMore,
    loading,
    error,
  } = useNotifications(userIdToUse);


  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");

  // Track new notifications for animation
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set());
  const [showNewNotificationToast, setShowNewNotificationToast] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  
  // Cache for sender names and roles
  const [senderNamesCache, setSenderNamesCache] = useState<Map<string, { name: string; role?: string }>>(new Map());


  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Detect new notifications and animate them
  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    const prevIds = prevIdsRef.current;

    const newIds = [...currentIds].filter((id) => !prevIds.has(id));
    if (newIds.length > 0) {
      setNewNotificationIds(new Set(newIds));
      setShowNewNotificationToast(true);

      setTimeout(() => setShowNewNotificationToast(false), 3000);
      setTimeout(() => setNewNotificationIds(new Set()), 3000);
    }

    prevIdsRef.current = currentIds;
  }, [notifications]);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      markRead(notification.id);
    }

    // Navigate FIRST - this must happen before closing the panel
    switch (notification.type) {
      case "new_message":
      case "message_reply":
<<<<<<< Updated upstream
        navigate("/student/messages?tab=recruiters");
=======
        // Determine sender type to navigate to correct tab
        try {
          // Get the authenticated user's UUID
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser?.id) {
            // Extract timestamp from notification to find the corresponding message
            const notificationTime = new Date(notification.created_at);
            const timeWindowStart = new Date(notificationTime.getTime() - 5000).toISOString();
            const timeWindowEnd = new Date(notificationTime.getTime() + 5000).toISOString();

            const { data: messageData } = await supabase
              .from('messages')
              .select('sender_type, conversation_id')
              .eq('receiver_id', authUser.id)
              .gte('created_at', timeWindowStart)
              .lte('created_at', timeWindowEnd)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (messageData) {
              // Map sender_type to Messages page tab
              let tab = 'recruiters'; // default fallback
              
              if (messageData.sender_type === 'recruiter') {
                tab = 'recruiters';
              } else if (messageData.sender_type === 'school_admin') {
                tab = 'admin';
              } else if (messageData.sender_type === 'college_admin') {
                tab = 'college_admin';
              } else if (messageData.sender_type === 'educator' || messageData.sender_type === 'school_educator') {
                tab = 'educators';
              } else if (messageData.sender_type === 'student') {
                tab = 'students';
              }

              // Navigate with tab and conversation parameters
              const conversationParam = messageData.conversation_id ? `&conversation=${messageData.conversation_id}` : '';
              navigate(`/student/messages?tab=${tab}${conversationParam}`);
            } else {
              // Fallback if message not found
              navigate("/student/messages");
            }
          } else {
            // Fallback if user not authenticated
            navigate("/student/messages");
          }
        } catch (error) {
          console.error('Error determining sender type:', error);
          // Fallback on error
          navigate("/student/messages");
        }
>>>>>>> Stashed changes
        break;

      case "course_added":
      case "course_updated":
      case "assignment_submitted":
      case "class_activity_pending":
      case "student_achievement":
      case "new_student_enrolled":
        navigate("/student/courses");
        break;

      case "new_opportunity":
      case "opportunity_closed":
      case "offer_accepted":
      case "offer_declined":
      case "offer_created":
      case "offer_withdrawn":
      case "offer_expiring":
      case "candidate_shortlisted":
      case "new_application":
        navigate("/student/opportunities");
        break;

      case "interview_scheduled":
      case "interview_rescheduled":
      case "interview_completed":
      case "interview_reminder":
      case "pipeline_stage_changed":
      case "candidate_rejected":
        navigate("/student/applications");
        break;

      default:
        // Default fallback
        break;
    }

    // Close panel AFTER navigation
    onClose();
  }

  const filteredNotifications = notifications.filter((n) => {
    switch (selectedFilter) {
      case "unread":
        return !n.read;
      case "opportunities":
        return [
          "offer_accepted",
          "offer_declined",
          "offer_created",
          "offer_withdrawn",
          "offer_expiring",
          "candidate_shortlisted",
          "new_application",
          "new_opportunity",
          "opportunity_closed"
        ].includes(n.type);
      case "interviews":
        return [
          "interview_scheduled",
          "interview_rescheduled",
          "interview_completed",
          "interview_reminder",
          "pipeline_stage_changed",
          "candidate_rejected"
        ].includes(n.type);
      case "courses":
        return [
          "assignment_submitted",
          "class_activity_pending",
          "student_achievement",
          "new_student_enrolled",
          "course_added",
          "course_updated"
        ].includes(n.type);
      case "messages":
        return [
          "new_message",
          "message_reply"
        ].includes(n.type);
      default:
        return true;
    }
  });



  // Helper function to get count for each filter
  const getFilterCount = (filterKey: FilterKey): number => {
    if (filterKey === "all") return notifications.length;
    if (filterKey === "unread") return notifications.filter((n) => !n.read).length;
    if (filterKey === "opportunities") {
      return notifications.filter((n) =>
        [
          "offer_accepted",
          "offer_declined",
          "offer_created",
          "offer_withdrawn",
          "offer_expiring",
          "candidate_shortlisted",
          "new_application",
          "new_opportunity",
          "opportunity_closed"
        ].includes(n.type)
      ).length;
    }
    if (filterKey === "interviews") {
      return notifications.filter((n) =>
        [
          "interview_scheduled",
          "interview_rescheduled",
          "interview_completed",
          "interview_reminder",
          "pipeline_stage_changed",
          "candidate_rejected"
        ].includes(n.type)
      ).length;
    }
    if (filterKey === "courses") {
      return notifications.filter((n) =>
        [
          "assignment_submitted",
          "class_activity_pending",
          "student_achievement",
          "new_student_enrolled",
          "course_added",
          "course_updated"
        ].includes(n.type)
      ).length;
    }
    if (filterKey === "messages") {
      return notifications.filter((n) =>
        [
          "new_message",
          "message_reply"
        ].includes(n.type)
      ).length;
    }
    return 0;
  };

  const getNotificationIcon = (type: NotificationType) => {
    const base = "h-5 w-5";
    switch (type) {
      case "offer_accepted":
      case "offer_created":
        return <CheckCircleIcon className={`${base} text-emerald-500`} />;
      case "offer_declined":
      case "offer_withdrawn":
      case "candidate_rejected":
      case "opportunity_closed":
        return <XMarkIcon className={`${base} text-red-500`} />;
      case "offer_expiring":
        return <ExclamationTriangleIcon className={`${base} text-amber-500`} />;
      case "interview_scheduled":
      case "interview_rescheduled":
      case "interview_reminder":
        return <ClockIcon className={`${base} text-violet-500`} />;
      case "interview_completed":
        return <CheckIcon className={`${base} text-emerald-500`} />;
      case "pipeline_stage_changed":
      case "candidate_shortlisted":
      case "new_opportunity":
        return <BriefcaseIcon className={`${base} text-blue-500`} />;
      case "new_application":
        return <BellIcon className={`${base} text-indigo-500`} />;
      case "assignment_submitted":
      case "class_activity_pending":
      case "student_achievement":
        return <AcademicCapIcon className={`${base} text-blue-500`} />;
      case "course_added":
        return <CheckCircleIcon className={`${base} text-green-500`} />;
      case "course_updated":
        return <InformationCircleIcon className={`${base} text-cyan-500`} />;
      case "new_message":
      case "message_reply":
        return <EnvelopeIcon className={`${base} text-purple-500`} />;
      case "system_maintenance":
        return <ExclamationTriangleIcon className={`${base} text-yellow-500`} />;
      default:
        return <BellIcon className={`${base} text-gray-400`} />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch sender name from database using message record linked to notification
  const fetchSenderName = async (notification: any): Promise<{ name: string; role?: string } | null> => {
    try {
      // Get the authenticated user's UUID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.id) {
        console.error('No authenticated user found');
        return null;
      }

      // Extract timestamp from notification to find the corresponding message
      const notificationTime = new Date(notification.created_at);
      
      // Query messages around the notification creation time (within 5 seconds)
      const timeWindowStart = new Date(notificationTime.getTime() - 5000).toISOString();
      const timeWindowEnd = new Date(notificationTime.getTime() + 5000).toISOString();

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('sender_id, sender_type')
        .eq('receiver_id', authUser.id)
        .gte('created_at', timeWindowStart)
        .lte('created_at', timeWindowEnd)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (messageError || !messageData) {
        console.error('Error fetching message for notification:', notification.id, messageError);
        return null;
      }

      const { sender_id, sender_type } = messageData;

      // Fetch sender name and role based on sender_type
      let senderName: string | null = null;
      let senderRole: string | undefined = undefined;

      if (sender_type === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('profile')
          .eq('id', sender_id)
          .maybeSingle();
        
        if (!error && data?.profile?.name) {
          senderName = data.profile.name;
          senderRole = 'Student';
        }
      } else if (sender_type === 'educator' || sender_type === 'school_educator') {
        // First get educator name from school_educators
        const { data: educatorData, error: educatorError } = await supabase
          .from('school_educators')
          .select('first_name, last_name, user_id')
          .eq('user_id', sender_id)
          .maybeSingle();
        
        if (!educatorError && educatorData) {
          const fullName = `${educatorData.first_name || ''} ${educatorData.last_name || ''}`.trim();
          if (fullName) {
            senderName = fullName;
            
            // Fetch role from users table using user_id
            if (educatorData.user_id) {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', educatorData.user_id)
                .maybeSingle();
              
              if (!userError && userData?.role) {
                senderRole = userData.role;
              } else {
                senderRole = 'Educator';
              }
            } else {
              senderRole = 'Educator';
            }
          }
        }
      } else if (sender_type === 'school_admin' || sender_type === 'college_admin') {
        const { data, error } = await supabase
          .from('users')
          .select('firstName, lastName, role')
          .eq('id', sender_id)
          .maybeSingle();
        
        if (!error && data) {
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
          if (fullName) {
            senderName = fullName;
            senderRole = data.role || (sender_type === 'school_admin' ? 'School Admin' : 'College Admin');
          }
        }
      } else if (sender_type === 'recruiter') {
        const { data, error } = await supabase
          .from('recruiters')
          .select('name')
          .eq('id', sender_id)
          .maybeSingle();
        
        if (!error && data?.name) {
          senderName = data.name;
          senderRole = 'Recruiter';
        }
      }

      if (senderName) {
        return { name: senderName, role: senderRole };
      }

      return null;
    } catch (error) {
      console.error('Error in fetchSenderName:', error);
      return null;
    }
  };

  // Parse sender from notification title as fallback
  const parseSenderFromTitle = (title: string): string => {
    // Extract sender from "New message from <sender>"
    const match = title.match(/New message from (.+)/i);
    if (!match) return 'Unknown User';

    const sender = match[1].trim();

    // If it's "Someone", keep it as is
    if (sender.toLowerCase() === 'someone') {
      return 'Someone';
    }

    // Check if sender is an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(sender)) {
      // Extract username part before @
      const username = sender.split('@')[0];
      
      // Convert username to readable name
      const nameParts = username
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
      
      return nameParts;
    }

    // Return the sender as-is if it's already a name
    return sender;
  };

  // Fetch sender names for message notifications
  useEffect(() => {
    const fetchSenderNames = async () => {
      const messageNotifications = notifications.filter(
        n => (n.type === 'new_message' || n.type === 'message_reply') && !senderNamesCache.has(n.id)
      );

      if (messageNotifications.length === 0) return;

      const newCache = new Map(senderNamesCache);

      // Process each notification independently
      for (const notification of messageNotifications) {
        // Try to fetch from database first, passing the full notification object
        const senderData = await fetchSenderName(notification);
        
        if (senderData) {
          // Database lookup succeeded - cache by notification.id
          newCache.set(notification.id, senderData);
        } else {
          // Database lookup failed, parse from title as fallback
          const fallbackName = parseSenderFromTitle(notification.title);
          newCache.set(notification.id, { name: fallbackName });
        }
      }

      setSenderNamesCache(newCache);
    };

    fetchSenderNames();
  }, [notifications]);

  const formatNotificationTitle = (notification: any) => {
    const { title, type, id } = notification;

    // Only format message notifications
    if (type !== "new_message" && type !== "message_reply") {
      return title;
    }

    // Use cached sender data if available
    const senderData = senderNamesCache.get(id);
    if (senderData) {
      const { name, role } = senderData;
      if (role) {
        // Format role: convert underscores to spaces and capitalize each word
        const formattedRole = role
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        return `New message from ${name} (${formattedRole})`;
      }
      return `New message from ${name}`;
    }

    // Fallback to original title while loading
    return title;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* New notification toast */}
      {showNewNotificationToast && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 duration-300">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">New notification received</span>
            </div>
          </div>
        </div>
      )}

      <div ref={panelRef} className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllRead();
                }}
                className="text-xs text-blue-600 hover:underline transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 py-2 border-b border-gray-100 overflow-x-auto">
          {(["all", "unread", "opportunities", "interviews", "courses", "messages"] as FilterKey[]).map((key) => {
            const count = getFilterCount(key);
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedFilter(key);
                }}
                className={`text-xs px-2.5 py-1 rounded-full transition whitespace-nowrap ${selectedFilter === key
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {key[0].toUpperCase() + key.slice(1)}
                {count > 0 && <span className="ml-1 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Notifications list */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-6 text-center text-sm text-gray-500">
              Loading…
            </div>
          )}
          {error && (
            <div className="p-6 text-center text-sm text-red-500">
              {error}
            </div>
          )}
          {!loading && filteredNotifications.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">
              No notifications
            </div>
          )}

          <ul className="divide-y divide-gray-100">
            {filteredNotifications.map((n) => (
              <li
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`px-5 py-4 hover:bg-gray-50 transition-all duration-300 group relative cursor-pointer ${!n.read ? "bg-blue-50/50" : ""
                  } ${newNotificationIds.has(n.id) ? "animate-pulse bg-blue-50 border-l-4 border-blue-400" : ""}`}
              >
                {newNotificationIds.has(n.id) && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.read ? "text-gray-700" : "text-gray-900"}`}>
                      {formatNotificationTitle(n)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-gray-400">{formatRelativeTime(n.created_at)}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the row click
                              markRead(n.id);
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="p-3 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  loadMore();
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
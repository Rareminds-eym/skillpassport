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

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.read) {
      markRead(notification.id);
    }

    // Navigate based on type
    switch (notification.type) {
      case "new_message":
      case "message_reply":
        // Extract conversation ID if available in metadata, or just go to messages
        // For now, just go to messages page
        navigate("/student/messages");
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

    // Close panel
    onClose();
  };

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
                    <p className={`text-sm font-medium ${n.read ? "text-gray-700" : "text-gray-900"}`}>{n.title}</p>
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
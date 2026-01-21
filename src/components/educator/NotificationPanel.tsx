import React, { useRef, useEffect } from 'react';
import {
  BellIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useNotifications } from '../../hooks/useNotifications';

// Mock notification type
type NotificationType =
  | 'student_verification_required'
  | 'verification_pending_review'
  | 'verification_approved'
  | 'verification_rejected'
  | 'assignment_submitted'
  | 'class_activity_pending'
  | 'new_student_enrolled'
  | 'attendance_reminder'
  | 'system_maintenance';

type FilterKey = 'all' | 'unread' | 'students' | 'assignments' | 'verifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  educatorEmail: string | null;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  educatorEmail,
}) => {
  const [selectedFilter, setSelectedFilter] = React.useState<FilterKey>('all');
  const [showAll, setShowAll] = React.useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const PREVIEW_LIMIT = 4;

  // Use the unified notification system
  const {
    items: notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
  } = useNotifications(educatorEmail);

  const getNotificationIcon = (type: NotificationType) => {
    const base = 'h-5 w-5';
    switch (type) {
      case 'student_verification_required':
      case 'verification_pending_review':
        return <ShieldCheckIcon className={`${base} text-amber-500`} />;
      case 'verification_approved':
        return <CheckCircleIcon className={`${base} text-green-500`} />;
      case 'verification_rejected':
        return <ExclamationTriangleIcon className={`${base} text-red-500`} />;
      case 'assignment_submitted':
        return <DocumentTextIcon className={`${base} text-green-500`} />;
      case 'class_activity_pending':
        return <ExclamationTriangleIcon className={`${base} text-amber-500`} />;
      case 'new_student_enrolled':
        return <UserGroupIcon className={`${base} text-indigo-500`} />;
      case 'attendance_reminder':
        return <ExclamationTriangleIcon className={`${base} text-orange-500`} />;
      case 'system_maintenance':
        return <InformationCircleIcon className={`${base} text-gray-500`} />;
      default:
        return <BellIcon className={`${base} text-gray-400`} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((n) => {
    switch (selectedFilter) {
      case 'unread':
        return !n.read;
      case 'students':
        return ['student_verification_required', 'new_student_enrolled'].includes(n.type);
      case 'assignments':
        return ['assignment_submitted', 'class_activity_pending'].includes(n.type);
      case 'verifications':
        return [
          'student_verification_required',
          'verification_approved',
          'verification_rejected',
          'verification_pending_review',
        ].includes(n.type);
      default:
        return true;
    }
  });

  // Determine which notifications to display
  const displayedNotifications = showAll
    ? filteredNotifications
    : filteredNotifications.slice(0, PREVIEW_LIMIT);

  const hasMoreToShow = filteredNotifications.length > PREVIEW_LIMIT;

  const getFilterCount = (filterKey: FilterKey): number => {
    switch (filterKey) {
      case 'all':
        return notifications.length;
      case 'unread':
        return notifications.filter((n) => !n.read).length;
      case 'students':
        return notifications.filter((n) =>
          ['student_verification_required', 'new_student_enrolled'].includes(n.type)
        ).length;
      case 'assignments':
        return notifications.filter((n) =>
          ['assignment_submitted', 'class_activity_pending'].includes(n.type)
        ).length;
      case 'verifications':
        return notifications.filter((n) =>
          [
            'student_verification_required',
            'verification_approved',
            'verification_rejected',
            'verification_pending_review',
          ].includes(n.type)
        ).length;
      default:
        return 0;
    }
  };

  const handleMarkRead = async (id: string) => {
    await markRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Click outside to close */}
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />

      {/* Notification Popup - Fully Mobile Responsive */}
      <div className="fixed top-16 md:absolute bottom-0 md:bottom-auto left-0 md:left-auto right-0 md:right-0 md:top-14 w-full md:w-[28rem] bg-white shadow-xl z-40 overflow-hidden md:border border-gray-100 md:rounded-xl lg:rounded-t-xl max-h-[85vh] md:max-h-[32rem] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50 overflow-x-auto flex-shrink-0">
          {(['all', 'unread', 'students', 'assignments', 'verifications'] as FilterKey[]).map(
            (key) => {
              const count = getFilterCount(key);
              const labels: Record<FilterKey, string> = {
                all: 'All',
                unread: 'Unread',
                students: 'Students',
                assignments: 'Assignments',
                verifications: 'Verifications',
              };

              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedFilter(key);
                    setShowAll(false); // Reset showAll when changing filters
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0 ${
                    selectedFilter === key
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {labels[key]}
                  {count > 0 && <span className="ml-1 text-[11px]">({count})</span>}
                </button>
              );
            }
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500 mt-3">Loading notifications...</p>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <BellIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No notifications</p>
              <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {displayedNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition-all duration-200 group ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                      {getNotificationIcon(notification.type as NotificationType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          notification.read ? 'text-gray-700' : 'text-gray-900'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
                        <span className="text-[11px] text-gray-400">
                          {formatTime(notification.created_at)}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkRead(notification.id)}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded"
                              title="Mark as read"
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
          )}
        </div>

        {/* Footer with View All Button */}
        {filteredNotifications.length > 0 && hasMoreToShow && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-center flex-shrink-0">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {showAll
                ? '← Show less'
                : `View all notifications (${filteredNotifications.length - PREVIEW_LIMIT} more) →`}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;

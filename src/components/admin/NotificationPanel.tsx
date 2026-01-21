import React, { useState, useEffect, useRef } from 'react';
import {
  BellIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAdminNotifications, AdminNotificationType } from '../../hooks/useAdminNotifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

type FilterKey = 'all' | 'unread' | 'approvals' | 'students' | 'system';

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, userId }) => {
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
  } = useAdminNotifications(userId);

  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');

  // Track new notifications for animation
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set());
  const [showNewNotificationToast, setShowNewNotificationToast] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // @ts-expect-error - Auto-suppressed for migration
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

  // Detect new notifications and animate them
  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    const prevIds = prevIdsRef.current;

    const newIds = [...currentIds].filter((id) => !prevIds.has(id));
    if (newIds.length > 0) {
      console.log('🆕 New admin notifications detected:', newIds);
      setNewNotificationIds(new Set(newIds));
      setShowNewNotificationToast(true);

      setTimeout(() => setShowNewNotificationToast(false), 3000);
      setTimeout(() => setNewNotificationIds(new Set()), 3000);
    }

    prevIdsRef.current = currentIds;
  }, [notifications]);

  const getNotificationIcon = (type: AdminNotificationType) => {
    const base = 'h-5 w-5';
    switch (type) {
      case 'training_submitted':
      case 'experience_submitted':
      case 'project_submitted':
        return <ClockIcon className={`${base} text-amber-500`} />;
      case 'training_approved':
      case 'experience_approved':
      case 'project_approved':
        return <CheckCircleIcon className={`${base} text-emerald-500`} />;
      case 'training_rejected':
      case 'experience_rejected':
      case 'project_rejected':
        return <XMarkIcon className={`${base} text-red-500`} />;
      case 'student_enrolled':
      case 'student_achievement':
        return <UserGroupIcon className={`${base} text-blue-500`} />;
      case 'assignment_submitted':
      case 'class_activity_pending':
      case 'assessment_completed':
      case 'assessment_submitted':
        return <AcademicCapIcon className={`${base} text-indigo-500`} />;
      case 'approval_required':
      case 'verification_required':
        return <ExclamationTriangleIcon className={`${base} text-amber-500`} />;
      case 'system_alert':
        return <InformationCircleIcon className={`${base} text-blue-500`} />;
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

  const markAsRead = async (id: string) => {
    await markRead(id);
  };

  const markAllAsRead = async () => {
    await markAllRead();
  };

  const deleteNotification = async (id: string) => {
    await remove(id);
  };

  const filteredNotifications = notifications.filter((n) => {
    switch (selectedFilter) {
      case 'unread':
        return !n.read;
      case 'approvals':
        return [
          'training_submitted',
          'experience_submitted',
          'project_submitted',
          'approval_required',
          'verification_required',
        ].includes(n.type);
      case 'students':
        return [
          'student_enrolled',
          'student_achievement',
          'assignment_submitted',
          'class_activity_pending',
          'assessment_completed',
          'assessment_submitted',
        ].includes(n.type);
      case 'system':
        return [
          'system_alert',
          'training_approved',
          'training_rejected',
          'experience_approved',
          'experience_rejected',
          'project_approved',
          'project_rejected',
        ].includes(n.type);
      default:
        return true;
    }
  });

  const getFilterCount = (filterKey: FilterKey): number => {
    switch (filterKey) {
      case 'all':
        return notifications.length;
      case 'unread':
        return notifications.filter((n) => !n.read).length;
      case 'approvals':
        return notifications.filter((n) =>
          [
            'training_submitted',
            'experience_submitted',
            'project_submitted',
            'approval_required',
            'verification_required',
          ].includes(n.type)
        ).length;
      case 'students':
        return notifications.filter((n) =>
          [
            'student_enrolled',
            'student_achievement',
            'assignment_submitted',
            'class_activity_pending',
            'assessment_completed',
            'assessment_submitted',
          ].includes(n.type)
        ).length;
      case 'system':
        return notifications.filter((n) =>
          [
            'system_alert',
            'training_approved',
            'training_rejected',
            'experience_approved',
            'experience_rejected',
            'project_approved',
            'project_rejected',
          ].includes(n.type)
        ).length;
      default:
        return 0;
    }
  };

  if (!isOpen) {
    console.log('❌ Admin NotificationPanel: Panel is closed, not rendering');
    return null;
  }

  // Log loading and error states
  if (loading) console.log('⏳ Showing loading state');
  if (error) console.error('❌ Error in admin notifications:', error);
  if (!loading && filteredNotifications.length === 0)
    console.log('📭 No admin notifications to display');

  console.log(
    '✅ Admin NotificationPanel: Rendering panel with',
    filteredNotifications?.length ?? 0,
    'filtered notifications'
  );

  return (
    <>
      {/* New notification toast */}
      {showNewNotificationToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">New notification received</span>
            </div>
          </div>
        </div>
      )}

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

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs - Responsive */}
        <div className="flex gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 bg-gray-50 overflow-x-auto flex-shrink-0">
          {(['all', 'unread', 'approvals', 'students', 'system'] as FilterKey[]).map((key) => {
            const count = getFilterCount(key);
            const label =
              key === 'all'
                ? 'All'
                : key === 'unread'
                  ? 'Unread'
                  : key === 'approvals'
                    ? 'Approvals'
                    : key === 'students'
                      ? 'Students'
                      : 'System';

            return (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                className={`text-xs px-2 sm:px-3 py-1.5 rounded-full transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0 ${
                  selectedFilter === key
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {label}
                {count > 0 && <span className="ml-1 text-[11px]">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Notifications List - Scrollable */}
        <div className="overflow-y-auto flex-1">
          {loading && <div className="p-6 text-center text-sm text-gray-500">Loading…</div>}
          {error && <div className="p-6 text-center text-sm text-red-500">{error}</div>}
          {!loading && filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <BellIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No notifications</p>
              <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
            </div>
          )}

          <ul className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <li
                key={notification.id}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 transition-all duration-200 group ${
                  !notification.read ? 'bg-blue-50/50' : ''
                } ${newNotificationIds.has(notification.id) ? 'animate-pulse bg-blue-50 border-l-4 border-blue-400' : ''}`}
              >
                {newNotificationIds.has(notification.id) && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                )}
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Icon */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
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
                    <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-200/50">
                      <span className="text-[11px] text-gray-400">
                        {formatTime(notification.created_at)}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded"
                            title="Mark as read"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
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
                  console.log('🔵 Load more clicked');
                  loadMore();
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Load more
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 sm:px-5 py-2 sm:py-3 border-t border-gray-100 bg-gray-50 text-center flex-shrink-0">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              View all notifications →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;

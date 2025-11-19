import React, { useState } from 'react'
import {
    BellIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    EyeIcon,
    TrashIcon,
} from '@heroicons/react/24/outline'

interface Notification {
    id: string
    type: 'success' | 'warning' | 'error' | 'info'
    title: string
    message: string
    timestamp: Date
    read: boolean
}

interface NotificationPanelProps {
    isOpen: boolean
    onClose: () => void
}

type FilterKey = 'all' | 'unread' | 'success' | 'warning'

const NotificationPanel: React.FC<NotificationPanelProps> = ({
    isOpen,
    onClose,
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'success',
            title: 'Verification Complete',
            message: 'John Doe\'s activity has been verified successfully.',
            timestamp: new Date(Date.now() - 5 * 60000),
            read: false,
        },
        {
            id: '2',
            type: 'info',
            title: 'New Class Created',
            message: 'Advanced Python 2025 has been added to your classes.',
            timestamp: new Date(Date.now() - 30 * 60000),
            read: false,
        },
        {
            id: '3',
            type: 'warning',
            title: 'Pending Activities',
            message: 'You have 5 activities waiting for review.',
            timestamp: new Date(Date.now() - 2 * 60 * 60000),
            read: true,
        },
        {
            id: '4',
            type: 'success',
            title: 'Report Generated',
            message: 'Your monthly performance report is ready.',
            timestamp: new Date(Date.now() - 24 * 60 * 60000),
            read: true,
        },
    ])

    const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all')

    const getNotificationIcon = (type: Notification['type']) => {
        const base = 'h-5 w-5'
        switch (type) {
            case 'success':
                return <CheckCircleIcon className={`${base} text-emerald-500`} />
            case 'warning':
                return <ExclamationTriangleIcon className={`${base} text-amber-500`} />
            case 'error':
                return <XMarkIcon className={`${base} text-red-500`} />
            case 'info':
                return <InformationCircleIcon className={`${base} text-blue-500`} />
            default:
                return <BellIcon className={`${base} text-gray-400`} />
        }
    }

    const formatTime = (date: Date) => {
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    const markAsRead = (id: string) => {
        setNotifications(
            notifications.map((notif) =>
                notif.id === id ? { ...notif, read: true } : notif
            )
        )
    }

    const markAllRead = () => {
        setNotifications(notifications.map((notif) => ({ ...notif, read: true })))
    }

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter((notif) => notif.id !== id))
    }

    const unreadCount = notifications.filter((n) => !n.read).length

    const filteredNotifications = notifications.filter((n) => {
        switch (selectedFilter) {
            case 'unread':
                return !n.read
            case 'success':
                return n.type === 'success'
            case 'warning':
                return n.type === 'warning'
            default:
                return true
        }
    })

    const getFilterCount = (filterKey: FilterKey): number => {
        switch (filterKey) {
            case 'all':
                return notifications.length
            case 'unread':
                return notifications.filter((n) => !n.read).length
            case 'success':
                return notifications.filter((n) => n.type === 'success').length
            case 'warning':
                return notifications.filter((n) => n.type === 'warning').length
            default:
                return 0
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop - Click outside to close */}
            <div
                className="fixed inset-0 z-30"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Notification Popup - Fully Mobile Responsive */}
            <div className="fixed top-16 md:absolute bottom-0 md:bottom-auto left-0 md:left-auto right-0 md:right-0 md:top-14 w-full md:w-96 bg-white shadow-2xl z-40 overflow-hidden md:border border-gray-100 md:rounded-xl lg:rounded-t-xl max-h-[85vh] md:max-h-96 flex flex-col">
                {/* Header */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                Notifications
                            </h3>
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
                            onClick={markAllRead}
                            className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filter Tabs - Responsive */}
                <div className="flex gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 bg-gray-50 overflow-x-auto flex-shrink-0">
                    {(['all', 'unread', 'success', 'warning'] as FilterKey[]).map(
                        (key) => {
                            const count = getFilterCount(key)
                            const label =
                                key === 'all'
                                    ? 'All'
                                    : key === 'unread'
                                        ? 'Unread'
                                        : key === 'success'
                                            ? 'Success'
                                            : 'Alerts'

                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedFilter(key)}
                                    className={`text-xs px-2 sm:px-3 py-1.5 rounded-full transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0 ${selectedFilter === key
                                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                >
                                    {label}
                                    {count > 0 && (
                                        <span className="ml-1 text-[11px]">({count})</span>
                                    )}
                                </button>
                            )
                        }
                    )}
                </div>

                {/* Notifications List - Scrollable */}
                <div className="overflow-y-auto flex-1">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <BellIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">
                                No notifications
                            </p>
                            <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {filteredNotifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className={`px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 transition-all duration-200 group ${!notification.read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-2 sm:gap-3">
                                        {/* Icon */}
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-sm font-semibold ${notification.read
                                                    ? 'text-gray-700'
                                                    : 'text-gray-900'
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
                                                    {formatTime(notification.timestamp)}
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
    )
}

export default NotificationPanel
// Notifications Feature - Public API

// Model
export { useNotifications } from './model/useNotifications';

export type { AdminNotificationType } from './model/useAdminNotifications';

export { useAdminNotifications } from './model/useAdminNotifications';

export type { NotificationType } from './model/useNotifications';

// API
export { createStudentNotification, createNotification } from './api/notificationService';

import { useState, useCallback } from 'react';

interface Notification {
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
}

export const useNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    type: 'info',
    title: '',
    message: ''
  });

  const showNotificationModal = useCallback((
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string
  ) => {
    setNotification({ type, title, message });
    setShowNotification(true);
  }, []);

  const hideNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  return {
    showNotification,
    notification,
    showNotificationModal,
    hideNotification
  };
};

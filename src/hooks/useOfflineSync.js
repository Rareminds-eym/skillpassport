import { useCallback, useEffect, useState } from 'react';
import { progressSyncManager } from '../services/progressSyncManager';

/**
 * Hook for offline progress sync status and controls
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncEvent, setLastSyncEvent] = useState(null);

  useEffect(() => {
    // Subscribe to sync events
    const unsubscribe = progressSyncManager.addListener((event) => {
      setLastSyncEvent(event);

      switch (event.type) {
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'syncStart':
          setSyncInProgress(true);
          break;
        case 'syncComplete':
        case 'syncError':
          setSyncInProgress(false);
          updatePendingCount();
          break;
      }
    });

    // Initial status
    updatePendingCount();

    return unsubscribe;
  }, []);

  const updatePendingCount = useCallback(async () => {
    const status = await progressSyncManager.getSyncStatus();
    setPendingCount(status.pendingCount);
    setIsOnline(status.isOnline);
    setSyncInProgress(status.syncInProgress);
  }, []);

  const forceSync = useCallback(async () => {
    try {
      await progressSyncManager.forceSync();
      await updatePendingCount();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [updatePendingCount]);

  const queueProgress = useCallback(
    async (type, data) => {
      await progressSyncManager.queueProgress(type, data);
      await updatePendingCount();
    },
    [updatePendingCount]
  );

  return {
    isOnline,
    pendingCount,
    syncInProgress,
    lastSyncEvent,
    forceSync,
    queueProgress,
    refreshStatus: updatePendingCount,
  };
};

export default useOfflineSync;

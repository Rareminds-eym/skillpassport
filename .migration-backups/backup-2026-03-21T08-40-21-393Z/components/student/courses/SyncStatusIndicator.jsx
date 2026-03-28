import { AnimatePresence, motion } from 'framer-motion';
import { Check, Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOfflineSync } from '../../../hooks/useOfflineSync';

/**
 * Sync Status Indicator Component
 * Shows online/offline status and pending sync items
 */
const SyncStatusIndicator = ({ className = '' }) => {
  const { isOnline, pendingCount, syncInProgress, forceSync, lastSyncEvent } = useOfflineSync();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Show toast on sync events
  useEffect(() => {
    if (lastSyncEvent) {
      switch (lastSyncEvent.type) {
        case 'online':
          setToastMessage('Back online - syncing progress...');
          setShowToast(true);
          break;
        case 'offline':
          setToastMessage('You\'re offline - progress will sync when connected');
          setShowToast(true);
          break;
        case 'syncComplete':
          if (lastSyncEvent.synced > 0) {
            setToastMessage(`Synced ${lastSyncEvent.synced} progress updates`);
            setShowToast(true);
          }
          break;
        case 'syncError':
          setToastMessage('Sync failed - will retry automatically');
          setShowToast(true);
          break;
      }
    }
  }, [lastSyncEvent]);

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <>
      {/* Status Indicator */}
      <div className={`flex items-center gap-2 ${className}`}>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            isOnline
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </>
          )}
        </motion.div>

        {/* Pending count badge */}
        {pendingCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
          >
            {syncInProgress ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Cloud className="w-3 h-3" />
            )}
            <span>{pendingCount} pending</span>
          </motion.div>
        )}

        {/* Sync button */}
        {isOnline && pendingCount > 0 && !syncInProgress && (
          <button
            onClick={forceSync}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Sync now"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              isOnline ? 'bg-gray-900 text-white' : 'bg-amber-500 text-white'
            }`}>
              {isOnline ? (
                syncInProgress ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )
              ) : (
                <CloudOff className="w-5 h-5" />
              )}
              <span className="text-sm">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SyncStatusIndicator;

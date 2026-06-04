/**
 * Simple debugging utility for recent updates
 * Run this in browser console: window.simpleDebug()
 */

import { apiPost } from '@/shared/api/apiClient';

export const simpleDebug = async () => {
  
  // 1. Check auth
  const user = useAuthStore.getState().user;
  
  // 2. Check table access
  try {
    await apiPost('/shared-widgets/actions', { action: 'debug-recent-updates' });
  } catch (err) {
  }
  
  // 3. Try to fetch user data if authenticated
  if (user) {
    try {
      await apiPost('/shared-widgets/actions', {
        action: 'debug-recent-updates-by-user',
        userId: user.id,
      });
    } catch (err) {
    }
  }
  
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.simpleDebug = simpleDebug;
}
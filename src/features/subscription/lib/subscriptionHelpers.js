/**
 * Subscription Utility Helpers
 * Shared helper functions for subscription status checks and operations
 */

/**
 * Check if subscription status is active or paused
 * @param {string} status - Subscription status
 * @returns {boolean}
 */
export const isActiveOrPaused = (status) => status === 'active' || status === 'paused';

/**
 * Check if subscription has valid access (active, paused, or cancelled but not expired)
 * @param {string} status - Subscription status
 * @param {string} endDate - Subscription end date
 * @returns {boolean}
 */
export const hasValidAccess = (status, endDate) => {
  if (status === 'active' || status === 'paused') return true;
  if (status === 'cancelled' && endDate) {
    return new Date(endDate) >= new Date();
  }
  return false;
};

/**
 * Check if subscription is in a manageable state
 * @param {string} status - Subscription status
 * @returns {boolean}
 */
export const isManageable = (status) => ['active', 'paused', 'cancelled'].includes(status);

/**
 * Get status badge color classes
 * @param {string} status - Subscription status
 * @returns {string} Tailwind CSS classes
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-orange-100 text-orange-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get status display text
 * @param {string} status - Subscription status
 * @returns {string}
 */
export const getStatusText = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Calculate days remaining in subscription
 * @param {string} endDate - Subscription end date
 * @returns {number|null}
 */
export const calculateDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Calculate subscription progress percentage
 * @param {string} startDate - Subscription start date
 * @param {string} endDate - Subscription end date
 * @returns {number}
 */
export const calculateProgressPercentage = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  const total = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const elapsed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
  const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
  return percentage;
};

/**
 * Get urgency level based on days remaining
 * @param {number} daysRemaining - Days remaining
 * @returns {string} 'critical' | 'warning' | 'normal'
 */
export const getUrgencyLevel = (daysRemaining) => {
  if (daysRemaining === null || daysRemaining === undefined) return 'normal';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'warning';
  return 'normal';
};

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string}
 */
export const formatDate = (dateString, locale = 'en-US') => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get subscription status checks
 * Optimized batch status check function
 * @param {Object} subscriptionData - Subscription data
 * @param {number} daysRemaining - Days remaining
 * @returns {Object} Status check results
 */
export const getSubscriptionStatusChecks = (subscriptionData, daysRemaining) => {
  if (!subscriptionData) {
    return {
      isExpiringSoon: false,
      isExpired: false,
      isActive: false,
      isPaused: false,
      isCancelled: false,
      isActiveOrPaused: false,
      isManageable: false,
      urgencyLevel: 'normal'
    };
  }

  const status = subscriptionData.status;
  const checks = {
    isExpiringSoon: daysRemaining !== null && daysRemaining <= 7,
    isExpired: status === 'expired',
    isActive: status === 'active',
    isPaused: status === 'paused',
    isCancelled: status === 'cancelled',
    isActiveOrPaused: isActiveOrPaused(status),
    isManageable: isManageable(status),
    urgencyLevel: getUrgencyLevel(daysRemaining)
  };

  return checks;
};


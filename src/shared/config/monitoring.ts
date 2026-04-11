/**
 * Monitoring Configuration for Organization Subscription Management
 * 
 * This module provides:
 * - Error capture (console-based, Sentry-ready stub)
 * - Performance monitoring
 * - Custom metrics collection
 * - Alert thresholds
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;

/**
 * Initialize error tracking (no-op stub, Sentry removed)
 */
export function initializeSentry(): void {
  console.warn('Sentry is not configured. Error tracking disabled.');
}

/**
 * Capture custom error with context
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  console.error('[captureError]', error.message, context);
}

/**
 * Set user context for error tracking (no-op stub)
 */
export function setUserContext(_user: {
  id: string;
  email?: string;
  role?: string;
  organizationId?: string;
  organizationType?: string;
}): void {
  // no-op
}

/**
 * Clear user context on logout (no-op stub)
 */
export function clearUserContext(): void {
  // no-op
}


// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Performance metrics thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  // API response times (milliseconds)
  api: {
    excellent: 100,
    good: 200,
    acceptable: 500,
    slow: 1000,
  },
  // Dashboard load times (milliseconds)
  dashboard: {
    excellent: 1000,
    good: 2000,
    acceptable: 3000,
    slow: 5000,
  },
  // Bulk operations (milliseconds per item)
  bulkOperation: {
    excellent: 10,
    good: 50,
    acceptable: 100,
    slow: 200,
  },
};

/**
 * Track performance metric
 */
export function trackPerformance(
  name: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  if (isDevelopment) {
    console.log(`[Performance] ${name}: ${duration}ms`, metadata);
  }

  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-end`);
  }
}

/**
 * Start a performance measurement
 */
export function startMeasurement(name: string): () => number {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    trackPerformance(name, duration);
    return duration;
  };
}

// ============================================================================
// CUSTOM METRICS
// ============================================================================

/**
 * Organization subscription metrics
 */
export interface OrgSubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalSeats: number;
  assignedSeats: number;
  utilizationRate: number;
  pendingInvitations: number;
  failedPayments: number;
}

/**
 * Track organization subscription metrics
 */
export function trackOrgMetrics(
  organizationId: string,
  metrics: OrgSubscriptionMetrics
): void {
  if (metrics.utilizationRate < 20) {
    console.warn(`Low seat utilization (${metrics.utilizationRate}%) for org ${organizationId}`);
  } else if (metrics.utilizationRate > 95) {
    console.warn(`High seat utilization (${metrics.utilizationRate}%) for org ${organizationId}`);
  }
}

/**
 * Track payment event
 */
export function trackPaymentEvent(
  event: 'initiated' | 'success' | 'failed' | 'refunded',
  data: {
    organizationId: string;
    amount: number;
    subscriptionId?: string;
    errorMessage?: string;
  }
): void {
  if (event === 'failed') {
    captureError(new Error(`Payment failed: ${data.errorMessage}`), data);
  }
}

/**
 * Track license assignment event
 */
export function trackLicenseEvent(
  event: 'assigned' | 'unassigned' | 'transferred' | 'bulk_assigned',
  data: {
    organizationId: string;
    poolId: string;
    userId?: string;
    count?: number;
  }
): void {
  // no-op — previously sent Sentry breadcrumb
}

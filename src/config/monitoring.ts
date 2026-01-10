/**
 * Monitoring Configuration for Organization Subscription Management
 * 
 * This module configures:
 * - Sentry for error tracking
 * - Performance monitoring
 * - Custom metrics collection
 * - Alert thresholds
 */

import * as Sentry from '@sentry/react';

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Sentry DSN from environment
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

/**
 * Initialize Sentry error tracking
 */
export function initializeSentry(): void {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isProduction ? 'production' : 'development',
    
    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session Replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    
    // Filter out non-critical errors
    beforeSend(event, hint) {
      // Don't send errors in development
      if (isDevelopment) {
        console.error('Sentry would send:', event);
        return null;
      }
      
      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore network errors that are expected
        if (error.message.includes('Network request failed')) {
          return null;
        }
        // Ignore user-initiated cancellations
        if (error.message.includes('AbortError')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });
}

/**
 * Capture custom error with context
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
  organizationId?: string;
  organizationType?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
  
  Sentry.setTags({
    userRole: user.role,
    organizationId: user.organizationId,
    organizationType: user.organizationType,
  });
}

/**
 * Clear user context on logout
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
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
  // Log to console in development
  if (isDevelopment) {
    console.log(`[Performance] ${name}: ${duration}ms`, metadata);
  }
  
  // Send to Sentry as custom measurement
  Sentry.addBreadcrumb({
    category: 'performance',
    message: name,
    data: {
      duration,
      ...metadata,
    },
    level: 'info',
  });
  
  // Track as custom metric
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
  Sentry.addBreadcrumb({
    category: 'metrics',
    message: 'Organization subscription metrics',
    data: {
      organizationId,
      ...metrics,
    },
    level: 'info',
  });
  
  // Log warning if utilization is very low or very high
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
  Sentry.addBreadcrumb({
    category: 'payment',
    message: `Payment ${event}`,
    data,
    level: event === 'failed' ? 'error' : 'info',
  });
  
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
  Sentry.addBreadcrumb({
    category: 'license',
    message: `License ${event}`,
    data,
    level: 'info',
  });
}

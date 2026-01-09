/**
 * Metrics Dashboard Configuration
 * 
 * Defines key metrics and dashboard widgets for monitoring
 * organization subscription management.
 */

// ============================================================================
// METRIC DEFINITIONS
// ============================================================================

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count' | 'rate';
  category: 'business' | 'performance' | 'error' | 'usage';
}

export const METRICS: MetricDefinition[] = [
  // Business Metrics
  {
    id: 'total_subscriptions',
    name: 'Total Subscriptions',
    description: 'Total number of active organization subscriptions',
    unit: 'count',
    aggregation: 'count',
    category: 'business',
  },
  {
    id: 'total_seats',
    name: 'Total Seats',
    description: 'Total seats across all subscriptions',
    unit: 'count',
    aggregation: 'sum',
    category: 'business',
  },
  {
    id: 'seat_utilization',
    name: 'Seat Utilization',
    description: 'Percentage of seats assigned',
    unit: 'percent',
    aggregation: 'avg',
    category: 'business',
  },
  {
    id: 'monthly_revenue',
    name: 'Monthly Revenue',
    description: 'Total monthly subscription revenue',
    unit: 'INR',
    aggregation: 'sum',
    category: 'business',
  },
  {
    id: 'new_subscriptions',
    name: 'New Subscriptions',
    description: 'New subscriptions in period',
    unit: 'count',
    aggregation: 'count',
    category: 'business',
  },
  {
    id: 'churned_subscriptions',
    name: 'Churned Subscriptions',
    description: 'Cancelled subscriptions in period',
    unit: 'count',
    aggregation: 'count',
    category: 'business',
  },
  
  // Performance Metrics
  {
    id: 'api_latency_p50',
    name: 'API Latency (P50)',
    description: 'Median API response time',
    unit: 'ms',
    aggregation: 'avg',
    category: 'performance',
  },
  {
    id: 'api_latency_p95',
    name: 'API Latency (P95)',
    description: '95th percentile API response time',
    unit: 'ms',
    aggregation: 'max',
    category: 'performance',
  },
  {
    id: 'dashboard_load_time',
    name: 'Dashboard Load Time',
    description: 'Time to load subscription dashboard',
    unit: 'ms',
    aggregation: 'avg',
    category: 'performance',
  },
  {
    id: 'bulk_operation_time',
    name: 'Bulk Operation Time',
    description: 'Average time for bulk operations',
    unit: 'ms',
    aggregation: 'avg',
    category: 'performance',
  },
  
  // Error Metrics
  {
    id: 'error_rate',
    name: 'Error Rate',
    description: 'Percentage of failed requests',
    unit: 'percent',
    aggregation: 'rate',
    category: 'error',
  },
  {
    id: 'payment_failure_rate',
    name: 'Payment Failure Rate',
    description: 'Percentage of failed payments',
    unit: 'percent',
    aggregation: 'rate',
    category: 'error',
  },
  {
    id: 'api_errors',
    name: 'API Errors',
    description: 'Total API errors',
    unit: 'count',
    aggregation: 'count',
    category: 'error',
  },
  
  // Usage Metrics
  {
    id: 'active_admins',
    name: 'Active Admins',
    description: 'Admins active in last 24 hours',
    unit: 'count',
    aggregation: 'count',
    category: 'usage',
  },
  {
    id: 'license_assignments',
    name: 'License Assignments',
    description: 'License assignments in period',
    unit: 'count',
    aggregation: 'count',
    category: 'usage',
  },
  {
    id: 'invitations_sent',
    name: 'Invitations Sent',
    description: 'Member invitations sent',
    unit: 'count',
    aggregation: 'count',
    category: 'usage',
  },
];


// ============================================================================
// DASHBOARD WIDGETS
// ============================================================================

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'number' | 'chart' | 'table' | 'gauge' | 'list';
  metrics: string[];
  size: 'small' | 'medium' | 'large';
  refreshInterval: number; // seconds
}

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  // Overview Row
  {
    id: 'total-subscriptions',
    title: 'Total Subscriptions',
    type: 'number',
    metrics: ['total_subscriptions'],
    size: 'small',
    refreshInterval: 60,
  },
  {
    id: 'total-seats',
    title: 'Total Seats',
    type: 'number',
    metrics: ['total_seats'],
    size: 'small',
    refreshInterval: 60,
  },
  {
    id: 'seat-utilization-gauge',
    title: 'Seat Utilization',
    type: 'gauge',
    metrics: ['seat_utilization'],
    size: 'small',
    refreshInterval: 60,
  },
  {
    id: 'monthly-revenue',
    title: 'Monthly Revenue',
    type: 'number',
    metrics: ['monthly_revenue'],
    size: 'small',
    refreshInterval: 300,
  },
  
  // Performance Row
  {
    id: 'api-latency-chart',
    title: 'API Latency',
    type: 'chart',
    metrics: ['api_latency_p50', 'api_latency_p95'],
    size: 'medium',
    refreshInterval: 30,
  },
  {
    id: 'error-rate-chart',
    title: 'Error Rate',
    type: 'chart',
    metrics: ['error_rate'],
    size: 'medium',
    refreshInterval: 30,
  },
  
  // Business Metrics Row
  {
    id: 'subscription-trend',
    title: 'Subscription Trend',
    type: 'chart',
    metrics: ['new_subscriptions', 'churned_subscriptions'],
    size: 'large',
    refreshInterval: 300,
  },
  
  // Activity Row
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    type: 'list',
    metrics: ['license_assignments', 'invitations_sent'],
    size: 'medium',
    refreshInterval: 30,
  },
  {
    id: 'active-alerts',
    title: 'Active Alerts',
    type: 'table',
    metrics: [],
    size: 'medium',
    refreshInterval: 10,
  },
];

// ============================================================================
// DASHBOARD LAYOUT
// ============================================================================

export interface DashboardLayout {
  id: string;
  name: string;
  rows: {
    widgets: string[];
  }[];
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  id: 'default',
  name: 'Organization Subscription Overview',
  rows: [
    {
      widgets: ['total-subscriptions', 'total-seats', 'seat-utilization-gauge', 'monthly-revenue'],
    },
    {
      widgets: ['api-latency-chart', 'error-rate-chart'],
    },
    {
      widgets: ['subscription-trend'],
    },
    {
      widgets: ['recent-activity', 'active-alerts'],
    },
  ],
};

// ============================================================================
// METRIC COLLECTION
// ============================================================================

/**
 * Metric collector for aggregating and storing metrics
 */
class MetricCollector {
  private metrics: Map<string, number[]> = new Map();
  private lastFlush: Date = new Date();

  /**
   * Record a metric value
   */
  record(metricId: string, value: number): void {
    const values = this.metrics.get(metricId) || [];
    values.push(value);
    this.metrics.set(metricId, values);
  }

  /**
   * Get aggregated metric value
   */
  getAggregated(metricId: string): number | null {
    const definition = METRICS.find(m => m.id === metricId);
    const values = this.metrics.get(metricId);
    
    if (!definition || !values || values.length === 0) {
      return null;
    }

    switch (definition.aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      case 'count':
        return values.length;
      case 'rate':
        // Calculate rate per minute
        const durationMinutes = (Date.now() - this.lastFlush.getTime()) / 60000;
        return values.length / Math.max(durationMinutes, 1);
      default:
        return null;
    }
  }

  /**
   * Get all current metrics
   */
  getAllMetrics(): Record<string, number | null> {
    const result: Record<string, number | null> = {};
    METRICS.forEach(m => {
      result[m.id] = this.getAggregated(m.id);
    });
    return result;
  }

  /**
   * Flush metrics (reset for new period)
   */
  flush(): Record<string, number | null> {
    const result = this.getAllMetrics();
    this.metrics.clear();
    this.lastFlush = new Date();
    return result;
  }
}

// Export singleton instance
export const metricCollector = new MetricCollector();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Record API latency
 */
export function recordApiLatency(latencyMs: number): void {
  metricCollector.record('api_latency_p50', latencyMs);
  metricCollector.record('api_latency_p95', latencyMs);
}

/**
 * Record error
 */
export function recordError(): void {
  metricCollector.record('api_errors', 1);
}

/**
 * Record payment result
 */
export function recordPayment(success: boolean): void {
  if (!success) {
    metricCollector.record('payment_failure_rate', 1);
  }
}

/**
 * Record license assignment
 */
export function recordLicenseAssignment(): void {
  metricCollector.record('license_assignments', 1);
}

/**
 * Record invitation sent
 */
export function recordInvitationSent(): void {
  metricCollector.record('invitations_sent', 1);
}

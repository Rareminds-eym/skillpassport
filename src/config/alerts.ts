/**
 * Alert Configuration for Organization Subscription Management
 *
 * Defines alert thresholds and notification rules for:
 * - Error rate monitoring
 * - Performance degradation
 * - Business metrics
 * - Payment failures
 */

// ============================================================================
// ALERT THRESHOLDS
// ============================================================================

export const ALERT_THRESHOLDS = {
  // Error rates (percentage)
  errorRate: {
    warning: 1, // 1% error rate
    critical: 5, // 5% error rate
  },

  // API latency (milliseconds)
  apiLatency: {
    warning: 500, // P95 > 500ms
    critical: 2000, // P95 > 2s
  },

  // Dashboard load time (milliseconds)
  dashboardLoad: {
    warning: 3000, // > 3s
    critical: 5000, // > 5s
  },

  // Payment failure rate (percentage)
  paymentFailure: {
    warning: 5, // 5% failure rate
    critical: 10, // 10% failure rate
  },

  // Seat utilization (percentage)
  seatUtilization: {
    low: 20, // < 20% utilization warning
    high: 95, // > 95% utilization warning
  },

  // Subscription expiration (days)
  subscriptionExpiry: {
    warning: 30, // 30 days before expiry
    critical: 7, // 7 days before expiry
  },

  // Bulk operation limits
  bulkOperation: {
    maxBatchSize: 100,
    maxDuration: 30000, // 30 seconds
  },
};

// ============================================================================
// ALERT TYPES
// ============================================================================

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  acknowledged?: boolean;
  resolvedAt?: Date;
}

// ============================================================================
// ALERT RULES
// ============================================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (value: number) => AlertSeverity | null;
  notificationChannels: ('email' | 'slack' | 'dashboard')[];
  cooldownMinutes: number; // Minimum time between alerts
}

export const ALERT_RULES: AlertRule[] = [
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'API error rate exceeds threshold',
    condition: (errorRate) => {
      if (errorRate >= ALERT_THRESHOLDS.errorRate.critical) return 'critical';
      if (errorRate >= ALERT_THRESHOLDS.errorRate.warning) return 'warning';
      return null;
    },
    notificationChannels: ['email', 'slack', 'dashboard'],
    cooldownMinutes: 15,
  },
  {
    id: 'slow-api-response',
    name: 'Slow API Response',
    description: 'API P95 latency exceeds threshold',
    condition: (latency) => {
      if (latency >= ALERT_THRESHOLDS.apiLatency.critical) return 'critical';
      if (latency >= ALERT_THRESHOLDS.apiLatency.warning) return 'warning';
      return null;
    },
    notificationChannels: ['slack', 'dashboard'],
    cooldownMinutes: 10,
  },
  {
    id: 'payment-failures',
    name: 'Payment Failures',
    description: 'Payment failure rate exceeds threshold',
    condition: (failureRate) => {
      if (failureRate >= ALERT_THRESHOLDS.paymentFailure.critical) return 'critical';
      if (failureRate >= ALERT_THRESHOLDS.paymentFailure.warning) return 'warning';
      return null;
    },
    notificationChannels: ['email', 'slack', 'dashboard'],
    cooldownMinutes: 30,
  },
  {
    id: 'low-seat-utilization',
    name: 'Low Seat Utilization',
    description: 'Organization seat utilization is very low',
    condition: (utilization) => {
      if (utilization < ALERT_THRESHOLDS.seatUtilization.low) return 'info';
      return null;
    },
    notificationChannels: ['dashboard'],
    cooldownMinutes: 1440, // Once per day
  },
  {
    id: 'high-seat-utilization',
    name: 'High Seat Utilization',
    description: 'Organization is running out of seats',
    condition: (utilization) => {
      if (utilization >= ALERT_THRESHOLDS.seatUtilization.high) return 'warning';
      return null;
    },
    notificationChannels: ['email', 'dashboard'],
    cooldownMinutes: 1440, // Once per day
  },
  {
    id: 'subscription-expiring',
    name: 'Subscription Expiring',
    description: 'Subscription is expiring soon',
    condition: (daysUntilExpiry) => {
      if (daysUntilExpiry <= ALERT_THRESHOLDS.subscriptionExpiry.critical) return 'critical';
      if (daysUntilExpiry <= ALERT_THRESHOLDS.subscriptionExpiry.warning) return 'warning';
      return null;
    },
    notificationChannels: ['email', 'dashboard'],
    cooldownMinutes: 1440, // Once per day
  },
];

// ============================================================================
// ALERT SERVICE
// ============================================================================

/**
 * Alert service for managing and dispatching alerts
 */
class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();

  /**
   * Check if alert should be triggered based on cooldown
   */
  private shouldTriggerAlert(ruleId: string, cooldownMinutes: number): boolean {
    const lastTime = this.lastAlertTime.get(ruleId);
    if (!lastTime) return true;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    return Date.now() - lastTime.getTime() > cooldownMs;
  }

  /**
   * Evaluate alert rules and trigger if conditions met
   */
  evaluateRule(ruleId: string, value: number): Alert | null {
    const rule = ALERT_RULES.find((r) => r.id === ruleId);
    if (!rule) return null;

    const severity = rule.condition(value);
    if (!severity) return null;

    if (!this.shouldTriggerAlert(ruleId, rule.cooldownMinutes)) {
      return null;
    }

    const alert: Alert = {
      id: `${ruleId}-${Date.now()}`,
      type: ruleId,
      severity,
      message: rule.description,
      timestamp: new Date(),
      metadata: { value, threshold: rule.name },
    };

    this.alerts.set(alert.id, alert);
    this.lastAlertTime.set(ruleId, new Date());

    // Dispatch to notification channels
    this.dispatchAlert(alert, rule.notificationChannels);

    return alert;
  }

  /**
   * Dispatch alert to configured channels
   */
  private dispatchAlert(alert: Alert, channels: ('email' | 'slack' | 'dashboard')[]): void {
    channels.forEach((channel) => {
      switch (channel) {
        case 'email':
          this.sendEmailAlert(alert);
          break;
        case 'slack':
          this.sendSlackAlert(alert);
          break;
        case 'dashboard':
          this.showDashboardAlert(alert);
          break;
      }
    });
  }

  /**
   * Send email alert (placeholder - integrate with email service)
   */
  private sendEmailAlert(alert: Alert): void {
    console.log('[Alert] Email notification:', alert);
    // TODO: Integrate with email service
    // await emailService.sendAlert({
    //   to: 'admin@organization.com',
    //   subject: `[${alert.severity.toUpperCase()}] ${alert.message}`,
    //   body: JSON.stringify(alert, null, 2),
    // });
  }

  /**
   * Send Slack alert (placeholder - integrate with Slack webhook)
   */
  private sendSlackAlert(alert: Alert): void {
    console.log('[Alert] Slack notification:', alert);
    // TODO: Integrate with Slack webhook
    // await fetch(SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     text: `[${alert.severity.toUpperCase()}] ${alert.message}`,
    //     attachments: [{ fields: Object.entries(alert.metadata || {}) }],
    //   }),
    // });
  }

  /**
   * Show dashboard alert
   */
  private showDashboardAlert(alert: Alert): void {
    // Emit event for dashboard to display
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('org-subscription-alert', {
          detail: alert,
        })
      );
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter((a) => !a.resolvedAt)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.getActiveAlerts().filter((a) => a.severity === severity);
  }
}

// Export singleton instance
export const alertService = new AlertService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Check error rate and trigger alert if needed
 */
export function checkErrorRate(errorRate: number): Alert | null {
  return alertService.evaluateRule('high-error-rate', errorRate);
}

/**
 * Check API latency and trigger alert if needed
 */
export function checkApiLatency(latencyMs: number): Alert | null {
  return alertService.evaluateRule('slow-api-response', latencyMs);
}

/**
 * Check payment failure rate and trigger alert if needed
 */
export function checkPaymentFailures(failureRate: number): Alert | null {
  return alertService.evaluateRule('payment-failures', failureRate);
}

/**
 * Check seat utilization and trigger alert if needed
 */
export function checkSeatUtilization(utilizationPercent: number): Alert | null {
  const lowAlert = alertService.evaluateRule('low-seat-utilization', utilizationPercent);
  const highAlert = alertService.evaluateRule('high-seat-utilization', utilizationPercent);
  return lowAlert || highAlert;
}

/**
 * Check subscription expiry and trigger alert if needed
 */
export function checkSubscriptionExpiry(daysUntilExpiry: number): Alert | null {
  return alertService.evaluateRule('subscription-expiring', daysUntilExpiry);
}

/**
 * Analytics Configuration
 * 
 * Centralized configuration for Google Analytics 4 and Google Tag Manager.
 * Reads from environment variables and provides type-safe access.
 */

export interface AnalyticsConfig {
  ga4MeasurementId: string | undefined;
  gtmId: string | undefined;
  isEnabled: boolean;
  debugMode: boolean;
}

/**
 * Get analytics configuration from environment variables
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const ga4MeasurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  const gtmId = import.meta.env.VITE_GTM_ID;
  const isDev = import.meta.env.DEV;

  return {
    ga4MeasurementId,
    gtmId,
    isEnabled: !!gtmId, // Enable if GTM ID is provided (GTM-based architecture)
    debugMode: isDev,
  };
}

/**
 * Validate analytics configuration
 * Logs warnings if configuration is incomplete
 */
export function validateAnalyticsConfig(): void {
  const config = getAnalyticsConfig();

  if (!config.gtmId) {
    if (config.debugMode) {
      console.warn(
        '[Analytics] VITE_GTM_ID is not set. Google Tag Manager is not configured. Analytics tracking is disabled.'
      );
    }
  }

  if (config.gtmId && !config.gtmId.startsWith('GTM-')) {
    console.error(
      '[Analytics] Invalid GTM ID format. Expected format: GTM-XXXXXXXX'
    );
  }

  if (config.debugMode) {
    console.log('[Analytics] Debug mode enabled. Events will be logged to console.');
    console.log('[Analytics] Configuration:', {
      gtmId: config.gtmId,
      isEnabled: config.isEnabled,
    });
  }
}

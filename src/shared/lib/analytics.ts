/**
 * Analytics Utility for GTM Integration
 *
 * Centralized tracking functions for Google Tag Manager.
 * All tracking events must go through these functions.
 * 
 * Architecture:
 * User Action → analytics.ts → TagManager.dataLayer() → GTM → GA4
 */

import TagManager from 'react-gtm-module';
import { getAnalyticsConfig } from '@/shared/config/analytics';

// Extend Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer: DataLayerObject[];
    google_tag_manager?: Record<string, unknown>;
  }
}

/**
 * GTM DataLayer object structure
 */
export interface DataLayerObject {
  event?: string;
  [key: string]: string | number | boolean | undefined | object;
}

/**
 * Event names — single source of truth for all GTM event names.
 * Must match exactly what is configured in the GTM dashboard.
 */
export const AnalyticsEvents = {
  // Page tracking
  PAGE_VIEW: 'page_view',

  // Signup flow events
  SIGNUP_START: 'signup_start',
  SIGNUP_SUBMIT: 'signup_submit',
  SIGNUP_SUCCESS: 'signup_success',
  SIGNUP_FAILED: 'signup_failed',

  // Login flow events
  LOGIN_START: 'login_start',
  LOGIN_SUBMIT: 'login_submit',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  FORGOT_PASSWORD_CLICK: 'forgot_password_click',

  // Contact form events
  CONTACT_FORM_SUBMIT: 'contact_form_submit',
  CONTACT_FORM_SUCCESS: 'contact_form_success',
  CONTACT_FORM_FAILED: 'contact_form_failed',

  // Engagement events (for later)
  SCROLL_DEPTH: 'scroll_depth',
  CTA_CLICK: 'cta_click',
  EXIT_INTENT: 'exit_intent',
  RETURN_VISIT: 'return_visit',
} as const;

/**
 * Type for event names
 */
export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

/**
 * Event properties interface with stricter typing
 */
export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Analytics configuration state
 */
let analyticsConfig = getAnalyticsConfig();
let isInitialized = false;

/**
 * Initialize analytics system
 * Should be called once at app startup
 */
export function initializeAnalytics(): void {
  if (isInitialized) {
    console.warn('[Analytics] Already initialized');
    return;
  }

  analyticsConfig = getAnalyticsConfig();
  ensureDataLayer();

  if (analyticsConfig.debugMode) {
    console.log('[Analytics] Initialized with config:', {
      gtmId: analyticsConfig.gtmId,
      isEnabled: analyticsConfig.isEnabled,
      debugMode: analyticsConfig.debugMode,
    });
  }

  isInitialized = true;
}

/**
 * Ensure dataLayer exists.
 * GTM script creates it, but this guards against timing issues.
 */
function ensureDataLayer(): void {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = [];
    if (analyticsConfig.debugMode) {
      console.log('[Analytics] Created dataLayer array');
    }
  }
}

/**
 * Validate event properties
 * Removes undefined values and sanitizes data
 */
function sanitizeProperties(properties?: EventProperties): EventProperties {
  if (!properties) return {};

  const sanitized: EventProperties = {};
  
  for (const [key, value] of Object.entries(properties)) {
    // Skip undefined values
    if (value === undefined) continue;
    
    // Sanitize strings (remove PII patterns if needed)
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Core push function — all events go through here.
 * Uses react-gtm-module's TagManager.dataLayer() for type-safe GTM integration.
 * 
 * @param eventName - The event name (should be from AnalyticsEvents constant)
 * @param properties - Optional event properties
 */
export function trackEvent(eventName: string, properties?: EventProperties): void {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    if (analyticsConfig.debugMode) {
      console.log('[Analytics] Skipped (SSR):', eventName);
    }
    return;
  }

  // Skip if analytics is disabled
  if (!analyticsConfig.isEnabled) {
    if (analyticsConfig.debugMode) {
      console.log('[Analytics] Skipped (disabled):', eventName);
    }
    return;
  }

  try {
    const sanitizedProps = sanitizeProperties(properties);
    const dataLayerEvent: DataLayerObject = {
      event: eventName,
      ...sanitizedProps,
      timestamp: new Date().toISOString(),
    };

    // Use TagManager.dataLayer() from react-gtm-module
    TagManager.dataLayer({
      dataLayer: dataLayerEvent,
    });

    if (analyticsConfig.debugMode) {
      console.log('[Analytics] Event tracked:', eventName, sanitizedProps);
    }
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
    // Don't throw - analytics failures should never break the app
  }
}

/**
 * Track SPA page navigation.
 * Called automatically by AnalyticsWrapper in App.tsx on every route change.
 * 
 * Sends complete page data to GA4 for accurate path tracking:
 * - page_path: The route path (e.g., /learner/dashboard, /courses?filter=active)
 * - page_title: Document title for better readability in GA4 reports
 * - page_location: Full URL including domain, path, query params, and hash
 * 
 * @param path - The route path (can include query params and hash)
 * @param title - Optional page title (defaults to document.title)
 * 
 * @example
 * trackPageView('/learner/dashboard', 'Dashboard - SkillPassport');
 * trackPageView('/courses?filter=active#section-1');
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined') return;
  
  // Ensure we have the complete page data
  const pageTitle = title || (typeof document !== 'undefined' ? document.title : '');
  const pageLocation = window.location.href;
  
  trackEvent(AnalyticsEvents.PAGE_VIEW, {
    page_path: path,
    page_title: pageTitle,
    page_location: pageLocation,
  });
}

/**
 * Signup funnel tracking helpers.
 */
export const trackSignup = {
  start: (role?: string) => {
    trackEvent(AnalyticsEvents.SIGNUP_START, {
      user_role: role,
      page_path: window.location.pathname,
    });
  },

  submit: (role?: string, country?: string) => {
    trackEvent(AnalyticsEvents.SIGNUP_SUBMIT, {
      user_role: role,
      country: country,
      page_path: window.location.pathname,
    });
  },

  success: (userId: string, email: string, role: string) => {
    trackEvent(AnalyticsEvents.SIGNUP_SUCCESS, {
      user_id: userId,
      email: email,
      user_role: role,
      page_path: window.location.pathname,
    });
  },

  failed: (errorMessage: string, role?: string) => {
    trackEvent(AnalyticsEvents.SIGNUP_FAILED, {
      error_message: errorMessage,
      user_role: role,
      page_path: window.location.pathname,
    });
  },
};

/**
 * Login funnel tracking helpers.
 */
export const trackLogin = {
  start: (role?: string) => {
    trackEvent(AnalyticsEvents.LOGIN_START, {
      user_role: role,
      page_path: window.location.pathname,
    });
  },

  submit: (role?: string) => {
    trackEvent(AnalyticsEvents.LOGIN_SUBMIT, {
      user_role: role,
      page_path: window.location.pathname,
    });
  },

  success: (userId: string, role: string) => {
    trackEvent(AnalyticsEvents.LOGIN_SUCCESS, {
      user_id: userId,
      user_role: role,
      page_path: window.location.pathname,
    });
  },

  failed: (errorMessage: string, role?: string) => {
    trackEvent(AnalyticsEvents.LOGIN_FAILED, {
      error_message: errorMessage,
      user_role: role,
      page_path: window.location.pathname,
    });
  },

  forgotPasswordClick: () => {
    trackEvent(AnalyticsEvents.FORGOT_PASSWORD_CLICK, {
      page_path: window.location.pathname,
    });
  },
};

/**
 * Debug helpers — only useful in development.
 */

/**
 * Check if GTM is loaded and initialized
 */
export function isGTMLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return Array.isArray(window.dataLayer) && window.dataLayer.length > 0;
}

/**
 * Get the current dataLayer array for debugging
 */
export function getDataLayer(): DataLayerObject[] {
  if (typeof window === 'undefined' || !window.dataLayer) return [];
  return window.dataLayer;
}

/**
 * Get analytics system status for debugging
 */
export function getAnalyticsStatus(): {
  isInitialized: boolean;
  isEnabled: boolean;
  isGTMLoaded: boolean;
  gtmId: string | undefined;
  debugMode: boolean;
  dataLayerLength: number;
} {
  return {
    isInitialized,
    isEnabled: analyticsConfig.isEnabled,
    isGTMLoaded: isGTMLoaded(),
    gtmId: analyticsConfig.gtmId,
    debugMode: analyticsConfig.debugMode,
    dataLayerLength: getDataLayer().length,
  };
}

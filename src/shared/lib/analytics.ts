/**
 * Analytics Utility for GTM Integration
 * 
 * This file provides centralized tracking functions for Google Tag Manager.
 * All tracking events should go through these functions.
 */

// Extend Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}

/**
 * Event names used throughout the application
 */
export const AnalyticsEvents = {
  // Page tracking
  PAGE_VIEW: 'page_view',
  
  // Signup flow events
  SIGNUP_START: 'signup_start',
  SIGNUP_SUBMIT: 'signup_submit',
  SIGNUP_SUCCESS: 'signup_success',
  SIGNUP_FAILED: 'signup_failed',
  
  // Engagement events (for later)
  SCROLL_DEPTH: 'scroll_depth',
  CTA_CLICK: 'cta_click',
  EXIT_INTENT: 'exit_intent',
  RETURN_VISIT: 'return_visit',
} as const;

/**
 * Type for event properties
 */
export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Initialize dataLayer if it doesn't exist
 * GTM script should create this, but we ensure it exists
 */
function ensureDataLayer(): void {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = [];
  }
}

/**
 * Track a custom event to GTM
 * 
 * @param eventName - Name of the event (use AnalyticsEvents constants)
 * @param properties - Additional event properties/parameters
 * 
 * @example
 * trackEvent(AnalyticsEvents.SIGNUP_START, {
 *   user_role: 'student',
 *   page_path: '/signup'
 * });
 */
export function trackEvent(
  eventName: string,
  properties?: EventProperties
): void {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  ensureDataLayer();

  try {
    // Push event to dataLayer
    window.dataLayer.push({
      event: eventName,
      ...properties,
      timestamp: new Date().toISOString(),
    });

    // Log in development mode
    if (import.meta.env.DEV) {
      console.log('[Analytics] Event tracked:', eventName, properties);
    }
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
}

/**
 * Track a page view event
 * Use this for SPA route changes
 * 
 * @param path - Page path (e.g., '/signup', '/dashboard')
 * @param title - Page title (optional, defaults to document.title)
 * 
 * @example
 * trackPageView('/signup', 'Sign Up - SkillPassport');
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent(AnalyticsEvents.PAGE_VIEW, {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/**
 * Track signup flow events with common properties
 * Helper function to ensure consistent signup tracking
 */
export const trackSignup = {
  /**
   * Track when user starts filling the signup form
   */
  start: (role?: string) => {
    trackEvent(AnalyticsEvents.SIGNUP_START, {
      user_role: role,
      page_path: window.location.pathname,
    });
  },

  /**
   * Track when user submits the signup form
   */
  submit: (role?: string, country?: string) => {
    trackEvent(AnalyticsEvents.SIGNUP_SUBMIT, {
      user_role: role,
      country: country,
      page_path: window.location.pathname,
    });
  },

  /**
   * Track successful signup
   */
  success: (userId: string, email: string, role: string) => {
    trackEvent(AnalyticsEvents.SIGNUP_SUCCESS, {
      user_id: userId,
      email: email,
      user_role: role,
      page_path: window.location.pathname,
    });
  },

  /**
   * Track signup failure
   */
  failed: (errorMessage: string, role?: string) => {
    trackEvent(AnalyticsEvents.SIGNUP_FAILED, {
      error_message: errorMessage,
      user_role: role,
      page_path: window.location.pathname,
    });
  },
};

/**
 * Check if GTM is loaded and working
 * Useful for debugging
 * 
 * @returns true if GTM dataLayer exists and has events
 */
export function isGTMLoaded(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.dataLayer !== undefined &&
    Array.isArray(window.dataLayer) &&
    window.dataLayer.length > 0
  );
}

/**
 * Get current dataLayer contents (for debugging)
 * Only use in development
 */
export function getDataLayer(): any[] {
  if (typeof window === 'undefined' || !window.dataLayer) {
    return [];
  }
  return window.dataLayer;
}

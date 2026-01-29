import { TourProgress, TourKey } from './types';
import { TOUR_STORAGE_KEY } from './constants';

/**
 * Utility functions for tour persistence and management
 */

/**
 * Get tour progress from localStorage (fallback)
 */
export const getTourProgressFromStorage = (): TourProgress => {
  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to parse tour progress from localStorage:', error);
    return {};
  }
};

/**
 * Save tour progress to localStorage (fallback)
 */
export const saveTourProgressToStorage = (progress: TourProgress): void => {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn('Failed to save tour progress to localStorage:', error);
  }
};

/**
 * Check if a specific tour has been completed
 */
export const isTourCompleted = (tourKey: TourKey, progress: TourProgress): boolean => {
  switch (tourKey) {
    case 'dashboard':
      return progress.dashboard_completed === true;
    case 'assessment_test':
      return progress.assessment_test_completed === true;
    case 'assessment_result':
      return progress.assessment_result_completed === true;
    default:
      return false;
  }
};

/**
 * Mark a tour as completed
 */
export const markTourCompleted = (tourKey: TourKey, progress: TourProgress): TourProgress => {
  const updatedProgress = { ...progress };
  
  switch (tourKey) {
    case 'dashboard':
      updatedProgress.dashboard_completed = true;
      break;
    case 'assessment_test':
      updatedProgress.assessment_test_completed = true;
      break;
    case 'assessment_result':
      updatedProgress.assessment_result_completed = true;
      break;
  }
  
  updatedProgress.last_completed_tour = tourKey;
  updatedProgress.completed_at = new Date().toISOString();
  
  return updatedProgress;
};

/**
 * Check if user is eligible for a tour (new user logic)
 * PURE FUNCTION - NO SIDE EFFECTS
 */
export const isEligibleForTour = (tourKey: TourKey, progress: TourProgress): boolean => {
  // Don't show tour if already completed
  if (isTourCompleted(tourKey, progress)) {
    console.log(`❌ Tour ${tourKey} already completed`);
    return false;
  }
  
  // For dashboard tour - eligible if not completed AND on dashboard page
  if (tourKey === 'dashboard') {
    const isOnDashboardPage = window.location.pathname === '/student/dashboard';
    if (!isOnDashboardPage) {
      console.log(`❌ Dashboard tour not eligible: not on dashboard page (${window.location.pathname})`);
      return false;
    }
    console.log(`✅ Dashboard tour eligible (not completed and on correct page)`);
    return true;
  }
  
  // For assessment test tour - eligible if dashboard is completed OR if user is on assessment test page (direct access)
  if (tourKey === 'assessment_test') {
    const isOnTestPath = window.location.pathname.includes('/student/assessment/test');
    if (!isOnTestPath) {
      console.log(`❌ Assessment test tour not eligible: not on test page (${window.location.pathname})`);
      return false;
    }
    const eligible = progress.dashboard_completed === true || isOnTestPath;
    console.log(`${eligible ? '✅' : '❌'} Assessment test tour eligible: dashboard_completed = ${progress.dashboard_completed}, isOnTestPath = ${isOnTestPath}`);
    return eligible;
  }
  
  // For assessment result tour - eligible if dashboard is completed OR assessment test is completed
  // OR if user is on assessment result page (direct access)
  if (tourKey === 'assessment_result') {
    const isOnResultPage = window.location.pathname.includes('/student/assessment/result');
    if (!isOnResultPage) {
      console.log(`❌ Assessment result tour not eligible: not on result page (${window.location.pathname})`);
      return false;
    }
    const eligible = progress.dashboard_completed === true || 
                    progress.assessment_test_completed === true ||
                    isOnResultPage;
    console.log(`${eligible ? '✅' : '❌'} Assessment result tour eligible: dashboard_completed = ${progress.dashboard_completed}, assessment_test_completed = ${progress.assessment_test_completed}, isOnResultPage = ${isOnResultPage}`);
    return eligible;
  }
  
  console.log(`❌ Unknown tour key: ${tourKey}`);
  return false;
};

/**
 * Wait for element to exist in DOM
 */
export const waitForElement = (selector: string, timeout = 5000): Promise<Element | null> => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};

/**
 * Check if element is visible and interactable
 */
export const isElementReady = (selector: string): boolean => {
  const element = document.querySelector(selector);
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
};

/**
 * Scroll Lock Utilities
 * DISABLED - Tours should NOT lock scrolling as it causes app-wide scroll issues
 * These functions are now no-ops to prevent scroll lock problems
 */

/**
 * Locks scrolling - DISABLED
 */
export const lockScroll = (): void => {
  console.log('🔒 Tour scroll lock called but DISABLED to prevent scroll issues');
  // Do nothing - scrolling should always work
};

/**
 * Unlocks scrolling - DISABLED
 */
export const unlockScroll = (): void => {
  console.log('🔓 Tour scroll unlock called (no-op)');
  // Do nothing - scrolling should always work
};

/**
 * Force unlock scroll - ensures scroll is always unlocked
 */
export const forceUnlockScroll = (): void => {
  // Remove any tour-specific classes that might exist
  document.body.classList.remove('tour-scroll-locked');
  
  // Ensure body can scroll
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('position', 'static', 'important');
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.paddingRight = '';
  document.documentElement.style.setProperty('overflow', 'auto', 'important');
  
  console.log('🔓 Tour scroll force unlocked');
};

/**
 * Check if scroll is currently locked - always returns false
 */
export const isScrollCurrentlyLocked = (): boolean => {
  return false;
};

/**
 * Initialize scroll utilities - ensures clean state on page load
 */
export const initializeScrollUtils = (): void => {
  forceUnlockScroll();
  console.log('🔄 Scroll utilities initialized (scroll lock disabled)');
};

/**
 * Temporarily unlocks scroll for programmatic scrolling - just runs callback
 */
export const temporaryUnlockForScroll = (callback: () => void): void => {
  callback();
};
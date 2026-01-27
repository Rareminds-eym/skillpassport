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
 */
export const isEligibleForTour = (tourKey: TourKey, progress: TourProgress): boolean => {
  // Debug logging
  console.log(`🎯 Tour eligibility check for ${tourKey}:`, {
    progress,
    alreadyCompleted: isTourCompleted(tourKey, progress)
  });
  
  // Don't show tour if already completed
  if (isTourCompleted(tourKey, progress)) {
    console.log(`❌ Tour ${tourKey} already completed`);
    return false;
  }
  
  // For dashboard tour - always eligible if not completed
  if (tourKey === 'dashboard') {
    console.log(`✅ Dashboard tour eligible`);
    return true;
  }
  
  // For assessment test tour - eligible if dashboard is completed OR if user is on assessment test page (direct access)
  if (tourKey === 'assessment_test') {
    const isOnTestPath = window.location.pathname.includes('/assessment/test');
    const eligible = progress.dashboard_completed === true || isOnTestPath;
    console.log(`${eligible ? '✅' : '❌'} Assessment test tour eligible: dashboard_completed = ${progress.dashboard_completed}, isOnTestPath = ${isOnTestPath}`);
    return eligible;
  }
  
  // For assessment result tour - eligible if dashboard is completed OR assessment test is completed
  // OR if user is on assessment result page (direct access)
  if (tourKey === 'assessment_result') {
    const isOnResultPage = window.location.pathname.includes('/assessment/result');
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
 * Prevents user-initiated scrolling while allowing programmatic scrolling
 */

let isScrollLocked = false;
let scrollPosition = 0;
let scrollbarWidth = 0;

/**
 * Calculate scrollbar width to prevent layout shift
 */
const getScrollbarWidth = (): number => {
  if (scrollbarWidth > 0) return scrollbarWidth;
  
  // Create temporary elements to measure scrollbar width
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  outer.style.msOverflowStyle = 'scrollbar';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  outer.appendChild(inner);

  scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  document.body.removeChild(outer);
  
  return scrollbarWidth;
};

/**
 * Prevents accidental scroll events during tour
 */
const preventAccidentalScroll = (e: Event) => {
  // Prevent all scroll-related events during tour
  if (e.type === 'wheel' || e.type === 'touchmove' || e.type === 'scroll') {
    if (e.isTrusted) {
      e.preventDefault();
      return false;
    }
  }
};

/**
 * Locks scrolling by preventing mouse wheel, touch, and scrollbar scrolling
 */
export const lockScroll = (): void => {
  if (isScrollLocked) return;
  
  // Store current scroll position
  scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  
  // Calculate scrollbar width to prevent layout shift
  const scrollbarWidthPx = getScrollbarWidth();
  
  // Prevent scroll events
  document.addEventListener('wheel', preventAccidentalScroll, { passive: false });
  document.addEventListener('touchmove', preventAccidentalScroll, { passive: false });
  document.addEventListener('scroll', preventAccidentalScroll, { passive: false });
  
  // Hide scrollbar and fix position
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
  document.body.style.paddingRight = `${scrollbarWidthPx}px`; // Prevent layout shift
  document.documentElement.style.overflow = 'hidden';
  
  // Add class for additional styling if needed
  document.body.classList.add('tour-scroll-locked');
  
  isScrollLocked = true;
  console.log('🔒 Tour scroll lock enabled (full lock with scrollbar hidden)');
};

/**
 * Unlocks scrolling and restores normal behavior
 */
export const unlockScroll = (): void => {
  if (!isScrollLocked) return;
  
  // Remove event listeners
  document.removeEventListener('wheel', preventAccidentalScroll);
  document.removeEventListener('touchmove', preventAccidentalScroll);
  document.removeEventListener('scroll', preventAccidentalScroll);
  
  // Restore body styles
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.paddingRight = '';
  document.documentElement.style.overflow = '';
  
  // Remove class
  document.body.classList.remove('tour-scroll-locked');
  
  // Restore scroll position
  window.scrollTo(0, scrollPosition);
  
  isScrollLocked = false;
  console.log('🔓 Tour scroll lock disabled');
};

/**
 * Force unlock scroll - ensures scroll is always unlocked regardless of state
 * Used for cleanup and emergency unlock situations
 */
export const forceUnlockScroll = (): void => {
  // Remove all possible event listeners
  document.removeEventListener('wheel', preventAccidentalScroll);
  document.removeEventListener('touchmove', preventAccidentalScroll);
  document.removeEventListener('scroll', preventAccidentalScroll);
  
  // Reset any CSS that might be blocking scroll
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.paddingRight = '';
  document.documentElement.style.overflow = '';
  
  // Remove any scroll lock classes
  document.body.classList.remove('tour-scroll-locked');
  
  // Restore scroll position if it was stored
  if (scrollPosition > 0) {
    window.scrollTo(0, scrollPosition);
    scrollPosition = 0;
  }
  
  isScrollLocked = false;
  console.log('🔓 Tour scroll force unlocked');
};

/**
 * Check if scroll is currently locked
 */
export const isScrollCurrentlyLocked = (): boolean => {
  return isScrollLocked;
};

/**
 * Initialize scroll utilities - ensures clean state on page load
 */
export const initializeScrollUtils = (): void => {
  // Force unlock on initialization to ensure clean state
  forceUnlockScroll();
  console.log('🔄 Scroll utilities initialized');
};

/**
 * Temporarily unlocks scroll for programmatic scrolling, then re-locks
 * Used by the tour to scroll to elements while keeping user scrolling disabled
 */
export const temporaryUnlockForScroll = (callback: () => void): void => {
  if (!isScrollLocked) {
    callback();
    return;
  }
  
  // Temporarily unlock
  const wasLocked = isScrollLocked;
  const savedPosition = scrollPosition;
  
  // Unlock scroll
  unlockScroll();
  
  // Execute callback (programmatic scroll)
  callback();
  
  // Re-lock if it was locked before
  if (wasLocked) {
    // Small delay to allow scroll to complete
    setTimeout(() => {
      scrollPosition = savedPosition; // Restore the original position reference
      lockScroll();
    }, 100);
  }
};
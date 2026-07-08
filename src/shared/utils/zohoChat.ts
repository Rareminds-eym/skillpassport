/**
 * Zoho SalesIQ Chat Utilities
 * Opens Zoho chat with user context for support
 */

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('zoho-chat');

export interface ZohoChatContext {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userRole?: string;
  userRoles?: string[];
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionId?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  billingCycle?: string;
  organizationId?: string;
  organizationType?: string;
  pageSource?: string;
  pagePath?: string;
  additionalInfo?: Record<string, string | number | boolean>;
}

type ZohoSalesIq = NonNullable<Window['$zoho']>['salesiq'];

interface ZohoVisitorExtended {
  firstname?: (value: string) => void;
  lastname?: (value: string) => void;
  phone?: (value: string) => void;
  contactnumber?: (value: string) => void;
}

/**
 * Type guard to check if a value is a string setter function
 */
const isStringSetter = (fn: unknown): fn is (value: string) => void => {
  return typeof fn === 'function';
};

/**
 * Type guard to check if the visitor object has extended methods
 */
const isZohoVisitorExtended = (
  visitor: unknown
): visitor is ZohoVisitorExtended => {
  return typeof visitor === 'object' && visitor !== null;
};

/**
 * Safely call a Zoho visitor method if it exists
 */
const callVisitorMethod = (
  visitor: unknown,
  methodName: keyof ZohoVisitorExtended,
  value: string,
  errorContext: string
): boolean => {
  if (!isZohoVisitorExtended(visitor)) {
    return false;
  }

  const method = visitor[methodName];
  if (isStringSetter(method)) {
    try {
      method(value);
      return true;
    } catch (e) {
      logger.warn(`Failed to ${errorContext}`, { error: e });
      return false;
    }
  }
  
  return false;
};

const MAX_OPEN_ATTEMPTS = 10;
const RETRY_DELAY_MS = 300;

/**
 * Safely converts an unknown error to an Error object
 * Handles cases where thrown values are not Error instances
 */
function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  // Handle null/undefined
  if (error === null || error === undefined) {
    return new Error('Unknown error occurred');
  }
  
  // Handle objects with message property
  if (typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }
  
  // Fallback: stringify the error
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(String(error));
  }
}

function getSalesIq(): ZohoSalesIq | undefined {
  return window.$zoho?.salesiq;
}

function formatVisitorInfo(context: ZohoChatContext): Record<string, string> {
  const visitorInfo: Record<string, string> = {};

  const addInfo = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return;
    visitorInfo[key] = Array.isArray(value) ? value.join(', ') : String(value);
  };

  addInfo('User ID', context.userId);
  addInfo('Phone', context.userPhone);
  addInfo('Role', context.userRole);
  addInfo('Roles', context.userRoles);
  addInfo('Subscription ID', context.subscriptionId);
  addInfo('Subscription Plan', context.subscriptionPlan);
  addInfo('Subscription Status', context.subscriptionStatus);
  addInfo('Subscription Start Date', context.subscriptionStartDate);
  addInfo('Subscription End Date', context.subscriptionEndDate);
  addInfo('Billing Cycle', context.billingCycle);
  addInfo('Organization ID', context.organizationId);
  addInfo('Organization Type', context.organizationType);
  addInfo('Page Source', context.pageSource);
  addInfo('Page Path', context.pagePath);

  if (context.additionalInfo) {
    Object.entries(context.additionalInfo).forEach(([key, value]) => addInfo(key, value));
  }

  return visitorInfo;
}

function applyZohoContext(salesiq: ZohoSalesIq, context?: ZohoChatContext): void {
  if (!context || !salesiq) return;

  // Extract first name from full name
  const firstName = context.userName ? context.userName.split(' ')[0] : '';
  const lastName = context.userName ? context.userName.split(' ').slice(1).join(' ') : '';

  // Set visitor name - try multiple approaches
  if (context.userName && salesiq.visitor?.name) {
    try {
      salesiq.visitor.name(context.userName);
    } catch (e) {
      logger.warn('Failed to set name', { error: e });
    }
  }

  // Set first name and last name using dedicated APIs
  if (firstName && salesiq.visitor) {
    callVisitorMethod(salesiq.visitor, 'firstname', firstName, 'set firstname');
  }

  if (lastName && salesiq.visitor) {
    callVisitorMethod(salesiq.visitor, 'lastname', lastName, 'set lastname');
  }
  
  // Set visitor email
  if (context.userEmail && salesiq.visitor?.email) {
    try {
      salesiq.visitor.email(context.userEmail);
    } catch (e) {
      logger.warn('Failed to set email', { error: e });
    }
  }
  
  // Set visitor phone/mobile - try multiple methods
  if (context.userPhone) {
    let phoneSet = false;
    
    // Try contactnumber method first (primary Zoho API)
    if (salesiq.visitor) {
      phoneSet = callVisitorMethod(salesiq.visitor, 'contactnumber', context.userPhone, 'set contactnumber');
    }
    
    // Try phone method as fallback
    if (!phoneSet && salesiq.visitor) {
      callVisitorMethod(salesiq.visitor, 'phone', context.userPhone, 'set phone');
    }
  }



  // Set visitor info (includes phone as backup)
  if (salesiq.visitor?.info) {
    const visitorInfo = formatVisitorInfo(context);
    // Add first name and phone to visitor info as well
    if (firstName) {
      visitorInfo['First Name'] = firstName;
    }
    if (lastName) {
      visitorInfo['Last Name'] = lastName;
    }
    if (Object.keys(visitorInfo).length > 0) {
      try {
        salesiq.visitor.info(visitorInfo);
      } catch (e) {
        logger.warn('Failed to set visitor info', { error: e });
      }
    }
  }
}

function showZohoChat(salesiq: ZohoSalesIq): void {
  document.body.classList.remove('hide-zoho-widget');

  salesiq?.visitor?.trigger?.('disable');
  salesiq?.floatwindow?.visible?.('show');
  salesiq?.chatwindow?.visible?.('show');
  salesiq?.chatwindow?.open?.();
  
  // Start a new conversation automatically after a short delay
  setTimeout(() => {
    if (salesiq?.chatwindow?.openchat) {
      salesiq.chatwindow.openchat();
    }
  }, 300);
}

/**
 * Opens Zoho SalesIQ chat with user context
 * @param context - User and page context to pass to support agents
 * @param options - Additional options like auto-close on scroll for learners
 */
export function openZohoChat(
  context?: ZohoChatContext,
  options?: { autoCloseOnScroll?: boolean; scrollThreshold?: number },
  attempt = 1
): void {
  try {
    const salesiq = getSalesIq();

    if (!salesiq?.chatwindow || !salesiq?.floatwindow) {
      if (attempt < MAX_OPEN_ATTEMPTS) {
        window.setTimeout(() => openZohoChat(context, options, attempt + 1), RETRY_DELAY_MS);
        return;
      }

      logger.warn('Zoho SalesIQ not loaded after max attempts', { attempts: MAX_OPEN_ATTEMPTS });
      return;
    }

    applyZohoContext(salesiq, context);
    showZohoChat(salesiq);

    // Setup auto-close on scroll for learners
    if (options?.autoCloseOnScroll) {
      setupAutoCloseOnScroll(salesiq, options.scrollThreshold || 100);
    }
  } catch (error) {
    logger.error('Error opening Zoho chat', toError(error));
  }
}

/**
 * Setup auto-close on scroll for learner dashboard
 * @param salesiq - Zoho SalesIQ instance
 * @param scrollThreshold - Minimum scroll distance to trigger close (default: 100px)
 */
function setupAutoCloseOnScroll(salesiq: ZohoSalesIq, scrollThreshold: number): void {
  let scrollTimer: number | null = null;
  let lastScrollY = window.scrollY;
  let isCleanedUp = false;
  let autoCleanupTimer: number | undefined = undefined;

  // Define beforeUnloadHandler first so it can be referenced by cleanup
  const beforeUnloadHandler = () => {
    cleanup();
    if (autoCleanupTimer !== undefined) {
      window.clearTimeout(autoCleanupTimer);
      autoCleanupTimer = undefined;
    }
  };

  const cleanup = () => {
    if (isCleanedUp) return; // Idempotent - safe to call multiple times
    isCleanedUp = true;
    
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('click', handleClickOutside, true);
    window.removeEventListener('touchstart', handleTouchStart, true);
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    
    if (scrollTimer !== null) {
      window.clearTimeout(scrollTimer);
      scrollTimer = null;
    }
    
    if (autoCleanupTimer !== undefined) {
      window.clearTimeout(autoCleanupTimer);
      autoCleanupTimer = undefined;
    }
  };

  const handleScroll = () => {
    if (isCleanedUp) return;
    
    const currentScrollY = window.scrollY;
    const scrollDistance = Math.abs(currentScrollY - lastScrollY);

    // Only close if scrolled more than threshold
    if (scrollDistance > scrollThreshold) {
      if (salesiq?.chatwindow?.minimize) {
        salesiq.chatwindow.minimize();
      }
      if (salesiq?.chatwindow?.visible) {
        salesiq.chatwindow.visible('hide');
      }
      cleanup();
    }

    lastScrollY = currentScrollY;

    // Reset timer
    if (scrollTimer !== null) {
      window.clearTimeout(scrollTimer);
    }
    scrollTimer = window.setTimeout(() => {
      // Reset after scroll stops
    }, 150);
  };

  const isInsideZohoWidget = (target: HTMLElement): boolean => {
    // Try multiple selectors to find Zoho widget elements
    const zohoSelectors = [
      '#zsiq_float',          // Float button
      '.zsiq_floatmain',      // Main container
      '.zsiq_flt_rel',        // Float relative
      '[id^="siqcht"]',       // Chat window
      '[id^="zsiq"]',         // Any Zoho element
      '.siqcht',              // Chat class
      '.siq-chat',            // Alternative chat class
    ];
    
    for (const selector of zohoSelectors) {
      const element = document.querySelector(selector);
      if (element && element.contains(target)) {
        return true;
      }
    }
    
    // Also check if target itself or any parent has zoho-related class/id
    let checkElement: HTMLElement | null = target;
    while (checkElement && checkElement !== document.body) {
      const id = checkElement.id || '';
      const classes = checkElement.getAttribute?.('class') || '';
      
      const hasZohoId = id.startsWith('zsiq') || id.startsWith('siq') || id.includes('zsiq') || id.includes('siq');
      const classList = classes.split(/\s+/);
      const hasZohoClass = classList.some(cls => cls.startsWith('zsiq') || cls.startsWith('siq') || cls.includes('zsiq') || cls.includes('siq'));
      
      if (hasZohoId || hasZohoClass) {
        return true;
      }
      checkElement = checkElement.parentElement;
    }
    
    return false;
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (isCleanedUp) return;
    
    const target = event.target as HTMLElement;
    
    if (!isInsideZohoWidget(target)) {
      // Click outside - minimize chat
      if (salesiq?.chatwindow?.minimize) {
        salesiq.chatwindow.minimize();
      }
      if (salesiq?.chatwindow?.visible) {
        salesiq.chatwindow.visible('hide');
      }
      cleanup();
    }
  };

  const handleTouchStart = (event: TouchEvent) => {
    if (isCleanedUp) return;
    
    const target = event.target as HTMLElement;
    
    if (!isInsideZohoWidget(target)) {
      // Touch outside - minimize chat
      if (salesiq?.chatwindow?.minimize) {
        salesiq.chatwindow.minimize();
      }
      if (salesiq?.chatwindow?.visible) {
        salesiq.chatwindow.visible('hide');
      }
      cleanup();
    }
  };

  // Add scroll listener
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Add click outside listener (with small delay to avoid immediate close)
  // Use capture phase to ensure we catch the event before any stopPropagation
  setTimeout(() => {
    window.addEventListener('click', handleClickOutside, true);
    window.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
  }, 500);

  // Auto cleanup after 5 minutes or when chat is manually closed
  autoCleanupTimer = window.setTimeout(cleanup, 5 * 60 * 1000);

  // Cleanup on unmount
  window.addEventListener('beforeunload', beforeUnloadHandler);
}

/**
 * Type declaration for window.$zoho
 */
declare global {
  interface Window {
    $zoho?: {
      salesiq?: {
        floatwindow?: {
          visible: (state: 'show' | 'hide') => void;
        };
        chatwindow?: {
          visible: (state: 'show' | 'hide') => void;
          open: () => void;
          openchat: () => void;
          minimize: () => void;
        };
        visitor?: {
          name: (name: string) => void;
          email: (email: string) => void;
          contactnumber: (phone: string) => void;
          info: (data: Record<string, string>) => void;
          trigger: (action: 'enable' | 'disable') => void;
        };
      };
    };
  }
}

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

const MAX_OPEN_ATTEMPTS = 10;
const RETRY_DELAY_MS = 300;

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
  if (firstName && (salesiq.visitor as any)?.firstname) {
    try {
      (salesiq.visitor as any).firstname(firstName);
    } catch (e) {
      logger.warn('Failed to set firstname', { error: e });
    }
  }

  if (lastName && (salesiq.visitor as any)?.lastname) {
    try {
      (salesiq.visitor as any).lastname(lastName);
    } catch (e) {
      logger.warn('Failed to set lastname', { error: e });
    }
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
    
    // Try contactnumber method
    if (salesiq.visitor?.contactnumber) {
      try {
        salesiq.visitor.contactnumber(context.userPhone);
        phoneSet = true;
      } catch (e) {
        logger.warn('Failed to set contactnumber', { error: e });
      }
    }
    
    // Try phone method as fallback
    if (!phoneSet && (salesiq.visitor as any)?.phone) {
      try {
        (salesiq.visitor as any).phone(context.userPhone);
        phoneSet = true;
      } catch (e) {
        logger.warn('Failed to set phone', { error: e });
      }
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
    logger.error('Error opening Zoho chat', error as Error);
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
    if (scrollTimer) {
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

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('click', handleClickOutside, true);
    window.removeEventListener('touchstart', handleTouchStart, true);
    
    if (scrollTimer) {
      window.clearTimeout(scrollTimer);
      scrollTimer = null;
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
  const autoCleanupTimer = window.setTimeout(cleanup, 5 * 60 * 1000);

  // Cleanup on unmount
  window.addEventListener('beforeunload', () => {
    cleanup();
    window.clearTimeout(autoCleanupTimer);
  });
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

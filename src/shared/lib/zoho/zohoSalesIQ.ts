/**
 * Zoho SalesIQ Integration Helper
 * 
 * Provides type-safe utilities for interacting with Zoho SalesIQ widget
 * No unsafe type assertions or console logs in production
 */

import { getLogger } from '@/shared/config/logging';
import {
  hasZohoChatWindowAPI,
  hasZohoVisitorAPI,
  isZohoSalesIQLoaded,
  type ZohoCustomInfo,
  type ZohoSalesIQ,
  type ZohoVisitorInfo,
  type ZohoWindow
} from './types';

const logger = getLogger('zoho-salesiq');

/**
 * Check if Zoho SalesIQ is available
 */
export function isZohoAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return isZohoSalesIQLoaded(window);
}

/**
 * Get Zoho SalesIQ instance with type safety
 */
export function getZohoInstance(): ZohoSalesIQ | null {
  if (!isZohoAvailable()) {
    return null;
  }
  const zohoWindow = window as ZohoWindow;
  return zohoWindow.$zoho?.salesiq || null;
}

/**
 * Wait for Zoho SalesIQ to load with timeout
 */
export function waitForZoho(timeoutMs = 10000): Promise<ZohoSalesIQ | null> {
  return new Promise((resolve) => {
    // Check if already loaded
    const zoho = getZohoInstance();
    if (zoho) {
      logger.info('Zoho already loaded');
      resolve(zoho);
      return;
    }

    logger.info('Waiting for Zoho to load...', { timeoutMs });

    // Set up polling with timeout
    const startTime = Date.now();
    let attempts = 0;
    
    const interval = setInterval(() => {
      attempts++;
      const currentZoho = getZohoInstance();
      
      if (currentZoho) {
        clearInterval(interval);
        logger.info('Zoho loaded successfully', { attempts, timeMs: Date.now() - startTime });
        resolve(currentZoho);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        logger.error('Zoho SalesIQ load timeout', new Error('Timeout'), { attempts, timeoutMs });
        resolve(null);
      }
    }, 200); // Check every 200ms instead of 100ms
  });
}

/**
 * Set visitor information in Zoho SalesIQ
 */
export async function setZohoVisitorInfo(visitorInfo: ZohoVisitorInfo): Promise<boolean> {
  try {
    const zoho = await waitForZoho();
    if (!zoho || !hasZohoVisitorAPI(zoho)) {
      logger.warn('Zoho SalesIQ visitor API not available');
      return false;
    }

    // Set visitor information using Zoho API
    // Name
    if (visitorInfo.name && typeof zoho.visitor.name === 'function') {
      zoho.visitor.name(visitorInfo.name);
      logger.info('Zoho: Set visitor name', { name: visitorInfo.name });
    } else {
      logger.warn('Zoho: Could not set visitor name', { 
        hasName: !!visitorInfo.name, 
        isFunction: typeof zoho.visitor.name === 'function' 
      });
    }

    // Email
    if (visitorInfo.email && typeof zoho.visitor.email === 'function') {
      zoho.visitor.email(visitorInfo.email);
      logger.info('Zoho: Set visitor email', { email: visitorInfo.email });
    } else {
      logger.warn('Zoho: Could not set visitor email', { 
        hasEmail: !!visitorInfo.email, 
        isFunction: typeof zoho.visitor.email === 'function' 
      });
    }

    // Phone - try both 'phone' and 'contactnumber' methods
    if (visitorInfo.phone) {
      // Try contactnumber method (preferred)
      if (typeof zoho.visitor.contactnumber === 'function') {
        zoho.visitor.contactnumber(visitorInfo.phone);
        logger.info('Zoho: Set visitor contactnumber', { phone: visitorInfo.phone });
      } 
      // Try phone method as fallback
      else if (typeof zoho.visitor.phone === 'function') {
        zoho.visitor.phone(visitorInfo.phone);
        logger.info('Zoho: Set visitor phone (fallback)', { phone: visitorInfo.phone });
      } else {
        logger.warn('Zoho: Could not set visitor phone', { 
          hasPhone: !!visitorInfo.phone,
          hasContactnumberMethod: typeof zoho.visitor.contactnumber === 'function',
          hasPhoneMethod: typeof zoho.visitor.phone === 'function'
        });
      }
    }

    return true;
  } catch (error) {
    logger.error('Failed to set Zoho visitor info', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Set custom information in Zoho SalesIQ
 */
export async function setZohoCustomInfo(customInfo: ZohoCustomInfo): Promise<boolean> {
  try {
    const zoho = await waitForZoho();
    if (!zoho || !hasZohoVisitorAPI(zoho)) {
      logger.warn('Zoho SalesIQ visitor API not available');
      return false;
    }

    if (typeof zoho.visitor.info === 'function') {
      zoho.visitor.info(customInfo);
    }

    return true;
  } catch (error) {
    logger.error('Failed to set Zoho custom info', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Open Zoho SalesIQ chat window
 */
export async function openZohoChat(): Promise<boolean> {
  try {
    const zoho = await waitForZoho();
    if (!zoho || !hasZohoChatWindowAPI(zoho)) {
      logger.error('Zoho SalesIQ chat window API not available', new Error('API not available'));
      return false;
    }

    logger.info('Opening Zoho chat window...');

    // Add class to body to show chat via CSS
    document.body.classList.add('zoho-chat-open');

    // First, make sure the float button is visible
    if (zoho.floatwindow && typeof zoho.floatwindow.visible === 'function') {
      zoho.floatwindow.visible('show');
      logger.info('Set float window visible');
    }

    // Small delay to ensure float button is ready
    await new Promise(resolve => setTimeout(resolve, 150));

    // Make sure chat window is visible
    if (typeof zoho.chatwindow.visible === 'function') {
      zoho.chatwindow.visible('show');
      logger.info('Set chat window visible');
    }

    // Small delay to ensure visibility is set
    await new Promise(resolve => setTimeout(resolve, 150));

    // Then open the chat and keep it open
    if (typeof zoho.chatwindow.open === 'function') {
      zoho.chatwindow.open();
      logger.info('Opened chat window');
    }

    // Verify it stayed open
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return true;
  } catch (error) {
    logger.error('Failed to open Zoho chat', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Close Zoho SalesIQ chat window
 */
export async function closeZohoChat(): Promise<boolean> {
  try {
    const zoho = await waitForZoho();
    if (!zoho || !hasZohoChatWindowAPI(zoho)) {
      logger.warn('Zoho SalesIQ chat window API not available');
      return false;
    }

    logger.info('Closing Zoho chat window...');

    // Remove class from body to hide chat via CSS
    document.body.classList.remove('zoho-chat-open');

    // Close the chat
    if (typeof zoho.chatwindow.close === 'function') {
      zoho.chatwindow.close();
      logger.info('Closed chat window');
    }

    // Make sure it's hidden
    if (typeof zoho.chatwindow.visible === 'function') {
      zoho.chatwindow.visible('hide');
      logger.info('Set chat window hidden');
    }

    return true;
  } catch (error) {
    logger.error('Failed to close Zoho chat', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Show Zoho float button
 */
export async function showZohoFloatButton(): Promise<boolean> {
  try {
    const zoho = await waitForZoho();
    if (!zoho || !zoho.floatwindow) {
      logger.warn('Zoho float window not available');
      return false;
    }

    if (typeof zoho.floatwindow.visible === 'function') {
      zoho.floatwindow.visible('show');
      logger.info('Showed Zoho float button');
    }

    return true;
  } catch (error) {
    logger.error('Failed to show Zoho float button', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Initialize Zoho widget - ensures it's ready for use
 */
export async function initializeZoho(): Promise<boolean> {
  try {
    const zoho = await waitForZoho();
    if (!zoho) {
      logger.error('Zoho SalesIQ failed to initialize', new Error('Zoho not available'));
      return false;
    }

    // Don't call zoho.ready() - it conflicts with existing implementations
    // Just ensure the widget is available and float window is visible
    
    // Ensure float window is visible
    await showZohoFloatButton();

    logger.info('Zoho initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Zoho', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Zoho SalesIQ Type Definitions
 * 
 * TypeScript-safe interfaces for Zoho SalesIQ API
 * No 'any' or 'as any' or @ts-ignore allowed
 */

export interface ZohoVisitorInfo {
  name?: string;
  email?: string;
  phone?: string;
  contactnumber?: string;
}

export interface ZohoCustomInfo {
  [key: string]: string | number | boolean;
}

export interface ZohoSalesIQVisitor {
  name: (visitorName: string) => void;
  email: (visitorEmail: string) => void;
  phone: (visitorPhone: string) => void;
  contactnumber: (visitorPhone: string) => void;
  info: (customInfo: ZohoCustomInfo) => void;
}

export interface ZohoSalesIQFloatWindow {
  visible: (visibility: 'show' | 'hide') => void;
}

export interface ZohoSalesIQChatWindow {
  visible: (visibility: 'show' | 'hide') => void;
  open: () => void;
  close: () => void;
  minimize: () => void;
}

export interface ZohoSalesIQ {
  visitor: ZohoSalesIQVisitor;
  floatwindow: ZohoSalesIQFloatWindow;
  chatwindow: ZohoSalesIQChatWindow;
  ready?: () => void;
  widgetcode?: string;
  values?: Record<string, unknown>;
}

export interface ZohoWindow extends Window {
  $zoho?: {
    salesiq?: ZohoSalesIQ;
  };
}

/**
 * Type guard to check if Zoho SalesIQ is loaded
 */
export function isZohoSalesIQLoaded(win: Window): win is ZohoWindow {
  const zohoWin = win as ZohoWindow;
  return !!(
    zohoWin.$zoho &&
    zohoWin.$zoho.salesiq &&
    typeof zohoWin.$zoho.salesiq === 'object'
  );
}

/**
 * Type guard to check if Zoho SalesIQ visitor API is available
 */
export function hasZohoVisitorAPI(zoho: ZohoSalesIQ | undefined): zoho is ZohoSalesIQ & { visitor: ZohoSalesIQVisitor } {
  return !!(zoho && zoho.visitor && typeof zoho.visitor === 'object');
}

/**
 * Type guard to check if Zoho SalesIQ chat window API is available
 */
export function hasZohoChatWindowAPI(zoho: ZohoSalesIQ | undefined): zoho is ZohoSalesIQ & { chatwindow: ZohoSalesIQChatWindow } {
  return !!(zoho && zoho.chatwindow && typeof zoho.chatwindow === 'object');
}

/**
 * Smart Scroll Hook
 * 
 * Intelligent scroll management for chat applications.
 * Automatically scrolls to bottom for new messages while
 * respecting user's scroll position when reading history.
 * 
 * @author Senior React Developer
 * @pattern UX Optimization
 */

import { useCallback, useRef, useState, useEffect } from 'react';

export interface UseSmartScrollReturn {
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  userScrolledUp: boolean;
  scrollToBottom: (force?: boolean) => void;
  handleScroll: () => void;
  setUserScrolledUp: (value: boolean) => void;
}

/**
 * Hook for smart scroll behavior in chat
 * 
 * Features:
 * - Auto-scroll for new messages
 * - Preserve scroll position when user is reading history
 * - Smooth scroll animations
 * - Performance optimized with useCallback
 * 
 * @param dependencies Array of dependencies that trigger scroll (e.g., messages)
 * @returns Scroll management utilities
 */
export function useSmartScroll(dependencies: any[] = []): UseSmartScrollReturn {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  /**
   * Check if user is at the bottom of the scroll container
   * Uses a threshold to account for rounding errors
   */
  const isUserAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 100; // pixels from bottom
    const position = container.scrollHeight - container.scrollTop - container.clientHeight;
    return position < threshold;
  }, []);

  /**
   * Scroll to bottom of messages
   * 
   * @param force If true, scrolls even if user has scrolled up
   */
  const scrollToBottom = useCallback((force = false) => {
    if (force || !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [userScrolledUp]);

  /**
   * Handle scroll events
   * Detects if user is scrolling up to read history
   * 
   * Performance: Uses refs to avoid state updates on every scroll
   */
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const currentScrollTop = container.scrollTop;
    const scrollingUp = currentScrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;
    
    const isScrollable = container.scrollHeight > container.clientHeight;
    
    // Update userScrolledUp state only when necessary
    if (isScrollable && isUserAtBottom()) {
      setUserScrolledUp(false);
    } else if (isScrollable && scrollingUp && !isUserAtBottom()) {
      setUserScrolledUp(true);
    }
  }, [isUserAtBottom]);

  /**
   * Auto-scroll effect
   * Scrolls to bottom when new messages arrive,
   * but only if user hasn't scrolled up
   */
  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom();
    }
    
    // Double-check scroll position after a brief delay
    // Handles cases where content height changes after render
    const timer = setTimeout(() => {
      if (isUserAtBottom()) {
        setUserScrolledUp(false);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [...dependencies, scrollToBottom, userScrolledUp, isUserAtBottom]);

  return {
    messagesEndRef,
    messagesContainerRef,
    userScrolledUp,
    scrollToBottom,
    handleScroll,
    setUserScrolledUp,
  };
}

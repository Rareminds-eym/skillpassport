import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Custom hook for managing chat scroll behavior
 * Handles auto-scroll, user scroll detection, and scroll-to-bottom functionality
 */
export const useChatScroll = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const isScrollingRef = useRef(false);

  const [userScrolledUp, setUserScrolledUp] = useState(false);

  /**
   * Check if user is at the bottom of the scroll container
   */
  const isUserAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100; // 100px from bottom is considered "at bottom"
    const position = container.scrollHeight - container.scrollTop - container.clientHeight;
    return position < threshold;
  }, []);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(
    (force = false) => {
      if (force || !userScrolledUp) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [userScrolledUp]
  );

  /**
   * Handle scroll events
   */
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const scrollingUp = currentScrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;

    const isScrollable = container.scrollHeight > container.clientHeight;

    // Mark user interaction during typing
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    userInteractedRef.current = true;
    isScrollingRef.current = true;

    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);

    // Update scroll button visibility
    if (isScrollable && isUserAtBottom()) {
      setUserScrolledUp(false);
    } else if (isScrollable && scrollingUp && !isUserAtBottom()) {
      setUserScrolledUp(true);
    }
  }, [isUserAtBottom]);

  /**
   * Reset scroll state (call when sending new message)
   */
  const resetScrollState = useCallback(() => {
    setUserScrolledUp(false);
    userInteractedRef.current = false;
    isScrollingRef.current = false;
  }, []);

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Setup wheel and touch event listeners for scroll detection
   */
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleWheel = () => {
      userInteractedRef.current = true;
      isScrollingRef.current = true;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    };

    const handleTouchMove = () => {
      userInteractedRef.current = true;
      isScrollingRef.current = true;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return {
    messagesEndRef,
    messagesContainerRef,
    userScrolledUp,
    userInteractedRef,
    isScrollingRef,
    scrollToBottom,
    handleScroll,
    resetScrollState,
    isUserAtBottom,
  };
};

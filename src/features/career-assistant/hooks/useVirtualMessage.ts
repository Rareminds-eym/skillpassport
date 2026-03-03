/**
 * Virtual Message Hook
 * 
 * Lightweight virtualization using IntersectionObserver.
 * Only renders messages when they're visible in the viewport.
 * 
 * STEP-BY-STEP EXPLANATION:
 * 1. IntersectionObserver watches when element enters/exits viewport
 * 2. When element is near viewport (rootMargin), render actual content
 * 3. When element is far away, show placeholder with measured height
 * 4. This reduces DOM nodes and improves scroll performance
 * 
 * @author Senior React Developer (20 years experience)
 * @pattern Performance Optimization with IntersectionObserver
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualMessageOptions {
  rootMargin?: string;
  defaultHeight?: number;
  initialVisible?: boolean;
}

interface UseVirtualMessageReturn {
  isVisible: boolean;
  ref: React.RefObject<HTMLDivElement>;
  height: number;
}

/**
 * STEP 1: Hook that manages visibility state for a single message
 * 
 * How it works:
 * - Creates IntersectionObserver on mount
 * - Observes the message container element
 * - Updates isVisible when element enters/exits viewport
 * - Measures height once for placeholder
 */
export function useVirtualMessage(options: UseVirtualMessageOptions = {}): UseVirtualMessageReturn {
  const {
    rootMargin = '400px', // STEP 2: Preload 400px before visible
    defaultHeight = 100,  // STEP 3: Default placeholder height
    initialVisible = false, // STEP 4: Initial state (true for first messages)
  } = options;

  // STEP 5: State management
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // STEP 6: Measure element height once it's rendered
  const measureHeight = useCallback(() => {
    if (ref.current && !measuredHeight) {
      const height = ref.current.offsetHeight;
      if (height > 0) {
        setMeasuredHeight(height);
      }
    }
  }, [measuredHeight]);

  // STEP 7: Setup IntersectionObserver
  useEffect(() => {
    // Skip on server-side
    if (typeof window === 'undefined' || !ref.current) return;

    const element = ref.current;

    // STEP 8: Create observer with callback
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // STEP 9: Element is visible or near viewport
            setIsVisible(true);
            
            // STEP 10: Measure height after first render
            setTimeout(measureHeight, 0);
          } else if (measuredHeight) {
            // STEP 11: Element is far away and we have height
            // Safe to hide and show placeholder
            setIsVisible(false);
          }
          // STEP 12: If no height yet, keep visible to measure
        });
      },
      {
        rootMargin, // STEP 13: Trigger before entering viewport
        threshold: 0, // STEP 14: Trigger as soon as 1px is visible
      }
    );

    // STEP 15: Start observing
    observer.observe(element);

    // STEP 16: Cleanup on unmount - properly disconnect observer
    return () => {
      observer.disconnect();
    };
  }, [rootMargin, measuredHeight, measureHeight]);

  return {
    isVisible,
    ref,
    height: measuredHeight || defaultHeight, // STEP 17: Use measured or default
  };
}

/**
 * STEP 18: Wrapper component for easy usage
 * 
 * Usage in CareerAssistant:
 * <VirtualMessage initialVisible={index < 5}>
 *   <SimpleMessage {...props} />
 * </VirtualMessage>
 */
interface VirtualMessageProps {
  children: React.ReactNode;
  rootMargin?: string;
  defaultHeight?: number;
  initialVisible?: boolean;
  className?: string;
}

export const VirtualMessage: React.FC<VirtualMessageProps> = ({
  children,
  rootMargin = '400px',
  defaultHeight = 100,
  initialVisible = false,
  className = '',
}) => {
  // STEP 19: Use the hook
  const { isVisible, ref, height } = useVirtualMessage({
    rootMargin,
    defaultHeight,
    initialVisible,
  });

  // STEP 20: Render container with ref
  // - If visible: render actual content
  // - If not visible: render empty div with measured height (placeholder)
  return React.createElement(
    'div',
    {
      ref,
      className,
      style: { 
        minHeight: isVisible ? undefined : height, // STEP 21: Placeholder height
      }
    },
    isVisible ? children : null // STEP 22: Conditional rendering
  );
};

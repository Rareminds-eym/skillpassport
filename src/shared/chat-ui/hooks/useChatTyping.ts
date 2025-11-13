import { useRef, useCallback } from 'react';
import { MessageWithInteractive } from '../types';

interface TypingCallbacks {
  onUpdateMessage: (id: string, content: string) => void;
  onTypingStart: () => void;
  onTypingEnd: () => void;
  shouldAutoScroll: () => boolean;
  scrollToBottom: () => void;
}

/**
 * Custom hook for managing progressive text typing animation
 * Provides realistic typing effect with punctuation delays
 */
export const useChatTyping = () => {
  const typingTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  /**
   * Type out text progressively with realistic delays
   */
  const typeText = useCallback((
    fullText: string,
    messageId: string,
    callbacks: TypingCallbacks
  ): Promise<void> => {
    return new Promise((resolve) => {
      callbacks.onTypingStart();
      isTypingRef.current = true;

      let i = 0;
      const baseDelay = 14; // ms per character
      let stopped = false;

      const step = () => {
        // Check if typing was stopped
        if (stopped || typingTimerRef.current === null) {
          isTypingRef.current = false;
          callbacks.onTypingEnd();
          resolve();
          return;
        }

        // If user is actively scrolling, pause typing briefly
        if (!callbacks.shouldAutoScroll()) {
          typingTimerRef.current = window.setTimeout(step, 50);
          return;
        }

        const prevChar = fullText[Math.max(0, i - 1)];
        i = Math.min(i + 1, fullText.length);

        callbacks.onUpdateMessage(messageId, fullText.slice(0, i));
        
        // Auto-scroll if should
        if (callbacks.shouldAutoScroll()) {
          requestAnimationFrame(() => {
            if (callbacks.shouldAutoScroll()) {
              callbacks.scrollToBottom();
            }
          });
        }

        if (i < fullText.length) {
          // Variable delay based on punctuation for natural feel
          let delay = baseDelay;
          if (prevChar === '.' || prevChar === '!' || prevChar === '?') delay = 140;
          else if (prevChar === ',' || prevChar === ';' || prevChar === ':') delay = 80;
          else if (prevChar === '\n') delay = 60;
          
          typingTimerRef.current = window.setTimeout(step, delay);
        } else {
          isTypingRef.current = false;
          callbacks.onTypingEnd();
          typingTimerRef.current = null;
          resolve();
        }
      };

      typingTimerRef.current = window.setTimeout(step, baseDelay);
    });
  }, []);

  /**
   * Stop typing animation immediately
   */
  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    isTypingRef.current = false;
  }, []);

  /**
   * Check if currently typing
   */
  const isTyping = useCallback(() => {
    return isTypingRef.current;
  }, []);

  return {
    typeText,
    stopTyping,
    isTyping: isTypingRef.current,
  };
};

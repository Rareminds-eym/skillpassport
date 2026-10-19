import { useEffect, useRef } from 'react';

/**
 * Options for {@link useEscapeToClose}.
 */
interface EscapeToCloseOptions {
  /**
   * When `false` the listener is not registered at all (default: `true`).
   */
  enabled?: boolean;
  /**
   * Called with the native Escape `keydown` event when Escape is pressed.
   */
  onEscape: (event: KeyboardEvent) => void;
}

/**
 * Universal "press Escape to close" hook.
 *
 * Registers a document-level `keydown` listener with proper cleanup that
 * invokes `onEscape` when the user presses Escape.
 *
 * - Tab-focus-safe: it only reacts to the Escape key, so keyboard tabbing
 *   and `<Tab>`-navigation behavior are untouched.
 * - Ignores auto-repeated keydown events and Escape pressed together with
 *   modifier keys (Ctrl/Alt/Meta/Shift), so shortcuts like Ctrl+Escape or a
 *   held-down key never trigger an unintended close.
 * - The callback is stored in a ref, so the listener is registered at most
 *   once per `enabled` state (no listener churn when the callback identity
 *   changes across renders).
 */
export function useEscapeToClose({ enabled = true, onEscape }: EscapeToCloseOptions): void {
  const onEscapeRef = useRef(onEscape);

  // Keep the latest callback without re-registering the document listener.
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Ignore auto-repeat and modifier combinations — neither is a deliberate "close".
      if (event.repeat) return;
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

      onEscapeRef.current(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}

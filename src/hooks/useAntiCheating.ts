/**
 * Anti-Cheating Hook
 * 
 * Implements comprehensive protections against cheating during assessments:
 * - Disables text selection
 * - Blocks right-click context menu
 * - Prevents keyboard shortcuts (copy, paste, print, view source)
 * - Blocks copy/cut/paste events
 * - Disables browser extensions (Grammarly, etc.)
 * - Tab/window switch detection with warnings
 * - Fullscreen enforcement (optional)
 * - Screenshot prevention attempts
 * - DevTools detection
 * - Works cross-browser and cross-platform (Windows/Mac)
 * 
 * NOTE: Automatically disabled on localhost and development environments for testing
 */

import { useEffect, useRef, useState } from 'react';

interface AntiCheatingOptions {
  enabled?: boolean;
  onTabSwitch?: () => void;
  onDevToolsDetected?: () => void;
  enforceFullscreen?: boolean;
  maxTabSwitches?: number;
}

export const useAntiCheating = (options: AntiCheatingOptions | boolean = true) => {
  // Handle both boolean and object parameters for backward compatibility
  const config = typeof options === 'boolean' 
    ? { enabled: options } 
    : { enabled: true, ...options };

  const { 
    enabled = true, 
    onTabSwitch, 
    onDevToolsDetected,
    enforceFullscreen = false,
    maxTabSwitches = 3
  } = config;

  const tabSwitchCountRef = useRef(0);
  const devToolsCheckIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Disable anti-cheating on localhost and development environments
    const hostname = window.location.hostname;
    const isDevelopment = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.includes('localhost') ||
      import.meta.env.DEV;

    if (!enabled || isDevelopment) {
      console.log('🔓 [Anti-Cheating] Disabled for development environment');
      return;
    }

    console.log('🔒 [Anti-Cheating] Enabled for production environment');

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Block common cheating shortcuts
      if (ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'a': // Select All
          case 'c': // Copy
          case 'x': // Cut
          case 'v': // Paste
          case 'p': // Print
          case 'u': // View Source
          case 's': // Save
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
      }

      // Block F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I (Developer Tools)
      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+J (Console)
      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+C (Inspect Element)
      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        return false;
      }
    };

    // Block copy event
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Block cut event
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Block paste event
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Block drag start (prevents drag-to-select)
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Block select start (prevents text selection)
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Tab/Window switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current += 1;
        console.warn(`⚠️ [Anti-Cheating] Tab switch detected (${tabSwitchCountRef.current}/${maxTabSwitches})`);
        
        if (onTabSwitch) {
          onTabSwitch();
        }

        if (tabSwitchCountRef.current >= maxTabSwitches) {
          alert(`⚠️ Warning: You have switched tabs ${maxTabSwitches} times.\n\nExcessive tab switching may be flagged as suspicious behavior.\n\nPlease stay focused on the assessment.`);
        }
      }
    };

    const handleBlur = () => {
      console.warn('⚠️ [Anti-Cheating] Window lost focus');
    };

    // Prevent screenshots (limited effectiveness but adds friction)
    const handlePrintScreen = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        console.warn('⚠️ [Anti-Cheating] Screenshot attempt detected');
        alert('⚠️ Screenshots are not allowed during the assessment.');
        return false;
      }
    };

    // DevTools detection (basic check)
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        console.warn('⚠️ [Anti-Cheating] DevTools may be open');
        if (onDevToolsDetected) {
          onDevToolsDetected();
        }
      }
    };

    // Fullscreen enforcement
    const requestFullscreen = () => {
      if (enforceFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(err => {
          console.warn('⚠️ [Anti-Cheating] Could not enter fullscreen:', err);
        });
      }
    };

    const handleFullscreenChange = () => {
      if (enforceFullscreen && !document.fullscreenElement) {
        console.warn('⚠️ [Anti-Cheating] User exited fullscreen');
        alert('⚠️ Please stay in fullscreen mode during the assessment.');
        requestFullscreen();
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keyup', handlePrintScreen);
    
    if (enforceFullscreen) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      requestFullscreen();
    }

    // Start DevTools detection
    if (onDevToolsDetected) {
      devToolsCheckIntervalRef.current = window.setInterval(detectDevTools, 1000);
    }

    // Disable browser extensions (Grammarly, etc.) on input fields
    const disableExtensions = () => {
      const inputs = document.querySelectorAll('input[type="text"], textarea');
      inputs.forEach((input) => {
        // Disable Grammarly
        input.setAttribute('data-gramm', 'false');
        input.setAttribute('data-gramm_editor', 'false');
        input.setAttribute('data-enable-grammarly', 'false');
        
        // Disable other common extensions
        input.setAttribute('spellcheck', 'false');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
      });
    };

    // Run initially
    disableExtensions();

    // Re-run when DOM changes (for dynamically added inputs)
    const observer = new MutationObserver(disableExtensions);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Apply CSS to disable text selection
    const style = document.createElement('style');
    style.id = 'anti-cheating-styles';
    style.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      /* Allow selection only for input fields */
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      /* Hide Grammarly and other extension overlays */
      grammarly-extension,
      grammarly-popups,
      grammarly-card,
      [data-grammarly-shadow-root],
      .__grammarly_container {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keyup', handlePrintScreen);
      
      if (enforceFullscreen) {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      }

      if (devToolsCheckIntervalRef.current) {
        clearInterval(devToolsCheckIntervalRef.current);
      }
      
      // Disconnect observer
      observer.disconnect();
      
      // Remove the style element
      const styleElement = document.getElementById('anti-cheating-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [enabled, onTabSwitch, onDevToolsDetected, enforceFullscreen, maxTabSwitches]);
};

// Hook to track and report suspicious behavior
export const useAntiCheatingMonitor = () => {
  const [suspiciousEvents, setSuspiciousEvents] = useState<Array<{
    type: string;
    timestamp: number;
    details?: string;
  }>>([]);

  const logEvent = (type: string, details?: string) => {
    setSuspiciousEvents(prev => [...prev, {
      type,
      timestamp: Date.now(),
      details
    }]);
  };

  const getReport = () => ({
    totalEvents: suspiciousEvents.length,
    events: suspiciousEvents,
    tabSwitches: suspiciousEvents.filter(e => e.type === 'tab_switch').length,
    devToolsDetections: suspiciousEvents.filter(e => e.type === 'devtools').length,
    copyAttempts: suspiciousEvents.filter(e => e.type === 'copy_attempt').length,
  });

  return {
    logEvent,
    getReport,
    suspiciousEvents
  };
};

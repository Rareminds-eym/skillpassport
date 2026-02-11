/**
 * Anti-Cheating Hook
 * 
 * Implements comprehensive protections against cheating during assessments:
 * - Disables text selection
 * - Blocks right-click context menu
 * - Prevents keyboard shortcuts (copy, paste, print, view source)
 * - Blocks copy/cut/paste events
 * - Disables browser extensions (Grammarly, etc.)
 * - Works cross-browser and cross-platform (Windows/Mac)
 * 
 * NOTE: Automatically disabled on localhost and development environments for testing
 */

import { useEffect } from 'react';

export const useAntiCheating = (enabled: boolean = true) => {
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

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

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
      
      // Disconnect observer
      observer.disconnect();
      
      // Remove the style element
      const styleElement = document.getElementById('anti-cheating-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [enabled]);
};

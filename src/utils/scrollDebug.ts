/**
 * Debug utilities for scroll lock issues
 * Add to window object for easy console access
 */

import { forceUnlockScroll, getScrollLockCount, isScrollLocked } from './scrollLock';

export const scrollDebug = {
  /**
   * Check current scroll lock status
   */
  status: () => {
    const locked = isScrollLocked();
    const count = getScrollLockCount();
    const bodyOverflow = document.body.style.overflow;
    const bodyPosition = document.body.style.position;
    const htmlOverflow = document.documentElement.style.overflow;
    
    console.log('🔍 Scroll Lock Status:');
    console.log('  Locked:', locked);
    console.log('  Lock Count:', count);
    console.log('  Body overflow:', bodyOverflow || 'default');
    console.log('  Body position:', bodyPosition || 'default');
    console.log('  HTML overflow:', htmlOverflow || 'default');
    console.log('  Tour class:', document.body.classList.contains('tour-scroll-locked'));
    
    return { locked, count, bodyOverflow, bodyPosition, htmlOverflow };
  },
  
  /**
   * Force unlock scroll (emergency fix)
   */
  forceUnlock: () => {
    console.log('🔓 Force unlocking scroll...');
    
    // Use our utility
    forceUnlockScroll();
    
    // Also clean up Tours scroll lock
    const toursUtils = (window as any).toursScrollLock;
    if (toursUtils?.forceUnlockScroll) {
      toursUtils.forceUnlockScroll();
      console.log('🔓 Tours scroll lock also unlocked');
    }
    
    // Direct DOM manipulation as last resort
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.body.style.setProperty('position', 'static', 'important');
    document.body.style.setProperty('top', 'auto', 'important');
    document.body.style.setProperty('width', 'auto', 'important');
    document.body.style.paddingRight = '';
    document.documentElement.style.overflow = '';
    document.body.classList.remove('tour-scroll-locked');
    
    scrollDebug.status();
  },
  
  /**
   * Check for common scroll lock issues
   */
  diagnose: () => {
    console.log('🔍 Diagnosing scroll issues...');
    
    const issues = [];
    
    if (document.body.style.overflow === 'hidden') {
      issues.push('Body overflow is hidden');
    }
    
    if (document.body.style.position === 'fixed') {
      issues.push('Body position is fixed');
    }
    
    if (document.documentElement.style.overflow === 'hidden') {
      issues.push('HTML overflow is hidden');
    }
    
    if (document.body.classList.contains('tour-scroll-locked')) {
      issues.push('Tour scroll lock class is active');
    }
    
    const lockCount = getScrollLockCount();
    if (lockCount > 0) {
      issues.push(`Scroll lock count is ${lockCount} (should be 0)`);
    }
    
    if (issues.length === 0) {
      console.log('✅ No scroll lock issues detected');
    } else {
      console.log('⚠️ Issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('\n💡 Run scrollDebug.forceUnlock() to fix');
    }
    
    return issues;
  },
  
  /**
   * Monitor scroll lock changes
   */
  monitor: () => {
    console.log('👀 Monitoring scroll lock changes...');
    console.log('   (Check console for updates)');
    
    const observer = new MutationObserver(() => {
      const status = scrollDebug.status();
      if (status.locked) {
        console.warn('⚠️ Scroll is locked!', status);
      }
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    return observer;
  }
};

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).scrollDebug = scrollDebug;
  console.log('🔧 Scroll debug utilities loaded. Use scrollDebug.status() to check scroll lock status.');
}

/**
 * Utility to manage body scroll locking for modals and tours
 * Prevents scroll issues by tracking lock count and ensuring proper cleanup
 */

let lockCount = 0;
let originalStyles = {
  overflow: '',
  position: '',
  top: '',
  width: '',
  paddingRight: ''
};

export const lockScroll = () => {
  if (lockCount === 0) {
    // Store original styles
    originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight
    };
    
    // Lock scroll with !important to override CSS
    document.body.style.setProperty('overflow', 'hidden', 'important');
  }
  lockCount++;
  console.log(`🔒 Scroll locked (count: ${lockCount})`);
};

export const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  
  if (lockCount === 0) {
    // Restore original styles or use auto with !important
    document.body.style.setProperty('overflow', originalStyles.overflow || 'auto', 'important');
    document.body.style.setProperty('position', originalStyles.position || 'static', 'important');
    document.body.style.setProperty('top', originalStyles.top || 'auto', 'important');
    document.body.style.setProperty('width', originalStyles.width || 'auto', 'important');
    document.body.style.paddingRight = originalStyles.paddingRight || '';
    
    console.log('🔓 Scroll unlocked');
  } else {
    console.log(`🔒 Scroll still locked (count: ${lockCount})`);
  }
};

export const forceUnlockScroll = () => {
  const previousCount = lockCount;
  lockCount = 0;
  
  // Force restore with !important
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('position', 'static', 'important');
  document.body.style.setProperty('top', 'auto', 'important');
  document.body.style.setProperty('width', 'auto', 'important');
  document.body.style.paddingRight = '';
  
  // Also remove any tour-specific classes
  document.body.classList.remove('tour-scroll-locked');
  document.documentElement.style.overflow = '';
  
  console.log(`🔓 Scroll force unlocked (was count: ${previousCount})`);
};

export const isScrollLocked = () => lockCount > 0;

export const getScrollLockCount = () => lockCount;

// Emergency cleanup on page visibility change
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && lockCount > 0) {
      console.warn('⚠️ Page hidden with scroll locked, forcing unlock');
      forceUnlockScroll();
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (lockCount > 0) {
      forceUnlockScroll();
    }
  });
  
  // Force unlock on initial load (in case of stale locks)
  window.addEventListener('load', () => {
    if (lockCount > 0) {
      console.warn('⚠️ Stale scroll lock detected on page load, forcing unlock');
      forceUnlockScroll();
    }
  });
}

/**
 * Emergency scroll unlock script
 * Runs immediately when page loads
 */
(function() {
  'use strict';
  
  function forceUnlockScroll() {
    // Force unlock body
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.body.style.setProperty('position', 'static', 'important');
    document.body.style.setProperty('top', 'auto', 'important');
    document.body.style.setProperty('width', 'auto', 'important');
    document.body.style.paddingRight = '';
    
    // Force unlock html
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('position', 'static', 'important');
    
    // Remove tour class
    document.body.classList.remove('tour-scroll-locked');
    
    console.log('✅ Scroll unlocked on page load');
  }
  
  // Run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceUnlockScroll);
  } else {
    forceUnlockScroll();
  }
  
  // Run again after a short delay to catch any late-loading scripts
  setTimeout(forceUnlockScroll, 100);
  setTimeout(forceUnlockScroll, 500);
  setTimeout(forceUnlockScroll, 1000);
  
  // Watch for changes and re-unlock if needed
  const observer = new MutationObserver(function(mutations) {
    const bodyOverflow = window.getComputedStyle(document.body).overflow;
    const bodyPosition = window.getComputedStyle(document.body).position;
    
    if (bodyOverflow === 'hidden' || bodyPosition === 'fixed') {
      console.warn('⚠️ Scroll lock detected, forcing unlock...');
      forceUnlockScroll();
    }
  });
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  // Make unlock function globally available
  window.forceUnlockScroll = forceUnlockScroll;
  
})();

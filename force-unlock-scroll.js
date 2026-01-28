/**
 * Emergency script to force unlock scroll
 * Run this in the browser console or as a bookmarklet
 */

// Force unlock all possible scroll locks
document.body.style.overflow = '';
document.body.style.position = '';
document.body.style.top = '';
document.body.style.width = '';
document.body.style.paddingRight = '';
document.documentElement.style.overflow = '';
document.body.classList.remove('tour-scroll-locked');

// Remove any event listeners that might be blocking scroll
const events = ['wheel', 'touchmove', 'scroll'];
events.forEach(event => {
  document.removeEventListener(event, () => {}, { passive: false });
});

console.log('✅ Scroll force unlocked!');
console.log('Body overflow:', document.body.style.overflow || 'default');
console.log('Body position:', document.body.style.position || 'default');

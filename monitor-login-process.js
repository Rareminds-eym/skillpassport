/**
 * Login Process Monitor
 * 
 * This script monitors localStorage changes during the login process
 * to verify if authentication data is being set properly.
 * 
 * Usage:
 *   1. Open browser console (F12) on the login page
 *   2. Copy and paste this entire script
 *   3. The monitor will start automatically
 *   4. Proceed with login and watch the console output
 */

console.log('🔍 Starting Login Process Monitor...\n');

// Store initial localStorage state
const initialLocalStorage = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  initialLocalStorage[key] = localStorage.getItem(key);
}

console.log('📋 Initial localStorage state:');
console.log(initialLocalStorage);
console.log('');

// Monitor localStorage changes
let monitoringActive = true;
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;
const originalClear = localStorage.clear;

// Override setItem to monitor changes
localStorage.setItem = function(key, value) {
  if (monitoringActive) {
    console.log(`✅ localStorage.setItem('${key}', '${value}')`);
    
    // Special handling for auth-related keys
    if (key === 'userEmail') {
      console.log('🎯 CRITICAL: userEmail set to:', value);
    }
    if (key === 'user') {
      console.log('🎯 CRITICAL: user object set to:', value);
      try {
        const parsed = JSON.parse(value);
        console.log('👤 Parsed user object:', parsed);
      } catch (e) {
        console.log('❌ Failed to parse user object');
      }
    }
  }
  return originalSetItem.call(this, key, value);
};

// Override removeItem to monitor deletions
localStorage.removeItem = function(key) {
  if (monitoringActive) {
    console.log(`🗑️ localStorage.removeItem('${key}')`);
  }
  return originalRemoveItem.call(this, key);
};

// Override clear to monitor full clears
localStorage.clear = function() {
  if (monitoringActive) {
    console.log('🧹 localStorage.clear() called');
  }
  return originalClear.call(this);
};

// Monitor navigation changes
let currentUrl = window.location.href;
const checkNavigation = () => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('🔄 Navigation detected:', currentUrl);
    
    // Check localStorage after navigation
    setTimeout(() => {
      console.log('📋 localStorage after navigation:');
      const currentState = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        currentState[key] = localStorage.getItem(key);
      }
      console.log(currentState);
      
      // Check for auth data specifically
      const userEmail = localStorage.getItem('userEmail');
      const user = localStorage.getItem('user');
      
      if (userEmail) {
        console.log('✅ SUCCESS: userEmail found:', userEmail);
      } else {
        console.log('❌ ISSUE: userEmail not found');
      }
      
      if (user) {
        console.log('✅ SUCCESS: user object found');
        try {
          const parsed = JSON.parse(user);
          console.log('👤 User details:', {
            id: parsed.id,
            email: parsed.email,
            name: parsed.name,
            role: parsed.role
          });
        } catch (e) {
          console.log('❌ ISSUE: user object is not valid JSON');
        }
      } else {
        console.log('❌ ISSUE: user object not found');
      }
    }, 1000);
  }
};

// Check navigation every 500ms
const navigationInterval = setInterval(checkNavigation, 500);

// Monitor form submissions
document.addEventListener('submit', (e) => {
  console.log('📝 Form submission detected');
  console.log('Form action:', e.target.action);
  console.log('Form method:', e.target.method);
  
  // Log form data (be careful with passwords)
  const formData = new FormData(e.target);
  const formEntries = {};
  for (const [key, value] of formData.entries()) {
    if (key.toLowerCase().includes('password')) {
      formEntries[key] = '[HIDDEN]';
    } else {
      formEntries[key] = value;
    }
  }
  console.log('Form data:', formEntries);
});

// Monitor fetch requests (for API calls)
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  const options = args[1] || {};
  
  console.log('🌐 Fetch request:', url);
  if (options.method && options.method !== 'GET') {
    console.log('📤 Request method:', options.method);
  }
  
  return originalFetch.apply(this, args).then(response => {
    console.log('📥 Fetch response:', response.status, response.statusText);
    return response;
  }).catch(error => {
    console.log('❌ Fetch error:', error);
    throw error;
  });
};

// Function to manually check current state
window.checkAuthState = () => {
  console.log('\n=== MANUAL AUTH STATE CHECK ===');
  console.log('Current URL:', window.location.href);
  console.log('userEmail:', localStorage.getItem('userEmail'));
  console.log('user:', localStorage.getItem('user'));
  
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      console.log('Parsed user:', parsed);
    } catch (e) {
      console.log('Failed to parse user object');
    }
  }
  
  console.log('All localStorage keys:', Object.keys(localStorage));
  console.log('================================\n');
};

// Function to stop monitoring
window.stopLoginMonitor = () => {
  monitoringActive = false;
  clearInterval(navigationInterval);
  localStorage.setItem = originalSetItem;
  localStorage.removeItem = originalRemoveItem;
  localStorage.clear = originalClear;
  window.fetch = originalFetch;
  console.log('🛑 Login monitoring stopped');
};

console.log('✅ Login Process Monitor is now active!');
console.log('📋 Available commands:');
console.log('   • checkAuthState() - Check current authentication state');
console.log('   • stopLoginMonitor() - Stop monitoring');
console.log('');
console.log('🎯 Now proceed with your login and watch the console output...');
console.log('');

// Auto-check every 5 seconds for the first minute
let autoCheckCount = 0;
const autoCheckInterval = setInterval(() => {
  autoCheckCount++;
  console.log(`⏰ Auto-check ${autoCheckCount}/12:`);
  
  const userEmail = localStorage.getItem('userEmail');
  const user = localStorage.getItem('user');
  
  if (userEmail && user) {
    console.log('✅ Authentication data found!');
    console.log('   userEmail:', userEmail);
    console.log('   user exists:', !!user);
    clearInterval(autoCheckInterval);
  } else {
    console.log('⏳ Still waiting for authentication data...');
  }
  
  if (autoCheckCount >= 12) {
    console.log('⏰ Auto-checking stopped after 1 minute');
    clearInterval(autoCheckInterval);
  }
}, 5000);
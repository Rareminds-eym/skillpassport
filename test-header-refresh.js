// Test script to verify header refresh functionality
console.log('🧪 Testing header refresh functionality...')

// Simulate profile update event
console.log('📢 Emitting educatorProfileUpdated event...')
window.dispatchEvent(new CustomEvent('educatorProfileUpdated'))

console.log('✅ Event emitted successfully')
console.log('The Header component should now refresh its profile data')
console.log('Check the browser console for "🔄 Header received profile update event, refreshing..." message')
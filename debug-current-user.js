// This script helps debug what user is logged in
// Check localStorage in browser console:

console.log('=== DEBUG CURRENT USER ===\n');

// Check what's in localStorage
const user = localStorage.getItem('user');
const userEmail = localStorage.getItem('userEmail');

console.log('User from localStorage:', user);
console.log('User email from localStorage:', userEmail);

if (user) {
  const parsedUser = JSON.parse(user);
  console.log('\nParsed user object:', parsedUser);
  console.log('User email:', parsedUser.email);
  console.log('User role:', parsedUser.role);
}

// Instructions to run in browser console:
console.log('\n=== TO RUN THIS IN BROWSER ===');
console.log('1. Open your app in browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Paste this code:');
console.log(`
const user = localStorage.getItem('user');
const userEmail = localStorage.getItem('userEmail');
console.log('User:', user);
console.log('Email:', userEmail);
if (user) {
  const parsed = JSON.parse(user);
  console.log('Parsed:', parsed);
  console.log('Email from user:', parsed.email);
}
`);

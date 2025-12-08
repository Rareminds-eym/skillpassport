// Quick script to check current user's school information
// Run this in browser console to debug school_id issues

console.log("=== Current User Debug Info ===");

// Check localStorage
const userEmail = localStorage.getItem('userEmail');
const userDataStr = localStorage.getItem('user');
const userData = userDataStr ? JSON.parse(userDataStr) : null;

console.log("1. LocalStorage Data:");
console.log("   - userEmail:", userEmail);
console.log("   - user object:", userData);
console.log("   - school_id in user:", userData?.school_id);

// Check if we can access Supabase
if (typeof supabase !== 'undefined') {
  console.log("\n2. Checking Supabase tables...");
  
  const email = userEmail || userData?.email;
  
  if (email) {
    // Check school_educators table
    supabase
      .from('school_educators')
      .select('*')
      .eq('email', email)
      .maybeSingle()
      .then(({ data, error }) => {
        console.log("\n   school_educators record:");
        if (error) console.log("   Error:", error);
        else console.log("   Data:", data);
      });
    
    // Check users table
    supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()
      .then(({ data, error }) => {
        console.log("\n   users record:");
        if (error) console.log("   Error:", error);
        else console.log("   Data:", data);
      });
    
    // Check schools table
    supabase
      .from('schools')
      .select('id, name')
      .limit(5)
      .then(({ data, error }) => {
        console.log("\n   Available schools:");
        if (error) console.log("   Error:", error);
        else console.log("   Data:", data);
      });
  } else {
    console.log("   No email found to query");
  }
} else {
  console.log("\n2. Supabase not available in console");
  console.log("   Copy this script and run it in the browser console on your app page");
}

console.log("\n=== End Debug Info ===");

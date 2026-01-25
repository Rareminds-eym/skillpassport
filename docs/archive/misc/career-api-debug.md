# Fix: User Not Found Error

## Root Cause
The worker's `VITE_SUPABASE_URL` doesn't match the Supabase project where the user is authenticated.

## Quick Fix

### Step 1: Get Your Current Supabase URL
Run this in browser console on http://localhost:3000:
```javascript
console.log('Current Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Current Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### Step 2: Update Worker Secrets
```bash
cd d:\Rareminds\GITEX\sp\cloudflare-workers\career-api

# Set EXACT same URL from your frontend
wrangler secret put VITE_SUPABASE_URL
# Paste the URL from console (e.g., https://xxxxx.supabase.co)

wrangler secret put VITE_SUPABASE_ANON_KEY
# Paste the anon key from console

wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Get this from Supabase Dashboard > Settings > API > service_role key

wrangler secret put VITE_OPENROUTER_API_KEY
# Your OpenRouter API key
```

### Step 3: Redeploy
```bash
npm run deploy
```

### Step 4: Clear Browser Cache
```javascript
// Run in console to clear and reload
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Verify the Fix

In browser console:
```javascript
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;

fetch(import.meta.env.VITE_CAREER_API_URL + '/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ message: 'hello' })
}).then(async r => {
  console.log('Status:', r.status);
  if (!r.ok) {
    console.error('Error:', await r.text());
  } else {
    console.log('✅ Success! Worker authenticated');
  }
});
```

## Why This Happens

Frontend uses Supabase project A → Generates token for project A
Worker uses Supabase project B → Can't validate token from project A → "User not found"

**Solution:** Both must use the same Supabase URL and keys.

# How to Get Your Auth Token

## 🎯 Quick Method

### Step 1: Open Your App
Make sure you're **logged in** to your app in the browser.

### Step 2: Open Developer Tools
Press **F12** (or right-click → Inspect)

### Step 3: Go to Console Tab
Click on the **Console** tab at the top

### Step 4: Run This Command
Paste this in the console and press Enter:

```javascript
// Method 1: Get from localStorage (most reliable)
const authData = localStorage.getItem('sb-iqxqxqxqxqxqxqxq-auth-token');
if (authData) {
  const parsed = JSON.parse(authData);
  console.log('Your token:', parsed.access_token);
  copy(parsed.access_token); // Copies to clipboard
} else {
  console.log('No token found. Make sure you are logged in.');
}
```

### Step 5: Copy the Token
The token will be copied to your clipboard automatically. It looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## 🔍 Alternative Methods

### Method 2: Application Tab
1. Press **F12**
2. Go to **Application** tab
3. Expand **Local Storage** in left sidebar
4. Click on your domain (e.g., `http://localhost:5173`)
5. Find key starting with `sb-` and ending with `-auth-token`
6. Click on it
7. Copy the `access_token` value from the JSON

### Method 3: Direct Console Command
```javascript
// Simple one-liner
copy(JSON.parse(localStorage.getItem('sb-iqxqxqxqxqxqxqxq-auth-token')).access_token)
```

### Method 4: From Supabase Client (if app is running)
```javascript
// If you have access to supabase client
const { data: { session } } = await supabase.auth.getSession();
console.log('Token:', session.access_token);
copy(session.access_token);
```

---

## 📋 Using the Token

### In test-worker-simple.html:
1. Open `test-worker-simple.html` in browser
2. Paste token in the input field
3. Click "▶ Run Test"

### In Node.js:
```bash
node test-worker-complete.js YOUR_TOKEN_HERE
```

### In Browser Console:
```javascript
// Paste the entire test-worker-complete.js file
// Then run:
runAllTests('YOUR_TOKEN_HERE');
```

---

## ⚠️ Token Format

Valid token should:
- ✅ Start with `eyJ`
- ✅ Be very long (hundreds of characters)
- ✅ Contain dots (`.`) separating three parts
- ✅ Look like: `eyJxxx.eyJyyy.zzz`

Invalid examples:
- ❌ `undefined`
- ❌ `null`
- ❌ `"token"`
- ❌ Short strings

---

## 🔒 Security Note

**Never share your auth token publicly!** It gives full access to your account.

- ✅ Use it locally for testing
- ✅ Delete it after testing
- ❌ Don't commit it to git
- ❌ Don't share in screenshots
- ❌ Don't post in public channels

---

## 🆘 Troubleshooting

### "No token found"
- Make sure you're logged in
- Try logging out and back in
- Check if you're on the correct domain

### "Token expired"
- Log out and log back in
- Get a fresh token

### "Invalid token format"
- Make sure you copied the entire token
- Check for extra spaces or quotes
- Token should start with `eyJ`

---

## 🎯 Quick Reference

**Fastest way**:
```javascript
copy(JSON.parse(localStorage.getItem('sb-iqxqxqxqxqxqxqxq-auth-token')).access_token)
```

Then paste in `test-worker-simple.html` and click "Run Test"!

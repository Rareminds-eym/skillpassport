# How to Get a Valid OpenRouter API Key

## The Problem
You're seeing this error:
```
❌ Error: User not found
401 Unauthorized from openrouter.ai
```

This means your API key is **invalid, expired, or not configured correctly**.

---

## Solution: Get a New API Key

### Step 1: Go to OpenRouter
Visit: **https://openrouter.ai/keys**

### Step 2: Sign Up or Log In
- If you don't have an account, click "Sign Up"
- If you have an account, log in

### Step 3: Create a New API Key
1. Click "Create Key" or "New Key"
2. Give it a name (e.g., "RareMinds Assessment")
3. Click "Create"
4. **Copy the key immediately** (you won't see it again!)

### Step 4: Add to Your .env File
1. Open your `.env` file in the project root
2. Find or add this line:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-new-key-here
   ```
3. Replace `sk-or-v1-your-new-key-here` with your actual key
4. Save the file

### Step 5: Restart Your Dev Server
1. Stop the server (Ctrl+C)
2. Start it again: `npm run dev`
3. Refresh your browser

---

## Important Notes

### API Key Format
OpenRouter keys should look like:
```
sk-or-v1-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd
```

- ✅ Starts with `sk-or-v1-`
- ✅ Long string of letters and numbers
- ❌ Should NOT be the example key from `.env.example`

### Free Credits
OpenRouter provides **free credits** when you sign up:
- You get $1-5 in free credits
- Enough for hundreds of assessments
- No credit card required initially

### Cost Per Assessment
- Each assessment generation costs ~$0.01-0.05
- 15 questions with Claude 3.5 Sonnet
- Very affordable for testing

---

## Verify Your Setup

### Check 1: API Key Exists
In browser console:
```javascript
console.log('API Key configured:', !!import.meta.env.OPENROUTER_API_KEY);
```

Should show: `true`

### Check 2: API Key Format
In browser console:
```javascript
const key = import.meta.env.OPENROUTER_API_KEY;
console.log('Key starts correctly:', key?.startsWith('sk-or-v1-'));
console.log('Key preview:', key?.substring(0, 20) + '...');
```

Should show:
```
Key starts correctly: true
Key preview: sk-or-v1-1234567890...
```

### Check 3: Test API Call
After adding the key and restarting:
1. Go to My Learning
2. Click Assessment on a course
3. Check console for:
   ```
   🔑 Using API key: sk-or-v1-12345678...abcd
   📡 Calling AI API to generate questions...
   ```

---

## Common Issues

### Issue 1: Using Example Key
**Problem:** You're using the example key from `.env.example`

**Solution:** Get your own key from https://openrouter.ai/keys

### Issue 2: Key Not Loading
**Problem:** Changed `.env` but still getting error

**Solution:** 
1. Restart dev server (Ctrl+C, then `npm run dev`)
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache

### Issue 3: Key Expired
**Problem:** Key worked before but now shows 401

**Solution:**
1. Go to https://openrouter.ai/keys
2. Check if key is still active
3. Create a new key if needed
4. Update `.env` file

### Issue 4: Wrong Environment Variable Name
**Problem:** Used wrong variable name

**Solution:** Make sure it's exactly:
```env
OPENROUTER_API_KEY=your-key-here
```

NOT:
- ❌ `OPENROUTER_API_KEY` (missing VITE_)
- ❌ `VITE_OPENAI_API_KEY` (wrong service)
- ❌ `VITE_API_KEY` (too generic)

---

## Alternative: Use OpenAI Instead

If you prefer to use OpenAI instead of OpenRouter:

### Step 1: Get OpenAI Key
Visit: https://platform.openai.com/api-keys

### Step 2: Update .env
```env
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

### Step 3: Update Service Code
Edit `src/services/assessmentGenerationService.js`:

Change:
```javascript
const apiKey = import.meta.env.OPENROUTER_API_KEY;
const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
```

To:
```javascript
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const apiUrl = 'https://api.openai.com/v1/chat/completions';
```

And change the model:
```javascript
model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo' for cheaper
```

---

## Quick Fix Checklist

- [ ] Go to https://openrouter.ai/keys
- [ ] Create a new API key
- [ ] Copy the key
- [ ] Open `.env` file
- [ ] Add/update `OPENROUTER_API_KEY=your-key`
- [ ] Save `.env` file
- [ ] Stop dev server (Ctrl+C)
- [ ] Start dev server (`npm run dev`)
- [ ] Refresh browser (Ctrl+Shift+R)
- [ ] Try assessment again
- [ ] Check console for success logs

---

## Expected Success Logs

After fixing, you should see:
```
🎓 Assessment Page Loaded: { courseName: "React Development" }
🎯 Generating assessment for: React Development Level: Intermediate
🔑 Using API key: sk-or-v1-12345678...abcd
📡 Calling AI API to generate questions...
📝 Raw AI response: {"course":"React Development"...
✅ Generated assessment: { course: "React Development", ... }
✅ Assessment validated successfully
```

---

## Still Not Working?

If you've followed all steps and still getting errors:

1. **Check OpenRouter Dashboard:**
   - Go to https://openrouter.ai/activity
   - See if requests are showing up
   - Check for error messages

2. **Check Credits:**
   - Go to https://openrouter.ai/credits
   - Make sure you have credits available
   - Add credits if needed

3. **Try a Different Model:**
   Edit the service to use a free model:
   ```javascript
   model: 'google/gemini-2.0-flash-exp:free', // Free model
   ```

4. **Contact Support:**
   - OpenRouter Discord: https://discord.gg/openrouter
   - Or use the contact form on their website

---

## Summary

The "User not found" error means:
- ❌ Invalid API key
- ❌ Expired API key  
- ❌ Wrong API key format
- ❌ API key not configured

**Fix:** Get a new key from https://openrouter.ai/keys and add it to `.env`

**Cost:** Free credits available, ~$0.01-0.05 per assessment

**Time:** 2-3 minutes to set up

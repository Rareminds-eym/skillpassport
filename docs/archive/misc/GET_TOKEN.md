# Get Your Auth Token - Easy Method

## 🎯 Copy and Paste This in Console

Open your app, press **F12**, go to **Console**, and paste this:

```javascript
// Auto-detect Supabase auth token
(function() {
  // Find all localStorage keys that look like Supabase auth tokens
  const keys = Object.keys(localStorage);
  const authKeys = keys.filter(k => k.includes('auth-token') || k.includes('supabase'));
  
  console.log('🔍 Found these keys:', authKeys);
  
  // Try each key
  for (const key of authKeys) {
    try {
      const data = localStorage.getItem(key);
      if (!data) continue;
      
      const parsed = JSON.parse(data);
      
      // Check if it has access_token
      if (parsed.access_token) {
        console.log('✅ Found token in key:', key);
        console.log('📋 Token:', parsed.access_token);
        copy(parsed.access_token);
        console.log('✅ Token copied to clipboard!');
        return parsed.access_token;
      }
      
      // Check nested structure
      if (parsed.user && parsed.session) {
        console.log('✅ Found token in key:', key);
        console.log('📋 Token:', parsed.session.access_token);
        copy(parsed.session.access_token);
        console.log('✅ Token copied to clipboard!');
        return parsed.session.access_token;
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }
  
  console.error('❌ No auth token found. Make sure you are logged in.');
  console.log('💡 Available localStorage keys:', keys);
})();
```

---

## 📋 Alternative: Manual Method

### Step 1: List All Keys
```javascript
Object.keys(localStorage)
```

### Step 2: Find the Supabase Key
Look for a key that contains `supabase` or `auth-token`. It might look like:
- `sb-xxxxx-auth-token`
- `supabase.auth.token`
- Something similar

### Step 3: Get the Token
Replace `KEY_NAME` with the actual key:
```javascript
const data = JSON.parse(localStorage.getItem('KEY_NAME'));
console.log(data.access_token);
copy(data.access_token);
```

---

## 🔍 If Still Not Working

Try this comprehensive search:

```javascript
// Search all localStorage for tokens
Object.keys(localStorage).forEach(key => {
  const value = localStorage.getItem(key);
  if (value && value.includes('eyJ')) {
    console.log('Key:', key);
    console.log('Value preview:', value.substring(0, 100) + '...');
    console.log('---');
  }
});
```

---

## 🎯 Once You Have the Token

1. Copy the token (long string starting with `eyJ`)
2. Open `test-worker-simple.html`
3. Paste token in input field
4. Click "Run Test"

---

## 💡 Quick Test Without Token

If you can't get the token, you can test directly in your app:

1. Go to your assessment results page
2. Open console (F12)
3. Paste this:

```javascript
// Test deterministic results directly
(async function() {
  const { supabase } = await import('/src/shared/api/supabaseClient.js');
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (!token) {
    console.error('Not logged in');
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 20) + '...');
  
  // Test worker
  const testData = {
    gradeLevel: 'after10',
    stream: 'science',
    riasecAnswers: { 'r1': { question: 'Test', answer: 4, type: 'rating' } },
    aptitudeScores: { verbal: { correct: 8, total: 10 } },
    bigFiveAnswers: { 'o1': { question: 'Test', answer: 4 } },
    workValuesAnswers: { 'v1': { question: 'Test', answer: 5 } },
    employabilityAnswers: { selfRating: {}, sjt: [] },
    knowledgeAnswers: {},
    sectionTimings: { totalTime: 1000 }
  };
  
  console.log('🧪 Testing worker...');
  
  const response = await fetch('https://analyze-assessment-api.dark-mode-d021.workers.dev/analyze-assessment?v=' + Date.now(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ assessmentData: testData })
  });
  
  const result = await response.json();
  const keys = Object.keys(result.data || {});
  
  console.log('📊 Response keys:', keys.length);
  console.log('📋 Keys:', keys);
  
  if (result.data._metadata) {
    console.log('✅ NEW VERSION DETECTED!');
    console.log('🎲 Seed:', result.data._metadata.seed);
    console.log('🎲 Model:', result.data._metadata.model);
    console.log('🎲 Deterministic:', result.data._metadata.deterministic);
  } else {
    console.log('⚠️ OLD VERSION - Missing _metadata');
    console.log('⏰ Wait 10-20 more minutes');
  }
})();
```

This will test the worker directly from your app without needing to copy the token!

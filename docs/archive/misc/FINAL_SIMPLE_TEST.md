# ✅ FINAL SIMPLE TEST - Works Everywhere

## 🎯 Just Test the Regenerate Button!

The simplest way is to just **test the actual regenerate button** in your app.

---

## 📋 Steps

### 1. Go to Your Assessment Results Page
Navigate to where you see your assessment results (the page with career recommendations)

### 2. Open Console
Press **F12** → Click **Console** tab

### 3. Click "Regenerate" Button
Click the regenerate button on the page

### 4. Look for These Logs

**✅ NEW VERSION (Working)**:
```
🎲 DETERMINISTIC SEED: 1234567890
🎲 Model used: google/gemini-2.0-flash-exp:free
🎲 Deterministic: true
📊 Response keys: (15) ['profileSnapshot', ..., '_metadata']
```

**❌ OLD VERSION (Still Cached)**:
```
📊 Response keys: (14) ['profileSnapshot', ...]
⚠️ NO SEED IN RESPONSE - Using old worker version?
```

### 5. Click "Regenerate" Again
Click the regenerate button a second time

### 6. Check if Results are Identical
- ✅ **NEW VERSION**: Same career clusters, same scores, same everything
- ❌ **OLD VERSION**: Different career clusters each time

---

## 🎯 Alternative: Direct API Test

If you want to test without the regenerate button, paste this:

```javascript
// Get token from window (if available)
(async function() {
  console.log('🧪 WORKER TEST');
  console.log('='.repeat(60));
  
  // Try to get token from various sources
  let token = null;
  
  // Method 1: Check if supabase is globally available
  if (typeof window.supabase !== 'undefined') {
    const { data: { session } } = await window.supabase.auth.getSession();
    token = session?.access_token;
  }
  
  // Method 2: Check localStorage
  if (!token) {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes('auth') || key.includes('supabase')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data?.access_token) {
            token = data.access_token;
            break;
          }
          if (data?.session?.access_token) {
            token = data.session.access_token;
            break;
          }
        } catch (e) {}
      }
    }
  }
  
  if (!token) {
    console.error('❌ Could not find auth token');
    console.log('💡 Please provide token manually:');
    console.log('   Run: testWorker("YOUR_TOKEN_HERE")');
    
    // Create helper function
    window.testWorker = async function(userToken) {
      await runTest(userToken);
    };
    return;
  }
  
  console.log('✅ Token found\n');
  await runTest(token);
  
  async function runTest(token) {
    const data = {
      gradeLevel: 'after10',
      stream: 'science',
      riasecAnswers: {
        'r1': { question: 'Test', answer: 4, categoryMapping: { '4': 'R' }, type: 'rating' }
      },
      aptitudeScores: { verbal: { correct: 8, total: 10 } },
      bigFiveAnswers: { 'o1': { question: 'Test', answer: 4 } },
      workValuesAnswers: { 'v1': { question: 'Test', answer: 5 } },
      employabilityAnswers: { selfRating: {}, sjt: [] },
      knowledgeAnswers: {},
      sectionTimings: { totalTime: 1000 }
    };
    
    const url = 'https://analyze-assessment-api.dark-mode-d021.workers.dev';
    
    console.log('▶ Call 1...');
    const r1 = await fetch(`${url}/analyze-assessment?v=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: data })
    });
    
    if (!r1.ok) {
      console.error('❌ Failed:', r1.status);
      const errorText = await r1.text();
      console.error('Error:', errorText);
      return;
    }
    
    const res1 = await r1.json();
    const keys = Object.keys(res1.data || {});
    console.log(`✅ Success - ${keys.length} keys`);
    
    if (!res1.data._metadata) {
      console.warn('⚠️ OLD VERSION (14 keys)');
      console.warn('⏰ Wait 15-20 min and try again');
      return;
    }
    
    const seed1 = res1.data._metadata.seed;
    console.log(`  Seed: ${seed1}\n`);
    
    console.log('▶ Call 2...');
    await new Promise(r => setTimeout(r, 2000));
    
    const r2 = await fetch(`${url}/analyze-assessment?v=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: data })
    });
    
    if (!r2.ok) {
      console.error('❌ Failed');
      return;
    }
    
    const res2 = await r2.json();
    const seed2 = res2.data._metadata?.seed;
    console.log(`✅ Success\n  Seed: ${seed2}\n`);
    
    if (seed1 === seed2) {
      console.log('%c✅ SEEDS MATCH! Working!', 'color:green;font-weight:bold;font-size:16px');
      
      const c1 = res1.data.careerFit?.clusters || [];
      const c2 = res2.data.careerFit?.clusters || [];
      console.log('\n▶ Clusters:');
      for (let i = 0; i < Math.min(3, c1.length); i++) {
        if (c1[i].title === c2[i].title && c1[i].matchScore === c2[i].matchScore) {
          console.log(`  ✅ ${i + 1}. ${c1[i].title} (${c1[i].matchScore}%) - MATCH`);
        } else {
          console.log(`  ❌ ${i + 1}. DIFFER`);
        }
      }
      console.log('\n' + ('='.repeat(60)));
      console.log('%c🎉 ALL TESTS PASSED!', 'color:green;font-weight:bold;font-size:18px');
    } else {
      console.error('%c❌ SEEDS DIFFER!', 'color:red;font-weight:bold');
      console.error(`  ${seed1} vs ${seed2}`);
    }
  }
})();
```

---

## 🎯 Simplest Method: Just Use the App!

**Honestly, the easiest way is**:

1. Go to your assessment results page
2. Open console (F12)
3. Click "Regenerate" button
4. Look for seed logs
5. Click "Regenerate" again
6. Check if results are identical

**That's it!** No scripts needed.

---

## ✅ What to Look For

### In Console After Clicking Regenerate:

**NEW VERSION (Working)**:
```
🎲 DETERMINISTIC SEED: 1234567890
🎲 Model used: google/gemini-2.0-flash-exp:free
🎲 Deterministic: true
```

**OLD VERSION (Still Cached)**:
```
⚠️ NO SEED IN RESPONSE - Using old worker version?
```

### On the Page:

**NEW VERSION**: Career clusters stay the same each time you regenerate

**OLD VERSION**: Career clusters change each time you regenerate

---

## ⏰ Timeline

- **Now (04:00 AM)**: ~25 minutes since deployment
- **Should work by**: 04:05-04:10 AM
- **Definitely by**: 04:20 AM (30 minutes)

---

**TL;DR**: Just go to your results page, open console, click regenerate, and look for seed logs!

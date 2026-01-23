# ✅ EASIEST WAY - Test in App Console

## 🎯 No Token Needed!

Just paste this in your app's console and it will test everything automatically.

---

## 📋 Steps

1. **Open your app** (make sure you're logged in)
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Paste this entire script** and press Enter:

```javascript
// Complete Worker Test - No Token Needed!
(async function() {
  console.log('🧪 WORKER DETERMINISTIC TEST');
  console.log('='.repeat(60));
  
  try {
    // Get token from Supabase
    const { supabase } = await import('/src/lib/supabaseClient.js');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      console.error('❌ Not logged in. Please log in first.');
      return;
    }
    
    console.log('✅ Auth token found');
    console.log('');
    
    // Sample test data
    const testData = {
      gradeLevel: 'after10',
      stream: 'science',
      riasecAnswers: {
        'r1': { question: 'Work with tools', answer: 4, categoryMapping: { '4': 'R' }, type: 'rating' },
        'i1': { question: 'Solve problems', answer: 5, categoryMapping: { '5': 'I' }, type: 'rating' },
        'a1': { question: 'Create art', answer: 3, categoryMapping: { '3': 'A' }, type: 'rating' },
        's1': { question: 'Help people', answer: 5, categoryMapping: { '5': 'S' }, type: 'rating' },
        'e1': { question: 'Lead teams', answer: 4, categoryMapping: { '4': 'E' }, type: 'rating' },
        'c1': { question: 'Organize data', answer: 3, categoryMapping: { '3': 'C' }, type: 'rating' }
      },
      aptitudeScores: {
        verbal: { correct: 8, total: 10, percentage: 80 },
        numerical: { correct: 9, total: 10, percentage: 90 },
        abstract: { correct: 7, total: 10, percentage: 70 },
        spatial: { correct: 6, total: 10, percentage: 60 },
        clerical: { correct: 8, total: 10, percentage: 80 }
      },
      bigFiveAnswers: {
        'o1': { question: 'Open to new experiences', answer: 4 },
        'c1': { question: 'Organized and careful', answer: 5 },
        'e1': { question: 'Outgoing and energetic', answer: 3 },
        'a1': { question: 'Friendly and compassionate', answer: 5 },
        'n1': { question: 'Anxious and easily upset', answer: 2 }
      },
      workValuesAnswers: {
        'v1': { question: 'Achievement', answer: 5 },
        'v2': { question: 'Independence', answer: 4 },
        'v3': { question: 'Recognition', answer: 3 }
      },
      employabilityAnswers: {
        selfRating: {
          Communication: [{ question: 'Express ideas clearly', answer: 4, domain: 'Communication' }],
          Teamwork: [{ question: 'Work well with others', answer: 5, domain: 'Teamwork' }],
          ProblemSolving: [{ question: 'Solve complex problems', answer: 4, domain: 'Problem Solving' }],
          Adaptability: [{ question: 'Adapt to change', answer: 5, domain: 'Adaptability' }],
          Leadership: [{ question: 'Lead projects', answer: 3, domain: 'Leadership' }],
          DigitalFluency: [{ question: 'Use technology', answer: 5, domain: 'Digital Fluency' }],
          Professionalism: [{ question: 'Act professionally', answer: 5, domain: 'Professionalism' }],
          CareerReadiness: [{ question: 'Ready for career', answer: 4, domain: 'Career Readiness' }]
        },
        sjt: []
      },
      knowledgeAnswers: {
        'k1': { question: 'Physics', studentAnswer: 'A', correctAnswer: 'A', isCorrect: true },
        'k2': { question: 'Chemistry', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true }
      },
      sectionTimings: {
        riasec: { seconds: 180 },
        aptitude: { seconds: 600 },
        bigfive: { seconds: 120 },
        values: { seconds: 90 },
        employability: { seconds: 240 },
        knowledge: { seconds: 300 },
        totalTime: 1530
      }
    };
    
    const workerUrl = 'https://analyze-assessment-api.dark-mode-d021.workers.dev';
    
    // First call
    console.log('▶ Making first API call...');
    const response1 = await fetch(`${workerUrl}/analyze-assessment?v=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: testData })
    });
    
    if (!response1.ok) {
      console.error('❌ First call failed:', response1.status);
      const errorText = await response1.text();
      console.error('Error:', errorText);
      return;
    }
    
    const result1 = await response1.json();
    const keys1 = Object.keys(result1.data || {});
    
    console.log('✅ First call successful');
    console.log('  → Response has', keys1.length, 'keys');
    
    if (!result1.data._metadata) {
      console.warn('⚠️ Missing _metadata field - OLD WORKER VERSION!');
      console.warn('⚠️ Wait 10-20 more minutes for Cloudflare propagation');
      console.log('');
      console.log('Current response keys:', keys1);
      return;
    }
    
    const seed1 = result1.data._metadata.seed;
    console.log('  → Seed:', seed1);
    console.log('  → Model:', result1.data._metadata.model);
    console.log('  → Deterministic:', result1.data._metadata.deterministic);
    console.log('');
    
    // Second call
    console.log('▶ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('▶ Making second API call with SAME data...');
    const response2 = await fetch(`${workerUrl}/analyze-assessment?v=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: testData })
    });
    
    if (!response2.ok) {
      console.error('❌ Second call failed:', response2.status);
      return;
    }
    
    const result2 = await response2.json();
    const seed2 = result2.data._metadata?.seed;
    
    console.log('✅ Second call successful');
    console.log('  → Seed:', seed2);
    console.log('');
    
    // Compare
    if (seed1 === seed2) {
      console.log('%c✅ SEEDS MATCH! Deterministic results working!', 'color: green; font-weight: bold; font-size: 16px');
      console.log('');
      
      // Compare career clusters
      const clusters1 = result1.data.careerFit?.clusters || [];
      const clusters2 = result2.data.careerFit?.clusters || [];
      
      console.log('▶ Comparing career clusters...');
      let allMatch = true;
      for (let i = 0; i < Math.min(3, clusters1.length); i++) {
        const c1 = clusters1[i];
        const c2 = clusters2[i];
        if (c1.title === c2.title && c1.matchScore === c2.matchScore) {
          console.log(`  ✅ Cluster ${i + 1}: ${c1.title} (${c1.matchScore}%) - MATCH`);
        } else {
          console.log(`  ❌ Cluster ${i + 1}: DIFFER`);
          console.log(`     Call 1: ${c1.title} (${c1.matchScore}%)`);
          console.log(`     Call 2: ${c2.title} (${c2.matchScore}%)`);
          allMatch = false;
        }
      }
      
      console.log('');
      console.log('='.repeat(60));
      if (allMatch) {
        console.log('%c🎉 ALL TESTS PASSED! Worker is working correctly!', 'color: green; font-weight: bold; font-size: 18px');
        console.log('');
        console.log('✅ Next steps:');
        console.log('  1. Go to your assessment results page');
        console.log('  2. Click "Regenerate" button');
        console.log('  3. Results should be IDENTICAL each time');
      } else {
        console.warn('⚠️ Seeds match but clusters differ');
      }
    } else {
      console.error('%c❌ SEEDS DIFFER! Deterministic results NOT working!', 'color: red; font-weight: bold; font-size: 16px');
      console.error('  Seed 1:', seed1);
      console.error('  Seed 2:', seed2);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
})();
```

---

## ✅ What You'll See

### If New Version is Active:
```
🧪 WORKER DETERMINISTIC TEST
============================================================
✅ Auth token found

▶ Making first API call...
✅ First call successful
  → Response has 15 keys
  → Seed: 1234567890
  → Model: google/gemini-2.0-flash-exp:free
  → Deterministic: true

▶ Waiting 2 seconds...
▶ Making second API call with SAME data...
✅ Second call successful
  → Seed: 1234567890

✅ SEEDS MATCH! Deterministic results working!

▶ Comparing career clusters...
  ✅ Cluster 1: Healthcare & Medicine (85%) - MATCH
  ✅ Cluster 2: Creative Arts & Design (75%) - MATCH
  ✅ Cluster 3: Business & Entrepreneurship (65%) - MATCH

============================================================
🎉 ALL TESTS PASSED! Worker is working correctly!
```

### If Old Version Still Cached:
```
🧪 WORKER DETERMINISTIC TEST
============================================================
✅ Auth token found

▶ Making first API call...
✅ First call successful
  → Response has 14 keys
⚠️ Missing _metadata field - OLD WORKER VERSION!
⚠️ Wait 10-20 more minutes for Cloudflare propagation
```

---

## 🎯 This is the EASIEST way!

No need to:
- ❌ Find localStorage keys
- ❌ Copy tokens manually
- ❌ Open separate HTML files
- ❌ Deal with file paths

Just paste and run! ✅

---

**TL;DR**: Open your app → F12 → Console → Paste script → Press Enter

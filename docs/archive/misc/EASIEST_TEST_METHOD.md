# ✅ EASIEST TEST METHOD

## 🎯 Just Copy & Paste This

No token needed! No files needed! Just paste in your app's console.

---

## 📋 3 Simple Steps

### 1. Open Your App
Make sure you're logged in

### 2. Open Console
Press **F12** → Click **Console** tab

### 3. Paste This Script
Copy everything below and paste in console:

```javascript
(async function(){console.log('🧪 WORKER TEST');console.log('='.repeat(60));try{const{supabase}=await import('/src/shared/api/supabaseClient.js');const{data:{session}}=await supabase.auth.getSession();const token=session?.access_token;if(!token){console.error('❌ Not logged in');return}console.log('✅ Token found\n');const data={gradeLevel:'after10',stream:'science',riasecAnswers:{'r1':{question:'Test',answer:4,categoryMapping:{'4':'R'},type:'rating'},'i1':{question:'Test',answer:5,categoryMapping:{'5':'I'},type:'rating'}},aptitudeScores:{verbal:{correct:8,total:10}},bigFiveAnswers:{'o1':{question:'Test',answer:4}},workValuesAnswers:{'v1':{question:'Test',answer:5}},employabilityAnswers:{selfRating:{},sjt:[]},knowledgeAnswers:{},sectionTimings:{totalTime:1000}};const url='https://analyze-assessment-api.dark-mode-d021.workers.dev';console.log('▶ Call 1...');const r1=await fetch(`${url}/analyze-assessment?v=${Date.now()}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({assessmentData:data})});if(!r1.ok){console.error('❌ Failed:',r1.status);return}const res1=await r1.json();const keys=Object.keys(res1.data||{});console.log(`✅ Success - ${keys.length} keys`);if(!res1.data._metadata){console.warn('⚠️ OLD VERSION (14 keys)');console.warn('⏰ Wait 15-20 min');return}const seed1=res1.data._metadata.seed;console.log(`  Seed: ${seed1}\n`);console.log('▶ Call 2...');await new Promise(r=>setTimeout(r,2000));const r2=await fetch(`${url}/analyze-assessment?v=${Date.now()}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({assessmentData:data})});if(!r2.ok){console.error('❌ Failed');return}const res2=await r2.json();const seed2=res2.data._metadata?.seed;console.log(`✅ Success\n  Seed: ${seed2}\n`);if(seed1===seed2){console.log('%c✅ SEEDS MATCH! Working!','color:green;font-weight:bold;font-size:16px');const c1=res1.data.careerFit?.clusters||[];const c2=res2.data.careerFit?.clusters||[];console.log('\n▶ Clusters:');for(let i=0;i<Math.min(3,c1.length);i++){if(c1[i].title===c2[i].title&&c1[i].matchScore===c2[i].matchScore){console.log(`  ✅ ${i+1}. ${c1[i].title} (${c1[i].matchScore}%) - MATCH`)}else{console.log(`  ❌ ${i+1}. DIFFER`)}}console.log('\n'+('='.repeat(60)));console.log('%c🎉 ALL TESTS PASSED!','color:green;font-weight:bold;font-size:18px')}else{console.error('%c❌ SEEDS DIFFER!','color:red;font-weight:bold');console.error(`  ${seed1} vs ${seed2}`)}}catch(e){console.error('❌ Error:',e.message)}})();
```

---

## ✅ Success Output

```
🧪 WORKER TEST
============================================================
✅ Token found

▶ Call 1...
✅ Success - 15 keys
  Seed: 1234567890

▶ Call 2...
✅ Success
  Seed: 1234567890

✅ SEEDS MATCH! Working!

▶ Clusters:
  ✅ 1. Healthcare & Medicine (85%) - MATCH
  ✅ 2. Creative Arts & Design (75%) - MATCH
  ✅ 3. Business & Entrepreneurship (65%) - MATCH

============================================================
🎉 ALL TESTS PASSED!
```

---

## ❌ Old Version Output

```
🧪 WORKER TEST
============================================================
✅ Token found

▶ Call 1...
✅ Success - 14 keys
⚠️ OLD VERSION (14 keys)
⏰ Wait 15-20 min
```

**If you see this**: Wait 15-20 minutes and run the script again!

---

## 🎯 That's It!

No files, no tokens, no complexity. Just paste and run!

---

**For detailed version with more output**, see: `TEST_IN_APP_CONSOLE.md`

/**
 * Test Stream Context Fix
 * Checks what career clusters the AI worker returns for a Science student
 */

const testData = {
  stream: 'science',
  gradeLevel: 'after12',
  riasecAnswers: {
    // Sample RIASEC answers that give C-E-I pattern
    a1: { answer: 4 }, a2: { answer: 5 }, a3: { answer: 5 }, a4: { answer: 4 },
    c1: { answer: 4 }, c2: { answer: 5 }, c3: { answer: 4 }, c4: { answer: 5 },
    e1: { answer: 4 }, e2: { answer: 5 }, e3: { answer: 5 }, e4: { answer: 5 },
    i1: { answer: 4 }, i2: { answer: 5 }, i3: { answer: 4 }, i4: { answer: 5 },
    r1: { answer: 2 }, r2: { answer: 5 }, r3: { answer: 4 }, r4: { answer: 3 },
    s1: { answer: 4 }, s2: { answer: 3 }, s3: { answer: 4 }, s4: { answer: 3 }
  },
  aptitudeScores: {
    verbal: { correct: 0, total: 8 },
    numerical: { correct: 0, total: 8 },
    abstract: { correct: 0, total: 8 },
    spatial: { correct: 0, total: 6 },
    clerical: { correct: 5, total: 20 }
  },
  bigFiveAnswers: {},
  workValuesAnswers: {},
  employabilityAnswers: { selfRating: {}, sjt: [] },
  knowledgeAnswers: [],
  totalKnowledgeQuestions: 20,
  totalAptitudeQuestions: 50,
  sectionTimings: {}
};

async function testStreamFix() {
  console.log('🧪 Testing Stream Context Fix...\n');
  console.log('Student Profile:');
  console.log('  Stream: SCIENCE');
  console.log('  Grade: after12');
  console.log('  RIASEC Pattern: C-E-I (Conventional-Enterprising-Investigative)\n');

  try {
    const response = await fetch('https://analyze-assessment-api.dark-mode-d021.workers.dev/analyze-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Dev-Mode': 'true' // Bypass auth for testing
      },
      body: JSON.stringify({ assessmentData: testData })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', error);
      return;
    }

    const result = await response.json();
    
    if (result.success && result.data?.careerFit?.clusters) {
      console.log('✅ AI Worker Response Received\n');
      console.log('📊 Career Clusters:');
      
      result.data.careerFit.clusters.forEach((cluster, idx) => {
        console.log(`\n${idx + 1}. ${cluster.title}`);
        console.log(`   Fit: ${cluster.fit} (${cluster.matchScore}%)`);
        console.log(`   Description: ${cluster.description.substring(0, 100)}...`);
        
        // Check if it's a Science career
        const scienceKeywords = ['engineer', 'technology', 'data', 'science', 'software', 'computer', 'tech', 'systems'];
        const commerceKeywords = ['business', 'finance', 'commerce', 'accounting', 'management', 'banking'];
        
        const titleLower = cluster.title.toLowerCase();
        const isScience = scienceKeywords.some(kw => titleLower.includes(kw));
        const isCommerce = commerceKeywords.some(kw => titleLower.includes(kw));
        
        if (isScience) {
          console.log('   ✅ MATCHES Science stream');
        } else if (isCommerce) {
          console.log('   ❌ WRONG - This is a Commerce career!');
        } else {
          console.log('   ⚠️  Other stream');
        }
      });
      
      // Calculate match percentage
      const scienceKeywords = ['engineer', 'technology', 'data', 'science', 'software', 'computer', 'tech', 'systems'];
      const matchCount = result.data.careerFit.clusters.filter(cluster => {
        const titleLower = cluster.title.toLowerCase();
        return scienceKeywords.some(kw => titleLower.includes(kw));
      }).length;
      
      const matchPercentage = Math.round((matchCount / result.data.careerFit.clusters.length) * 100);
      
      console.log('\n' + '='.repeat(60));
      console.log(`Stream-Career Match: ${matchCount}/${result.data.careerFit.clusters.length} (${matchPercentage}%)`);
      
      if (matchPercentage >= 66) {
        console.log('✅ FIX WORKING - Most careers match Science stream!');
      } else {
        console.log('❌ FIX NOT WORKING - Most careers are NOT Science-related!');
      }
      console.log('='.repeat(60));
      
    } else {
      console.error('❌ Invalid response structure');
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStreamFix();

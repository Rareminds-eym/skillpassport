/**
 * Test Script: Verify After 10th Stream Recommendation
 * 
 * This script tests if the AI worker is generating streamRecommendation
 * for after10 students by making a direct API call.
 * 
 * Usage: node test-after10-stream-recommendation.js
 */

// Sample after10 assessment data
const testAssessmentData = {
  gradeLevel: 'after10',
  stream: 'science',
  
  // RIASEC answers (1-5 scale, 20 questions per type)
  riasecAnswers: {
    // Investigative (I) - High scores
    'riasec_1': 5, 'riasec_2': 5, 'riasec_3': 4, 'riasec_4': 5,
    'riasec_5': 4, 'riasec_6': 5, 'riasec_7': 4, 'riasec_8': 5,
    'riasec_9': 4, 'riasec_10': 5, 'riasec_11': 4, 'riasec_12': 5,
    'riasec_13': 4, 'riasec_14': 5, 'riasec_15': 4, 'riasec_16': 5,
    'riasec_17': 4, 'riasec_18': 5, 'riasec_19': 4, 'riasec_20': 5,
    
    // Realistic (R) - Medium scores
    'riasec_21': 4, 'riasec_22': 3, 'riasec_23': 4, 'riasec_24': 3,
    'riasec_25': 4, 'riasec_26': 3, 'riasec_27': 4, 'riasec_28': 3,
    'riasec_29': 4, 'riasec_30': 3, 'riasec_31': 4, 'riasec_32': 3,
    'riasec_33': 4, 'riasec_34': 3, 'riasec_35': 4, 'riasec_36': 3,
    'riasec_37': 4, 'riasec_38': 3, 'riasec_39': 4, 'riasec_40': 3,
    
    // Artistic (A) - Low scores
    'riasec_41': 2, 'riasec_42': 2, 'riasec_43': 3, 'riasec_44': 2,
    'riasec_45': 2, 'riasec_46': 3, 'riasec_47': 2, 'riasec_48': 2,
    'riasec_49': 3, 'riasec_50': 2, 'riasec_51': 2, 'riasec_52': 3,
    'riasec_53': 2, 'riasec_54': 2, 'riasec_55': 3, 'riasec_56': 2,
    'riasec_57': 2, 'riasec_58': 3, 'riasec_59': 2, 'riasec_60': 2,
    
    // Social (S) - Low scores
    'riasec_61': 2, 'riasec_62': 3, 'riasec_63': 2, 'riasec_64': 2,
    'riasec_65': 3, 'riasec_66': 2, 'riasec_67': 2, 'riasec_68': 3,
    'riasec_69': 2, 'riasec_70': 2, 'riasec_71': 3, 'riasec_72': 2,
    'riasec_73': 2, 'riasec_74': 3, 'riasec_75': 2, 'riasec_76': 2,
    'riasec_77': 3, 'riasec_78': 2, 'riasec_79': 2, 'riasec_80': 3,
    
    // Enterprising (E) - Low scores
    'riasec_81': 2, 'riasec_82': 2, 'riasec_83': 3, 'riasec_84': 2,
    'riasec_85': 2, 'riasec_86': 3, 'riasec_87': 2, 'riasec_88': 2,
    'riasec_89': 3, 'riasec_90': 2, 'riasec_91': 2, 'riasec_92': 3,
    'riasec_93': 2, 'riasec_94': 2, 'riasec_95': 3, 'riasec_96': 2,
    'riasec_97': 2, 'riasec_98': 3, 'riasec_99': 2, 'riasec_100': 2,
    
    // Conventional (C) - Medium scores
    'riasec_101': 3, 'riasec_102': 4, 'riasec_103': 3, 'riasec_104': 4,
    'riasec_105': 3, 'riasec_106': 4, 'riasec_107': 3, 'riasec_108': 4,
    'riasec_109': 3, 'riasec_110': 4, 'riasec_111': 3, 'riasec_112': 4,
    'riasec_113': 3, 'riasec_114': 4, 'riasec_115': 3, 'riasec_116': 4,
    'riasec_117': 3, 'riasec_118': 4, 'riasec_119': 3, 'riasec_120': 4
  },
  
  // Aptitude scores (pre-calculated)
  aptitudeScores: {
    verbal: { correct: 6, total: 8 },      // 75%
    numerical: { correct: 7, total: 8 },   // 87.5%
    abstract: { correct: 7, total: 8 },    // 87.5%
    spatial: { correct: 4, total: 6 },     // 66.7%
    clerical: { correct: 15, total: 20 }   // 75%
  },
  
  // Big Five answers (sample)
  bigFiveAnswers: {
    'bigfive_1': 4, 'bigfive_2': 3, 'bigfive_3': 4, 'bigfive_4': 5,
    'bigfive_5': 4, 'bigfive_6': 3, 'bigfive_7': 4, 'bigfive_8': 4,
    'bigfive_9': 3, 'bigfive_10': 4
  },
  
  // Work values answers (sample)
  workValuesAnswers: {
    'workvalues_1': 4, 'workvalues_2': 5, 'workvalues_3': 3, 'workvalues_4': 4,
    'workvalues_5': 5, 'workvalues_6': 4, 'workvalues_7': 3, 'workvalues_8': 4
  },
  
  // Employability answers (sample)
  employabilityAnswers: {
    selfRating: {
      communication: 4, teamwork: 4, problemSolving: 5, adaptability: 4,
      leadership: 3, digitalFluency: 5, professionalism: 4, careerReadiness: 4
    },
    sjt: []
  },
  
  // Knowledge answers (sample)
  knowledgeAnswers: {
    'knowledge_1': 'A', 'knowledge_2': 'B', 'knowledge_3': 'C',
    'knowledge_4': 'A', 'knowledge_5': 'D'
  },
  
  // Section timings (sample)
  sectionTimings: {
    riasec: 600, aptitude: 900, bigFive: 300, workValues: 200,
    employability: 400, knowledge: 300
  }
};

async function testStreamRecommendation() {
  console.log('🧪 Testing After 10th Stream Recommendation...\n');
  
  // API endpoint
  const API_URL = 'https://analyze-assessment-api.dark-mode-d021.workers.dev/analyze-assessment';
  
  console.log('📡 Calling AI Worker API...');
  console.log('   URL:', API_URL);
  console.log('   Grade Level:', testAssessmentData.gradeLevel);
  console.log('   Stream:', testAssessmentData.stream);
  console.log('');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Dev-Mode': 'true'  // Bypass authentication for testing
      },
      body: JSON.stringify({
        assessmentData: testAssessmentData
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ API Response Received\n');
    
    // Check if response has data
    if (!result.success || !result.data) {
      console.error('❌ Response missing data:', result);
      return;
    }
    
    const data = result.data;
    
    // Check RIASEC scores
    console.log('📊 RIASEC Scores:');
    if (data.riasec?.scores) {
      console.log('   R:', data.riasec.scores.R);
      console.log('   I:', data.riasec.scores.I);
      console.log('   A:', data.riasec.scores.A);
      console.log('   S:', data.riasec.scores.S);
      console.log('   E:', data.riasec.scores.E);
      console.log('   C:', data.riasec.scores.C);
      console.log('   Code:', data.riasec.code);
      
      // Check if all zeros
      const allZeros = Object.values(data.riasec.scores).every(score => score === 0);
      if (allZeros) {
        console.log('   ❌ WARNING: All RIASEC scores are zero!');
      } else {
        console.log('   ✅ RIASEC scores are differentiated');
      }
    } else {
      console.log('   ❌ RIASEC scores missing!');
    }
    console.log('');
    
    // Check streamRecommendation
    console.log('🎯 Stream Recommendation:');
    if (data.streamRecommendation) {
      console.log('   ✅ streamRecommendation field exists');
      console.log('   isAfter10:', data.streamRecommendation.isAfter10);
      console.log('   recommendedStream:', data.streamRecommendation.recommendedStream);
      console.log('   streamFit:', data.streamRecommendation.streamFit);
      console.log('   confidenceScore:', data.streamRecommendation.confidenceScore);
      console.log('   alternativeStream:', data.streamRecommendation.alternativeStream);
      
      // Check if valid
      if (!data.streamRecommendation.recommendedStream || 
          data.streamRecommendation.recommendedStream === 'N/A') {
        console.log('   ❌ WARNING: recommendedStream is missing or N/A!');
      } else {
        console.log('   ✅ Valid stream recommendation');
      }
    } else {
      console.log('   ❌ streamRecommendation field is MISSING!');
    }
    console.log('');
    
    // Check career clusters
    console.log('💼 Career Clusters:');
    if (data.careerFit?.clusters) {
      console.log('   Count:', data.careerFit.clusters.length);
      data.careerFit.clusters.forEach((cluster, i) => {
        console.log(`   ${i + 1}. ${cluster.title} (${cluster.fit} fit, ${cluster.matchScore}% match)`);
      });
      
      // Check alignment with stream
      if (data.streamRecommendation?.recommendedStream) {
        console.log('');
        console.log('   Checking alignment with recommended stream:', data.streamRecommendation.recommendedStream);
        // This would require mapping logic to verify
      }
    } else {
      console.log('   ❌ Career clusters missing!');
    }
    console.log('');
    
    // Summary
    console.log('📋 Summary:');
    const hasRiasec = data.riasec?.scores && Object.values(data.riasec.scores).some(s => s > 0);
    const hasStream = data.streamRecommendation?.recommendedStream && 
                      data.streamRecommendation.recommendedStream !== 'N/A';
    const hasClusters = data.careerFit?.clusters?.length === 3;
    
    console.log('   RIASEC Scores:', hasRiasec ? '✅' : '❌');
    console.log('   Stream Recommendation:', hasStream ? '✅' : '❌');
    console.log('   Career Clusters (3):', hasClusters ? '✅' : '❌');
    console.log('');
    
    if (hasRiasec && hasStream && hasClusters) {
      console.log('✅ ALL CHECKS PASSED! After 10th assessment is working correctly.');
    } else {
      console.log('❌ SOME CHECKS FAILED! Review the issues above.');
    }
    
    // Save full response for inspection
    const fs = require('fs');
    fs.writeFileSync('test-after10-response.json', JSON.stringify(result, null, 2));
    console.log('');
    console.log('📄 Full response saved to: test-after10-response.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testStreamRecommendation();

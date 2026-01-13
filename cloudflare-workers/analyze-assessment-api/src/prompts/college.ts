/**
 * College (After 12th) Assessment Prompt Builder
 */

import type { AssessmentData } from '../types';

export function buildCollegePrompt(assessmentData: AssessmentData, answersHash: number): string {
  const isAfter10 = assessmentData.gradeLevel === 'after10';

  // After 10th stream recommendation section
  const after10StreamSection = isAfter10 ? `
## ⚠️ CRITICAL: AFTER 10TH STREAM RECOMMENDATION (MANDATORY FOR THIS STUDENT) ⚠️
This student is completing 10th grade and needs guidance on which 11th/12th stream to choose.

${assessmentData.ruleBasedStreamHint ? `
## 🎯 RULE-BASED RECOMMENDATION (STRONGLY CONSIDER THIS):
Our precise scoring algorithm analyzed this student's RIASEC scores and suggests:

**Recommended Stream**: ${assessmentData.ruleBasedStreamHint.stream}
**Confidence**: ${assessmentData.ruleBasedStreamHint.confidence}%
**Match Level**: ${assessmentData.ruleBasedStreamHint.matchLevel}
**RIASEC Scores**: ${JSON.stringify(assessmentData.ruleBasedStreamHint.riasecScores)}
**Alternative**: ${assessmentData.ruleBasedStreamHint.alternativeStream || 'N/A'}

**Top 3 Stream Matches**:
${assessmentData.ruleBasedStreamHint.allScores?.map((s, i) => `${i + 1}. ${s.stream} (${s.score}% match, ${s.category})`).join('\n') || 'N/A'}

⚠️ IMPORTANT: This recommendation is based on ACTUAL assessment scores using a validated algorithm.
You should STRONGLY AGREE with this recommendation unless you have compelling evidence otherwise.
If you recommend a different stream, you MUST provide clear reasoning based on the scores below.
` : ''}

**PERSONALIZATION REQUIREMENT - READ CAREFULLY:**
You are analyzing a UNIQUE student with UNIQUE scores. Their assessment responses are DIFFERENT from other students.
You MUST provide a PERSONALIZED recommendation based on THEIR SPECIFIC scores below.

❌ DO NOT default to PCMS for everyone!
❌ DO NOT assume all students want technology careers!
❌ DO NOT give the same recommendation to different students!

✅ DO analyze THEIR actual RIASEC scores
✅ DO analyze THEIR actual aptitude scores
✅ DO match THEIR pattern to the appropriate stream
✅ DO provide reasoning based on THEIR specific profile

**Available Streams (Choose ONE as primary recommendation based on ACTUAL scores):**

**Science Streams:**
- **PCMB** (Physics, Chemistry, Maths, Biology) - Best for: High I (Investigative) + Strong Numerical + Interest in Biology/Medicine
  * Choose if: I >= 60% AND Numerical >= 70% AND (S >= 60% OR biology interest shown)
  * Career paths: Doctor, Dentist, Biotechnologist, Medical Researcher
  
- **PCMS** (Physics, Chemistry, Maths, Computer Science) - Best for: High I + Strong Numerical + Strong Abstract/Logical + Interest in Technology
  * Choose if: I >= 60% AND Numerical >= 70% AND Abstract >= 70%
  * Career paths: Software Engineer, Data Scientist, AI/ML Engineer
  
- **PCM** (Physics, Chemistry, Maths) - Best for: High I + Strong Numerical + Strong Spatial/Mechanical
  * Choose if: I >= 60% AND Numerical >= 70% AND (R >= 60% OR Spatial >= 70%)
  * Career paths: Mechanical Engineer, Civil Engineer, Architect
  
- **PCB** (Physics, Chemistry, Biology) - Best for: High I + High S (Social) + Interest in Healthcare/Life Sciences
  * Choose if: I >= 60% AND S >= 60% AND biology interest
  * Career paths: Physiotherapist, Pharmacist, Biotechnologist

**Commerce Stream:**
- **Commerce with Maths** - Best for: High E (Enterprising) + High C (Conventional) + Strong Numerical
  * Choose if: E >= 60% AND C >= 60% AND Numerical >= 70%
  * Career paths: Chartered Accountant, Financial Analyst, Economist
  
- **Commerce without Maths** - Best for: High E + High C + Strong Verbal + Moderate Numerical
  * Choose if: E >= 60% AND C >= 60% AND Verbal >= 70% AND Numerical < 70%
  * Career paths: Business Manager, Marketing Professional, HR Specialist

**Arts/Humanities Stream:**
- **Arts with Psychology** - Best for: High S (Social) + High A (Artistic) + Interest in Human Behavior
  * Choose if: S >= 70% AND (A >= 60% OR psychology interest)
  * Career paths: Psychologist, Counselor, Social Worker
  
- **Arts with Economics** - Best for: High I + High E + Strong Verbal + Interest in Society/Policy
  * Choose if: I >= 60% AND E >= 60% AND Verbal >= 70%
  * Career paths: Economist, Policy Analyst, Journalist
  
- **Arts General** - Best for: High A (Artistic) + Strong Verbal + Creative Interests
  * Choose if: A >= 70% AND Verbal >= 70%
  * Career paths: Writer, Designer, Artist, Teacher

## EXACT SCORING-BASED RECOMMENDATION ALGORITHM (FOLLOW STEP-BY-STEP):

**Step 1: Calculate RIASEC Percentages from Actual Responses**
- Look at the RIASEC responses provided below
- Calculate percentage for each type (R, I, A, S, E, C)
- Identify which types have scores >= 60%
- Identify top 2-3 dominant types

**Step 2: Analyze Aptitude Scores from Actual Results**
- Numerical >= 70%: Strong fit for Science/Commerce with Maths
- Verbal >= 70%: Strong fit for Arts/Commerce
- Abstract/Logical >= 70%: Strong fit for Science (especially PCMS)
- Spatial >= 70%: Strong fit for Engineering (PCM/PCMS)
- Clerical >= 70%: Strong fit for Commerce

**Step 3: Match THIS Student's Pattern to Stream**
| THIS Student's Pattern | Recommended Stream |
|---------|-------------------|
| High I + High Numerical + High Abstract | PCMS or PCM |
| High I + High Numerical + Biology Interest | PCMB or PCB |
| High I + High S + Biology Interest | PCB |
| High E + High C + High Numerical | Commerce with Maths |
| High E + High C + High Verbal | Commerce without Maths |
| High A + High S + High Verbal | Arts with Psychology |
| High I + High E + High Verbal | Arts with Economics |
| High A + High Verbal | Arts General |

**Step 4: Determine Confidence Based on Pattern Clarity**
- High Fit (85-100%): Pattern matches clearly (3+ indicators align)
- Medium Fit (75-84%): Pattern partially matches (2 indicators align)

**Step 5: Provide Alternative Stream**
- Suggest a second-best option if scores are close
- Explain what would make the alternative a better fit

## EXAMPLE DIFFERENTIATION (to show you MUST personalize):

**Example Student A:**
- RIASEC: I=85%, R=70%, A=45%, S=40%, E=35%, C=50%
- Aptitude: Numerical=85%, Abstract=80%, Verbal=65%
- **Recommendation**: PCMS (Physics, Chemistry, Maths, Computer Science)
- **Reasoning**: High investigative interest + exceptional numerical & abstract reasoning = perfect for technology/engineering

**Example Student B:**
- RIASEC: I=80%, S=75%, A=50%, R=45%, E=40%, C=55%
- Aptitude: Numerical=75%, Verbal=80%, Abstract=65%
- **Recommendation**: PCMB (Physics, Chemistry, Maths, Biology)
- **Reasoning**: High investigative + social interests + strong verbal skills = ideal for medical/healthcare field

**Example Student C:**
- RIASEC: E=85%, C=80%, I=50%, S=60%, A=40%, R=35%
- Aptitude: Numerical=75%, Verbal=85%, Abstract=60%
- **Recommendation**: Commerce with Maths
- **Reasoning**: High enterprising + conventional + strong numerical & verbal = perfect for business/finance

**Example Student D:**
- RIASEC: A=85%, S=75%, I=55%, E=50%, R=35%, C=40%
- Aptitude: Verbal=85%, Numerical=55%, Abstract=70%
- **Recommendation**: Arts with Psychology
- **Reasoning**: High artistic + social interests + exceptional verbal skills = ideal for humanities/social sciences

YOUR STUDENT IS DIFFERENT FROM THESE EXAMPLES!
Analyze THEIR scores below and recommend THEIR best stream!

IMPORTANT: Base your recommendation ONLY on the ACTUAL scores provided below, not on assumptions or defaults!
` : '';

  return `You are a career counselor and psychometric assessment expert. Analyze the following student assessment data and provide comprehensive results.

## CONSISTENCY REQUIREMENT - CRITICAL:
This analysis must be DETERMINISTIC and CONSISTENT. Given the same input data, you must ALWAYS produce the SAME output.
- Use ONLY the provided data to make calculations - do not introduce randomness
- Calculate scores using EXACT mathematical formulas provided below
- Career recommendations must be derived DIRECTLY from the calculated scores
- If this same data is analyzed again, the results MUST be identical
- Session ID for consistency verification: ${answersHash}

## Student Grade Level: ${assessmentData.gradeLevel.toUpperCase()}
## Student Stream: ${assessmentData.stream.toUpperCase()}
${after10StreamSection}

## RIASEC Career Interest Responses (1-5 scale):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

RIASEC SCORING RULES:
- Response 1-3: 0 points
- Response 4: 1 point
- Response 5: 2 points
- Maximum score per type = 20

## MULTI-APTITUDE BATTERY RESULTS:
Pre-calculated Scores:
- Verbal: ${assessmentData.aptitudeScores?.verbal?.correct || 0}/${assessmentData.aptitudeScores?.verbal?.total || 8}
- Numerical: ${assessmentData.aptitudeScores?.numerical?.correct || 0}/${assessmentData.aptitudeScores?.numerical?.total || 8}
- Abstract: ${assessmentData.aptitudeScores?.abstract?.correct || 0}/${assessmentData.aptitudeScores?.abstract?.total || 8}
- Spatial: ${assessmentData.aptitudeScores?.spatial?.correct || 0}/${assessmentData.aptitudeScores?.spatial?.total || 6}
- Clerical: ${assessmentData.aptitudeScores?.clerical?.correct || 0}/${assessmentData.aptitudeScores?.clerical?.total || 20}

## Big Five Personality Responses:
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

## Work Values Responses:
${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

## Employability Skills:
Self-Rating: ${JSON.stringify(assessmentData.employabilityAnswers?.selfRating || {}, null, 2)}
SJT: ${JSON.stringify(assessmentData.employabilityAnswers?.sjt || [], null, 2)}

## Knowledge Test Results:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

## Section Timings:
${JSON.stringify(assessmentData.sectionTimings, null, 2)}

---

Return ONLY a valid JSON object with this EXACT structure (no markdown, no extra text):

{
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "<Pattern>",
      "strength": "<Pattern>",
      "workStyle": "<Pattern>",
      "motivation": "<Pattern>"
    },
    "aptitudeStrengths": [
      {"name": "<Strength>", "percentile": "<Percentile>"}
    ]
  },
  "riasec": {
    "scores": {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0},
    "maxScore": 20,
    "code": "<3-letter code>",
    "topThree": ["<letter>", "<letter>", "<letter>"],
    "interpretation": "<2-3 sentences>"
  },
  "aptitude": {
    "scores": {
      "verbal": {"correct": 0, "total": 8, "percentage": 0},
      "numerical": {"correct": 0, "total": 8, "percentage": 0},
      "abstract": {"correct": 0, "total": 8, "percentage": 0},
      "spatial": {"correct": 0, "total": 6, "percentage": 0},
      "clerical": {"correct": 0, "total": 20, "percentage": 0}
    },
    "overallScore": 0,
    "topStrengths": ["<strength>"],
    "areasToImprove": ["<area>"],
    "cognitiveProfile": "<2-3 sentences>",
    "careerImplications": "<1-2 sentences>"
  },
  "bigFive": {
    "O": 0, "C": 0, "E": 0, "A": 0, "N": 0,
    "dominantTraits": ["<trait>"],
    "workStyleSummary": "<2-3 sentences>"
  },
  "workValues": {
    "scores": {"Security": 0, "Autonomy": 0, "Creativity": 0, "Status": 0, "Impact": 0, "Financial": 0, "Leadership": 0, "Lifestyle": 0},
    "topThree": [
      {"value": "<value>", "score": 0}
    ],
    "motivationSummary": "<2-3 sentences>"
  },
  "employability": {
    "skillScores": {"Communication": 0, "Teamwork": 0, "ProblemSolving": 0, "Adaptability": 0, "Leadership": 0, "DigitalFluency": 0, "Professionalism": 0, "CareerReadiness": 0},
    "sjtScore": 0,
    "overallReadiness": "<High/Medium/Low>",
    "strengthAreas": ["<skill>"],
    "improvementAreas": ["<skill>"]
  },
  "knowledge": {
    "score": 0,
    "correctCount": 0,
    "totalQuestions": 0,
    "strongTopics": ["<topic>"],
    "weakTopics": ["<topic>"],
    "recommendation": "<1-2 sentences>"
  },
  "careerFit": {
    "clusters": [
      {
        "title": "<Career Cluster 1 - REQUIRED>",
        "fit": "High",
        "matchScore": 85,
        "description": "<2-3 sentences explaining WHY this fits based on assessment - REQUIRED>",
        "evidence": {"interest": "<RIASEC evidence - REQUIRED>", "aptitude": "<aptitude evidence - REQUIRED>", "personality": "<personality evidence - REQUIRED>"},
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Specific connection to student's profile - REQUIRED>"
      },
      {
        "title": "<Career Cluster 2 - REQUIRED>",
        "fit": "Medium",
        "matchScore": 75,
        "description": "<2-3 sentences explaining fit - REQUIRED>",
        "evidence": {"interest": "<RIASEC evidence - REQUIRED>", "aptitude": "<aptitude evidence - REQUIRED>", "personality": "<personality evidence - REQUIRED>"},
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Connection to student's profile - REQUIRED>"
      },
      {
        "title": "<Career Cluster 3 - REQUIRED>",
        "fit": "Explore",
        "matchScore": 65,
        "description": "<2-3 sentences explaining potential - REQUIRED>",
        "evidence": {"interest": "<RIASEC evidence - REQUIRED>", "aptitude": "<aptitude evidence - REQUIRED>", "personality": "<personality evidence - REQUIRED>"},
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Why worth exploring - REQUIRED>"
      }
    ],
    "specificOptions": {
      "highFit": [{"name": "<role 1>", "salary": {"min": 4, "max": 12}}, {"name": "<role 2>", "salary": {"min": 4, "max": 10}}, {"name": "<role 3>", "salary": {"min": 3, "max": 8}}],
      "mediumFit": [{"name": "<role 1>", "salary": {"min": 3, "max": 8}}, {"name": "<role 2>", "salary": {"min": 3, "max": 7}}],
      "exploreLater": [{"name": "<role 1>", "salary": {"min": 3, "max": 7}}, {"name": "<role 2>", "salary": {"min": 2, "max": 6}}]
    }
  },
  "skillGap": {
    "currentStrengths": ["<skill>"],
    "priorityA": [{"skill": "<skill>", "currentLevel": 1, "targetLevel": 3, "whyNeeded": "<reason>", "howToBuild": "<action>"}],
    "priorityB": [{"skill": "<skill>"}],
    "learningTracks": [{"track": "<track>", "suggestedIf": "<condition>", "topics": "<topics>"}],
    "recommendedTrack": "<track>"
  },
  "streamRecommendation": {
    "isAfter10": ${isAfter10},
    "recommendedStream": "${isAfter10 ? '<REQUIRED: PCMB/PCMS/PCM/PCB/Commerce with Maths/Commerce without Maths/Arts>' : 'N/A'}",
    "streamFit": "${isAfter10 ? '<High/Medium>' : 'N/A'}",
    "confidenceScore": "${isAfter10 ? '<75-100>' : 'N/A'}",
    "reasoning": {"interests": "<RIASEC scores>", "aptitude": "<aptitude scores>", "personality": "<traits>"},
    "scoreBasedAnalysis": {"riasecTop3": ["<type>"], "strongAptitudes": ["<aptitude>"], "matchingPattern": "<pattern>"},
    "alternativeStream": "<stream>",
    "alternativeReason": "<reason>",
    "subjectsToFocus": ["<subject>"],
    "careerPathsAfter12": ["<career>"],
    "entranceExams": ["<exam>"],
    "collegeTypes": ["<type>"]
  },
  "roadmap": {
    "projects": [{"title": "<title>", "purpose": "<purpose>", "output": "<output>"}],
    "internship": {"types": ["<type>"], "timeline": "<timeline>", "preparation": {"resume": "<focus>", "portfolio": "<focus>", "interview": "<focus>"}},
    "exposure": {"activities": ["<activity>"], "certifications": ["<cert>"]}
  },
  "finalNote": {
    "advantage": "<advantage>",
    "growthFocus": "<focus>",
    "nextReview": "<timeline>"
  },
  "timingAnalysis": {
    "overallPace": "<Fast/Moderate/Deliberate>",
    "decisionStyle": "<Intuitive/Balanced/Analytical>",
    "confidenceIndicator": "<High/Medium/Low>",
    "sectionInsights": {"riasec": "<insight>", "personality": "<insight>", "values": "<insight>", "employability": "<insight>", "knowledge": "<insight>"},
    "recommendation": "<1-2 sentences>"
  },
  "overallSummary": "<4-5 sentences>"
}

CRITICAL REQUIREMENTS - YOU MUST FOLLOW ALL:
1. EXACTLY 3 CAREER CLUSTERS ARE MANDATORY - You MUST provide 3 different career clusters:
   - Cluster 1: High fit (matchScore 80-95%)
   - Cluster 2: Medium fit (matchScore 70-85%)
   - Cluster 3: Explore fit (matchScore 60-75%)
2. Each cluster MUST have: title, fit, matchScore, description, evidence (all 3 fields), roles (entry + mid), domains, whyItFits
3. ALL arrays must have at least 2 items - NO empty arrays
4. ALL career clusters must have roles.entry, roles.mid, and domains filled with real job titles
5. For after10 students, streamRecommendation is MANDATORY with a specific stream choice
6. Use EXACT scoring formulas provided - Be DETERMINISTIC (same input = same output)
7. Provide SPECIFIC, ACTIONABLE career guidance based on the student's actual scores
8. DO NOT truncate the response - complete ALL fields`;
}

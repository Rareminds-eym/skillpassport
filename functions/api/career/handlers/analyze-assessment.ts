/**
 * Analyze Assessment Handler - Comprehensive career assessment analysis
 * 
 * Features:
 * - RIASEC career interest scoring
 * - Multi-aptitude battery analysis
 * - Big Five personality assessment
 * - Work values analysis
 * - Employability skills diagnostic
 * - Stream recommendation for after-10th students
 * - Career cluster matching with salary ranges
 * - Skill gap analysis and learning tracks
 * 
 * Source: cloudflare-workers/career-api/src/index.ts (handleAnalyzeAssessment, buildAnalysisPrompt)
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../utils/auth';
import { checkRateLimit } from '../utils/rate-limit';
import { getOpenRouterKey } from '../[[path]]';
import { API_CONFIG } from '../../shared/ai-config';

/**
 * Build the comprehensive analysis prompt for Claude AI
 * This is a massive prompt that guides the AI through detailed career assessment analysis
 */
function buildAnalysisPrompt(assessmentData: any): string {
  // Create a hash of the answers for consistency tracking
  const answersHash = JSON.stringify(assessmentData).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const gradeLevel = assessmentData.gradeLevel || 'after12';
  const isAfter10 = gradeLevel === 'after10';
  
  // Extract student context for enhanced recommendations
  const studentContext = assessmentData.studentContext || {};
  const hasStudentContext = studentContext.rawGrade || studentContext.programName;
  
  // Build student context section for AI prompt
  const studentContextSection = hasStudentContext ? `
## STUDENT ACADEMIC CONTEXT (USE THIS FOR PERSONALIZED RECOMMENDATIONS):
${studentContext.rawGrade ? `- Current Grade/Year: ${studentContext.rawGrade}` : ''}
${studentContext.programName ? `- Program/Course: ${studentContext.programName}` : ''}
${studentContext.degreeLevel ? `- Degree Level: ${studentContext.degreeLevel}` : ''}

**IMPORTANT INSTRUCTIONS FOR USING STUDENT CONTEXT:**
${studentContext.degreeLevel === 'postgraduate' ? `
- This student is pursuing POSTGRADUATE education (Master's level)
- DO NOT recommend undergraduate (UG) courses or basic entry-level roles
- Focus on ADVANCED roles, specializations, and career progression
- Recommend roles that require Master's degree or equivalent experience
- Salary ranges should reflect postgraduate qualifications (higher range)
- Skill gaps should focus on advanced/specialized skills, not basics
` : studentContext.degreeLevel === 'undergraduate' ? `
- This student is pursuing UNDERGRADUATE education (Bachelor's level)
- Recommend entry-level to mid-level roles appropriate for fresh graduates
- Focus on foundational skills and early career development
- Include internship and training opportunities
- Salary ranges should reflect entry-level positions
` : studentContext.degreeLevel === 'diploma' ? `
- This student is pursuing DIPLOMA education
- Recommend technical/vocational roles appropriate for diploma holders
- Focus on practical skills and hands-on experience
- Include apprenticeship and skill certification opportunities
` : ''}
${studentContext.programName ? `
- Student's field of study: ${studentContext.programName}
- Prioritize career recommendations ALIGNED with their program
- If program is technical (CS/IT/Engineering), focus on tech roles
- If program is business (BBA/MBA), focus on management/business roles
- If program is science (MSc/BSc), focus on research/analytical roles
` : ''}

**FILTERING RULES:**
- Filter out recommendations that don't match the student's education level
- Ensure career clusters are relevant to their field of study
- Adjust skill gap priorities based on their current program
- Tailor learning tracks to complement their academic curriculum
` : '';

  // After 10th specific stream recommendation section
  const after10StreamSection = isAfter10 ? `
## AFTER 10TH STREAM RECOMMENDATION (MANDATORY FOR THIS STUDENT):
This student is completing 10th grade and needs guidance on which 11th/12th stream to choose.
Based on their ACTUAL assessment scores below, you MUST recommend the best stream.

**Available Streams (Choose ONE as primary recommendation):**

**Science Streams:**
- PCMB (Physics, Chemistry, Maths, Biology) - Best for: High I (Investigative) + Strong Numerical + Interest in Biology/Medicine
- PCMS (Physics, Chemistry, Maths, Computer Science) - Best for: High I + Strong Numerical + Strong Abstract/Logical + Interest in Technology
- PCM (Physics, Chemistry, Maths) - Best for: High I + Strong Numerical + Strong Spatial/Mechanical
- PCB (Physics, Chemistry, Biology) - Best for: High I + High S (Social) + Interest in Healthcare/Life Sciences

**Commerce Stream:**
- Commerce with Maths - Best for: High E (Enterprising) + High C (Conventional) + Strong Numerical
- Commerce without Maths - Best for: High E + High C + Strong Verbal + Moderate Numerical

**Arts/Humanities Stream:**
- Arts with Psychology - Best for: High S (Social) + High A (Artistic) + Interest in Human Behavior
- Arts with Economics - Best for: High I + High E + Strong Verbal + Interest in Society/Policy
- Arts General - Best for: High A (Artistic) + Strong Verbal + Creative Interests

## SCORING-BASED RECOMMENDATION ALGORITHM (FOLLOW EXACTLY):

**Step 1: Analyze RIASEC Scores**
- Calculate which RIASEC types have scores >= 60%
- Identify top 2-3 dominant types

**Step 2: Analyze Aptitude Scores**
- Numerical >= 70%: Strong fit for Science/Commerce with Maths
- Verbal >= 70%: Strong fit for Arts/Commerce
- Abstract/Logical >= 70%: Strong fit for Science (especially PCMS)
- Spatial >= 70%: Strong fit for Engineering (PCM/PCMS)
- Clerical >= 70%: Strong fit for Commerce

**Step 3: Match Pattern to Stream**
| Pattern | Recommended Stream |
|---------|-------------------|
| High I + High Numerical + High Abstract | PCMS or PCM |
| High I + High Numerical + Biology Interest | PCMB or PCB |
| High I + High S + Biology Interest | PCB |
| High E + High C + High Numerical | Commerce with Maths |
| High E + High C + High Verbal | Commerce without Maths |
| High A + High S + High Verbal | Arts |
| High I + High E + High Verbal | Arts with Economics |

**Step 4: Determine Confidence**
- High Fit: Pattern matches clearly (2+ indicators align)
- Medium Fit: Pattern partially matches (1-2 indicators align)

IMPORTANT: Base your recommendation on the ACTUAL scores provided, not assumptions!
` : '';

  return `You are a career counselor and psychometric assessment expert. Analyze the following student assessment data and provide comprehensive results.

## CONSISTENCY REQUIREMENT - CRITICAL:
This analysis must be DETERMINISTIC and CONSISTENT. Given the same input data, you must ALWAYS produce the SAME output.
- Use ONLY the provided data to make calculations - do not introduce randomness
- Calculate scores using EXACT mathematical formulas provided below
- Career recommendations must be derived DIRECTLY from the calculated scores
- If this same data is analyzed again, the results MUST be identical
- Session ID for consistency verification: ${answersHash}

## Student Grade Level: ${gradeLevel.toUpperCase()}
## Student Stream: ${assessmentData.stream.toUpperCase()}
${studentContextSection}
${after10StreamSection}

## RIASEC Career Interest Responses (1-5 scale: 1=Strongly Dislike, 2=Dislike, 3=Neutral, 4=Like, 5=Strongly Like):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

RIASEC SCORING RULES:
- Response 1 (Strongly Dislike): 0 points - DO NOT count
- Response 2 (Dislike): 0 points - DO NOT count  
- Response 3 (Neutral): 0 points
- Response 4 (Like): 1 point
- Response 5 (Strongly Like): 2 points
- Maximum score per type = 20 (10 questions × 2 points max)

## MULTI-APTITUDE BATTERY RESULTS (DAT/GATB Style):
Pre-calculated Scores:
- Verbal Reasoning: ${assessmentData.aptitudeScores?.verbal?.correct || 0}/${assessmentData.aptitudeScores?.verbal?.total || 8} correct
- Numerical Ability: ${assessmentData.aptitudeScores?.numerical?.correct || 0}/${assessmentData.aptitudeScores?.numerical?.total || 8} correct
- Abstract/Logical Reasoning: ${assessmentData.aptitudeScores?.abstract?.correct || 0}/${assessmentData.aptitudeScores?.abstract?.total || 8} correct
- Spatial/Mechanical Reasoning: ${assessmentData.aptitudeScores?.spatial?.correct || 0}/${assessmentData.aptitudeScores?.spatial?.total || 6} correct
- Clerical Speed & Accuracy: ${assessmentData.aptitudeScores?.clerical?.correct || 0}/${assessmentData.aptitudeScores?.clerical?.total || 20} correct

Detailed Aptitude Answers:
${JSON.stringify(assessmentData.aptitudeAnswers, null, 2)}

APTITUDE SCORING RULES:
- Each correct answer = 1 point
- Convert raw scores to percentages for each domain
- Identify top 2-3 cognitive strengths based on highest percentage scores
- Use aptitude profile to inform career cluster recommendations

## Big Five Personality Responses (1-5 scale: 1=Very Inaccurate, 5=Very Accurate):
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

## Work Values Responses (1-5 scale: 1=Not Important, 5=Extremely Important):
${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

## EMPLOYABILITY / 21st-CENTURY SKILLS DIAGNOSTIC:

### Part A: Self-Rating Skills (25 items, 1-5 scale: 1=Not like me, 5=Very much like me)
${JSON.stringify(assessmentData.employabilityAnswers?.selfRating || {}, null, 2)}

EMPLOYABILITY SCORING RULES:
- Average each domain (Communication, Teamwork, Problem Solving, Adaptability, Leadership, Digital Fluency, Professionalism, Career Readiness)
- Create a readiness heat-map based on domain averages
- Identify strength areas (avg >= 4) and improvement areas (avg <= 2.5)

### Part B: Situational Judgement Test (6 scenarios)
${JSON.stringify(assessmentData.employabilityAnswers?.sjt || [], null, 2)}

SJT SCORING RULES:
- Best answer = 2 points, Worst answer = 0 points, Other answers = 1 point
- Calculate total SJT score out of 12 (6 scenarios × 2 max points)
- Convert to percentage for overall SJT score

## Stream Knowledge Test Results:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}
Total Questions: ${assessmentData.totalKnowledgeQuestions}

## SECTION TIMING DATA (Time spent by student on each section):
- RIASEC (Career Interests): ${assessmentData.sectionTimings?.riasec?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.riasec?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.riasec?.avgSecondsPerQuestion || 0}s per question)
- Multi-Aptitude Battery: ${assessmentData.sectionTimings?.aptitude?.formatted || 'Not recorded'} of 45 minutes allowed (${assessmentData.sectionTimings?.aptitude?.questionsCount || 0} questions total, avg ${assessmentData.sectionTimings?.aptitude?.avgSecondsPerQuestion || 0}s per question)
- Big Five (Personality): ${assessmentData.sectionTimings?.bigfive?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.bigfive?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.bigfive?.avgSecondsPerQuestion || 0}s per question)
- Work Values: ${assessmentData.sectionTimings?.values?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.values?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.values?.avgSecondsPerQuestion || 0}s per question)
- Employability Skills: ${assessmentData.sectionTimings?.employability?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.employability?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.employability?.avgSecondsPerQuestion || 0}s per question)
- Knowledge Test: ${assessmentData.sectionTimings?.knowledge?.formatted || 'Not recorded'} of 30 minutes allowed (${assessmentData.sectionTimings?.knowledge?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.knowledge?.avgSecondsPerQuestion || 0}s per question)
- TOTAL ASSESSMENT TIME: ${assessmentData.sectionTimings?.totalFormatted || 'Not recorded'}

---

Analyze all responses and return ONLY a valid JSON object. Ensure ALL arrays are filled with actual data - NO empty arrays allowed. Every career cluster MUST have roles.entry, roles.mid, and domains filled. Every role in specificOptions MUST have a salary object with min and max values.

Return the JSON with this structure (see full schema in original prompt - includes profileSnapshot, riasec, aptitude, bigFive, workValues, employability, knowledge, careerFit with 3 clusters, specificOptions with salary ranges, skillGap, streamRecommendation for after10, roadmap, finalNote, timingAnalysis, and overallSummary).`;
}

export async function handleAnalyzeAssessment(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { user } = auth;
  const studentId = user.id;

  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  let body;
  try {
    body = await request.json() as { assessmentData: any };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { assessmentData } = body;

  if (!assessmentData) {
    return jsonResponse({ error: 'Assessment data is required' }, 400);
  }

  const prompt = buildAnalysisPrompt(assessmentData);
  const openRouterKey = getOpenRouterKey(env);

  if (!openRouterKey) {
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  // Helper function to call AI with a specific model
  const callAI = async (model: string) => {
    const response = await fetch(API_CONFIG.OPENROUTER.endpoint, {
      method: 'POST',
      headers: {
        ...API_CONFIG.OPENROUTER.headers,
        'Authorization': `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor and psychometric analyst. You provide detailed, deterministic, and consistent career analysis based on assessment data. CRITICAL: Always return complete, valid JSON. Never truncate your response. Ensure all arrays and objects are properly closed.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 8000
      })
    });
    return response;
  };

  // Try models in order of preference
  const models = ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini', 'openai/gpt-4o'];
  
  try {
    let response: Response | null = null;
    let lastError = '';
    
    for (const model of models) {
      console.log(`[ASSESSMENT] Trying model: ${model}`);
      try {
        response = await callAI(model);
        if (response.ok) {
          console.log(`[ASSESSMENT] Success with model: ${model}`);
          break;
        }
        const errorText = await response.text();
        lastError = errorText;
        console.error(`[ASSESSMENT] Model ${model} failed:`, response.status, errorText);
        response = null;
      } catch (e) {
        console.error(`[ASSESSMENT] Model ${model} error:`, e);
        lastError = (e as Error).message;
      }
    }

    if (!response || !response.ok) {
      console.error('[ASSESSMENT AI ERROR] All models failed');
      return jsonResponse({ error: `AI service error: ${lastError}` }, 500);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: 'Empty response from AI' }, 500);
    }

    // Clean up response - try multiple extraction methods
    let jsonStr = content;
    
    // Method 1: Extract from markdown code block
    const codeBlockMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // Method 2: Find the outermost JSON object
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = content.substring(firstBrace, lastBrace + 1);
      }
    }

    if (!jsonStr || (!jsonStr.startsWith('{') && !jsonStr.startsWith('['))) {
      console.error('Could not extract JSON from response:', content.substring(0, 500));
      return jsonResponse({ error: 'Invalid response format from AI' }, 500);
    }

    let parsedResults;

    try {
      parsedResults = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      console.error('Raw content length:', content.length);
      console.error('Extracted JSON length:', jsonStr.length);
      
      // Try to fix common JSON issues
      let fixedJson = jsonStr;
      
      // Fix 1: Remove trailing commas before closing brackets
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix 2: Handle truncated response - try to close open brackets
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/]/g) || []).length;
      
      // If response appears truncated, try to close it
      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        console.log('Attempting to fix truncated JSON...');
        // Add missing closing brackets
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedJson += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedJson += '}';
        }
      }
      
      try {
        parsedResults = JSON.parse(fixedJson);
        console.log('Successfully parsed after fixing JSON');
      } catch (e2) {
        console.error('Still failed after fix attempt:', e2);
        return jsonResponse({ 
          error: 'Failed to parse AI response. Please try again.',
          details: 'The AI response was incomplete or malformed. This can happen with complex assessments.'
        }, 500);
      }
    }

    return jsonResponse({ success: true, data: parsedResults });

  } catch (error) {
    console.error('Assessment analysis error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

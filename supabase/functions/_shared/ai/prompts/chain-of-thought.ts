// Chain of Thought Framework for Career AI
// Implements Zero-shot CoT, structured reasoning, self-correction, and confidence calibration

import type { CareerIntent } from '../../types/career-ai.ts';

/**
 * Zero-shot Chain-of-Thought (CoT) Prompting
 * Research shows adding "Let's think step by step" improves reasoning by 40-70%
 * Reference: Kojima et al. (2022) - "Large Language Models are Zero-Shot Reasoners"
 */
export const ZERO_SHOT_COT_TRIGGERS = {
  standard: "Let's think step by step.",
  detailed: "Let's work this out step by step to be sure we have the right answer.",
  breakdown: "Let's break this task into simpler subtasks and solve each one.",
  systematic: "Let's approach this systematically, thinking through each step carefully.",
  analytical: "Let's analyze this step by step to ensure accuracy.",
  methodical: "Let's work through this methodically, one step at a time."
} as const;

export function buildChainOfThoughtFramework(intent: CareerIntent, studentName: string): string {
  const zeroShotCoT = buildZeroShotCoTPrompt(intent);
  
  const baseCoT = `
<zero_shot_chain_of_thought>
${zeroShotCoT}
</zero_shot_chain_of_thought>

<chain_of_thought_framework>
Before responding, reason through these steps (internally, don't output this):

**${ZERO_SHOT_COT_TRIGGERS.standard}**

**Step 1 - UNDERSTAND**: What is ${studentName} actually asking?
Let's break this down:
- Surface question: [What they literally asked]
- Underlying need: [What they really want to achieve]
- Emotional state: [Excited? Frustrated? Confused? Neutral?]

**Step 2 - GATHER**: What relevant data do I have?
Let's work through this systematically:
- From <student_profile>: [List specific data points]
- From <assessment_results>: [If available]
- From <available_opportunities>: [If job-related]
- From <courses>: [If learning-related]

**Step 3 - ANALYZE**: How does this data answer their question?
Let's think step by step:
- Direct answer: [What can I definitively say?]
- Inferences: [What can I reasonably conclude?]
- Gaps: [What information is missing?]

**Step 4 - VERIFY**: Am I using ONLY real data?
Let's verify each claim carefully:
- ✓ Check: All jobs mentioned exist in <available_opportunities>
- ✓ Check: All skills attributed are in <skills><technical>
- ✓ Check: No assumptions from hobbies/interests
- ✓ Check: No fabricated companies, salaries, or statistics

**Step 5 - CALIBRATE CONFIDENCE**:
Let's assess our certainty level:
- HIGH: Data directly from context → State as fact
- MEDIUM: Reasonable inference → Use "Based on your profile..."
- LOW: General advice → Use "Generally speaking..."
- NONE: No data → Acknowledge honestly

**Step 6 - RESPOND**: Structure the response
Let's compose the final answer:
- Acknowledge their query
- Provide specific, data-backed answer
- Include actionable next steps
- End with follow-up question or offer
</chain_of_thought_framework>

<self_correction_mechanism>
**${ZERO_SHOT_COT_TRIGGERS.analytical}**

If you catch yourself about to:
❌ Mention a job not in <opportunities> → STOP, think again, use only listed jobs
❌ Attribute a skill not in <student_skills> → STOP, reconsider, use only listed skills
❌ Give generic advice → STOP, step back, personalize with their data
❌ Fabricate statistics → STOP, verify, acknowledge uncertainty
❌ Exceed word limit for phase → STOP, revise, be more concise

**Self-Correction Process:**
1. Pause and identify the error
2. Think step by step about the correct approach
3. Verify against available data
4. Reformulate the response
</self_correction_mechanism>`;

/**
 * Build Zero-shot CoT prompt based on intent
 * Different intents benefit from different reasoning triggers
 */
function buildZeroShotCoTPrompt(intent: CareerIntent): string {
  const intentCoTTriggers: Partial<Record<CareerIntent, string>> = {
    'find-jobs': `
**Zero-shot CoT for Job Matching:**
${ZERO_SHOT_COT_TRIGGERS.breakdown}

Subtask 1: Extract student's skills from <student_skills>
Subtask 2: List all jobs from <opportunities>
Subtask 3: For each job, calculate skill overlap percentage
Subtask 4: Rank jobs by match score
Subtask 5: Identify skill gaps for top matches
Subtask 6: Format response with honest match percentages`,

    'skill-gap': `
**Zero-shot CoT for Skill Gap Analysis:**
${ZERO_SHOT_COT_TRIGGERS.systematic}

Step 1: List current skills from <student_skills> (ONLY these, nothing assumed)
Step 2: Identify target role requirements for their field
Step 3: Compare current vs required skills
Step 4: Categorize gaps by priority (High/Medium/Low)
Step 5: Match gaps to courses from <courses>
Step 6: Estimate realistic learning timeline`,

    'learning-path': `
**Zero-shot CoT for Learning Roadmap:**
${ZERO_SHOT_COT_TRIGGERS.methodical}

Step 1: Assess current skill level from profile
Step 2: Define target role based on their field
Step 3: Identify skill progression (foundation → intermediate → advanced)
Step 4: Map courses from <courses> to each phase
Step 5: Add milestones and project suggestions
Step 6: Ensure timeline matches user's request`,

    'interview-prep': `
**Zero-shot CoT for Interview Preparation:**
${ZERO_SHOT_COT_TRIGGERS.detailed}

Step 1: Identify their target field and role type
Step 2: List their actual skills for technical questions
Step 3: Review their projects for STAR examples
Step 4: Consider personality from assessment (if available)
Step 5: Structure prep into technical + behavioral sections
Step 6: Offer mock interview practice`,

    'career-guidance': `
**Zero-shot CoT for Career Guidance:**
${ZERO_SHOT_COT_TRIGGERS.analytical}

Step 1: Analyze profile holistically (skills, education, experience)
Step 2: Consider assessment results (RIASEC, personality)
Step 3: Identify 2-3 viable career paths
Step 4: Evaluate fit percentage for each path
Step 5: Consider market demand and growth potential
Step 6: Provide clear recommendation with reasoning`,

    'assessment-insights': `
**Zero-shot CoT for Assessment Explanation:**
${ZERO_SHOT_COT_TRIGGERS.standard}

Step 1: Check if assessment data exists
Step 2: If yes, interpret RIASEC code in practical terms
Step 3: Connect personality traits to work preferences
Step 4: Link to specific career recommendations
Step 5: If no assessment, explain benefits and encourage completion`,

    'course-recommendation': `
**Zero-shot CoT for Course Recommendations:**
${ZERO_SHOT_COT_TRIGGERS.breakdown}

Subtask 1: Check <recommended_courses_based_on_assessment> first
Subtask 2: Check <available_courses> for additional options
Subtask 3: Match courses to skill gaps and career goals
Subtask 4: Prioritize by relevance, popularity, duration
Subtask 5: Group into categories (Technical/Soft Skills)
Subtask 6: Explain why each course is recommended`,

    'resume-review': `
**Zero-shot CoT for Profile/Resume Review:**
${ZERO_SHOT_COT_TRIGGERS.systematic}

Step 1: Calculate profile completeness score
Step 2: Identify strengths from existing data
Step 3: Find gaps and areas for improvement
Step 4: Provide ATS optimization tips
Step 5: Suggest specific actionable improvements`,

    'general': `
**Zero-shot CoT for General Queries:**
${ZERO_SHOT_COT_TRIGGERS.standard}

Step 1: Understand what the user is asking
Step 2: Determine if it's career-related
Step 3: If yes, identify the best way to help
Step 4: If no, politely redirect to career topics
Step 5: Offer relevant assistance options`
  };

  return intentCoTTriggers[intent] || intentCoTTriggers['general'] || '';
}

  const intentCoT: Partial<Record<CareerIntent, string>> = {
    'find-jobs': `
<job_matching_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.breakdown}**

For job recommendations, use SELF-CONSISTENCY with 3 reasoning paths:

**Path 1 - Skill-First Matching:**
Let's think step by step:
1. List ${studentName}'s skills from <student_skills>
2. For each job in <opportunities>, count matching skills
3. Calculate: (matching skills / required skills) × 100
4. Rank jobs by skill match percentage

**Path 2 - Field-Alignment Matching:**
Let's work through this systematically:
1. Identify ${studentName}'s field: their department
2. Filter jobs by sector/department alignment
3. Within aligned jobs, calculate skill match
4. Rank by: (field alignment × 0.4) + (skill match × 0.6)

**Path 3 - Assessment-Based Matching (if available):**
Let's analyze this step by step:
1. Use RIASEC code to identify suitable job types
2. Filter jobs matching personality profile
3. Calculate skill match within filtered set
4. Rank by: (RIASEC fit × 0.3) + (skill match × 0.7)

**Self-Consistency Vote:**
Let's compare and verify:
- Compare top 5 jobs from each path
- Jobs appearing in 2+ paths = HIGH confidence
- Jobs in only 1 path = MEDIUM confidence
- Present jobs with highest consensus first

**Match Score Guidelines:**
- 80%+ = Excellent match ⭐ (highlight)
- 60-79% = Good match ✓ (note minor gaps)
- 40-59% = Partial match ⚠️ (significant gaps)
- <40% = Weak match (may not recommend)

**Anti-Hallucination Check:**
Let's verify each claim:
- Every job ID must exist in <opportunities>
- Every skill attributed must be in <student_skills>
- If no good matches, say so honestly
</job_matching_reasoning>`,

    'skill-gap': `
<skill_analysis_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.systematic}**

For skill gap analysis, let's work through this methodically:

Step 1: List ONLY skills from <skills><technical> - these are verified
Step 2: Identify target role requirements for ${studentName}'s field
Step 3: Compare current vs required - What's missing?
Step 4: Prioritize gaps by impact:
   - 🔴 HIGH: Critical for entry-level jobs in their field
   - 🟡 MEDIUM: Important for career growth
   - 🟢 LOW: Nice to have, can learn on job
Step 5: For each gap, suggest SPECIFIC courses from <courses>
Step 6: Provide realistic timeline estimates

**Verification:** Before finalizing, let's verify each skill gap is real and each course exists in <courses>.
</skill_analysis_reasoning>`,

    'learning-path': `
<roadmap_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.methodical}**

For learning path creation, let's break this into clear steps:

Step 1: Assess current skill level from <skills><technical>
Step 2: Extract the TARGET TOPIC from user's request (the skill/technology they want to learn)
Step 3: Map the skill progression needed (foundation → intermediate → advanced)
Step 4: Break into phases matching requested duration

Step 5: COURSE RELEVANCE CHECK (CRITICAL):
   - Look at <courses> available
   - For EACH course, ask: "Is this course DIRECTLY RELEVANT to the target topic?"
   - A course is relevant ONLY if:
     * Its title/category matches the target topic
     * It teaches skills needed for the target topic
     * A student learning the target topic would benefit from it
   - If NO relevant courses exist in <courses>, be HONEST

Step 6: Add milestones and project suggestions for each phase
Step 7: Consider their assessment results if available

**TIMELINE GUIDELINES:**
- 3 months: Focus on 2-3 core skills
- 6 months: Foundation + intermediate skills
- 12 months: Comprehensive roadmap with specialization

**HONESTY RULE:**
If the course catalog doesn't have courses for the requested topic:
- Say: "Our course catalog doesn't currently have [target topic]-specific courses"
- Provide a skill-based roadmap instead (what to learn, in what order)
- Suggest projects to build at each phase
- Do NOT recommend unrelated courses just to fill the roadmap

**Final Check:** 
- Is every recommended course ACTUALLY relevant to the target topic?
- Would recommending this course make sense for someone learning [target topic]?
</roadmap_reasoning>`,

    'interview-prep': `
<interview_prep_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.detailed}**

For interview preparation, let's work this out step by step:

Step 1: Identify ${studentName}'s target field: their department
Step 2: List their skills from <student_skills> for technical questions
Step 3: Review their projects for STAR method examples
Step 4: Consider their personality from assessment (if available)
Step 5: Structure prep into:
   - Technical questions (based on their actual skills)
   - Behavioral questions (using their real experiences)
   - Company research tips
Step 6: Offer mock interview practice

**Key Principle:** Only reference skills and experiences that actually exist in their profile.
</interview_prep_reasoning>`,

    'career-guidance': `
<career_guidance_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.analytical}**

For career guidance, use TREE-OF-THOUGHTS approach with 3 expert perspectives:

**Expert 1 (Skills Analyst):**
Let's analyze skills step by step:
- Step 1: List ${studentName}'s current skills from <student_skills>
- Step 2: Identify roles that match these skills
- Step 3: Evaluate skill-to-role fit percentage
- If skills are insufficient for any role, note this and continue

**Expert 2 (Assessment Specialist):**
Let's examine assessment data:
- Step 1: Review RIASEC code and personality from <assessment>
- Step 2: Identify careers aligned with their personality type
- Step 3: Cross-reference with Expert 1's skill-based roles
- If no assessment, skip to Expert 3

**Expert 3 (Market Analyst):**
Let's consider market factors:
- Step 1: Consider current job market trends for their field
- Step 2: Identify high-growth vs declining career paths
- Step 3: Evaluate realistic entry points for ${studentName}

**Synthesis:**
Let's combine all perspectives:
- Combine insights from all experts
- Identify paths where 2+ experts agree
- Rank by: (Expert agreement × Fit score × Market demand)
- Present top 2-3 paths with clear reasoning

**Final Output:**
- Path A: [Highest consensus] - Fit: X%
- Path B: [Alternative] - Fit: Y%
- Recommendation: [Best path] because [specific reasons]
- Immediate next steps: [2-3 actionable items]
</career_guidance_reasoning>`,

    'assessment-insights': `
<assessment_insights_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.standard}**

For explaining assessment results, let's think step by step:

Step 1: Check if assessment data exists in <assessment>
Step 2: If yes:
   - Explain RIASEC code in practical, relatable terms
   - Connect personality traits to work preferences
   - Highlight strengths to leverage
   - Link to specific career recommendations
Step 3: If no:
   - Explain benefits of taking assessment
   - Encourage completion for personalized guidance
Step 4: Always connect insights to actionable next steps

**Remember:** Only interpret data that actually exists in the assessment.
</assessment_insights_reasoning>`,

    'course-recommendation': `
<course_recommendation_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.breakdown}**

For course recommendations, let's break this into subtasks:

Subtask 1: Check <recommended_courses_based_on_assessment> first (AI-matched)
Subtask 2: Check <available_courses> for additional options
Subtask 3: Match courses to:
   - Skill gaps identified in assessment
   - Career goals based on their field
   - Current skill level
Subtask 4: Prioritize by:
   - Relevance score (if available)
   - Popularity (enrollment count)
   - Duration (shorter for quick wins)
Subtask 5: Group recommendations:
   - 🎯 Top Picks (highest relevance)
   - 📚 Technical Skills
   - 💼 Soft Skills
Subtask 6: Verify - NEVER invent course titles - use ONLY from provided lists

**Final Verification:** Double-check every course name exists in the database.
</course_recommendation_reasoning>`,

    'resume-review': `
<resume_review_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.systematic}**

For profile/resume review, let's work through this systematically:

Step 1: Calculate profile completeness score
   - Skills section: X%
   - Education section: X%
   - Experience section: X%
   - Projects section: X%
   - Certificates section: X%
Step 2: Identify strengths from existing data
Step 3: Find gaps and areas for improvement
Step 4: Provide ATS optimization tips
Step 5: Suggest specific actionable improvements

**Key:** Only comment on sections that actually exist in their profile.
</resume_review_reasoning>`,

    'networking': `
<networking_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.detailed}**

For networking advice, let's think this through:

Step 1: Identify their field and target industry
Step 2: Suggest relevant professional communities
Step 3: Provide LinkedIn optimization tips specific to their profile
Step 4: Offer outreach templates personalized to their background
Step 5: Recommend networking strategies for their career stage

**Remember:** Tailor all advice to their specific field and experience level.
</networking_reasoning>`,

    'general': `
<general_reasoning>
**${ZERO_SHOT_COT_TRIGGERS.standard}**

For general queries, let's think step by step:

Step 1: Understand what the user is asking
Step 2: Determine if it's career-related
Step 3: If yes, identify the best way to help
Step 4: If no, politely redirect to career topics
Step 5: Offer relevant assistance options

**Goal:** Be helpful while staying focused on career assistance.
</general_reasoning>`
  };

  return baseCoT + (intentCoT[intent] || intentCoT['general'] || '');
}

/**
 * Get the appropriate Zero-shot CoT trigger for an intent
 * Useful for embedding in other prompts
 */
export function getZeroShotTrigger(intent: CareerIntent): string {
  const triggers: Partial<Record<CareerIntent, keyof typeof ZERO_SHOT_COT_TRIGGERS>> = {
    'find-jobs': 'breakdown',
    'skill-gap': 'systematic',
    'learning-path': 'methodical',
    'interview-prep': 'detailed',
    'career-guidance': 'analytical',
    'assessment-insights': 'standard',
    'course-recommendation': 'breakdown',
    'resume-review': 'systematic',
    'networking': 'detailed',
    'general': 'standard'
  };
  
  const triggerKey = triggers[intent] || 'standard';
  return ZERO_SHOT_COT_TRIGGERS[triggerKey];
}

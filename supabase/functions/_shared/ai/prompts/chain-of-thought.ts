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

  return baseCoT;
}

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

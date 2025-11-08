import { StudentProfile, Opportunity } from '../types';

/**
 * Intelligent Prompt System
 * Context-aware prompts that adapt to user intent and leverage all available database data
 */

export interface QueryContext {
  studentProfile: StudentProfile;
  marketData: {
    inDemandSkills: string[];
    totalJobs: number;
    relevantJobs: Opportunity[];
  };
  userIntent: 'quick-answer' | 'detailed-guidance' | 'comprehensive-plan';
  conversationHistory?: string[];
}

/**
 * Build rich student context string with ALL available data
 */
export function buildRichStudentContext(profile: StudentProfile): string {
  const skills = profile.profile?.technicalSkills || [];
  const softSkills = profile.profile?.softSkills || [];
  const training = profile.profile?.training || [];
  const projects = profile.profile?.projects || [];
  const certificates = profile.profile?.certificates || [];
  const experience = profile.profile?.experience || [];
  
  const completedTraining = training.filter((t: any) => t.status === 'completed');
  const ongoingTraining = training.filter((t: any) => t.status === 'ongoing');
  
  return `**STUDENT PROFILE:**
Name: ${profile.name}
Field/Department: ${profile.department}
University: ${profile.university}
${profile.cgpa ? `CGPA: ${profile.cgpa}` : ''}
${profile.year_of_passing ? `Year of Passing: ${profile.year_of_passing}` : ''}

**TECHNICAL SKILLS (${skills.length}):**
${skills.length > 0 
  ? skills.map((s: any) => `- ${s.name} (Level: ${s.level}/5)${s.source ? ` [from ${s.source}]` : ''}`).join('\n')
  : '- No technical skills listed yet'}

**SOFT SKILLS:**
${softSkills.length > 0 
  ? softSkills.map((s: any) => `- ${s.name}`).join('\n')
  : '- Not specified'}

**COMPLETED TRAINING/COURSES (${completedTraining.length}):**
${completedTraining.length > 0
  ? completedTraining.map((t: any) => `- ${t.course}${t.skills ? ` [Skills: ${t.skills.join(', ')}]` : ''}`).join('\n')
  : '- None completed yet'}

**ONGOING LEARNING (${ongoingTraining.length}):**
${ongoingTraining.length > 0
  ? ongoingTraining.map((t: any) => `- ${t.course}`).join('\n')
  : '- No active courses'}

**PROJECTS (${projects.length}):**
${projects.length > 0
  ? projects.map((p: any) => `- ${p.title || 'Untitled'}${p.status ? ` (${p.status})` : ''}${
      p.skills || p.technologies || p.techStack 
        ? ` [Tech: ${(p.skills || p.technologies || p.techStack).join(', ')}]` 
        : ''
    }`).join('\n')
  : '- No projects listed'}

**CERTIFICATIONS (${certificates.length}):**
${certificates.length > 0
  ? certificates.map((c: any) => `- ${c.name}${c.issuer ? ` by ${c.issuer}` : ''}`).join('\n')
  : '- No certifications yet'}

**EXPERIENCE:**
${experience.length > 0
  ? experience.map((e: any) => `- ${e.role} at ${e.company}${e.duration ? ` (${e.duration})` : ''}`).join('\n')
  : '- No formal experience yet (projects count!)'}`;
}

/**
 * Build market context with job data
 */
export function buildMarketContext(opportunities: Opportunity[], inDemandSkills: string[]): string {
  const topSkills = inDemandSkills.slice(0, 15);
  
  return `**CURRENT JOB MARKET DATA (${opportunities.length} opportunities analyzed):**

**Top In-Demand Skills:**
${topSkills.slice(0, 10).map((skill, i) => `${i + 1}. ${skill}`).join('\n')}

**Job Types Available:**
${Array.from(new Set(opportunities.map(o => o.employment_type)))
  .filter(Boolean)
  .map(type => `- ${type}`)
  .join('\n')}

**Top Companies Hiring:**
${Array.from(new Set(opportunities.map(o => o.company_name)))
  .slice(0, 8)
  .map(company => `- ${company}`)
  .join('\n')}`;
}

/**
 * Detect if query is simple/specific or complex/comprehensive
 */
export function detectQueryType(message: string): 'quick-answer' | 'detailed-guidance' | 'comprehensive-plan' {
  const lower = message.toLowerCase().trim();
  const wordCount = lower.split(/\s+/).length;
  
  // Comparison question keywords (should get detailed guidance)
  const comparisonKeywords = [
    'vs', 'versus', 'or', 'which is better', 'which one',
    'difference between', 'compare', 'should i choose', 'should i use'
  ];
  
  // Quick answer keywords
  const quickKeywords = [
    'suggest', 'recommend', 'list', 'best', 'top', 'good',
    'which course', 'what course', 'any course', 'course for',
    'tutorial', 'resource', 'platform', 'where to learn'
  ];
  
  // Comprehensive plan keywords
  const planKeywords = [
    'roadmap', 'plan', 'path', 'journey', 'prepare me',
    'career guidance', 'how to become', 'switch career',
    'comprehensive', 'complete guide', 'step by step'
  ];
  
  // Check for comparison questions (always detailed guidance)
  if (comparisonKeywords.some(kw => lower.includes(kw))) {
    return 'detailed-guidance';
  }
  
  // Check for comprehensive plan
  if (planKeywords.some(kw => lower.includes(kw)) || wordCount > 15) {
    return 'comprehensive-plan';
  }
  
  // Check for quick answer (short, specific question)
  if (quickKeywords.some(kw => lower.includes(kw)) && wordCount <= 10) {
    return 'quick-answer';
  }
  
  // Default to detailed guidance (middle ground)
  return 'detailed-guidance';
}

/**
 * Create context-aware learning prompt
 */
export function createIntelligentLearningPrompt(
  context: QueryContext,
  userMessage: string
): string {
  const studentContext = buildRichStudentContext(context.studentProfile);
  const marketContext = buildMarketContext(
    context.marketData.relevantJobs,
    context.marketData.inDemandSkills
  );
  
  const basePrompt = `${studentContext}

${marketContext}

**STUDENT'S QUESTION:**
"${userMessage}"

---`;

  // Adapt response style based on query type
  if (context.userIntent === 'quick-answer') {
    return `${basePrompt}

**YOUR TASK:**
The student asked a **specific, direct question**. Provide a **concise, focused answer**.

**Response Format:**
1. **Direct Answer** (1-2 sentences addressing their question)
2. **Top Recommendations** (3-5 specific options):
   For each recommendation include:
   - **Name & Platform** (e.g., "SQL Fundamentals on Coursera")
   - **Cost**: FREE or PAID (with price if known)
   - **Duration**: Estimated time (e.g., "4 weeks, 5 hrs/week")
   - **Level**: Beginner/Intermediate/Advanced
   - **Why Good**: One sentence explanation
3. **Quick Tip** (1 sentence practical advice)

**Style**: 
- Be direct and concise
- No lengthy explanations
- Focus on actionable recommendations
- Keep total response under 250 words`;
  }
  
  if (context.userIntent === 'detailed-guidance') {
    return `${basePrompt}

**YOUR TASK:**
Provide **detailed, personalized guidance** that considers their profile and market demands.

**Response Structure:**
1. **Context Assessment** (2-3 sentences)
   - Acknowledge their current skills/situation
   - How this relates to market demand

2. **Tailored Recommendations** (5-8 specific options)
   For each include:
   - Resource name, platform, and link if known
   - FREE or PAID indicator
   - Duration and difficulty level
   - Why it's good FOR THEM specifically
   - How it fills their skill gaps

3. **Learning Strategy** (practical advice)
   - Suggested order/priority
   - Time commitment
   - How to practice/apply

4. **Next Steps** (2-3 actionable items)

**Style**:
- Personalized to their profile
- Explain WHY you're recommending each resource
- Connect to their career goals
- Keep response under 500 words`;
  }
  
  // comprehensive-plan
  return `${basePrompt}

**YOUR TASK:**
Create a **comprehensive, personalized learning roadmap** that transforms them into a competitive candidate.

**Response Structure:**

### 1. Current State Analysis
- Their strengths (skills they already have)
- Skill gaps (comparing profile vs market demand)
- Market positioning (how competitive they are now)

### 2. Goal Setting
- **Short-term (1-3 months)**: Immediate skills to learn
- **Medium-term (3-6 months)**: Intermediate capabilities
- **Long-term (6-12 months)**: Advanced mastery & specialization

### 3. Detailed Learning Path

**Phase 1: Foundation (Weeks 1-4)**
- Specific courses/resources (FREE + PAID options)
- Mini-projects to build (with tech stack)
- Time commitment per week

**Phase 2: Intermediate (Weeks 5-12)**  
- Advanced courses
- Substantial projects (portfolio-worthy)
- Skills to practice daily

**Phase 3: Specialization (Months 4-6)**
- Specialization area based on market demand
- Industry-recognized certifications
- Real-world application projects

### 4. Resources Breakdown
For each resource:
- Platform and course name
- Cost (FREE/PAID with price)
- Duration and difficulty
- Key outcomes/skills gained

### 5. Success Metrics
- How to track progress
- Milestones to hit
- When they'll be job-ready

### 6. Action Plan
- Start TODAY: First 3 things to do
- Weekly routine structure
- How to stay motivated

**Style**:
- Highly personalized to their profile
- Evidence-based (reference their skills and market data)
- Motivating and encouraging
- Realistic timelines
- Mix of free and paid resources
- Prioritize job-relevant skills`;
}

/**
 * Create context-aware general prompt (for questions without specific chips)
 */
export function createIntelligentGeneralPrompt(
  context: QueryContext,
  userMessage: string
): string {
  const studentContext = buildRichStudentContext(context.studentProfile);
  const marketContext = buildMarketContext(
    context.marketData.relevantJobs,
    context.marketData.inDemandSkills
  );
  
  return `${studentContext}

${marketContext}

**STUDENT'S QUESTION:**
"${userMessage}"

**YOUR TASK:**
You are an intelligent career assistant. Analyze the student's question and provide a helpful, personalized response that leverages their profile data and current market insights.

**Guidelines:**
- **Be conversational** but professional
- **Use their name** to personalize
- **Reference their actual skills, courses, or projects** when relevant
- **Connect to market data** when giving advice
- **Be specific** - mention actual course names, platforms, companies, or technologies
- **Match the depth** of your response to their question:
  - Simple question → Simple answer (3-5 sentences)
  - Complex question → Detailed guidance (2-3 paragraphs)
- **Always be actionable** - give them something they can DO

**Examples:**
- If they ask about SQL courses → Suggest 3-5 specific courses, considering their current skill level
- If they ask about career paths → Analyze their skills vs market demand, suggest 2-3 realistic paths
- If they ask a vague question → Clarify what they mean or guide them to be more specific
- If they're just chatting → Respond naturally but steer toward career topics

Keep responses concise (under 300 words unless they ask for comprehensive guidance).`;
}

/**
 * System prompts for different contexts
 */
export const SYSTEM_PROMPTS = {
  learning: `You are an expert career coach and learning advisor with deep knowledge of online education platforms, courses, and learning paths. You provide personalized, actionable recommendations based on student profiles and market demand. You are honest about skill gaps and realistic about timelines. You always include specific course names, platforms, and practical next steps.`,
  
  general: `You are an intelligent career AI assistant with access to the student's complete profile and current job market data. You provide personalized, context-aware career guidance. You reference the student's actual skills, projects, and courses when relevant. You are conversational, encouraging, and always actionable. You adapt your response style to match the user's question - brief for simple questions, comprehensive for complex ones.`,
  
  jobMatching: `You are an expert career counselor and job matching AI with deep knowledge of the job market, student career development, and skill assessment. You provide accurate, honest, and helpful career guidance. You never inflate match scores - honesty helps students make better decisions.`
};


import { StudentContext, OpportunityContext } from '../types';

/**
 * Job Matching Prompt Templates
 * Contains all AI prompts for job matching and recommendations
 */

/**
 * Create detailed job matching prompt for AI
 */
export function createJobMatchingPrompt(
  studentContext: StudentContext,
  opportunities: OpportunityContext[],
  topN: number,
  userQuery?: string
): string {
  return `
You are analyzing a student profile to find the BEST ${topN} job matches from ${opportunities.length} available opportunities.

**STUDENT PROFILE:**
Name: ${studentContext.name}
Department/Field: ${studentContext.department}
University: ${studentContext.university}
CGPA: ${studentContext.cgpa || 'Not specified'}
Year of Passing: ${studentContext.year_of_passing || 'Not specified'}
Experience: ${studentContext.experience_years} years

Technical Skills (${studentContext.technical_skills.length}):
${studentContext.technical_skills.map((s: any) => `- ${s.name} (Level: ${s.level}/5)${s.category ? ` [${s.category}]` : ''}`).join('\n') || '- None listed'}

Soft Skills: ${studentContext.soft_skills.join(', ') || 'None listed'}

Experience Roles: ${studentContext.experience_roles.join(', ') || 'No experience yet'}

Completed Training: ${studentContext.completed_training.join(', ') || 'None'}

---

${userQuery ? `**USER'S SPECIFIC REQUEST:**
"${userQuery}"

IMPORTANT: Filter and prioritize jobs that match this specific request. If they ask for "SQL jobs", ONLY show jobs that require SQL.

---

` : ''}**AVAILABLE OPPORTUNITIES (${opportunities.length} total):**

${opportunities.map(opp => `
${opp.index}. [ID: ${opp.id}] ${opp.title} at ${opp.company}
   Type: ${opp.type} | Location: ${opp.location} | Mode: ${opp.mode || 'Not specified'}
   Experience Required: ${opp.experience || 'Not specified'}
   Skills Required: ${opp.skills.join(', ') || 'Not specified'}
   Salary/Stipend: ${opp.salary || 'Not disclosed'}
   Deadline: ${opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'Open'}
   Description: ${opp.description?.substring(0, 150) || 'N/A'}...
`).join('\n---\n')}

---

**MATCHING RULES:**

1. **FIELD MATCH IS CRITICAL (50% of score)**
   - Same field (e.g., CS student → Developer role) = 40-50 points
   - Related field (e.g., CS → Data Analyst) = 25-35 points
   - Different field = MAX 15 points

2. **SKILLS MATCH (30% of score)**
   - Has 80%+ required skills = 24-30 points
   - Has 60-79% required skills = 18-23 points
   - Has 40-59% required skills = 12-17 points
   - Has <40% required skills = 0-11 points

3. **EXPERIENCE LEVEL (10% of score)**
   - Matches experience requirement = 8-10 points
   - Within 1 year of requirement = 5-7 points
   - Significant gap = 0-4 points

4. **OTHER FACTORS (10% of score)**
   - Training/certifications relevant = +5 points
   - Location preference match = +3 points
   - Deadline approaching = +2 points

**SCORING SCALE:**
- 90-100: Perfect match - Apply immediately!
- 75-89: Excellent match - Strong candidate
- 60-74: Good match - Worth applying
- 45-59: Fair match - Consider with preparation
- 30-44: Stretch opportunity - Requires skill development
- Below 30: Not recommended currently

**BE HONEST:**
- If student is CS but jobs are all in Food Science → Low scores (20-35%)
- If student is Food Science but jobs are Developer roles → Low scores (20-35%)
- NEVER inflate scores to make poor matches look good
- It's better to be honest than misleading

**YOUR TASK:**
Analyze ALL ${opportunities.length} opportunities and return the TOP ${topN} matches.

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "matches": [
    {
      "job_id": <number>,
      "job_title": "<exact title>",
      "company_name": "<exact company>",
      "match_score": <number 0-100>,
      "match_reason": "<2-3 sentences explaining the match, be specific about skills>",
      "key_matching_skills": ["<skill1>", "<skill2>", "<skill3>"],
      "skills_gap": ["<missing_skill1>", "<missing_skill2>"],
      "recommendation": "<What should the student do? Apply now, learn X first, good for beginners, etc.>"
    }
  ]
}

Return ONLY valid JSON. Be accurate, honest, and helpful.`;
}

/**
 * System prompt for job matching AI
 */
export const JOB_MATCHING_SYSTEM_PROMPT = 
  'You are an expert career counselor and job matching AI with deep knowledge of the Indian job market, student career development, and skill assessment. You provide accurate, honest, and helpful career guidance.';

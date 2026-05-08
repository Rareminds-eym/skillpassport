// Few-Shot Examples for Career AI

import type { CareerIntent, LearnerProfile, AssessmentResults } from '../../types';

export function buildFewShotExamples(
  intent: CareerIntent, 
  learnerName: string, 
  profile: LearnerProfile, 
  assessment?: AssessmentResults
): string {
  const examples: Partial<Record<CareerIntent, string>> = {
    'find-jobs': `
<few_shot_examples>
<example intent="find-jobs" quality="excellent">
USER: "What jobs are available for me?"
ASSISTANT: "Hi ${learnerName}! 👋 Let me match your profile against our current opportunities.

**Your Profile Highlights:**
- Field: ${profile.department || 'Your field'}
- Key Skills: ${profile.technicalSkills.slice(0, 3).map(s => s.name).join(', ') || 'Skills from your profile'}

**Top Matches:**

1. **[Exact Job Title from Database]** (ID: X) - Match: 85%
   - Company: [From database or 'Not specified']
   - Location: [From database] | Mode: [From database]
   - Why it fits: Your [specific skill] directly aligns with their requirements
   - Skills gap: [Honest assessment - if none, say 'Great fit!']

Would you like details on any of these, or should I filter by location/type?"
</example>

<anti_pattern intent="find-jobs" quality="poor">
❌ WRONG: "Based on your programming skills in Python, JavaScript, and React..."
   (If learner only has "Programming" listed, don't assume specific languages)
❌ WRONG: "I found this great opportunity at TechCorp for a Senior Developer..."
   (If this job isn't in <available_opportunities>, don't mention it)
</anti_pattern>
</few_shot_examples>`,

    'skill-gap': `
<few_shot_examples>
<example intent="skill-gap" quality="excellent">
USER: "What skills am I missing?"
ASSISTANT: "Great question, ${learnerName}! Let me analyze your current skills against market demands.

**Your Current Skills:**
${profile.technicalSkills.slice(0, 5).map(s => `- ${s.name} (Level ${s.level}/5)`).join('\n') || '- [Skills from your profile]'}

**Critical Gaps for ${profile.department || 'Your Target Role'}:**

1. **[Specific Skill]** - High Priority 🔴
   - Why: [Market demand reason]
   - Learn via: [Specific course from <courses>]

2. **[Another Skill]** - Medium Priority 🟡
   - Why: [Career growth reason]
   - Learn via: [Specific course from <courses>]

Would you like a detailed learning roadmap for any of these skills?"
</example>
</few_shot_examples>`,

    'general': `
<few_shot_examples>
<example intent="general" quality="excellent">
USER: "Hi"
ASSISTANT: "Hi ${learnerName}! 👋 Nice to meet you.

I'm your Career AI assistant. I can help with job matching 💼, skill development 📚, interview prep, and career guidance.

How can I help you today? 🎯"
</example>
</few_shot_examples>

<error_recovery_examples>
<example scenario="no_skills_listed">
USER: "Find me jobs"
ASSISTANT: "Hey ${learnerName}! 👋 I'd love to help you find matching jobs.

I noticed your skills aren't listed in your profile yet. Adding your technical skills would help me find much better matches for you!

**Quick Action:** Head to your profile and add your top 5-10 skills.

In the meantime, would you like me to show you opportunities in your field (${profile.department || 'your area'})? 🎯"
</example>

<example scenario="no_assessment">
USER: "What career should I pursue?"
ASSISTANT: "Great question, ${learnerName}! 🎯

I can give you some guidance based on your profile, but I'd be able to provide much more personalized recommendations if you complete our career assessment.

**The assessment reveals:**
- Your RIASEC interest profile
- Personality-career fit
- AI-matched career recommendations

Would you like to take the assessment first, or should I share some initial thoughts based on your current profile?"
</example>
</error_recovery_examples>`
  };

  return examples[intent] || examples['general'] || '';
}

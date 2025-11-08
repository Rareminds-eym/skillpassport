import { StudentProfile } from '../types';

/**
 * Learning Path Prompt Templates
 * Contains all AI prompts for personalized learning roadmaps
 */

/**
 * Create detailed learning path prompt for AI
 */
export function createLearningPathPrompt(
  studentProfile: StudentProfile,
  userMessage: string,
  inDemandSkills: string[],
  opportunitiesCount: number
): string {
  const department = studentProfile.department || 'your field';
  const currentSkills = studentProfile.profile?.technicalSkills || [];
  const completedCourses = studentProfile.profile?.training?.filter((t: any) => t.status === 'completed') || [];
  const ongoingCourses = studentProfile.profile?.training?.filter((t: any) => t.status === 'ongoing') || [];
  
  const skillsList = currentSkills.map((s: any) => `${s.name} (Level: ${s.level}/5)`).join(', ') || 'No skills listed yet';
  const completedList = completedCourses.map((c: any) => c.course).join(', ') || 'None';
  const ongoingList = ongoingCourses.map((c: any) => c.course).join(', ') || 'None';
  
  return `You are an expert career coach creating a personalized learning roadmap.

**STUDENT PROFILE:**
Name: ${studentProfile.name}
Field: ${department}
Current Skills: ${skillsList}
Completed Courses: ${completedList}
Ongoing Learning: ${ongoingList}

**MARKET DEMAND (from ${opportunitiesCount} job postings):**
Top In-Demand Skills: ${inDemandSkills.slice(0, 10).join(', ')}

**STUDENT'S REQUEST:**
"${userMessage}"

**YOUR TASK:**
Analyze the student's request and respond accordingly:

**IF** they ask a simple, specific question (e.g., "Suggest SQL courses", "Best Python tutorial"):
- Answer directly and concisely
- Provide 3-5 specific course recommendations with:
  * Course name and platform
  * FREE or PAID indicator
  * Brief description (1 line)
  * Estimated duration
  * Difficulty level (Beginner/Intermediate/Advanced)
- Keep it focused and actionable

**IF** they want a comprehensive learning plan (e.g., "Create a roadmap", "Learning path for..."):
- Create a full learning roadmap that includes:
  1. **Assesses Current State**: What skills they have, what's missing
  2. **Identifies Skill Gaps**: Compare current skills vs market demand
  3. **Sets Clear Goals**: Short-term (1-3 months) and Long-term (6-12 months)
  4. **Recommends Specific Courses**: Mix of FREE and PAID options
  5. **Suggests Hands-on Projects**: Real-world projects to build portfolio
  6. **Provides Timeline**: Week-by-week or month-by-month plan
  7. **Recommends Certifications**: Industry-recognized certifications

**OUTPUT FORMAT:**
- Use ### headers for sections
- Bullet points for easy scanning
- Specific course/resource names (not generic)
- Time estimates where relevant
- Be specific, actionable, and encouraging

Focus on skills that will help them get jobs. Match the depth of your response to their question.`;
}

/**
 * System prompt for learning path AI
 */
export const LEARNING_PATH_SYSTEM_PROMPT = 
  'You are an expert career coach and learning path designer. You create personalized, actionable learning roadmaps that are specific, realistic, and aligned with market demand. You always include free resources, time estimates, and hands-on projects.';

/**
 * Create fallback learning path when AI fails or profile is minimal
 */
export function createFallbackLearningPath(studentProfile: StudentProfile, userMessage: string): string {
  const studentName = studentProfile.name?.split(' ')[0] || 'there';
  const currentSkills = studentProfile.profile?.technicalSkills || [];
  
  return `Hey ${studentName}! 🎓

I'd love to create a personalized learning path for you. Based on your profile, here's a general roadmap:

### 🎯 Your Current Skills:
${currentSkills.length > 0 ? currentSkills.map((s: any) => `- ${s.name}`).join('\n') : '- Add your skills to your profile for better recommendations'}

### 📈 Recommended Learning Path:

**Phase 1: Foundation (Weeks 1-4)**
- Master the basics of your core technologies
- Complete beginner-friendly projects
- Build a strong GitHub portfolio

**Phase 2: Intermediate (Weeks 5-12)**
- Learn advanced concepts
- Build 2-3 substantial projects
- Contribute to open-source projects

**Phase 3: Specialization (Months 4-6)**
- Choose a specialization (Frontend, Backend, Full Stack, etc.)
- Learn in-demand frameworks and tools
- Build production-ready applications

### 📚 Recommended Platforms:
- **Free**: freeCodeCamp, YouTube, MDN Docs, The Odin Project
- **Paid**: Udemy, Coursera, Pluralsight, Frontend Masters

### 🛠️ Next Steps:
1. Tell me specifically what role you're targeting (e.g., "Full Stack Developer")
2. Share your career timeline (e.g., "Need a job in 6 months")
3. I'll create a detailed, week-by-week learning plan for you!

What would you like to focus on? 🚀`;
}

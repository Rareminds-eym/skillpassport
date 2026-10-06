/**
 * Career-path generation prompts (server copy).
 *
 * Verbatim ports of CAREER_PATH_SYSTEM_PROMPT + buildlearnerProfileContext
 * from `src/features/counselling/api/aiCareerPathService.ts`. Learner input
 * is sanitized to bounded strings/lists before prompt assembly.
 */

export interface SanitizedLearnerProfile {
  name: string;
  email: string;
  dept: string;
  college: string;
  currentCgpa?: number;
  ai_score_overall?: number;
  skills: string[];
  certificates: string[];
  experience: string[];
  trainings: string[];
  interests: string[];
  projects: string[];
  education: string[];
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function strList(value: unknown, maxItems: number, maxItem: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string').slice(0, maxItems).map((v) => v.slice(0, maxItem));
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Sanitize client-supplied learner profile: bounded strings/lists only. */
export function sanitizeLearnerProfile(input: unknown): SanitizedLearnerProfile | null {
  if (typeof input !== 'object' || input === null) return null;
  const rec = input as Record<string, unknown>;
  const name = text(rec.name, 80);
  if (!name) return null;
  return {
    name,
    email: text(rec.email, 120),
    dept: text(rec.dept, 80),
    college: text(rec.college, 120),
    currentCgpa: num(rec.currentCgpa),
    ai_score_overall: num(rec.ai_score_overall),
    skills: strList(rec.skills, 50, 80),
    certificates: strList(rec.certificates, 30, 120),
    experience: strList(rec.experience, 20, 200),
    trainings: strList(rec.trainings, 30, 120),
    interests: strList(rec.interests, 20, 80),
    projects: strList(rec.projects, 20, 200),
    education: strList(rec.education, 10, 200),
  };
}

export const CAREER_PATH_SYSTEM_PROMPT = `You are an expert career counsellor and AI career path advisor specializing in learner career development. Your role is to analyze learner profiles and generate comprehensive, personalized career development paths.

Analyze the learner based on:
1. **Skill-Based Roles**: Match their technical skills to relevant job roles and positions
2. **Interest Alignment**: Consider their stated interests and career aspirations
3. **Skill Gap Analysis**: Identify missing skills needed for target roles
4. **Development Roadmap**: Create a step-by-step skill development plan
5. **Salary Expectations**: Provide realistic salary ranges for each career stage

Generate career paths that are:
- Realistic and achievable based on current profile
- Aligned with industry trends and job market demands (2024-2025)
- Practical with specific skill gaps and development areas
- Actionable with concrete next steps and learning resources
- Include salary expectations for each role level
- Diversified with alternative career directions

Always format your response as valid JSON. Be specific, encouraging, and data-driven with current market insights.`;

export function buildlearnerProfileContext(learner: SanitizedLearnerProfile): string {
  let context = `\n=== LEARNER PROFILE ===\n`;
  context += `Name: ${learner.name}\n`;
  context += `Email: ${learner.email}\n`;
  context += `Department/Field: ${learner.dept}\n`;
  context += `College/University: ${learner.college}\n`;

  if (learner.currentCgpa) {
    context += `Current CGPA: ${learner.currentCgpa}/4.0\n`;
  }

  if (learner.ai_score_overall !== undefined) {
    context += `AI Assessment Score: ${learner.ai_score_overall}%\n`;
  }

  if (learner.skills && learner.skills.length > 0) {
    context += `\nSkills:\n`;
    learner.skills.forEach((skill) => {
      context += `  • ${skill}\n`;
    });
  }

  if (learner.certificates && learner.certificates.length > 0) {
    context += `\nCertificates & Credentials (${learner.certificates.length} total):\n`;
    learner.certificates.forEach((cert) => {
      context += `  • ${cert}\n`;
    });
  } else {
    context += `\nCertificates & Credentials: None listed\n`;
  }

  if (learner.experience && learner.experience.length > 0) {
    context += `\nExperience:\n`;
    learner.experience.forEach((exp) => {
      context += `  • ${exp}\n`;
    });
  }

  if (learner.trainings && learner.trainings.length > 0) {
    context += `\nTrainings & Courses:\n`;
    learner.trainings.forEach((training) => {
      context += `  • ${training}\n`;
    });
  }

  if (learner.projects && learner.projects.length > 0) {
    context += `\nProjects:\n`;
    learner.projects.forEach((project) => {
      context += `  • ${project}\n`;
    });
  }

  if (learner.education && learner.education.length > 0) {
    context += `\nEducation:\n`;
    learner.education.forEach((edu) => {
      context += `  • ${edu}\n`;
    });
  }

  if (learner.interests && learner.interests.length > 0) {
    context += `\nInterests & Goals:\n`;
    learner.interests.forEach((interest) => {
      context += `  • ${interest}\n`;
    });
  }

  context += `\n==================\n`;
  return context;
}

export function buildCareerPathUserPrompt(profileContext: string): string {
  return `Based on the following learner profile, generate a comprehensive career development path with focus on:
1. Skill-based job/role recommendations
2. Interest-aligned career paths
3. Detailed skill gap analysis
4. Skill development roadmap
5. Realistic salary expectations

${profileContext}

Generate a detailed JSON response with:
1. **currentRole**: Current assessed role/level based on skills (entry, junior, mid, senior, lead)
2. **careerGoal**: Primary career goal based on interests and skills
3. **overallScore**: Career readiness score (0-100) based on skills, experience, and education
4. **strengths**: Key strengths (4-6 items) - what they're good at
5. **gaps**: Skill gaps to address (4-6 items) - what they need to learn
6. **recommendedPath**: Career progression with 3-4 steps, each containing:
   - roleTitle: Specific job title (e.g., "Junior Full Stack Developer")
   - level: entry/junior/mid/senior/lead
   - timeline: Duration (e.g., "1-2 years")
   - estimatedTimeline: Detailed timeline explanation
   - description: Role description and what they'll do
   - skillsNeeded: Skills they already have that match this role (array)
   - skillsToGain: New skills to develop for this role (array)
   - learningResources: Specific courses/platforms/certifications (array)
   - salaryRange: Expected salary in INR/USD (e.g., "₹4-6 LPA" or "$50k-70k")
   - keyResponsibilities: Main job responsibilities (array, 3-4 items)
7. **alternativePaths**: 2-3 different career directions they could pursue
8. **actionItems**: Immediate action items to start (4-5 items)
9. **nextSteps**: Specific next steps for this month (4-5 items)

Be specific with Indian job market context if the college is in India. Include realistic salary ranges based on 2024-2025 market rates.
Ensure all arrays are properly formatted and the JSON is valid.`;
}

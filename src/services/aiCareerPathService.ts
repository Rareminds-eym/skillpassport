import OpenAI from 'openai';

// Lazy initialization of OpenAI client to avoid errors when API key is not set
let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OpenAI/OpenRouter API key is not configured. Please add VITE_OPENAI_API_KEY or VITE_OPENROUTER_API_KEY to your .env file.'
      );
    }
    openaiInstance = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'Career Path Generator',
      },
    });
  }
  return openaiInstance;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  dept: string;
  college: string;
  currentCgpa?: number;
  ai_score_overall?: number;
  skills?: string[];
  certificates?: string[];
  experience?: string[];
  trainings?: string[];
  interests?: string[];
  projects?: string[];
  education?: string[];
}

export interface CareerPathStep {
  roleTitle: string;
  level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
  timeline: string;
  estimatedTimeline: string;
  description: string;
  skillsNeeded: string[];
  skillsToGain: string[];
  learningResources: string[];
  salaryRange?: string;
  keyResponsibilities?: string[];
}

export interface CareerPathResponse {
  studentName: string;
  currentRole: string;
  careerGoal: string;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  recommendedPath: CareerPathStep[];
  alternativePaths: string[];
  actionItems: string[];
  nextSteps: string[];
  generatedAt: string;
  // Store original student data for chat context
  studentData?: {
    skills?: string[];
    certificates?: string[];
    experience?: string[];
    trainings?: string[];
    interests?: string[];
    projects?: string[];
    education?: string[];
  };
}

const CAREER_PATH_SYSTEM_PROMPT = `You are an expert career counsellor and AI career path advisor specializing in student career development. Your role is to analyze student profiles and generate comprehensive, personalized career development paths.

Analyze the student based on:
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

function buildStudentProfileContext(student: StudentProfile): string {
  let context = `\n=== STUDENT PROFILE ===\n`;
  context += `Name: ${student.name}\n`;
  context += `Email: ${student.email}\n`;
  context += `Department/Field: ${student.dept}\n`;
  context += `College/University: ${student.college}\n`;

  if (student.currentCgpa) {
    context += `Current CGPA: ${student.currentCgpa}/4.0\n`;
  }

  if (student.ai_score_overall !== undefined) {
    context += `AI Assessment Score: ${student.ai_score_overall}%\n`;
  }

  if (student.skills && student.skills.length > 0) {
    context += `\nSkills:\n`;
    student.skills.forEach((skill) => {
      context += `  • ${skill}\n`;
    });
  }

  if (student.certificates && student.certificates.length > 0) {
    context += `\nCertificates & Credentials (${student.certificates.length} total):\n`;
    student.certificates.forEach((cert) => {
      context += `  • ${cert}\n`;
    });
  } else {
    context += `\nCertificates & Credentials: None listed\n`;
  }

  if (student.experience && student.experience.length > 0) {
    context += `\nExperience:\n`;
    student.experience.forEach((exp) => {
      context += `  • ${exp}\n`;
    });
  }

  if (student.trainings && student.trainings.length > 0) {
    context += `\nTrainings & Courses:\n`;
    student.trainings.forEach((training) => {
      context += `  • ${training}\n`;
    });
  }

  if (student.projects && student.projects.length > 0) {
    context += `\nProjects:\n`;
    student.projects.forEach((project) => {
      context += `  • ${project}\n`;
    });
  }

  if (student.education && student.education.length > 0) {
    context += `\nEducation:\n`;
    student.education.forEach((edu) => {
      context += `  • ${edu}\n`;
    });
  }

  if (student.interests && student.interests.length > 0) {
    context += `\nInterests & Goals:\n`;
    student.interests.forEach((interest) => {
      context += `  • ${interest}\n`;
    });
  }

  context += `\n==================\n`;
  return context;
}

function parseCareerPathResponse(content: string): CareerPathResponse {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    studentName: parsed.studentName || '',
    currentRole: parsed.currentRole || 'Entry Level',
    careerGoal: parsed.careerGoal || 'Career Development',
    overallScore: Math.min(100, Math.max(0, parsed.overallScore || 65)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
    recommendedPath: Array.isArray(parsed.recommendedPath)
      ? parsed.recommendedPath.map((step: any) => ({
          roleTitle: step.roleTitle || 'Role',
          level: ['entry', 'junior', 'mid', 'senior', 'lead'].includes(step.level)
            ? step.level
            : 'entry',
          timeline: step.timeline || '1-2 years',
          estimatedTimeline: step.estimatedTimeline || 'Based on skill development',
          description: step.description || '',
          skillsNeeded: Array.isArray(step.skillsNeeded) ? step.skillsNeeded : [],
          skillsToGain: Array.isArray(step.skillsToGain) ? step.skillsToGain : [],
          learningResources: Array.isArray(step.learningResources) ? step.learningResources : [],
          salaryRange: step.salaryRange || 'Market rate',
          keyResponsibilities: Array.isArray(step.keyResponsibilities)
            ? step.keyResponsibilities
            : [],
        }))
      : [],
    alternativePaths: Array.isArray(parsed.alternativePaths) ? parsed.alternativePaths : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    generatedAt: new Date().toISOString(),
  };
}

export async function generateCareerPath(student: StudentProfile): Promise<CareerPathResponse> {
  try {
    // Get OpenAI client (will throw if API key not configured)
    const client = getOpenAIClient();

    const profileContext = buildStudentProfileContext(student);

    const userPrompt = `Based on the following student profile, generate a comprehensive career development path with focus on:
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

    console.log('Calling OpenRouter API...');
    const completion = await client.chat.completions
      .create({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: CAREER_PATH_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      })
      .catch((err) => {
        console.error('OpenRouter API call failed:', err);
        throw err;
      });

    console.log('API response received');

    const responseContent = completion.choices[0]?.message?.content || '';

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    const careerPath = parseCareerPathResponse(responseContent);
    careerPath.studentName = student.name;

    // Store original student data for chat context
    careerPath.studentData = {
      skills: student.skills,
      certificates: student.certificates,
      experience: student.experience,
      trainings: student.trainings,
      interests: student.interests,
      projects: student.projects,
      education: student.education,
    };

    return careerPath;
  } catch (error) {
    console.error('Error generating career path:', error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 402) {
        throw new Error(
          'Insufficient credits. Please add credits at https://openrouter.ai/settings/credits'
        );
      }
      if (error.status === 401) {
        throw new Error('Invalid API key. Please check your VITE_OPENAI_API_KEY in .env file.');
      }
      throw new Error(`API Error: ${error.message}`);
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse career path response. Please try again.');
    }

    throw error;
  }
}

/**
 * List of common action verbs for job responsibilities
 */
const ACTION_VERBS = [
  'Analyze',
  'Build',
  'Collaborate',
  'Create',
  'Design',
  'Develop',
  'Drive',
  'Evaluate',
  'Execute',
  'Facilitate',
  'Guide',
  'Implement',
  'Lead',
  'Manage',
  'Monitor',
  'Optimize',
  'Oversee',
  'Plan',
  'Research',
  'Review',
  'Support',
  'Test',
  'Train',
  'Transform',
  'Write',
];

/**
 * Check if a string starts with an action verb
 */
function startsWithActionVerb(text: string): boolean {
  const firstWord = text.trim().split(/\s+/)[0];
  return ACTION_VERBS.some(
    (verb) =>
      firstWord.toLowerCase() === verb.toLowerCase() ||
      firstWord.toLowerCase().startsWith(verb.toLowerCase())
  );
}

/**
 * Ensure a responsibility starts with an action verb
 */
function ensureActionVerb(responsibility: string): string {
  const trimmed = responsibility.trim();
  if (startsWithActionVerb(trimmed)) {
    return trimmed;
  }
  // Prepend a generic action verb if missing
  return `Manage ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

/**
 * Parse AI response to extract exactly 3 responsibilities
 */
function parseResponsibilitiesResponse(content: string, roleName: string): string[] {
  // Try to extract JSON array first
  const jsonMatch = content.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const responsibilities = parsed
          .slice(0, 3)
          .map((item: string) => ensureActionVerb(String(item)));

        // Pad with fallback if less than 3
        while (responsibilities.length < 3) {
          responsibilities.push(getFallbackResponsibilities(roleName)[responsibilities.length]);
        }
        return responsibilities;
      }
    } catch (e) {
      // Fall through to line parsing
    }
  }

  // Try to parse numbered or bulleted list
  const lines = content
    .split('\n')
    .map((line) => line.replace(/^[\d\.\-\*\•]+\s*/, '').trim())
    .filter((line) => line.length > 10 && line.length < 200);

  if (lines.length >= 3) {
    return lines.slice(0, 3).map((line) => ensureActionVerb(line));
  }

  // Return fallback if parsing fails
  return getFallbackResponsibilities(roleName);
}

/**
 * Get fallback responsibilities when AI is unavailable
 * @param roleName - The specific job role name
 * @returns string[] - Array of 3 generic responsibility strings
 */
export function getFallbackResponsibilities(roleName: string): string[] {
  return [
    `Design and develop solutions in the ${roleName} domain`,
    `Collaborate with cross-functional teams on projects`,
    `Continuously learn and apply new skills in your field`,
  ];
}

/**
 * Generate AI-powered job responsibilities for a career role
 * @param roleName - The specific job role name
 * @param clusterTitle - The career cluster context
 * @returns Promise<string[]> - Array of 3 responsibility strings
 */
export async function generateRoleResponsibilities(
  roleName: string,
  clusterTitle: string
): Promise<string[]> {
  // Validate inputs
  if (!roleName || roleName.trim() === '') {
    return getFallbackResponsibilities('professional');
  }

  try {
    // Get OpenAI client (will throw if API key not configured)
    const client = getOpenAIClient();

    const prompt = `Generate exactly 3 key job responsibilities for a ${roleName} role in the ${clusterTitle} career cluster.

Requirements:
- Each responsibility must start with an action verb (e.g., Design, Develop, Analyze, Lead, Manage)
- Each responsibility should be concise (10-20 words)
- Responsibilities should cover different aspects of the role
- Be specific to the ${roleName} role, not generic

Return ONLY a JSON array of 3 strings, nothing else. Example format:
["Design and implement...", "Collaborate with...", "Analyze and optimize..."]`;

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a career advisor that generates concise, action-oriented job responsibilities. Always respond with a valid JSON array of exactly 3 strings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    if (!responseContent) {
      return getFallbackResponsibilities(roleName);
    }

    return parseResponsibilitiesResponse(responseContent, roleName);
  } catch (error) {
    console.error('Error generating role responsibilities:', error);
    return getFallbackResponsibilities(roleName);
  }
}

export async function generateCareerPathStreaming(
  student: StudentProfile
): Promise<AsyncGenerator<string, void, unknown>> {
  const client = getOpenAIClient();
  const profileContext = buildStudentProfileContext(student);

  const userPrompt = `Based on the following student profile, generate a comprehensive career development path. Consider their skills, interests, background, and market demands.

${profileContext}

Generate a detailed JSON response with:
1. Current assessed role/level (entry, junior, mid, senior, lead)
2. Career goal based on interests and skills
3. Overall career readiness score (0-100)
4. Key strengths (3-5 items)
5. Skill gaps to address (3-5 items)
6. Recommended career path with 3-4 progression steps
7. Alternative career paths (2-3 different directions)
8. Immediate action items (3-4 items)
9. Next steps for this month (3-4 items)

Ensure all arrays are properly formatted and the JSON is valid.`;

  const stream = await client.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: CAREER_PATH_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    max_tokens: 1500,
    temperature: 0.7,
    stream: true,
  });

  return (async function* () {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  })();
}

/**
 * Industry demand data structure
 */
export interface IndustryDemandData {
  description: string;
  demandLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  demandPercentage: number;
}

/**
 * Get fallback industry demand when AI is unavailable
 * Uses role name to provide slightly varied fallback data
 * @param roleName - The specific job role name
 * @returns IndustryDemandData - Fallback industry demand data
 */
export function getFallbackIndustryDemand(roleName: string): IndustryDemandData {
  // Generate varied fallback based on role name hash to avoid always showing "High"
  const hash = roleName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const levels: Array<{ level: IndustryDemandData['demandLevel']; percentage: number }> = [
    { level: 'Medium', percentage: 55 },
    { level: 'High', percentage: 75 },
    { level: 'Very High', percentage: 90 },
    { level: 'Medium', percentage: 60 },
  ];
  const selected = levels[hash % levels.length];

  return {
    description: `${roleName} roles show ${selected.level.toLowerCase()} market demand with steady opportunities.`,
    demandLevel: selected.level,
    demandPercentage: selected.percentage,
  };
}

/**
 * Parse AI response to extract industry demand data
 */
function parseIndustryDemandResponse(content: string, roleName: string): IndustryDemandData {
  try {
    // Try to extract JSON object
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize demand level
      const validLevels = ['Low', 'Medium', 'High', 'Very High'];
      let demandLevel = parsed.demandLevel || 'Medium';
      if (!validLevels.includes(demandLevel)) {
        demandLevel = 'Medium';
      }

      // Validate percentage (0-100)
      let demandPercentage = parseInt(parsed.demandPercentage) || 65;
      demandPercentage = Math.min(100, Math.max(0, demandPercentage));

      // Truncate description to max 2 sentences
      let description = parsed.description || getFallbackIndustryDemand(roleName).description;
      const sentences = description.match(/[^.!?]+[.!?]+/g) || [description];
      if (sentences.length > 2) {
        description = sentences.slice(0, 2).join(' ').trim();
      }

      return {
        description,
        demandLevel: demandLevel as IndustryDemandData['demandLevel'],
        demandPercentage,
      };
    }
  } catch (e) {
    // Fall through to fallback
  }

  return getFallbackIndustryDemand(roleName);
}

/**
 * Generate AI-powered industry demand data for a career role
 * @param roleName - The specific job role name
 * @param clusterTitle - The career cluster context
 * @returns Promise<IndustryDemandData> - Industry demand information
 */
export async function generateIndustryDemand(
  roleName: string,
  clusterTitle: string
): Promise<IndustryDemandData> {
  // Validate inputs
  if (!roleName || roleName.trim() === '') {
    return getFallbackIndustryDemand('professional');
  }

  try {
    // Get OpenAI client (will throw if API key not configured)
    const client = getOpenAIClient();

    const prompt = `Analyze the current job market demand for a ${roleName} role in the ${clusterTitle} career cluster.

IMPORTANT: Be realistic and accurate. Assess based on actual market data.

Provide:
1. A brief description (2 short sentences, max 25 words total) about market demand
2. Demand level: "Low", "Medium", "High", or "Very High" based on real market conditions
3. Demand percentage matching the level: Low=20-40, Medium=41-65, High=66-85, Very High=86-100

Guidelines:
- AI/ML, Cloud, Cybersecurity roles: typically "High" or "Very High"
- Software Engineering, Data Science: typically "High"
- Traditional IT support, basic admin roles: typically "Medium"
- Declining or oversaturated fields: "Low" or "Medium"

Return ONLY a JSON object with these exact keys:
{"description": "...", "demandLevel": "...", "demandPercentage": ...}`;

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a job market analyst providing accurate demand assessments. Base your analysis on real 2024-2025 market trends. Vary your responses - use the full range from Low to Very High based on actual demand.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    if (!responseContent) {
      return getFallbackIndustryDemand(roleName);
    }

    return parseIndustryDemandResponse(responseContent, roleName);
  } catch (error) {
    console.error('Error generating industry demand:', error);
    return getFallbackIndustryDemand(roleName);
  }
}

/**
 * Career progression stage
 */
export interface CareerStage {
  title: string;
  yearsExperience: string;
}

/**
 * Learning roadmap phase
 */
export interface RoadmapPhase {
  month: string;
  title: string;
  description: string;
  tasks: string[];
  color: string;
}

/**
 * Recommended course structure
 */
export interface RecommendedCourse {
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  skills: string[];
}

/**
 * Free resource structure
 */
export interface FreeResource {
  title: string;
  description: string;
  type: 'YouTube' | 'Documentation' | 'Certification' | 'Community' | 'Tool';
  url: string;
}

/**
 * Action item structure
 */
export interface ActionItem {
  title: string;
  description: string;
}

/**
 * Suggested project structure
 */
export interface SuggestedProject {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skills: string[];
  estimatedTime: string;
}

/**
 * Combined role overview data structure
 */
export interface RoleOverviewData {
  responsibilities: string[];
  industryDemand: IndustryDemandData;
  careerProgression: CareerStage[];
  learningRoadmap: RoadmapPhase[];
  recommendedCourses: RecommendedCourse[];
  freeResources: FreeResource[];
  actionItems: ActionItem[];
  suggestedProjects: SuggestedProject[];
}

/**
 * Get fallback career progression
 */
export function getFallbackCareerProgression(roleName: string): CareerStage[] {
  return [
    { title: `Junior ${roleName}`, yearsExperience: '0-2 yrs' },
    { title: `${roleName}`, yearsExperience: '2-5 yrs' },
    { title: `Senior ${roleName}`, yearsExperience: '5-8 yrs' },
    { title: `Lead ${roleName}`, yearsExperience: '8+ yrs' },
  ];
}

/**
 * Get fallback learning roadmap - more role-specific content
 */
export function getFallbackLearningRoadmap(roleName: string): RoadmapPhase[] {
  return [
    {
      month: 'Month 1-2',
      title: `${roleName} Foundations`,
      description: `Master the core concepts, tools, and fundamentals required for ${roleName} roles`,
      tasks: [
        `Learn essential ${roleName} concepts and terminology`,
        `Set up your ${roleName} development environment`,
        `Complete beginner tutorials and exercises`,
        `Study industry best practices for ${roleName}`,
      ],
      color: '#22c55e',
    },
    {
      month: 'Month 3-4',
      title: `Hands-on ${roleName} Practice`,
      description: `Build practical ${roleName} skills through real projects and exercises`,
      tasks: [
        `Build 2-3 guided ${roleName} projects`,
        `Practice solving real-world ${roleName} problems`,
        `Learn advanced ${roleName} tools and techniques`,
        `Get feedback from ${roleName} mentors or peers`,
      ],
      color: '#3b82f6',
    },
    {
      month: 'Month 5-6',
      title: `${roleName} Portfolio & Career`,
      description: `Create an impressive ${roleName} portfolio and prepare for job applications`,
      tasks: [
        `Complete 2-3 portfolio-worthy ${roleName} projects`,
        `Optimize resume with ${roleName} keywords and achievements`,
        `Apply for ${roleName} internships or entry-level positions`,
        `Practice ${roleName} interview questions and scenarios`,
      ],
      color: '#a855f7',
    },
  ];
}

/**
 * Get fallback recommended courses
 */
export function getFallbackRecommendedCourses(roleName: string): RecommendedCourse[] {
  return [
    {
      title: `${roleName} Fundamentals`,
      description: `Master the core concepts and skills needed for ${roleName} roles`,
      duration: '4 weeks',
      level: 'Beginner',
      skills: ['Core Concepts', 'Best Practices', 'Tools'],
    },
    {
      title: `Advanced ${roleName} Skills`,
      description: 'Take your skills to the next level with advanced techniques',
      duration: '6 weeks',
      level: 'Intermediate',
      skills: ['Advanced Techniques', 'Problem Solving', 'Optimization'],
    },
    {
      title: 'Project-Based Learning',
      description: 'Build real-world projects to strengthen your portfolio',
      duration: '8 weeks',
      level: 'Advanced',
      skills: ['Project Management', 'Implementation', 'Deployment'],
    },
    {
      title: 'Industry Certification Prep',
      description: 'Prepare for industry-recognized certifications',
      duration: '4 weeks',
      level: 'Professional',
      skills: ['Certification', 'Industry Standards', 'Best Practices'],
    },
  ];
}

/**
 * Get fallback free resources
 */
export function getFallbackFreeResources(roleName: string): FreeResource[] {
  const searchQuery = encodeURIComponent(roleName + ' tutorial');
  return [
    {
      title: 'YouTube Tutorials',
      description: `Free video tutorials from industry experts on ${roleName} topics`,
      type: 'YouTube',
      url: `https://www.youtube.com/results?search_query=${searchQuery}`,
    },
    {
      title: 'Official Documentation',
      description: 'Comprehensive guides and references for tools and frameworks',
      type: 'Documentation',
      url: `https://www.google.com/search?q=${encodeURIComponent(roleName + ' documentation')}`,
    },
    {
      title: 'Industry Certifications',
      description: 'Free certification programs to validate your skills',
      type: 'Certification',
      url: `https://www.google.com/search?q=${encodeURIComponent(roleName + ' free certification')}`,
    },
  ];
}

/**
 * Get fallback action items
 */
export function getFallbackActionItems(roleName: string): ActionItem[] {
  return [
    { title: 'Start Learning', description: `Enroll in a ${roleName} foundational course` },
    { title: 'Build Daily Habits', description: 'Dedicate 1-2 hours daily to practice' },
    { title: 'Join Communities', description: `Connect with ${roleName} professionals online` },
    { title: 'Track Progress', description: 'Set weekly goals and review your growth' },
  ];
}

/**
 * Get fallback suggested projects
 */
export function getFallbackSuggestedProjects(roleName: string): SuggestedProject[] {
  return [
    {
      title: `Build Your First ${roleName} Project`,
      description: `Start with a simple beginner project to understand the fundamentals. You'll learn the basic tools, workflows, and concepts that every ${roleName} needs to know. This is your foundation for more complex work!`,
      difficulty: 'Beginner',
      skills: ['Core Concepts', 'Basic Tools', 'Problem Solving'],
      estimatedTime: '2-4 hours',
    },
    {
      title: `${roleName} Portfolio Piece`,
      description: `Create a real-world project that solves an actual problem. This intermediate project will challenge you to apply multiple skills together and give you something impressive to show potential employers or clients.`,
      difficulty: 'Intermediate',
      skills: ['Applied Skills', 'Project Planning', 'Documentation', 'Best Practices'],
      estimatedTime: '1-2 weeks',
    },
    {
      title: `Advanced ${roleName} Challenge`,
      description: `Take on a complex project that pushes your boundaries. You'll integrate advanced techniques, optimize for performance, and create something that demonstrates mastery of ${roleName} skills.`,
      difficulty: 'Advanced',
      skills: ['Advanced Techniques', 'Optimization', 'System Design', 'Leadership'],
      estimatedTime: '2-4 weeks',
    },
  ];
}

/**
 * Get fallback role overview when AI is unavailable
 */
export function getFallbackRoleOverview(roleName: string): RoleOverviewData {
  return {
    responsibilities: getFallbackResponsibilities(roleName),
    industryDemand: getFallbackIndustryDemand(roleName),
    careerProgression: getFallbackCareerProgression(roleName),
    learningRoadmap: getFallbackLearningRoadmap(roleName),
    recommendedCourses: getFallbackRecommendedCourses(roleName),
    freeResources: getFallbackFreeResources(roleName),
    actionItems: getFallbackActionItems(roleName),
    suggestedProjects: getFallbackSuggestedProjects(roleName),
  };
}

/**
 * Parse combined AI response for role overview
 */
function parseRoleOverviewResponse(content: string, roleName: string): RoleOverviewData {
  const colors = ['#22c55e', '#3b82f6', '#a855f7'];

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Parse responsibilities
      let responsibilities: string[] = [];
      if (Array.isArray(parsed.responsibilities) && parsed.responsibilities.length > 0) {
        responsibilities = parsed.responsibilities
          .slice(0, 3)
          .map((item: string) => ensureActionVerb(String(item)));
      }
      while (responsibilities.length < 3) {
        responsibilities.push(getFallbackResponsibilities(roleName)[responsibilities.length]);
      }

      // Parse industry demand
      const validLevels = ['Low', 'Medium', 'High', 'Very High'];
      let demandLevel = parsed.demandLevel || 'High';
      if (!validLevels.includes(demandLevel)) {
        demandLevel = 'High';
      }

      let demandPercentage = parseInt(parsed.demandPercentage) || 75;
      demandPercentage = Math.min(100, Math.max(0, demandPercentage));

      let description = parsed.demandDescription || getFallbackIndustryDemand(roleName).description;
      const sentences = description.match(/[^.!?]+[.!?]+/g) || [description];
      if (sentences.length > 2) {
        description = sentences.slice(0, 2).join(' ').trim();
      }

      // Parse career progression
      let careerProgression: CareerStage[] = [];
      if (Array.isArray(parsed.careerProgression) && parsed.careerProgression.length >= 4) {
        careerProgression = parsed.careerProgression.slice(0, 4).map((stage: any) => ({
          title: stage.title || 'Role',
          yearsExperience: stage.yearsExperience || stage.years || '0+ yrs',
        }));
      }
      if (careerProgression.length < 4) {
        careerProgression = getFallbackCareerProgression(roleName);
      }

      // Parse learning roadmap
      let learningRoadmap: RoadmapPhase[] = [];
      if (Array.isArray(parsed.learningRoadmap) && parsed.learningRoadmap.length >= 3) {
        learningRoadmap = parsed.learningRoadmap.slice(0, 3).map((phase: any, idx: number) => ({
          month: phase.month || `Month ${idx * 2 + 1}-${idx * 2 + 2}`,
          title: phase.title || 'Learning Phase',
          description: phase.description || 'Build skills and knowledge',
          tasks: Array.isArray(phase.tasks) ? phase.tasks.slice(0, 4) : [],
          color: colors[idx] || '#3b82f6',
        }));
      }
      if (learningRoadmap.length < 3) {
        learningRoadmap = getFallbackLearningRoadmap(roleName);
      }

      // Parse recommended courses
      const validCourseLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
      let recommendedCourses: RecommendedCourse[] = [];
      if (Array.isArray(parsed.recommendedCourses) && parsed.recommendedCourses.length >= 4) {
        recommendedCourses = parsed.recommendedCourses.slice(0, 4).map((course: any) => {
          let level = course.level || 'Beginner';
          if (!validCourseLevels.includes(level)) {
            level = 'Beginner';
          }
          return {
            title: course.title || 'Course',
            description: course.description || 'Learn essential skills',
            duration: course.duration || '4 weeks',
            level: level as RecommendedCourse['level'],
            skills: Array.isArray(course.skills) ? course.skills.slice(0, 3) : [],
          };
        });
      }
      if (recommendedCourses.length < 4) {
        recommendedCourses = getFallbackRecommendedCourses(roleName);
      }

      // Parse free resources
      const validResourceTypes = ['YouTube', 'Documentation', 'Certification', 'Community', 'Tool'];
      let freeResources: FreeResource[] = [];
      if (Array.isArray(parsed.freeResources) && parsed.freeResources.length >= 3) {
        freeResources = parsed.freeResources.slice(0, 3).map((resource: any) => {
          let type = resource.type || 'Documentation';
          if (!validResourceTypes.includes(type)) {
            type = 'Documentation';
          }
          return {
            title: resource.title || 'Resource',
            description: resource.description || 'Helpful learning resource',
            type: type as FreeResource['type'],
            url: resource.url || '',
          };
        });
      }
      if (freeResources.length < 3) {
        freeResources = getFallbackFreeResources(roleName);
      }

      // Parse action items
      let actionItems: ActionItem[] = [];
      if (Array.isArray(parsed.actionItems) && parsed.actionItems.length >= 4) {
        actionItems = parsed.actionItems.slice(0, 4).map((item: any) => ({
          title: item.title || 'Action',
          description: item.description || 'Take action to progress',
        }));
      }
      if (actionItems.length < 4) {
        actionItems = getFallbackActionItems(roleName);
      }

      // Parse suggested projects
      const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
      let suggestedProjects: SuggestedProject[] = [];
      if (Array.isArray(parsed.suggestedProjects) && parsed.suggestedProjects.length >= 3) {
        suggestedProjects = parsed.suggestedProjects.slice(0, 3).map((project: any) => {
          let difficulty = project.difficulty || 'Beginner';
          if (!validDifficulties.includes(difficulty)) {
            difficulty = 'Beginner';
          }
          return {
            title: project.title || 'Project',
            description: project.description || 'Build something amazing',
            difficulty: difficulty as SuggestedProject['difficulty'],
            skills: Array.isArray(project.skills) ? project.skills.slice(0, 4) : [],
            estimatedTime: project.estimatedTime || '1-2 weeks',
          };
        });
      }
      if (suggestedProjects.length < 3) {
        suggestedProjects = getFallbackSuggestedProjects(roleName);
      }

      return {
        responsibilities,
        industryDemand: {
          description,
          demandLevel: demandLevel as IndustryDemandData['demandLevel'],
          demandPercentage,
        },
        careerProgression,
        learningRoadmap,
        recommendedCourses,
        freeResources,
        actionItems,
        suggestedProjects,
      };
    }
  } catch (e) {
    console.error('Error parsing role overview response:', e);
  }

  return getFallbackRoleOverview(roleName);
}

// Worker API URL for role overview
const ROLE_OVERVIEW_API_URL =
  import.meta.env.VITE_ROLE_OVERVIEW_API_URL ||
  'https://role-overview-api.dark-mode-d021.workers.dev';

/**
 * Generate combined role overview data via Cloudflare Worker
 * The worker handles the fallback chain: OpenRouter → Gemini → Static fallback
 * @param roleName - The specific job role name
 * @param clusterTitle - The career cluster context
 * @returns Promise<RoleOverviewData> - Combined responsibilities and industry demand
 */
export async function generateRoleOverview(
  roleName: string,
  clusterTitle: string
): Promise<RoleOverviewData> {
  if (!roleName || roleName.trim() === '') {
    console.warn('[RoleOverview] Empty role name provided, using fallback');
    return getFallbackRoleOverview('professional');
  }

  console.log(`[RoleOverview] Calling worker API for: ${roleName} in ${clusterTitle}`);

  try {
    const response = await fetch(`${ROLE_OVERVIEW_API_URL}/role-overview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roleName: roleName.trim(),
        clusterTitle: clusterTitle.trim(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[RoleOverview] Worker API error ${response.status}:`, errorText);
      throw new Error(`Worker API error: ${response.status}`);
    }

    const result = (await response.json()) as {
      success: boolean;
      data?: RoleOverviewData;
      source?: string;
      error?: string;
    };

    if (!result.success || !result.data) {
      console.error('[RoleOverview] Worker returned error:', result.error);
      throw new Error(result.error || 'Worker returned no data');
    }

    console.log(`[RoleOverview] Success via ${result.source} for: ${roleName}`);
    return result.data;
  } catch (error: any) {
    console.error('[RoleOverview] Worker API call failed:', error.message);

    // Fallback to local static data if worker is unavailable
    console.log(`[RoleOverview] Using local fallback for: ${roleName}`);
    return getFallbackRoleOverview(roleName);
  }
}

/**
 * Course input for AI matching
 */
export interface CourseForMatching {
  id: string;
  title: string;
  description: string;
  skills?: string[];
  category?: string;
}

/**
 * Course matching result from AI
 */
export interface CourseMatchingResult {
  matchedCourseIds: string[];
  reasoning: string;
}

/**
 * Match platform courses to a role using AI
 * Calls the /match-courses endpoint on the role-overview-api worker
 *
 * @param roleName - The job role name (e.g., "Software Engineer")
 * @param clusterTitle - The career cluster (e.g., "Technology")
 * @param courses - Array of available platform courses
 * @returns Promise<CourseMatchingResult> - Matched course IDs and reasoning
 */
export async function matchCoursesForRole(
  roleName: string,
  clusterTitle: string,
  courses: CourseForMatching[]
): Promise<CourseMatchingResult> {
  // Validate inputs
  if (!roleName || roleName.trim() === '') {
    console.warn('[CourseMatching] Empty role name provided');
    return { matchedCourseIds: [], reasoning: 'No role specified' };
  }

  if (!courses || courses.length === 0) {
    console.warn('[CourseMatching] No courses provided');
    return { matchedCourseIds: [], reasoning: 'No courses available' };
  }

  console.log(`[CourseMatching] Matching ${courses.length} courses for: ${roleName}`);

  try {
    const response = await fetch(`${ROLE_OVERVIEW_API_URL}/match-courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roleName: roleName.trim(),
        clusterTitle: (clusterTitle || '').trim(),
        courses: courses.slice(0, 20).map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description || '',
          skills: c.skills || [],
          category: c.category || '',
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CourseMatching] Worker API error ${response.status}:`, errorText);
      throw new Error(`Worker API error: ${response.status}`);
    }

    const result = (await response.json()) as {
      success: boolean;
      data?: CourseMatchingResult;
      source?: string;
      error?: string;
    };

    if (!result.success || !result.data) {
      console.error('[CourseMatching] Worker returned error:', result.error);
      throw new Error(result.error || 'Worker returned no data');
    }

    console.log(`[CourseMatching] Success via ${result.source}:`, result.data.matchedCourseIds);
    return result.data;
  } catch (error: any) {
    console.error('[CourseMatching] Worker API call failed:', error.message);

    // Return empty result on failure - let the UI handle fallback
    return {
      matchedCourseIds: [],
      reasoning: 'AI matching unavailable',
    };
  }
}

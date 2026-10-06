import { getLogger } from '@/shared/config/logging';
import { ssoClient } from '@/shared/api/ssoClient';

const logger = getLogger('ai-career-path');

// Server-side generation (Cloudflare Workers AI via authenticated Pages endpoint).
// Parsing, normalization and fallbacks below are unchanged.
async function postCareerPathOp<T>(op: string, payload: Record<string, unknown>): Promise<T> {
  const { getApiUrl } = await import('@/shared/api/apiUtils');
  const url = getApiUrl(`career-path/${op}`);
  const response = await ssoClient.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Career path request failed (${response.status})`);
  }
  const json = (await response.json()) as { success: boolean; data: T };
  if (!json.success) {
    throw new Error('Career path request failed');
  }
  return json.data;
}

export interface LearnerProfile {
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
  learnerName: string;
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
  // Store original learner data for chat context
  learnerData?: {
    skills?: string[];
    certificates?: string[];
    experience?: string[];
    trainings?: string[];
    interests?: string[];
    projects?: string[];
    education?: string[];
  };
}

// Career-path system prompt + learner-context assembly are server-owned now
// (functions/api/career-path/lib/). Parsing/normalization below unchanged.

function parseCareerPathResponse(content: string): CareerPathResponse {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    learnerName: parsed.learnerName || '',
    currentRole: parsed.currentRole || 'Entry Level',
    careerGoal: parsed.careerGoal || 'Career Development',
    overallScore: Math.min(100, Math.max(0, parsed.overallScore || 65)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
    recommendedPath: Array.isArray(parsed.recommendedPath) ? parsed.recommendedPath.map((step: any) => ({
      roleTitle: step.roleTitle || 'Role',
      level: ['entry', 'junior', 'mid', 'senior', 'lead'].includes(step.level) ? step.level : 'entry',
      timeline: step.timeline || '1-2 years',
      estimatedTimeline: step.estimatedTimeline || 'Based on skill development',
      description: step.description || '',
      skillsNeeded: Array.isArray(step.skillsNeeded) ? step.skillsNeeded : [],
      skillsToGain: Array.isArray(step.skillsToGain) ? step.skillsToGain : [],
      learningResources: Array.isArray(step.learningResources) ? step.learningResources : [],
      salaryRange: step.salaryRange || 'Market rate',
      keyResponsibilities: Array.isArray(step.keyResponsibilities) ? step.keyResponsibilities : [],
    })) : [],
    alternativePaths: Array.isArray(parsed.alternativePaths) ? parsed.alternativePaths : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    generatedAt: new Date().toISOString(),
  };
}

export async function generateCareerPath(learner: LearnerProfile): Promise<CareerPathResponse> {
  try {
    const { content: responseContent } = await postCareerPathOp<{ content: string }>('generate', {
      learner,
    });
    
    if (!responseContent) {
      throw new Error('Empty generation response');
    }

    const careerPath = parseCareerPathResponse(responseContent);
    careerPath.learnerName = learner.name;
    
    // Store original learner data for chat context
    careerPath.learnerData = {
      skills: learner.skills,
      certificates: learner.certificates,
      experience: learner.experience,
      trainings: learner.trainings,
      interests: learner.interests,
      projects: learner.projects,
      education: learner.education,
    };
    
    return careerPath;
  } catch (error) {
    logger.error('Career path generation failed', error instanceof Error ? error : new Error(String(error)));

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
 * Get fallback responsibilities when AI is unavailable
 * IMPORTANT: These are EMERGENCY fallbacks only - should NOT be displayed to users
 * The backend AI should ALWAYS generate real, personalized responsibilities
 * @param roleName - The specific job role name
 * @returns string[] - Array of 3 generic responsibility strings
 */
export function getFallbackResponsibilities(roleName: string): string[] {
  logger.warn('AI generation failed, using fallback responsibilities', { roleName });
  return [
    `[AI UNAVAILABLE] Design and develop solutions in the ${roleName} domain`,
    `[AI UNAVAILABLE] Collaborate with cross-functional teams on projects`,
    `[AI UNAVAILABLE] Research and apply new skills in your field`
  ];
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
 * IMPORTANT: This is an EMERGENCY fallback only - should NOT be displayed to users
 * The backend AI should ALWAYS generate real, personalized industry demand data
 * @param roleName - The specific job role name
 * @returns IndustryDemandData - Fallback industry demand data
 */
export function getFallbackIndustryDemand(roleName: string): IndustryDemandData {
  logger.warn('AI generation failed, using fallback industry demand', { roleName });
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
    description: `[AI UNAVAILABLE] ${roleName} roles show ${selected.level.toLowerCase()} market demand with steady opportunities.`,
    demandLevel: selected.level,
    demandPercentage: selected.percentage
  };
}

/**
 * Parse AI response to extract industry demand data
 */
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
 * IMPORTANT: This is an EMERGENCY fallback only - should NOT be displayed to users
 * The backend AI should ALWAYS generate real, personalized career progression
 */
export function getFallbackCareerProgression(roleName: string): CareerStage[] {
  logger.warn('AI generation failed, using fallback career progression', { roleName });
  return [
    { title: `[AI UNAVAILABLE] Junior ${roleName}`, yearsExperience: '0-2 yrs' },
    { title: `[AI UNAVAILABLE] ${roleName}`, yearsExperience: '2-5 yrs' },
    { title: `[AI UNAVAILABLE] Senior ${roleName}`, yearsExperience: '5-8 yrs' },
    { title: `[AI UNAVAILABLE] Lead ${roleName}`, yearsExperience: '8+ yrs' }
  ];
}

/**
 * Get fallback learning roadmap - more role-specific content
 * IMPORTANT: This is an EMERGENCY fallback only - should NOT be displayed to users
 * The backend AI should ALWAYS generate real, personalized learning roadmap
 */
export function getFallbackLearningRoadmap(roleName: string): RoadmapPhase[] {
  logger.warn('AI generation failed, using fallback learning roadmap', { roleName });
  return [
    {
      month: 'Month 1-2',
      title: `[AI UNAVAILABLE] ${roleName} Foundations`,
      description: `Master the core concepts, tools, and fundamentals required for ${roleName} roles`,
      tasks: [
        `Learn essential ${roleName} concepts and terminology`,
        `Set up your ${roleName} development environment`,
        `Complete beginner tutorials and exercises`,
        `Study industry best practices for ${roleName}`
      ],
      color: '#22c55e'
    },
    {
      month: 'Month 3-4',
      title: `[AI UNAVAILABLE] Hands-on ${roleName} Practice`,
      description: `Build practical ${roleName} skills through real projects and exercises`,
      tasks: [
        `Build 2-3 guided ${roleName} projects`,
        `Practice solving real-world ${roleName} problems`,
        `Learn advanced ${roleName} tools and techniques`,
        `Get feedback from ${roleName} mentors or peers`
      ],
      color: '#3b82f6'
    },
    {
      month: 'Month 5-6',
      title: `[AI UNAVAILABLE] ${roleName} Portfolio & Career`,
      description: `Create an impressive ${roleName} portfolio and prepare for job applications`,
      tasks: [
        `Complete 2-3 portfolio-worthy ${roleName} projects`,
        `Optimize resume with ${roleName} keywords and achievements`,
        `Apply for ${roleName} internships or entry-level positions`,
        `Practice ${roleName} interview questions and scenarios`
      ],
      color: '#a855f7'
    }
  ];
}

/**
 * Get fallback recommended courses
 * IMPORTANT: This is an EMERGENCY fallback only - should NOT be displayed to users
 * The backend AI should ALWAYS generate real, personalized course recommendations
 */
export function getFallbackRecommendedCourses(roleName: string): RecommendedCourse[] {
  logger.warn('AI generation failed, using fallback recommended courses', { roleName });
  return [
    {
      title: `[AI UNAVAILABLE] ${roleName} Fundamentals`,
      description: `Master the core concepts and skills needed for ${roleName} roles`,
      duration: '4 weeks',
      level: 'Beginner',
      skills: ['Core Concepts', 'Best Practices', 'Tools']
    },
    {
      title: `[AI UNAVAILABLE] Advanced ${roleName} Skills`,
      description: 'Take your skills to the next level with advanced techniques',
      duration: '6 weeks',
      level: 'Intermediate',
      skills: ['Advanced Techniques', 'Problem Solving', 'Optimization']
    },
    {
      title: '[AI UNAVAILABLE] Project-Based Learning',
      description: 'Build real-world projects to strengthen your portfolio',
      duration: '8 weeks',
      level: 'Advanced',
      skills: ['Project Management', 'Implementation', 'Deployment']
    },
    {
      title: '[AI UNAVAILABLE] Industry Certification Prep',
      description: 'Prepare for industry-recognized certifications',
      duration: '4 weeks',
      level: 'Professional',
      skills: ['Certification', 'Industry Standards', 'Best Practices']
    }
  ];
}

/**
 * Get fallback free resources
 * IMPORTANT: This is an EMERGENCY fallback only - should NOT be displayed to users
 * The backend AI should ALWAYS generate real, personalized free resources
 */
export function getFallbackFreeResources(roleName: string): FreeResource[] {
  logger.warn('AI generation failed, using fallback free resources', { roleName });
  const searchQuery = encodeURIComponent(roleName + ' tutorial');
  return [
    {
      title: '[AI UNAVAILABLE] YouTube Tutorials',
      description: `Free video tutorials from industry experts on ${roleName} topics`,
      type: 'YouTube',
      url: `https://www.youtube.com/results?search_query=${searchQuery}`
    },
    {
      title: '[AI UNAVAILABLE] Official Documentation',
      description: 'Comprehensive guides and references for tools and frameworks',
      type: 'Documentation',
      url: `https://www.google.com/search?q=${encodeURIComponent(roleName + ' documentation')}`
    },
    {
      title: '[AI UNAVAILABLE] Industry Certifications',
      description: 'Free certification programs to validate your skills',
      type: 'Certification',
      url: `https://www.google.com/search?q=${encodeURIComponent(roleName + ' free certification')}`
    }
  ];
}

/**
 * Get fallback action items
 * IMPORTANT: This is an EMERGENCY fallback only - should NOT be displayed to users
 * The backend AI should ALWAYS generate real, personalized action items
 */
export function getFallbackActionItems(roleName: string): ActionItem[] {
  logger.warn('AI generation failed, using fallback action items', { roleName });
  return [
    { title: '[AI UNAVAILABLE] Start Learning', description: `Enroll in a ${roleName} foundational course` },
    { title: '[AI UNAVAILABLE] Build Daily Habits', description: 'Dedicate 1-2 hours daily to practice' },
    { title: '[AI UNAVAILABLE] Join Communities', description: `Connect with ${roleName} professionals online` },
    { title: '[AI UNAVAILABLE] Track Progress', description: 'Set weekly goals and review your growth' }
  ];
}

/**
 * Get fallback suggested projects
 * IMPORTANT: This is an EMERGENCY fallback only - should NOT be displayed to users
 * The backend AI should ALWAYS generate real, personalized project suggestions
 */
export function getFallbackSuggestedProjects(roleName: string): SuggestedProject[] {
  logger.warn('AI generation failed, using fallback suggested projects', { roleName });
  return [
    {
      title: `[AI UNAVAILABLE] Build Your First ${roleName} Project`,
      description: `Start with a simple beginner project to understand the fundamentals. You'll learn the basic tools, workflows, and concepts that every ${roleName} needs to know. This is your foundation for more complex work!`,
      difficulty: 'Beginner',
      skills: ['Core Concepts', 'Basic Tools', 'Problem Solving'],
      estimatedTime: '2-4 hours',
    },
    {
      title: `[AI UNAVAILABLE] ${roleName} Portfolio Piece`,
      description: `Create a real-world project that solves an actual problem. This intermediate project will challenge you to apply multiple skills together and give you something impressive to show potential employers or clients.`,
      difficulty: 'Intermediate',
      skills: ['Applied Skills', 'Project Planning', 'Documentation', 'Best Practices'],
      estimatedTime: '1-2 weeks',
    },
    {
      title: `[AI UNAVAILABLE] Advanced ${roleName} Challenge`,
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


// Worker API URL for role overview
// Uses local API endpoint via Pages Functions
const ROLE_OVERVIEW_API_URL =
  typeof window !== 'undefined' ? `${window.location.origin}/api/role-overview` : '/api/role-overview';

/**
 * Generate combined role overview data via Cloudflare Worker
 * Flow: Check DB → Generate via AI → Store in DB
 * @param roleName - The specific job role name
 * @param clusterTitle - The career cluster context
 * @param attemptId - Optional attempt ID to check/store in DB
 * @returns Promise<RoleOverviewData> - Combined responsibilities and industry demand
 */
export async function generateRoleOverview(
  roleName: string,
  clusterTitle: string,
  attemptId?: string
): Promise<RoleOverviewData> {
  if (!roleName || roleName.trim() === '') {
    return getFallbackRoleOverview('professional');
  }

  // Step 1: Check if data exists in DB
  if (attemptId) {
    try {
      const storageUrl = `${ROLE_OVERVIEW_API_URL}/storage?attemptId=${encodeURIComponent(attemptId)}&roleName=${encodeURIComponent(roleName)}`;
      // ssoClient.fetch attaches the JWT — these endpoints are auth-protected (401 with plain fetch).
      const dbResponse = await ssoClient.fetch(storageUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (dbResponse.ok) {
        // Unwrap apiSuccess envelope: { success, data: { exists, data } }.
        // Supports both the enveloped and a flat { exists, data } shape.
        const dbRaw = await dbResponse.json() as {
          exists?: boolean;
          data?: { exists?: boolean; data?: RoleOverviewData } | RoleOverviewData;
        } | null;
        const payload = (dbRaw?.data ?? dbRaw) as { exists?: boolean; data?: RoleOverviewData } | null;
        if (payload?.exists && payload?.data) {
          return payload.data as RoleOverviewData;
        }
      } else {
        logger.warn('Role overview DB check returned non-OK status', { roleName, status: dbResponse.status });
      }
    } catch (dbError: any) {
      logger.warn('Role overview DB check failed, proceeding to AI generation', { roleName, error: dbError.message });
    }
  }

  // Step 2: Generate via AI

  try {
    const response = await ssoClient.fetch(`${ROLE_OVERVIEW_API_URL}/role-overview`, {
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
      logger.error('Role overview worker API error', new Error(errorText), { roleName, status: response.status });
      throw new Error(`Worker API error: ${response.status}`);
    }

    const result = await response.json() as {
      success: boolean;
      data?: { data?: RoleOverviewData } & Partial<RoleOverviewData>;
      source?: string;
      error?: string;
    };

    // The worker returns apiSuccess({ data, source }), which wraps everything
    // under an envelope `data`. So the actual RoleOverviewData lives at
    // result.data.data. Unwrap defensively to also support a flat shape.
    const overview: RoleOverviewData | undefined =
      (result?.data?.data ?? result?.data) as RoleOverviewData | undefined;

    if (!result.success || !overview || !Array.isArray(overview.responsibilities)) {
      logger.error('Role overview worker returned error', new Error(result.error || 'Worker returned no data'), { roleName });
      throw new Error(result.error || 'Worker returned no data');
    }

    // Step 3: Store in DB if attemptId provided
    if (attemptId) {
      try {
        const storeResponse = await ssoClient.fetch(`${ROLE_OVERVIEW_API_URL}/storage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attemptId,
            roleName: roleName.trim(),
            roleOverview: overview,
          }),
        });

        if (!storeResponse.ok) {
          logger.warn('Failed to store role overview in DB', { roleName, status: storeResponse.status });
        }
      } catch (storeError: any) {
        logger.warn('Role overview DB storage failed', { roleName, error: storeError.message });
      }
    }

    return overview;
  } catch (error: any) {
    logger.error('Role overview worker API call failed', error instanceof Error ? error : new Error(error.message), { roleName });
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
    return { matchedCourseIds: [], reasoning: 'No role specified' };
  }

  if (!courses || courses.length === 0) {
    return { matchedCourseIds: [], reasoning: 'No courses available' };
  }

  try {
    const response = await ssoClient.fetch(`${ROLE_OVERVIEW_API_URL}/match-courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roleName: roleName.trim(),
        clusterTitle: (clusterTitle || '').trim(),
        courses: courses.slice(0, 20).map(c => ({
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
      logger.error('Course matching worker API error', new Error(errorText), { roleName, status: response.status });
      throw new Error(`Worker API error: ${response.status}`);
    }

    const result = await response.json() as {
      success: boolean;
      data?: CourseMatchingResult;
      source?: string;
      error?: string;
    };

    if (!result.success || !result.data) {
      logger.error('Course matching worker returned error', new Error(result.error || 'Worker returned no data'), { roleName });
      throw new Error(result.error || 'Worker returned no data');
    }

    return result.data;
  } catch (error: any) {
    logger.error('Course matching worker API call failed', error instanceof Error ? error : new Error(error.message), { roleName });
    
    // Return empty result on failure - let the UI handle fallback
    return { 
      matchedCourseIds: [], 
      reasoning: 'AI matching unavailable' 
    };
  }
}

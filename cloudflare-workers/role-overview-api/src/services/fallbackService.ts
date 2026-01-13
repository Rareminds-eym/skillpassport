import {
  RoleOverviewData,
  IndustryDemandData,
  CareerStage,
  RoadmapPhase,
  RecommendedCourse,
  FreeResource,
  ActionItem,
  SuggestedProject,
} from '../types';

/**
 * Get fallback responsibilities when AI is unavailable
 */
export function getFallbackResponsibilities(roleName: string): string[] {
  return [
    `Design and develop solutions in the ${roleName} domain`,
    `Collaborate with cross-functional teams on projects`,
    `Continuously learn and apply new skills in your field`,
  ];
}

/**
 * Get fallback industry demand when AI is unavailable
 */
export function getFallbackIndustryDemand(roleName: string): IndustryDemandData {
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
 * Get complete fallback role overview when all AI services fail
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

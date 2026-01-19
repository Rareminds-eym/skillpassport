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
import {
  getFallbackResponsibilities,
  getFallbackIndustryDemand,
  getFallbackCareerProgression,
  getFallbackLearningRoadmap,
  getFallbackRecommendedCourses,
  getFallbackFreeResources,
  getFallbackActionItems,
  getFallbackSuggestedProjects,
  getFallbackRoleOverview,
} from '../services/fallbackService';

/**
 * List of common action verbs for job responsibilities
 */
const ACTION_VERBS = [
  'Analyze', 'Build', 'Collaborate', 'Create', 'Design', 'Develop', 'Drive',
  'Evaluate', 'Execute', 'Facilitate', 'Guide', 'Implement', 'Lead', 'Manage',
  'Monitor', 'Optimize', 'Oversee', 'Plan', 'Research', 'Review', 'Support',
  'Test', 'Train', 'Transform', 'Write',
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
  return `Manage ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

/**
 * Parse AI response to extract role overview data
 */
export function parseRoleOverviewResponse(
  content: string,
  roleName: string
): RoleOverviewData {
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
        learningRoadmap = parsed.learningRoadmap.slice(0, 3).map((phase: any, index: number) => ({
          month: phase.month || `Month ${index * 2 + 1}-${index * 2 + 2}`,
          title: phase.title || 'Phase',
          description: phase.description || '',
          tasks: Array.isArray(phase.tasks) ? phase.tasks.slice(0, 4) : [],
          color: colors[index % colors.length],
        }));
      }
      if (learningRoadmap.length < 3) {
        learningRoadmap = getFallbackLearningRoadmap(roleName);
      }

      // Parse recommended courses
      let recommendedCourses: RecommendedCourse[] = [];
      if (Array.isArray(parsed.recommendedCourses) && parsed.recommendedCourses.length >= 4) {
        const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
        recommendedCourses = parsed.recommendedCourses.slice(0, 4).map((course: any) => ({
          title: course.title || 'Course',
          description: course.description || '',
          duration: course.duration || '4 weeks',
          level: validLevels.includes(course.level) ? course.level : 'Beginner',
          skills: Array.isArray(course.skills) ? course.skills.slice(0, 3) : [],
        }));
      }
      if (recommendedCourses.length < 4) {
        recommendedCourses = getFallbackRecommendedCourses(roleName);
      }

      // Parse free resources
      let freeResources: FreeResource[] = [];
      if (Array.isArray(parsed.freeResources) && parsed.freeResources.length >= 3) {
        const validTypes = ['YouTube', 'Documentation', 'Certification', 'Community', 'Tool'];
        freeResources = parsed.freeResources.slice(0, 3).map((resource: any) => ({
          title: resource.title || 'Resource',
          description: resource.description || '',
          type: validTypes.includes(resource.type) ? resource.type : 'Documentation',
          url: resource.url || '#',
        }));
      }
      if (freeResources.length < 3) {
        freeResources = getFallbackFreeResources(roleName);
      }

      // Parse action items
      let actionItems: ActionItem[] = [];
      if (Array.isArray(parsed.actionItems) && parsed.actionItems.length >= 4) {
        actionItems = parsed.actionItems.slice(0, 4).map((item: any) => ({
          title: item.title || 'Action',
          description: item.description || '',
        }));
      }
      if (actionItems.length < 4) {
        actionItems = getFallbackActionItems(roleName);
      }

      // Parse suggested projects
      let suggestedProjects: SuggestedProject[] = [];
      if (Array.isArray(parsed.suggestedProjects) && parsed.suggestedProjects.length >= 3) {
        const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
        suggestedProjects = parsed.suggestedProjects.slice(0, 3).map((project: any) => ({
          title: project.title || 'Project',
          description: project.description || '',
          difficulty: validDifficulties.includes(project.difficulty) ? project.difficulty : 'Beginner',
          skills: Array.isArray(project.skills) ? project.skills.slice(0, 4) : [],
          estimatedTime: project.estimatedTime || '1-2 weeks',
        }));
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

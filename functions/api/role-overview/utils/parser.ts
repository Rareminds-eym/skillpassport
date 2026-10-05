/**
 * Role Overview Response Parser
 * 
 * Migrated from: cloudflare-workers/role-overview-api/src/utils/parser.ts
 * Changes:
 * - Simplified to work with handler's RoleOverviewData interface
 * - Uses repairAndParseJSON from shared/ai-config
 */

import { repairAndParseJSON } from '../../shared/ai-config';
import type { RoleOverviewData } from '../handlers/role-overview';
import { getFallbackRoleOverview } from './fallback';

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
  return `Manage ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

/**
 * Parse AI response to extract role overview data
 */
export function parseRoleOverviewResponse(
  content: string,
  roleName: string
): RoleOverviewData {
  try {
    const parsed = repairAndParseJSON(content, true); // preferObject = true

    // Parse responsibilities
    let responsibilities: string[] = [];
    if (Array.isArray(parsed.responsibilities) && parsed.responsibilities.length > 0) {
      responsibilities = parsed.responsibilities
        .slice(0, 3)
        .map((item: string) => ensureActionVerb(String(item)));
    }
    if (responsibilities.length < 3) {
      const fallback = getFallbackRoleOverview(roleName);
      while (responsibilities.length < 3) {
        responsibilities.push(fallback.responsibilities[responsibilities.length]);
      }
    }

    // Parse industry demand
    const validLevels = ['Low', 'Medium', 'High', 'Very High'];
    let demandLevel = parsed.demandLevel || 'High';
    if (!validLevels.includes(demandLevel)) {
      demandLevel = 'High';
    }

    let demandPercentage = parseInt(parsed.demandPercentage) || 75;
    demandPercentage = Math.min(100, Math.max(0, demandPercentage));

    let demandDescription =
      parsed.demandDescription || getFallbackRoleOverview(roleName).demandDescription;
    const sentences = demandDescription.match(/[^.!?]+[.!?]+/g) || [demandDescription];
    if (sentences.length > 2) {
      demandDescription = sentences.slice(0, 2).join(' ').trim();
    }

    // Parse career progression
    let careerProgression = [];
    if (Array.isArray(parsed.careerProgression) && parsed.careerProgression.length >= 4) {
      careerProgression = parsed.careerProgression.slice(0, 4).map((stage: any) => ({
        title: stage.title || 'Role',
        yearsExperience: stage.yearsExperience || stage.years || '0+ yrs',
      }));
    }
    if (careerProgression.length < 4) {
      careerProgression = getFallbackRoleOverview(roleName).careerProgression;
    }

    // Parse learning roadmap
    let learningRoadmap = [];
    if (Array.isArray(parsed.learningRoadmap) && parsed.learningRoadmap.length >= 3) {
      learningRoadmap = parsed.learningRoadmap.slice(0, 3).map((phase: any) => ({
        month: phase.month || '',
        title: phase.title || 'Phase',
        description: phase.description || '',
        tasks: Array.isArray(phase.tasks) ? phase.tasks.slice(0, 4) : [],
      }));
    }
    if (learningRoadmap.length < 3) {
      learningRoadmap = getFallbackRoleOverview(roleName).learningRoadmap;
    }

    // Parse recommended courses
    let recommendedCourses = [];
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
      recommendedCourses = getFallbackRoleOverview(roleName).recommendedCourses;
    }

    // Parse free resources
    let freeResources = [];
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
      freeResources = getFallbackRoleOverview(roleName).freeResources;
    }

    // Parse action items
    let actionItems = [];
    if (Array.isArray(parsed.actionItems) && parsed.actionItems.length >= 4) {
      actionItems = parsed.actionItems.slice(0, 4).map((item: any) => ({
        title: item.title || 'Action',
        description: item.description || '',
      }));
    }
    if (actionItems.length < 4) {
      actionItems = getFallbackRoleOverview(roleName).actionItems;
    }

    // Parse suggested projects
    let suggestedProjects = [];
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
      suggestedProjects = getFallbackRoleOverview(roleName).suggestedProjects;
    }

    return {
      responsibilities,
      demandDescription,
      demandLevel,
      demandPercentage,
      careerProgression,
      learningRoadmap,
      recommendedCourses,
      freeResources,
      actionItems,
      suggestedProjects,
    };
  } catch (e) {
    console.error('Error parsing role overview response:', e);
    return getFallbackRoleOverview(roleName);
  }
}

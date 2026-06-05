import { EducatorContext } from '@/features/learner-profile/model';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('EducatorContextBuilder');

export const buildEducatorContext = async (educatorId: string): Promise<EducatorContext> => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'buildEducatorContext',
      educatorId,
    });

    if (!result?.data) {
      logger.error('No educator data returned from API');
      return buildFallbackContext();
    }

    return result.data as EducatorContext;
  } catch (error) {
    logger.error('Failed to build educator context', error as Error);
    return buildFallbackContext();
  }
};

function buildFallbackContext(): EducatorContext {
  return {
    name: 'Educator',
    institution: 'Your Institution',
    total_learners: 0,
    active_classes: 0,
    subjects_taught: [],
    recent_activities: []
  };
}

export const buildClassContext = (classId: string): Promise<any> => {
  return Promise.resolve({
    id: classId, name: 'Class', total_learners: 0, active_learners: 0, skill_distribution: [], career_interests: []
  });
};

export const buildlearnerContext = (learnerId: string): Promise<any> => {
  return Promise.resolve({
    id: learnerId, name: 'Learner', skills: [], projects: [], career_interests: [], engagement_level: 'unknown'
  });
};

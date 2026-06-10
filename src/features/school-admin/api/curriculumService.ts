import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('curriculumService');

export interface CopyCurriculumParams {
  sourceCurriculumId: string;
  targetSchoolId: string;
  targetSubject: string;
  targetClass: string;
  targetAcademicYear: string;
  createdBy: string;
}

const API_PATH = '/college-admin/school-admin';

class CurriculumService {
  async copyCurriculumTemplate(params: CopyCurriculumParams): Promise<string> {
    try {
      const result = await apiPost(API_PATH, {
        action: 'copy-curriculum-template',
        source_curriculum_id: params.sourceCurriculumId,
        target_school_id: params.targetSchoolId,
        target_subject: params.targetSubject,
        target_class: params.targetClass,
        target_academic_year: params.targetAcademicYear,
        created_by: params.createdBy,
      });
      return result as string;
    } catch (error) {
      logger.error('Failed to copy curriculum template', error as Error);
      throw error;
    }
  }
}

export const curriculumService = new CurriculumService();

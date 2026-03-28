import { supabase } from '@/shared/api/supabaseClient';

export interface CopyCurriculumParams {
  sourceCurriculumId: string;
  targetSchoolId: string;
  targetSubject: string;
  targetClass: string;
  targetAcademicYear: string;
  createdBy: string;
}

class CurriculumService {
  /**
   * Copy a curriculum template to a new curriculum
   * @param params - Copy curriculum parameters
   * @returns The new curriculum ID
   */
  async copyCurriculumTemplate(params: CopyCurriculumParams): Promise<string> {
    const { data: newCurriculumId, error } = await supabase.rpc(
      'copy_curriculum_template',
      {
        p_source_curriculum_id: params.sourceCurriculumId,
        p_target_school_id: params.targetSchoolId,
        p_target_subject: params.targetSubject,
        p_target_class: params.targetClass,
        p_target_academic_year: params.targetAcademicYear,
        p_created_by: params.createdBy,
      }
    );

    if (error) {
      console.error('Error copying curriculum template:', error);
      throw error;
    }

    return newCurriculumId;
  }
}

export const curriculumService = new CurriculumService();

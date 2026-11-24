import { apiPost } from '@/shared/api/apiClient';
import type { CourseCurriculum, CourseMappingAccess, EditRequest, ImportContext, ImportCourse, ImportOutcome, CurriculumHistoryRecord, MappedCourse } from '../model/types';

async function request<T>(action: string, payload: Record<string,unknown> = {}): Promise<T> {
  const response = await apiPost<{ data: T }>('/college-courses/actions',{ action,payload });
  return response.data;
}
interface MappedModule { module_id: string; title: string; description: string; lessons: { lesson_id: string; title: string; description: string; content: string; lesson_resources: { resource_id: string; name: string; url: string }[] }[] }
export const courseWorkflow = {
  history: async () => (await apiPost<{ data: CurriculumHistoryRecord[] }>('/college-admin/curriculum-changes', { action: 'get-all-curriculum-changes', faculty_history: true })).data,
  createAssessmentType: (courseId: string, programId: string, name: string, description: string) => request<{ id: string; name: string }>('create-assessment-type', { courseId, programId, name, description }),
  assessmentTypes: async () => (await apiPost<{ data: { id: string; name: string }[] }>('/college-admin/curriculum', { action: 'get-assessment-types' })).data,
  add: (payload: { courseId: string; programId: string; academicYear: string; curriculumId?: string; entityType: 'unit' | 'outcome'; name?: string; code?: string; description?: string; outcomes?: (string | ImportOutcome)[]; unitId?: string; outcome_text?: string; bloom_level?: string; assessment_mappings?: { assessmentType: string; weightage?: number }[] }) => request('propose-add', payload),
  raremindsContent: (courseId: string) => request<MappedModule[]>('rareminds-content',{ courseId }),
  courses: () => request<{ isCollegeEducator: boolean; courses: MappedCourse[] }>('courses'),
  content: (courseId: string, programId: string) => request<CourseCurriculum[]>('content',{ courseId,programId }),
  overview: () => request<{ mappings: CourseMappingAccess[]; requests: EditRequest[] }>('admin-overview'),
  setAccess: (mappingId: string, access: 'read' | 'edit') => request('set-access',{ mappingId,access }),
  import: (context: ImportContext,courses: ImportCourse[]) => request<{ courseId: string; curriculumId: string }[]>('import',{ ...context,courses }),
  propose: (curriculumId: string,entityType: 'unit' | 'outcome',entityId: string,changes: Record<string,string>) => request('propose',{ curriculumId,entityType,entityId,changes }),
  review: (requestId: string,decision: 'approved' | 'rejected',note: string) => request('review',{ requestId,decision,note }),
};

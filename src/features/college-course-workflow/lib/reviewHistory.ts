import type { CurriculumHistoryRecord, ReviewDecision } from '../model/types';

export function reviewDecisions(curriculums: CurriculumHistoryRecord[], requesterId?: string): ReviewDecision[] {
  return curriculums.flatMap(curriculum => {
    const course = Array.isArray(curriculum.course) ? curriculum.course[0] : curriculum.course;
    return (curriculum.change_history || []).flatMap(item => {
      const original = item.original_change;
      if (!original || (item.status !== 'approved' && item.status !== 'rejected')) return [];
      if (requesterId ? original.requested_by !== requesterId : original.source !== 'faculty_course') return [];
      const decision: ReviewDecision = {
        id: item.id, curriculum_id: curriculum.id, academic_year: curriculum.academic_year,
        course_name: course?.course_name || 'Course', requester_email: original.requester_name || 'Educator',
        entity_type: original.change_type?.startsWith('unit') ? 'unit' : 'outcome',
        before_data: original.data?.before || {}, proposed_data: original.data?.after || {},
        status: item.status, reviewed_at: item.timestamp, review_notes: item.review_notes, created_at: '',
      };
      return [decision];
    });
  }).sort((a, b) => (Date.parse(b.reviewed_at || '') || 0) - (Date.parse(a.reviewed_at || '') || 0));
}

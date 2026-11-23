import type { SupabaseClient } from '@supabase/supabase-js';

export function academicYearVariants(value?: string | null): string[] {
  const match = value?.trim().match(/^(\d{4})\s*[-/]\s*(\d{2}|\d{4})$/);
  if (!match) return [];
  const start = Number(match[1]);
  const end = match[2].length === 2 ? Math.floor((start + 1) / 100) * 100 + Number(match[2]) : Number(match[2]);
  if (end !== start + 1) return [];
  return [...new Set([value!.trim(), `${start}-${end}`, `${start}-${String(end).slice(-2)}`])];
}

// Admission year and degree level are not the learner's current academic year.
export async function getCollegeLearnerAcademicYear(db: SupabaseClient, learner: {
  college_id: string; program_id: string; semester: number;
  program_section_id?: string | null; college_class_id?: string | null;
}, departmentId?: string | null): Promise<string | null> {
  if (learner.program_section_id) {
    if (!departmentId) return null;
    const { data, error } = await db.from('program_sections').select('academic_year')
      .eq('id', learner.program_section_id).eq('program_id', learner.program_id)
      .eq('department_id', departmentId).eq('semester', learner.semester).eq('status', 'active').maybeSingle();
    if (error) throw error;
    return academicYearVariants(data?.academic_year).length ? data.academic_year.trim() : null;
  }
  if (learner.college_class_id) {
    const { data, error } = await db.from('college_classes').select('academic_year')
      .eq('id', learner.college_class_id).eq('college_id', learner.college_id).eq('status', 'active').maybeSingle();
    if (error) throw error;
    return academicYearVariants(data?.academic_year).length ? data.academic_year.trim() : null;
  }
  return null;
}

import { determinelearnerType, type LearnerData } from '@/entities/learner/lib/learnerType';

type InstitutionProfile = LearnerData & {
  school_name?: string | null;
  college?: string | null;
  programId?: string | null;
  branch_field?: string | null;
  branch?: string | null;
};

const hasValue = (...values: unknown[]) =>
  values.some((value) => typeof value === 'string' && value.trim().length > 0);

/** Keep completion and the displayed missing fields based on the same rules. */
export function getMissingInstitutionFields(profile: InstitutionProfile | null | undefined): string[] {
  if (!profile) return [];

  const learnerType = determinelearnerType(profile);
  if (learnerType.isSchoolLearner) {
    return hasValue(profile.school_id, profile.schoolId, profile.school_name,
      profile.college_school_name, profile.college) ? [] : ['School name'];
  }

  if (learnerType.isCollegeLearner) {
    const missing: string[] = [];
    if (!hasValue(profile.university_college_id, profile.universityCollegeId,
      profile.college_id, profile.collegeId, profile.college_school_name, profile.college)) {
      missing.push('College name');
    }
    if (!hasValue(profile.program_id, profile.programId, profile.branch_field, profile.branch)) {
      missing.push('Program / course name');
    }
    return missing;
  }

  // Independent learners have no institution requirement.
  return [];
}

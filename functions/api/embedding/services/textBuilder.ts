/**
 * Text Builders
 * Single source of truth for building embedding text from database records
 *
 * CRITICAL: Always use these builders to ensure consistent embeddings
 * across the entire application.
 *
 * SCHEMA-ALIGNED IMPLEMENTATION:
 * - Uses actual column names from SQL schema (supabase/migrations/20260204094733_remote_schema.sql)
 * - Filters: enabled=true, approval_status='approved', expiry_date validation
 * - Includes training JOIN for certificates via training_id
 * - Identity, demographics, contact fields and raw profile links are excluded
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CourseData,
  OpportunityData,
  EmbeddingError
} from '../types';
import { EMBEDDING_CONFIG } from '../config/constants';
import { evaluateRecommendationReadiness, normalizeCareerSignal, isUsefulCareerSignal } from '../../../lib/recommendation-readiness';
import type { RecommendationReadiness } from '../../../../shared/contracts/job-recommendations';
import { careerPreferencesSchema, type CareerPreferences } from '../../../../shared/contracts/career-preferences';
import { assessmentRoleIntent, prepareRecommendationLearning } from '../../../lib/recommendation-learning';

// Database record types (matching actual Supabase schema)
interface LearnerRecord {
  id: string;
  user_id: string;
  bio: string | null;
  branch_field: string | null;
  course_name: string | null;
  university: string | null;
  college_school_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  grade: string | null;
  semester: number | null;
  currentCgpa: number | null;
  interests: string[] | null;
  hobbies: string[] | null;
  languages: string[] | null;
  work_experience: string | null;
  gap_in_studies: boolean | null;
  gap_years: number | null;
  gap_reason: string | null;
}

// These interfaces document the expected Supabase response shape.
// Actual data access uses safe property checks to handle schema drift.

/**
 * Build ENRICHED text from learner record
 *
 * This is the ONLY correct way to build learner text.
 * Includes: profile, skills, certificates, projects, trainings, and courses
 *
 * @param supabase - Supabase client
 * @param learnerId - Learner UUID
 * @returns Enriched text string (typically 2000-4000 chars)
 * @throws EmbeddingError if insufficient data
 */
export interface LearnerRecommendationContext {
  text: string;
  readiness: RecommendationReadiness;
  inputRevision: string;
  preferences: CareerPreferences;
  skillNames: string[];
  softSkillNames: string[];
  inferredRoles: string[];
  sourceStatus: { assessment: string; learning: string };
}

// Reserve room for every source category; a long biography/certificate must
// not hide skills or completed learning at the worker's 10,000-character cap.
const CAREER_TEXT_BUDGETS: Record<string, number> = {
  '=== LEARNER PROFILE ===': 1100, '=== EDUCATION ===': 1000,
  '=== EXPERIENCE ===': 1200, '=== TECHNICAL SKILLS ===': 1800,
  '=== CERTIFICATIONS ===': 900, '=== PROJECTS ===': 1200,
  '=== TRAINING PROGRAMS ===': 600, '=== COMPLETED COURSES ===': 800,
  '=== VERIFIED LEARNING ===': 1000,
};
function budgetCareerText(parts: string[]): string {
  const sections: Array<{ heading: string; lines: string[] }> = [];
  for (const part of parts) {
    const heading = part.trim();
    if (Object.hasOwn(CAREER_TEXT_BUDGETS, heading)) sections.push({ heading, lines: [heading] });
    else sections[sections.length - 1]?.lines.push(part);
  }
  return sections.map(section => section.lines.join('\n').slice(0, CAREER_TEXT_BUDGETS[section.heading])).join('\n');
}

export async function readRecommendationContextRevision(supabase: SupabaseClient, learnerId: string, userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_recommendation_context_revision_v1', { p_learner_id: learnerId, p_user_id: userId });
  if (error || typeof data !== 'string' || !/^\d+$/.test(data)) throw new EmbeddingError('Career context is temporarily unavailable', 'API_ERROR');
  return data;
}

export async function readRecommendationFreshness(supabase: SupabaseClient, learnerId: string, userId: string): Promise<{ inputRevision: string; catalogRevision: string }> {
  const { data, error } = await supabase.rpc('get_recommendation_freshness_v1', { p_learner_id: learnerId, p_user_id: userId });
  if (error || !data || typeof data.inputRevision !== 'string' || typeof data.catalogRevision !== 'string' || !/^\d+$/.test(data.inputRevision) || !/^\d+$/.test(data.catalogRevision)) throw new EmbeddingError('Career context is temporarily unavailable', 'API_ERROR');
  return data;
}

export async function buildLearnerRecommendationContext(
  supabase: SupabaseClient,
  learnerId: string,
  expectedUserId?: string,
  env: Record<string, any> = {},
): Promise<LearnerRecommendationContext> {
  try {
    let ownerId = expectedUserId;
    if (!ownerId) {
      const identity = await supabase.from('learners').select('user_id').eq('id', learnerId).single();
      if (identity.error || typeof identity.data?.user_id !== 'string') throw new EmbeddingError('Learner identity is temporarily unavailable', 'API_ERROR');
      ownerId = identity.data.user_id;
    }
    const initialPreferences = await supabase.from('learner_career_preferences').select('preferences').eq('learner_id', learnerId).maybeSingle();
    const initialParsed = careerPreferencesSchema.safeParse(initialPreferences.data?.preferences ?? {});
    if (initialPreferences.error || !initialParsed.success) throw new EmbeddingError('Career preferences are temporarily unavailable', 'API_ERROR');
    // Synchronize the external dependency before opening the local read fence.
    // Only its hash is stored; no learner submissions/review payload is copied.
    const learning = await prepareRecommendationLearning(supabase, env, learnerId, ownerId, initialParsed.data);
    // Bracket profile fields as well as evidence queries, not just the latter.
    const inputRevision = await readRecommendationContextRevision(supabase, learnerId, ownerId);
    // Fetch only the profile fields used for career context.
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select(`
        id, user_id, bio,
        branch_field, course_name, university, college_school_name,
        city, state, country,
        grade, semester, currentCgpa,
        interests, hobbies, languages,
        work_experience, gap_in_studies, gap_years, gap_reason
      `)
      .eq('id', learnerId)
      .single();

    if (learnerError) throw new EmbeddingError('Learner profile is temporarily unavailable', 'API_ERROR');
    if (!learner || learner.user_id !== ownerId) {
      throw new EmbeddingError(
        'Learner identity changed during context collection',
        'INSUFFICIENT_DATA',
        { learnerId, error: learnerError }
      );
    }

    // Type-safe learner record
    const learnerRecord = learner as LearnerRecord;

    // Fetch ALL related data in parallel for maximum performance
    // This reduces total query time from ~500ms (sequential) to ~100ms (parallel)
    const [
      { data: skills, error: skillsError },
      { data: certificates, error: certificatesError },
      { data: projects, error: projectsError },
      { data: courseEnrollments, error: coursesError },
      { data: trainings, error: trainingsError },
      { data: education, error: educationError },
      { data: experience, error: experienceError },
      { data: preferenceRow, error: preferencesError },
    ] = await Promise.all([
      // Fetch skills with proficiency levels
      supabase
        .from('skills')
        .select('name, level, proficiency_level, type, description')
        .eq('learner_id', learnerId)
        .eq('enabled', true)
        .eq('approval_status', 'approved')
        .order('level', { ascending: false })
        .order('id', { ascending: true })
        .limit(EMBEDDING_CONFIG.MAX_SKILLS),

      // Fetch certificates with full context including training join
      supabase
        .from('certificates')
        .select(`
          title, issuer, level, category, description, platform, instructor,
          trainings!training_id(title, learner_id, enabled, approval_status)
        `)
        .eq('learner_id', learnerId)
        .eq('enabled', true)
        .or('expiry_date.is.null,expiry_date.gte.now()')
        .eq('approval_status', 'approved')
        .order('id', { ascending: true })
        .limit(EMBEDDING_CONFIG.MAX_CERTIFICATES),

      // Fetch projects with tech stacks
      supabase
        .from('projects')
        .select(`
          title, description, tech_stack, role, organization,
          start_date, end_date, status
        `)
        .eq('learner_id', learnerId)
        .eq('enabled', true)
        .eq('approval_status', 'approved')
        .order('id', { ascending: true })
        .limit(EMBEDDING_CONFIG.MAX_PROJECTS),

      // Fetch course enrollments
      supabase
        .from('course_enrollments')
        .select('course_title, status, skills_acquired')
        .eq('learner_id', learnerId)
        .eq('status', 'completed')
        .order('id', { ascending: true })
        .limit(EMBEDDING_CONFIG.MAX_COURSES),

      // Fetch trainings
      supabase
        .from('trainings')
        .select('title, organization, description, source, status, start_date, end_date')
        .eq('learner_id', learnerId)
        .eq('approval_status', 'approved')
        // Existing profile visibility treats legacy NULL as visible.
        .or('enabled.is.null,enabled.eq.true')
        .order('id', { ascending: true })
        .limit(EMBEDDING_CONFIG.MAX_TRAININGS),
      supabase.from('education').select('degree, department')
        .eq('learner_id', learnerId).eq('approval_status', 'approved')
        .or('enabled.is.null,enabled.eq.true').order('id', { ascending: true }).limit(10),
      supabase.from('experience').select('role, description, start_date, end_date')
        .eq('learner_id', learnerId).eq('approval_status', 'approved')
        .or('enabled.is.null,enabled.eq.true').order('id', { ascending: true }).limit(10),
      supabase.from('learner_career_preferences').select('preferences').eq('learner_id', learnerId).maybeSingle(),
    ]);

    if ([skillsError, certificatesError, projectsError, coursesError, trainingsError, educationError, experienceError, preferencesError].some(Boolean)) {
      throw new EmbeddingError('Learner evidence is temporarily unavailable', 'API_ERROR');
    }

    const str = normalizeCareerSignal;
    const parsedPreferences = careerPreferencesSchema.safeParse(preferenceRow?.preferences ?? {});
    if (!parsedPreferences.success) throw new EmbeddingError('Career preferences are temporarily unavailable', 'API_ERROR');
    const preferences = parsedPreferences.data;
    if (JSON.stringify(preferences) !== JSON.stringify(initialParsed.data)) throw new EmbeddingError('Career preferences changed during collection', 'CONTEXT_CHANGED');
    let inferredRoles: string[] = [];
    if (preferences.useAssessmentRecommendations) {
      const assessment = await supabase.from('personal_assessment_results').select('id, career_fit').eq('learner_id', learnerId).eq('status', 'completed').order('created_at', { ascending: false }).order('id', { ascending: true }).limit(1).maybeSingle();
      if (assessment.error) throw new EmbeddingError('Career assessment is temporarily unavailable', 'API_ERROR');
      inferredRoles = assessmentRoleIntent(assessment.data?.career_fit);
    }
    const legacyExperience = str(learnerRecord.work_experience);
    const legacyField = str(learnerRecord.branch_field);
    const legacyDegree = str(learnerRecord.course_name);
    const usableSkills = (skills || []).filter(row => isUsefulCareerSignal(str(row.name)));
    const list = (value: unknown): string[] => Array.isArray(value) ? value.map(str).filter(Boolean).slice(0, 100) : [];
    const readiness = evaluateRecommendationReadiness({
      skills: usableSkills.map(row => str(row.name)),
      education: [
        { field: legacyField, degree: legacyDegree },
        ...(education || []).map(row => ({ field: str(row.department), degree: str(row.degree) })),
      ],
      experience: [
        { description: legacyExperience },
        ...(experience || []).map(row => ({ role: str(row.role), description: str(row.description) })),
      ],
      projects: (projects || []).map(row => ({ title: str(row.title), description: str(row.description), technologies: list(row.tech_stack) })),
      credentials: (certificates || []).map(row => str(row.title)),
      completedCourses: [...(courseEnrollments || []).filter(row => row.status === 'completed').map(row => str(row.course_title)), ...(learning?.levels || []).map(row => row.title)].slice(0, 100),
      trainings: (trainings || []).map(row => ({ title: str(row.title), status: str(row.status) })),
      interests: [...list(learnerRecord.interests), ...preferences.targetRoles, ...inferredRoles].slice(0, 100),
    });

    // ========== Build ENRICHED Embedding Text ==========
    const parts: string[] = [];

    // Section 1: Core Profile
    parts.push('=== LEARNER PROFILE ===');
    if (legacyField) parts.push(`Field of Study: ${legacyField}`);
    if (legacyDegree) parts.push(`Course: ${legacyDegree}`);
    if (learnerRecord.university) parts.push(`University: ${learnerRecord.university}`);
    if (learnerRecord.college_school_name) parts.push(`Institution: ${learnerRecord.college_school_name}`);
    if (learnerRecord.city) parts.push(`City: ${learnerRecord.city}`);
    if (learnerRecord.state) parts.push(`State: ${learnerRecord.state}`);
    if (learnerRecord.country) parts.push(`Country: ${learnerRecord.country}`);
    if (learnerRecord.grade) parts.push(`Grade/Class: ${learnerRecord.grade}`);
    if (learnerRecord.semester) parts.push(`Semester: ${learnerRecord.semester}`);
    if (learnerRecord.currentCgpa) parts.push(`CGPA: ${learnerRecord.currentCgpa}`);
    if (learnerRecord.bio) parts.push(`Bio: ${learnerRecord.bio}`);

    // Add interests, hobbies, and languages
    if (learnerRecord.interests && Array.isArray(learnerRecord.interests) && learnerRecord.interests.length > 0) {
      parts.push(`Interests: ${learnerRecord.interests.join(', ')}`);
    }
    if (learnerRecord.hobbies && Array.isArray(learnerRecord.hobbies) && learnerRecord.hobbies.length > 0) {
      parts.push(`Hobbies: ${learnerRecord.hobbies.join(', ')}`);
    }
    if (learnerRecord.languages && Array.isArray(learnerRecord.languages) && learnerRecord.languages.length > 0) {
      parts.push(`Languages: ${learnerRecord.languages.join(', ')}`);
    }

    // Stable, deduplicated normalized records supplement the legacy columns.
    const fingerprint = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
    const uniqueLines = (values: string[]) => [...new Map(values.filter(Boolean).map(value => [fingerprint(value), value])).values()];
    const normalizedEducation = uniqueLines((education || []).map(row =>
      [str(row.degree), str(row.department)].filter(Boolean).join(' · ')));
    const legacyEducation = [legacyDegree, legacyField].filter(Boolean).join(' · ');
    if (normalizedEducation.length) parts.push('=== EDUCATION ===');
    for (const item of normalizedEducation) if (fingerprint(item) !== fingerprint(legacyEducation)) parts.push(`Education: ${item}`);
    const normalizedExperience = uniqueLines((experience || []).map(row =>
      [str(row.role), str(row.description)].filter(Boolean).join(' · ')));
    if (normalizedExperience.length || legacyExperience) parts.push('=== EXPERIENCE ===');
    if (legacyExperience) parts.push(`Work Experience: ${legacyExperience}`);
    for (const item of normalizedExperience) if (fingerprint(item) !== fingerprint(legacyExperience)) parts.push(`Experience: ${item}`);
    if (learnerRecord.gap_in_studies && learnerRecord.gap_reason) {
      parts.push(`Career Gap: ${learnerRecord.gap_years || 0} years - ${learnerRecord.gap_reason}`);
    }

    // Reserve a share for every selected skill; a verbose early description
    // must not erase later names that established readiness.
    if (usableSkills.length > 0) {
      const heading = '=== TECHNICAL SKILLS ===';
      const separator = ', ';
      const perSkill = Math.floor((CAREER_TEXT_BUDGETS[heading] - heading.length - 1
        - separator.length * (usableSkills.length - 1)) / usableSkills.length);
      parts.push(heading);
      const skillStrings = usableSkills.map(skill => {
        let line = str(skill.name);
        const level = typeof skill.level === 'number' ? skill.level : null;
        const proficiency = str(skill.proficiency_level);
        const type = str(skill.type);
        const description = str(skill.description);
        if (level) line += ` (Level ${level}/5)`;
        else if (proficiency) line += ` (${proficiency})`;
        if (type) line += ` [${type}]`;
        if (description) line += ` - ${description}`;
        return line.slice(0, perSkill);
      });
      parts.push(skillStrings.join(separator));
    }

    // Section 3: Certificates
    if (certificates && certificates.length > 0) {
      parts.push('\n=== CERTIFICATIONS ===');
      const safeStr = (val: unknown): string | null => typeof val === 'string' ? val : null;

      for (const cert of certificates as unknown as Record<string, unknown>[]) {
        const title = safeStr(cert.title);
        if (!title) continue;

        let certStr = title;
        const issuer = safeStr(cert.issuer);
        const platform = safeStr(cert.platform);
        const level = safeStr(cert.level);
        const category = safeStr(cert.category);
        const instructor = safeStr(cert.instructor);
        const description = safeStr(cert.description);

        if (issuer) certStr += ` from ${issuer}`;
        if (platform) certStr += ` on ${platform}`;
        if (level) certStr += ` (${level})`;
        if (category) certStr += ` - Category: ${category}`;
        if (instructor) certStr += ` - Instructor: ${instructor}`;
        if (description) certStr += `. ${description}`;

        // Handle trainings join - can be object, array, or null
        const trainings = cert.trainings;
        let trainingTitle: string | null = null;

        if (trainings && typeof trainings === 'object') {
          if (Array.isArray(trainings) && trainings.length > 0) {
            // Array case: take first element's title
            const firstTraining = trainings[0];
            if (firstTraining && typeof firstTraining === 'object' &&
              firstTraining.learner_id === learnerId &&
              firstTraining.enabled !== false && firstTraining.approval_status === 'approved') {
              trainingTitle = safeStr((firstTraining as Record<string, unknown>).title);
            }
          } else if (!Array.isArray(trainings) &&
            (trainings as Record<string, unknown>).learner_id === learnerId &&
            (trainings as Record<string, unknown>).enabled !== false &&
            (trainings as Record<string, unknown>).approval_status === 'approved') {
            // Object case: extract title directly
            trainingTitle = safeStr((trainings as Record<string, unknown>).title);
          }
        }

        if (trainingTitle) {
          certStr += ` | Related Training: ${trainingTitle}`;
        }

        parts.push(`• ${certStr}`);
      }
    }

    // Section 4: Projects
    if (projects && projects.length > 0) {
      parts.push('\n=== PROJECTS ===');
      const safeStr = (val: unknown): string | null => typeof val === 'string' ? val : null;

      for (const proj of projects as unknown as Record<string, unknown>[]) {
        const title = safeStr(proj.title);
        if (!title) continue;

        let projStr = title;
        const role = safeStr(proj.role);
        const organization = safeStr(proj.organization);
        const status = safeStr(proj.status);
        const description = safeStr(proj.description);

        if (role) projStr += ` (${role})`;
        if (organization) projStr += ` at ${organization}`;
        if (status) projStr += ` [${status}]`;

        const techStack = proj.tech_stack;
        if (Array.isArray(techStack) && techStack.length > 0) {
          const techStrings = techStack
            .map((t) => typeof t === 'string' ? t : null)
            .filter((t): t is string => t !== null);
          if (techStrings.length > 0) {
            projStr += ` | Technologies: ${techStrings.join(', ')}`;
          }
        }

        if (description) {
          projStr += `. ${description.slice(0, EMBEDDING_CONFIG.PROJECT_DESC_MAX_LENGTH)}`;
        }
        parts.push(`• ${projStr}`);
      }
    }

    // Section 5: Trainings
    if (trainings && trainings.length > 0) {
      parts.push('\n=== TRAINING PROGRAMS ===');
      const safeStr = (val: unknown): string | null => typeof val === 'string' ? val : null;

      for (const training of trainings as unknown as Record<string, unknown>[]) {
        const title = safeStr(training.title);
        if (!title) continue;

        let trainStr = title;
        const organization = safeStr(training.organization);
        const source = safeStr(training.source);
        const status = safeStr(training.status);
        const description = safeStr(training.description);

        if (organization) trainStr += ` by ${organization}`;
        if (source) trainStr += ` via ${source}`;
        if (status) trainStr += ` (${status})`;
        if (description) {
          trainStr += `. ${description.slice(0, EMBEDDING_CONFIG.TRAINING_DESC_MAX_LENGTH)}`;
        }
        parts.push(`• ${trainStr}`);
      }
    }

    // Section 6: Completed Courses
    if (courseEnrollments && courseEnrollments.length > 0) {
      const safeStr = (val: unknown): string | null => typeof val === 'string' ? val : null;

      const completed = (courseEnrollments as unknown as Record<string, unknown>[])
        .filter((c) => safeStr(c.status) === 'completed');

      if (completed.length > 0) {
        parts.push('\n=== COMPLETED COURSES ===');
        for (const course of completed.slice(0, EMBEDDING_CONFIG.MAX_COURSES)) {
          const courseTitle = safeStr(course.course_title);
          if (!courseTitle) continue;

          let courseStr = courseTitle;
          const skillsAcquired = course.skills_acquired;

          if (Array.isArray(skillsAcquired) && skillsAcquired.length > 0) {
            const skillStrings = skillsAcquired
              .map((s) => typeof s === 'string' ? s : null)
              .filter((s): s is string => s !== null);
            if (skillStrings.length > 0) {
              courseStr += ` | Skills: ${skillStrings.join(', ')}`;
            }
          }
          parts.push(`• ${courseStr}`);
        }
      }
    }

    if (learning?.levels.length) {
      parts.push('=== VERIFIED LEARNING ===');
      // Reserve a bounded share per selected achievement, with source labels.
      const share = Math.floor((1000 - 32 - learning.levels.length) / learning.levels.length);
      for (const level of learning.levels) parts.push(`${level.capabilityName} · ${level.title} · Level ${level.levelNumber} (${learning.evaluationPolicy} evaluated)`.slice(0, share));
    }
    const text = budgetCareerText(parts);

    if (learning) await prepareRecommendationLearning(supabase, env, learnerId, learnerRecord.user_id, preferences);
    if (await readRecommendationContextRevision(supabase, learnerId, learnerRecord.user_id) !== inputRevision)
      throw new EmbeddingError('Career context changed during collection', 'CONTEXT_CHANGED');

    console.log(`[TextBuilder] Built enriched learner text (${text.length} chars) for ${learnerId}`);
    return { text: readiness.state === 'ready' ? text : '', readiness, inputRevision, preferences, skillNames: usableSkills.map(row => str(row.name)), softSkillNames: usableSkills.filter(row => row.type === 'soft').map(row => str(row.name)), inferredRoles,
      sourceStatus: { assessment: !preferences.useAssessmentRecommendations ? 'not_requested' : inferredRoles.length ? 'available_inferred' : 'absent', learning: !learning ? 'not_requested' : learning.truncated ? 'available_truncated' : 'available' } };

  } catch (error) {
    if (error instanceof EmbeddingError) {
      throw error;
    }
    throw new EmbeddingError(
      `Error building learner text: ${error instanceof Error ? error.message : String(error)}`,
      'API_ERROR',
      { learnerId, originalError: error }
    );
  }
}

/** Legacy database embedding callers use the same authoritative readiness. */
export async function buildlearnerTextFromDatabase(supabase: SupabaseClient, learnerId: string, env: Record<string, any> = {}): Promise<string> {
  const context = await buildLearnerRecommendationContext(supabase, learnerId, undefined, env);
  if (context.readiness.state !== 'ready') throw new EmbeddingError('Add career context before preparing personalized matches', 'INSUFFICIENT_DATA');
  return context.text;
}

/**
 * Build text from course record
 *
 * @param supabase - Supabase client
 * @param courseId - Course UUID
 * @returns Course text
 * @throws EmbeddingError on failure
 */
export async function buildCourseTextFromDatabase(
  supabase: SupabaseClient,
  courseId: string
): Promise<string> {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error || !course) {
      throw new EmbeddingError(
        `Failed to fetch course: ${error?.message || 'Not found'}`,
        'INSUFFICIENT_DATA',
        { courseId, error }
      );
    }

    return buildCourseText(course as CourseData);

  } catch (error) {
    if (error instanceof EmbeddingError) {
      throw error;
    }
    throw new EmbeddingError(
      `Error building course text: ${error instanceof Error ? error.message : String(error)}`,
      'API_ERROR',
      { courseId, originalError: error }
    );
  }
}

/**
 * Build text from course object (in-memory)
 * Used when you already have the course data
 */
export function buildCourseText(course: CourseData): string {
  const parts: string[] = [];

  if (course.title || course.name) {
    parts.push(`Course: ${course.title || course.name}`);
  }
  if (course.provider) parts.push(`Provider: ${course.provider}`);
  if (course.category) parts.push(`Category: ${course.category}`);
  if (course.level) parts.push(`Level: ${course.level}`);

  if (course.skills_taught) {
    const skills = Array.isArray(course.skills_taught)
      ? course.skills_taught.join(', ')
      : course.skills_taught;
    parts.push(`Skills: ${skills}`);
  }

  if (course.description) {
    parts.push(`Description: ${course.description.slice(0, 500)}`);
  }

  return parts.join('\n');
}

/**
 * Build text from opportunity record
 *
 * @param supabase - Supabase client
 * @param opportunityId - Opportunity UUID
 * @returns Opportunity text
 * @throws EmbeddingError if no skills_required
 */
export async function buildOpportunityTextFromDatabase(
  supabase: SupabaseClient,
  opportunityId: string
): Promise<string> {
  try {
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (error || !opportunity) {
      throw new EmbeddingError(
        `Failed to fetch opportunity: ${error?.message || 'Not found'}`,
        'INSUFFICIENT_DATA',
        { opportunityId, error }
      );
    }

    return buildOpportunityText(opportunity as OpportunityData);

  } catch (error) {
    if (error instanceof EmbeddingError) {
      throw error;
    }
    throw new EmbeddingError(
      `Error building opportunity text: ${error instanceof Error ? error.message : String(error)}`,
      'API_ERROR',
      { opportunityId, originalError: error }
    );
  }
}

/**
 * Build text from opportunity object (in-memory)
 * Used when you already have the opportunity data
 *
 * @throws EmbeddingError if no skills_required
 */
export function buildOpportunityText(opportunity: OpportunityData): string {
  // Validate opportunity object
  if (!opportunity) {
    throw new EmbeddingError(
      'Opportunity object is null or undefined',
      'INSUFFICIENT_DATA',
      { opportunity }
    );
  }

  const parts: string[] = [];

  // Skills are REQUIRED - validate carefully
  const skillsRaw = opportunity.skills_required;
  let skillNames: string[] = [];

  // Define proper type for skill items (can be string or object with name/skill properties)
  type SkillItem = string | { name?: string; skill?: string };

  if (Array.isArray(skillsRaw) && skillsRaw.length > 0) {
    skillNames = skillsRaw
      .map((s: SkillItem) => typeof s === 'string' ? s : s?.name || s?.skill)
      .filter((name): name is string => Boolean(name && typeof name === 'string'));
  } else if (typeof skillsRaw === 'string' && skillsRaw.trim()) {
    skillNames = skillsRaw
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(skillNames) || skillNames.length === 0) {
    throw new EmbeddingError(
      `Opportunity ${opportunity.id} has no valid skills_required`,
      'INSUFFICIENT_DATA',
      { opportunityId: opportunity.id, skillsRaw }
    );
  }

  // Build text parts with safe property access
  const jobTitle = opportunity?.job_title || opportunity?.title;
  if (jobTitle) {
    parts.push(`Job: ${jobTitle}`);
  }

  if (opportunity?.company_name) {
    parts.push(`Company: ${opportunity.company_name}`);
  }

  if (opportunity?.location) {
    parts.push(`Location: ${opportunity.location}`);
  }

  parts.push(`Required Skills: ${skillNames.join(', ')}`);

  if (opportunity?.description) {
    const maxLength = EMBEDDING_CONFIG.DESCRIPTION_MAX_LENGTH;
    const description = opportunity.description.slice(0, maxLength);
    parts.push(`Description: ${description}`);
  }

  return parts.join('\n');
}

/**
 * Build text for skill search query
 * Wraps skill name with context for better semantic matching
 */
export function buildSkillSearchText(skillName: string): string {
  return `Skill: ${skillName}. Looking for courses that teach ${skillName} skills and competencies.`;
}

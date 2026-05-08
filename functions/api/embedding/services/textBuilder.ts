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
 * - Supports both legacy (date_of_birth, contact_number) and new (dateOfBirth, contactNumber) columns
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  CourseData,
  OpportunityData,
  EmbeddingError,
  SkillData,
  CertificateData,
  ProjectData,
  CourseEnrollmentData,
  TrainingData
} from '../types';
import { EMBEDDING_CONFIG } from '../config/constants';

// Database record types (matching actual Supabase schema)
interface LearnerRecord {
  id: string;
  name: string | null;
  age: number | null;
  date_of_birth: string | null;
  dateOfBirth: string | null;
  gender: string | null;
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
  github_link: string | null;
  linkedin_link: string | null;
  portfolio_link: string | null;
  resumeUrl: string | null;
  profilePicture: string | null;
  contact_number: string | null;
  contactNumber: string | null;
  email: string | null;
}

// These interfaces document the expected Supabase response shape.
// Actual data access uses safe property checks to handle schema drift.
interface SkillRecord {
  name: string;
  level: number | null;
  proficiency_level: string | null;
  type: string | null;
  description: string | null;
}

interface CertificateRecord {
  title: string;
  issuer: string | null;
  level: string | null;
  category: string | null;
  description: string | null;
  platform: string | null;
  instructor: string | null;
  trainings: { title: string } | null;
}

interface ProjectRecord {
  title: string;
  description: string | null;
  tech_stack: string[] | null;
  role: string | null;
  organization: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
}

interface CourseEnrollmentRecord {
  course_title: string;
  status: string;
  skills_acquired: string[] | null;
}

interface TrainingRecord {
  title: string;
  organization: string | null;
  description: string | null;
  source: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
}

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
export async function buildlearnerTextFromDatabase(
  supabase: SupabaseClient,
  learnerId: string
): Promise<string> {
  try {
    // Fetch learner with ALL relevant data for comprehensive embedding
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select(`
        id, name, age, date_of_birth, dateOfBirth, gender, bio,
        branch_field, course_name, university, college_school_name, 
        city, state, country,
        grade, semester, currentCgpa,
        interests, hobbies, languages,
        work_experience, gap_in_studies, gap_years, gap_reason,
        github_link, linkedin_link, portfolio_link,
        resumeUrl, profilePicture,
        contact_number, contactNumber, email
      `)
      .eq('id', learnerId)
      .single();

    if (learnerError || !learner) {
      throw new EmbeddingError(
        `Failed to fetch learner: ${learnerError?.message || 'Not found'}`,
        'INSUFFICIENT_DATA',
        { learnerId, error: learnerError }
      );
    }

    // Type-safe learner record
    const learnerRecord = learner as LearnerRecord;

    // Fetch ALL related data in parallel for maximum performance
    // This reduces total query time from ~500ms (sequential) to ~100ms (parallel)
    const [
      { data: skills },
      { data: certificates },
      { data: projects },
      { data: courseEnrollments },
      { data: trainings }
    ] = await Promise.all([
      // Fetch skills with proficiency levels
      supabase
        .from('skills')
        .select('name, level, proficiency_level, type, description')
        .eq('learner_id', learnerId)
        .eq('enabled', true)
        .eq('approval_status', 'approved')
        .order('level', { ascending: false })
        .limit(EMBEDDING_CONFIG.MAX_SKILLS),
      
      // Fetch certificates with full context including training join
      supabase
        .from('certificates')
        .select(`
          title, issuer, level, category, description, platform, instructor,
          trainings!training_id(title)
        `)
        .eq('learner_id', learnerId)
        .eq('enabled', true)
        .or('expiry_date.is.null,expiry_date.gte.now()')
        .eq('approval_status', 'approved')
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
        .limit(EMBEDDING_CONFIG.MAX_PROJECTS),
      
      // Fetch course enrollments
      supabase
        .from('course_enrollments')
        .select('course_title, status, skills_acquired')
        .eq('learner_id', learnerId)
        .in('status', ['completed', 'in_progress', 'active']),
      
      // Fetch trainings
      supabase
        .from('trainings')
        .select('title, organization, description, source, status, start_date, end_date')
        .eq('learner_id', learnerId)
        .eq('approval_status', 'approved')
        .limit(EMBEDDING_CONFIG.MAX_TRAININGS)
    ]);

    // ========== Build ENRICHED Embedding Text ==========
    const parts: string[] = [];

    // Section 1: Core Profile
    parts.push('=== LEARNER PROFILE ===');
    if (learnerRecord.name) parts.push(`Name: ${learnerRecord.name}`);
    if (learnerRecord.age) parts.push(`Age: ${learnerRecord.age}`);
    if (learnerRecord.gender) parts.push(`Gender: ${learnerRecord.gender}`);
    if (learnerRecord.branch_field) parts.push(`Field of Study: ${learnerRecord.branch_field}`);
    if (learnerRecord.course_name) parts.push(`Course: ${learnerRecord.course_name}`);
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

    // Add work experience and career gaps
    if (learnerRecord.work_experience) {
      parts.push(`Work Experience: ${learnerRecord.work_experience}`);
    }
    if (learnerRecord.gap_in_studies && learnerRecord.gap_reason) {
      parts.push(`Career Gap: ${learnerRecord.gap_years || 0} years - ${learnerRecord.gap_reason}`);
    }

    // Add social/portfolio links
    const links: string[] = [];
    if (learnerRecord.github_link) links.push(`GitHub: ${learnerRecord.github_link}`);
    if (learnerRecord.linkedin_link) links.push(`LinkedIn: ${learnerRecord.linkedin_link}`);
    if (learnerRecord.portfolio_link) links.push(`Portfolio: ${learnerRecord.portfolio_link}`);
    if (links.length > 0) {
      parts.push(`Professional Links: ${links.join(', ')}`);
    }

    // Section 2: Skills with Proficiency
    if (skills && skills.length > 0) {
      parts.push('\n=== TECHNICAL SKILLS ===');
      const safeStr = (val: unknown): string | null => typeof val === 'string' ? val : null;
      const safeNum = (val: unknown): number | null => typeof val === 'number' ? val : null;
      
      const skillStrings = (skills as unknown as Record<string, unknown>[]).map((s) => {
        const name = safeStr(s.name);
        if (!name) return null;
        
        let skillStr = name;
        const level = safeNum(s.level);
        const proficiencyLevel = safeStr(s.proficiency_level);
        const type = safeStr(s.type);
        const description = safeStr(s.description);
        
        if (level) skillStr += ` (Level ${level}/5)`;
        else if (proficiencyLevel) skillStr += ` (${proficiencyLevel})`;
        if (type) skillStr += ` [${type}]`;
        if (description) skillStr += ` - ${description}`;
        return skillStr;
      }).filter((s): s is string => s !== null);
      
      if (skillStrings.length > 0) {
        parts.push(skillStrings.join(', '));
      }
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
            if (firstTraining && typeof firstTraining === 'object') {
              trainingTitle = safeStr((firstTraining as Record<string, unknown>).title);
            }
          } else if (!Array.isArray(trainings)) {
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

    const text = parts.join('\n');
    
    if (text.length < 50) {
      throw new EmbeddingError(
        `Insufficient data for learner ${learnerId} (only ${text.length} chars)`,
        'INSUFFICIENT_DATA',
        { learnerId, textLength: text.length }
      );
    }

    console.log(`[TextBuilder] Built enriched learner text (${text.length} chars) for ${learnerId}`);
    return text;

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

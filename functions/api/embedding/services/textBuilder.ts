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
interface StudentRecord {
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
 * Build ENRICHED text from student record
 * 
 * This is the ONLY correct way to build student text.
 * Includes: profile, skills, certificates, projects, trainings, and courses
 * 
 * @param supabase - Supabase client
 * @param studentId - Student UUID
 * @returns Enriched text string (typically 2000-4000 chars)
 * @throws EmbeddingError if insufficient data
 */
export async function buildStudentTextFromDatabase(
  supabase: SupabaseClient,
  studentId: string
): Promise<string> {
  try {
    // Fetch student with ALL relevant data for comprehensive embedding
    const { data: student, error: studentError } = await supabase
      .from('students')
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
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      throw new EmbeddingError(
        `Failed to fetch student: ${studentError?.message || 'Not found'}`,
        'INSUFFICIENT_DATA',
        { studentId, error: studentError }
      );
    }

    // Type-safe student record
    const studentRecord = student as StudentRecord;

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
        .eq('student_id', studentId)
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
        .eq('student_id', studentId)
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
        .eq('student_id', studentId)
        .eq('enabled', true)
        .eq('approval_status', 'approved')
        .limit(EMBEDDING_CONFIG.MAX_PROJECTS),
      
      // Fetch course enrollments
      supabase
        .from('course_enrollments')
        .select('course_title, status, skills_acquired')
        .eq('student_id', studentId)
        .in('status', ['completed', 'in_progress', 'active']),
      
      // Fetch trainings
      supabase
        .from('trainings')
        .select('title, organization, description, source, status, start_date, end_date')
        .eq('student_id', studentId)
        .eq('approval_status', 'approved')
        .limit(EMBEDDING_CONFIG.MAX_TRAININGS)
    ]);

    // ========== Build ENRICHED Embedding Text ==========
    const parts: string[] = [];

    // Section 1: Core Profile
    parts.push('=== STUDENT PROFILE ===');
    if (studentRecord.name) parts.push(`Name: ${studentRecord.name}`);
    if (studentRecord.age) parts.push(`Age: ${studentRecord.age}`);
    if (studentRecord.gender) parts.push(`Gender: ${studentRecord.gender}`);
    if (studentRecord.branch_field) parts.push(`Field of Study: ${studentRecord.branch_field}`);
    if (studentRecord.course_name) parts.push(`Course: ${studentRecord.course_name}`);
    if (studentRecord.university) parts.push(`University: ${studentRecord.university}`);
    if (studentRecord.college_school_name) parts.push(`Institution: ${studentRecord.college_school_name}`);
    if (studentRecord.city) parts.push(`City: ${studentRecord.city}`);
    if (studentRecord.state) parts.push(`State: ${studentRecord.state}`);
    if (studentRecord.country) parts.push(`Country: ${studentRecord.country}`);
    if (studentRecord.grade) parts.push(`Grade/Class: ${studentRecord.grade}`);
    if (studentRecord.semester) parts.push(`Semester: ${studentRecord.semester}`);
    if (studentRecord.currentCgpa) parts.push(`CGPA: ${studentRecord.currentCgpa}`);
    if (studentRecord.bio) parts.push(`Bio: ${studentRecord.bio}`);

    // Add interests, hobbies, and languages
    if (studentRecord.interests && Array.isArray(studentRecord.interests) && studentRecord.interests.length > 0) {
      parts.push(`Interests: ${studentRecord.interests.join(', ')}`);
    }
    if (studentRecord.hobbies && Array.isArray(studentRecord.hobbies) && studentRecord.hobbies.length > 0) {
      parts.push(`Hobbies: ${studentRecord.hobbies.join(', ')}`);
    }
    if (studentRecord.languages && Array.isArray(studentRecord.languages) && studentRecord.languages.length > 0) {
      parts.push(`Languages: ${studentRecord.languages.join(', ')}`);
    }

    // Add work experience and career gaps
    if (studentRecord.work_experience) {
      parts.push(`Work Experience: ${studentRecord.work_experience}`);
    }
    if (studentRecord.gap_in_studies && studentRecord.gap_reason) {
      parts.push(`Career Gap: ${studentRecord.gap_years || 0} years - ${studentRecord.gap_reason}`);
    }

    // Add social/portfolio links
    const links: string[] = [];
    if (studentRecord.github_link) links.push(`GitHub: ${studentRecord.github_link}`);
    if (studentRecord.linkedin_link) links.push(`LinkedIn: ${studentRecord.linkedin_link}`);
    if (studentRecord.portfolio_link) links.push(`Portfolio: ${studentRecord.portfolio_link}`);
    if (links.length > 0) {
      parts.push(`Professional Links: ${links.join(', ')}`);
    }

    // Section 2: Skills with Proficiency
    if (skills && skills.length > 0) {
      parts.push('\n=== TECHNICAL SKILLS ===');
      const skillStrings = (skills as SkillRecord[]).map((s) => {
        let skillStr = s.name;
        if (s.level) skillStr += ` (Level ${s.level}/5)`;
        else if (s.proficiency_level) skillStr += ` (${s.proficiency_level})`;
        if (s.type) skillStr += ` [${s.type}]`;
        if (s.description) skillStr += ` - ${s.description}`;
        return skillStr;
      });
      parts.push(skillStrings.join(', '));
    }

    // Section 3: Certificates
    if (certificates && certificates.length > 0) {
      parts.push('\n=== CERTIFICATIONS ===');
      for (const cert of certificates) {
        const typedCert = cert as unknown as CertificateRecord;
        let certStr = typedCert.title;
        if (typedCert.issuer) certStr += ` from ${typedCert.issuer}`;
        if (typedCert.platform) certStr += ` on ${typedCert.platform}`;
        if (typedCert.level) certStr += ` (${typedCert.level})`;
        if (typedCert.category) certStr += ` - Category: ${typedCert.category}`;
        if (typedCert.instructor) certStr += ` - Instructor: ${typedCert.instructor}`;
        if (typedCert.description) certStr += `. ${typedCert.description}`;
        
        // Add training title if joined
        if (typedCert.trainings && typedCert.trainings.title) {
          certStr += ` | Related Training: ${typedCert.trainings.title}`;
        }
        
        parts.push(`• ${certStr}`);
      }
    }

    // Section 4: Projects
    if (projects && projects.length > 0) {
      parts.push('\n=== PROJECTS ===');
      for (const proj of projects as ProjectRecord[]) {
        let projStr = proj.title;
        if (proj.role) projStr += ` (${proj.role})`;
        if (proj.organization) projStr += ` at ${proj.organization}`;
        if (proj.status) projStr += ` [${proj.status}]`;
        if (proj.tech_stack && Array.isArray(proj.tech_stack) && proj.tech_stack.length > 0) {
          projStr += ` | Technologies: ${proj.tech_stack.join(', ')}`;
        }
        if (proj.description) {
          projStr += `. ${proj.description.slice(0, EMBEDDING_CONFIG.PROJECT_DESC_MAX_LENGTH)}`;
        }
        parts.push(`• ${projStr}`);
      }
    }

    // Section 5: Trainings
    if (trainings && trainings.length > 0) {
      parts.push('\n=== TRAINING PROGRAMS ===');
      for (const training of trainings as TrainingRecord[]) {
        let trainStr = training.title;
        if (training.organization) trainStr += ` by ${training.organization}`;
        if (training.source) trainStr += ` via ${training.source}`;
        if (training.status) trainStr += ` (${training.status})`;
        if (training.description) {
          trainStr += `. ${training.description.slice(0, EMBEDDING_CONFIG.TRAINING_DESC_MAX_LENGTH)}`;
        }
        parts.push(`• ${trainStr}`);
      }
    }

    // Section 6: Completed Courses
    if (courseEnrollments && courseEnrollments.length > 0) {
      const completed = (courseEnrollments as CourseEnrollmentRecord[]).filter((c) => c.status === 'completed');
      if (completed.length > 0) {
        parts.push('\n=== COMPLETED COURSES ===');
        for (const course of completed.slice(0, EMBEDDING_CONFIG.MAX_COURSES)) {
          let courseStr = course.course_title;
          if (course.skills_acquired && Array.isArray(course.skills_acquired) && course.skills_acquired.length > 0) {
            courseStr += ` | Skills: ${course.skills_acquired.join(', ')}`;
          }
          parts.push(`• ${courseStr}`);
        }
      }
    }

    const text = parts.join('\n');
    
    if (text.length < 50) {
      throw new EmbeddingError(
        `Insufficient data for student ${studentId} (only ${text.length} chars)`,
        'INSUFFICIENT_DATA',
        { studentId, textLength: text.length }
      );
    }

    console.log(`[TextBuilder] Built enriched student text (${text.length} chars) for ${studentId}`);
    return text;

  } catch (error) {
    if (error instanceof EmbeddingError) {
      throw error;
    }
    throw new EmbeddingError(
      `Error building student text: ${error instanceof Error ? error.message : String(error)}`,
      'API_ERROR',
      { studentId, originalError: error }
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

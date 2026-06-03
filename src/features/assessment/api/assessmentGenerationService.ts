/**
 * Assessment Generation Service
 * Generates dynamic assessments based on course name using AI
 */

type AssessmentLevel = 'Beginner' | 'Intermediate' | 'Advanced';
type QuestionType = 'mcq' | 'short_answer';

interface Question {
  id: number;
  type: QuestionType;
  difficulty: AssessmentLevel;
  question: string;
  options?: string[];
  correct_answer: string;
  skill_tag: string;
}

interface Assessment {
  course: string;
  level: AssessmentLevel;
  total_questions: number;
  questions: Question[];
  cachedAt?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface SaveResult {
  success: boolean;
  data?: any;
  alreadyExists?: boolean;
  error?: string;
}

/**
 * Save generated assessment to database for reuse
 */
export async function saveGeneratedAssessment(
  courseName: string,
  courseId: string | null,
  assessment: Assessment
): Promise<SaveResult> {
  try {
    const { supabase } = await import('@/shared/api/supabaseClient');
    
    console.log('💾 Saving generated assessment to database...', {
      courseName,
      courseId,
      questionCount: assessment.questions?.length
    });

    const { data, error } = await supabase
      .from('generated_external_assessment')
      .insert({
        certificate_name: courseName,
        course_id: courseId,
        assessment_level: assessment.level,
        total_questions: assessment.questions.length,
        questions: assessment.questions,
        generated_by: 'AI'
      })
      .select()
      .single();

    if (error) {
      // If duplicate (already exists), that's okay
      if (error.code === '23505') {
        console.log('ℹ️ Assessment already exists in database');
        return { success: true, data: null, alreadyExists: true };
      }
      throw error;
    }

    console.log('✅ Assessment saved to database:', data.id);
    return { success: true, data, alreadyExists: false };
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error saving assessment to database:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Load generated assessment from database
 */
export async function loadGeneratedAssessment(courseName: string): Promise<Assessment | null> {
  try {
    const { supabase } = await import('@/shared/api/supabaseClient');
    
    console.log('🔍 Loading generated assessment from database...', courseName);

    const { data, error } = await supabase
      .from('generated_external_assessment')
      .select('*')
      .eq('certificate_name', courseName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ No generated assessment found in database');
        return null;
      }
      throw error;
    }

    console.log('✅ Loaded assessment from database:', {
      id: data.id,
      questionCount: data.questions?.length,
      generatedAt: data.generated_at
    });

    // Transform to expected format
    return {
      course: data.certificate_name,
      level: data.assessment_level,
      total_questions: data.total_questions,
      questions: data.questions
    };
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error loading assessment from database:', err);
    return null;
  }
}

/**
 * Generate assessment using backend API (which calls Claude AI)
 */
export async function generateAssessment(
  courseName: string,
  level: AssessmentLevel = 'Intermediate',
  questionCount: number = 15,
  courseId: string | null = null
): Promise<Assessment> {
  try {
    console.log('🎯 Generating assessment for:', courseName, 'Level:', level);

    // Call backend API (Cloudflare Worker) to generate assessment
    // Use unified question generation API
    const { getApiUrl } = await import('@/shared/api/apiUtils');
    const apiUrl = `${getApiUrl('question-generation')}/generate`;

    console.log('📡 Calling backend API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseName,
        level,
        questionCount
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ API Error:', errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid API key on server. Please check server configuration.');
      }
      
      throw new Error(errorData.error || `API Error (${response.status}): Failed to generate assessment`);
    }

    const assessment: Assessment = await response.json();
    
    console.log('✅ Generated assessment with AI:', {
      course: assessment.course,
      level: assessment.level,
      questionCount: assessment.questions?.length,
      firstQuestion: assessment.questions?.[0]?.question?.substring(0, 50) + '...'
    });
    
    // Validate the assessment
    const validation = validateAssessment(assessment);
    if (!validation.valid) {
      console.error('❌ Validation errors:', validation.errors);
      throw new Error('Generated assessment is invalid: ' + validation.errors.join(', '));
    }

    console.log('✅ Assessment validated successfully');

    return assessment;
  } catch (error) {
    console.error('❌ Error generating assessment:', error);
    throw error;
  }
}

/**
 * Validate assessment structure
 */
export function validateAssessment(assessment: Assessment): ValidationResult {
  const errors: string[] = [];
  
  if (!assessment.course) errors.push('Missing course name');
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(assessment.level)) {
    errors.push('Invalid level');
  }
  if (!assessment.questions || assessment.questions.length === 0) {
    errors.push('No questions found');
  }
  if (assessment.questions && assessment.questions.length !== assessment.total_questions) {
    errors.push('Question count mismatch');
  }
  
  if (assessment.questions) {
    assessment.questions.forEach((q, idx) => {
      if (!q.id) errors.push(`Question ${idx + 1}: Missing id`);
      if (!q.type) errors.push(`Question ${idx + 1}: Missing type`);
      if (!q.question) errors.push(`Question ${idx + 1}: Missing question text`);
      if (!q.correct_answer) errors.push(`Question ${idx + 1}: Missing correct answer`);
      if (!q.skill_tag) errors.push(`Question ${idx + 1}: Missing skill tag`);
      
      if (q.type === 'mcq' && (!q.options || q.options.length < 2)) {
        errors.push(`Question ${idx + 1}: MCQ must have at least 2 options`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Save assessment to localStorage for offline access
 */
export function cacheAssessment(courseName: string, assessment: Assessment): void {
  try {
    const cacheKey = `assessment_${courseName.toLowerCase().replace(/\s+/g, '_')}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      ...assessment,
      cachedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error caching assessment:', error);
  }
}

/**
 * Load cached assessment from localStorage
 */
export function getCachedAssessment(courseName: string): Assessment | null {
  try {
    const cacheKey = `assessment_${courseName.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const assessment: Assessment = JSON.parse(cached);
      // Check if cache is less than 7 days old
      const cacheAge = Date.now() - new Date(assessment.cachedAt!).getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (cacheAge < maxAge) {
        return assessment;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading cached assessment:', error);
    return null;
  }
}

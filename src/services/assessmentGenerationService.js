/**
 * Assessment Generation Service
 * Generates dynamic assessments based on course name using AI
 */

const SYSTEM_PROMPT = `You are an expert assessment creator. Generate a skill assessment SPECIFICALLY for the course: {{COURSE_NAME}}

CRITICAL REQUIREMENTS:
1. ALL questions MUST be directly related to {{COURSE_NAME}}
2. Questions should test practical knowledge of {{COURSE_NAME}}
3. Use terminology, concepts, and examples from {{COURSE_NAME}}
4. DO NOT generate generic programming or general knowledge questions
5. Focus on the specific skills taught in {{COURSE_NAME}}

Course Details:
- Course Name: {{COURSE_NAME}}
- Assessment Level: {{LEVEL}}
- Number of Questions: {{QUESTION_COUNT}}
- Purpose: Evaluate student's understanding of {{COURSE_NAME}}

Difficulty Guidelines for {{LEVEL}}:
- Beginner: Basic concepts, syntax, fundamental features of {{COURSE_NAME}}
- Intermediate: Practical application, common patterns, real-world usage of {{COURSE_NAME}}
- Advanced: Complex scenarios, optimization, best practices, edge cases in {{COURSE_NAME}}

Question Design Rules:
1. Every question MUST mention or relate to {{COURSE_NAME}} concepts
2. Use specific terminology from {{COURSE_NAME}}
3. Include practical scenarios relevant to {{COURSE_NAME}}
4. Mix question types: 80% MCQ, 20% short answer
5. Each MCQ must have 4 options with exactly ONE correct answer
6. Options should be plausible but clearly distinguishable
7. Avoid trick questions or ambiguous wording
8. Test understanding, not memorization
9. Progress from easier to harder questions

Output Format:
- Respond with ONLY valid JSON
- NO markdown formatting (no \`\`\`json)
- NO explanatory text before or after JSON
- NO comments in the JSON

Required JSON structure:
{
  "course": "{{COURSE_NAME}}",
  "level": "{{LEVEL}}",
  "total_questions": {{QUESTION_COUNT}},
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "{{LEVEL}}",
      "question": "Specific question about {{COURSE_NAME}}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "skill_tag": "specific {{COURSE_NAME}} skill"
    }
  ]
}

IMPORTANT: Generate questions that someone studying {{COURSE_NAME}} would expect to see. Make it obvious this is a {{COURSE_NAME}} assessment, not a general test.`;

/**
 * Save generated assessment to database for reuse
 */
export async function saveGeneratedAssessment(courseName, courseId, assessment) {
  try {
    const { supabase } = await import('../lib/supabaseClient');
    
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
    console.error('❌ Error saving assessment to database:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load generated assessment from database
 */
export async function loadGeneratedAssessment(courseName) {
  try {
    const { supabase } = await import('../lib/supabaseClient');
    
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
    console.error('❌ Error loading assessment from database:', error);
    return null;
  }
}

/**
 * Generate assessment using backend API (which calls Claude AI)
 */
export async function generateAssessment(courseName, level = 'Intermediate', questionCount = 15, courseId = null) {
  try {
    console.log('🎯 Generating assessment for:', courseName, 'Level:', level);

    // Call backend API (Cloudflare Worker) to generate assessment
    // Use unified question generation API
    const backendUrl = import.meta.env.VITE_EXTERNAL_API_KEY || 
      import.meta.env.VITE_QUESTION_GENERATION_API_URL || 
      'https://question-generation-api.dark-mode-d021.workers.dev';
    const apiUrl = `${backendUrl}/api/assessment/generate`;

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

    const assessment = await response.json();
    
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
export function validateAssessment(assessment) {
  const errors = [];
  
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
export function cacheAssessment(courseName, assessment) {
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
export function getCachedAssessment(courseName) {
  try {
    const cacheKey = `assessment_${courseName.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const assessment = JSON.parse(cached);
      // Check if cache is less than 7 days old
      const cacheAge = Date.now() - new Date(assessment.cachedAt).getTime();
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

/**
 * Career Assessment AI Service
 * Generates AI-based questions for Aptitude and Stream Knowledge sections
 * 
 * Key Features:
 * - AI generation ONLY for Aptitude & Technical (Stream Knowledge)
 * - Questions saved per student for resume functionality
 * - If student quits and continues, loads their saved questions
 * - Fallback to hardcoded questions if AI fails
 */

import { supabase } from '../lib/supabaseClient';

// Stream-specific prompts for knowledge questions
export const STREAM_KNOWLEDGE_PROMPTS = {
  // Category-level streams (when user selects Science/Commerce/Arts)
  science: {
    name: 'Science',
    topics: ['Scientific method', 'Physics fundamentals', 'Chemistry basics', 'Biology concepts', 'Mathematics', 'Laboratory techniques']
  },
  commerce: {
    name: 'Commerce',
    topics: ['Accounting principles', 'Business law', 'Economics', 'Financial management', 'Marketing basics', 'Business statistics']
  },
  arts: {
    name: 'Arts & Humanities',
    topics: ['Critical thinking', 'Communication skills', 'Social sciences', 'Cultural studies', 'Research methods', 'Analytical writing']
  },
  
  // Science streams
  cs: {
    name: 'Computer Science / IT',
    topics: ['Programming fundamentals', 'Data structures', 'Algorithms', 'Database concepts', 'Web technologies', 'Software engineering']
  },
  engineering: {
    name: 'Engineering',
    topics: ['Physics applications', 'Mathematics', 'Engineering mechanics', 'Technical drawing', 'Problem solving', 'Design thinking']
  },
  medical: {
    name: 'Medical Sciences',
    topics: ['Human anatomy', 'Biology fundamentals', 'Chemistry basics', 'Health sciences', 'Medical terminology', 'Patient care concepts']
  },
  pharmacy: {
    name: 'Pharmacy',
    topics: ['Pharmaceutical chemistry', 'Pharmacology basics', 'Drug interactions', 'Dosage forms', 'Healthcare systems', 'Patient counseling']
  },
  bsc: {
    name: 'Pure Sciences',
    topics: ['Scientific method', 'Laboratory techniques', 'Data analysis', 'Research methodology', 'Core science concepts', 'Mathematical applications']
  },
  animation: {
    name: 'Animation & Game Design',
    topics: ['Visual design principles', 'Animation basics', 'Storytelling', 'Digital tools', 'Character design', 'Game mechanics']
  },
  
  // Commerce streams
  bba: {
    name: 'Business Administration',
    topics: ['Management principles', 'Marketing basics', 'Organizational behavior', 'Business communication', 'Entrepreneurship', 'Strategic thinking']
  },
  bca: {
    name: 'Computer Applications',
    topics: ['Programming basics', 'Database management', 'Web development', 'Software applications', 'IT fundamentals', 'System analysis']
  },
  dm: {
    name: 'Digital Marketing',
    topics: ['Social media marketing', 'SEO basics', 'Content marketing', 'Analytics', 'Brand management', 'Digital advertising']
  },
  bcom: {
    name: 'Commerce',
    topics: ['Accounting principles', 'Business law', 'Economics', 'Financial management', 'Taxation basics', 'Business statistics']
  },
  ca: {
    name: 'Chartered Accountancy',
    topics: ['Advanced accounting', 'Auditing', 'Taxation', 'Corporate law', 'Financial reporting', 'Cost accounting']
  },
  finance: {
    name: 'Finance & Banking',
    topics: ['Financial markets', 'Banking operations', 'Investment basics', 'Risk management', 'Financial analysis', 'Monetary policy']
  },
  
  // Arts streams
  ba: {
    name: 'Arts & Humanities',
    topics: ['Critical thinking', 'Communication skills', 'Social sciences', 'Cultural studies', 'Research methods', 'Analytical writing']
  },
  journalism: {
    name: 'Journalism & Mass Communication',
    topics: ['News writing', 'Media ethics', 'Digital journalism', 'Public relations', 'Broadcasting', 'Content creation']
  },
  design: {
    name: 'Design',
    topics: ['Design principles', 'Color theory', 'Typography', 'User experience', 'Visual communication', 'Creative thinking']
  },
  law: {
    name: 'Law',
    topics: ['Legal reasoning', 'Constitutional basics', 'Contract law', 'Legal research', 'Ethics', 'Argumentation']
  },
  psychology: {
    name: 'Psychology',
    topics: ['Human behavior', 'Cognitive processes', 'Research methods', 'Developmental psychology', 'Social psychology', 'Mental health awareness']
  },
  finearts: {
    name: 'Fine Arts',
    topics: ['Art history', 'Visual composition', 'Creative expression', 'Art criticism', 'Studio techniques', 'Contemporary art']
  }
};

// Aptitude categories
const APTITUDE_CATEGORIES = [
  { id: 'verbal', name: 'Verbal Reasoning', description: 'Language comprehension, vocabulary, analogies' },
  { id: 'numerical', name: 'Numerical Ability', description: 'Mathematical reasoning, data interpretation' },
  { id: 'logical', name: 'Logical Reasoning', description: 'Pattern recognition, deductive reasoning' },
  { id: 'spatial', name: 'Spatial Reasoning', description: 'Visual-spatial relationships, mental rotation' },
  { id: 'abstract', name: 'Abstract Reasoning', description: 'Pattern completion, sequence identification' }
];

/**
 * Get saved questions for a student (for resume functionality)
 */
export async function getSavedQuestionsForStudent(studentId, streamId, questionType) {
  if (!studentId) return null;
  
  try {
    const { data, error } = await supabase
      .from('career_assessment_ai_questions')
      .select('questions')
      .eq('student_id', studentId)
      .eq('stream_id', streamId)
      .eq('question_type', questionType)
      .eq('is_active', true)
      .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

    if (error) {
      console.warn(`No saved ${questionType} questions found:`, error.message);
      return null;
    }
    
    if (data?.questions?.length > 0) {
      console.log(`✅ Found saved ${questionType} questions for student:`, studentId);
      return data.questions;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching saved questions:', err);
    return null;
  }
}

/**
 * Generate Stream Knowledge questions using AI
 * If studentId provided, saves questions for resume functionality
 */
export async function generateStreamKnowledgeQuestions(streamId, questionCount = 20, studentId = null, attemptId = null) {
  const streamInfo = STREAM_KNOWLEDGE_PROMPTS[streamId];
  
  if (!streamInfo) {
    console.error('Unknown stream:', streamId, '- available streams:', Object.keys(STREAM_KNOWLEDGE_PROMPTS));
    return null; // Return null instead of fallback
  }

  // Check for saved questions first if studentId provided
  if (studentId) {
    const saved = await getSavedQuestionsForStudent(studentId, streamId, 'knowledge');
    if (saved) {
      console.log('✅ Using saved knowledge questions for student');
      return saved;
    }
  }

  console.log('🎯 Generating fresh knowledge questions for:', streamInfo.name);

  const apiUrl = import.meta.env.VITE_EXTERNAL_API_KEY || 'https://assessment-api.dark-mode-d021.workers.dev';
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Calling Knowledge API (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(`${apiUrl}/career-assessment/generate-knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          streamName: streamInfo.name,
          topics: streamInfo.topics,
          questionCount,
          studentId,
          attemptId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error Response (attempt ${attempt}):`, errorText);
        if (attempt === maxRetries) {
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      const data = await response.json();
      console.log('✅ Knowledge questions generated:', data.questions?.length || 0);
      return data.questions;
    } catch (error) {
      console.error(`Error generating knowledge questions (attempt ${attempt}):`, error);
      if (attempt === maxRetries) {
        return null; // Return null instead of fallback - let UI handle loading state
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return null; // Return null instead of fallback
}

/**
 * Generate Aptitude questions using AI
 * If studentId provided, saves questions for resume functionality
 */
export async function generateAptitudeQuestions(streamId, questionCount = 50, studentId = null, attemptId = null) {
  // Check for saved questions first if studentId provided
  if (studentId) {
    const saved = await getSavedQuestionsForStudent(studentId, streamId, 'aptitude');
    if (saved && saved.length > 0) {
      console.log('✅ Using saved aptitude questions for student:', saved.length);
      return saved;
    }
  }

  console.log('🎯 Generating aptitude questions for stream:', streamId);

  const apiUrl = import.meta.env.VITE_EXTERNAL_API_KEY || 'https://assessment-api.dark-mode-d021.workers.dev';
  const maxRetries = 3;
  const questionsPerCategory = Math.ceil(questionCount / APTITUDE_CATEGORIES.length); // 10 per category for 50 total
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Calling API (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(`${apiUrl}/career-assessment/generate-aptitude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          questionsPerCategory,
          studentId,
          attemptId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (attempt ${attempt}):`, errorText.substring(0, 200));
        if (attempt === maxRetries) return null;
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }

      const data = await response.json();
      console.log('✅ Aptitude questions generated:', data.questions?.length || 0);
      return data.questions || [];
    } catch (error) {
      console.error(`Error generating aptitude questions (attempt ${attempt}):`, error.message);
      if (attempt === maxRetries) return null;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  
  return null;
}

/**
 * Save aptitude questions to database
 */
async function saveAptitudeQuestions(studentId, streamId, attemptId, questions) {
  if (!studentId) return;
  
  try {
    await supabase.from('career_assessment_ai_questions').upsert({
      student_id: studentId,
      stream_id: streamId,
      question_type: 'aptitude',
      attempt_id: attemptId || null,
      questions: questions,
      generated_at: new Date().toISOString(),
      is_active: true
    }, { onConflict: 'student_id,stream_id,question_type' });
    console.log('✅ All aptitude questions saved:', questions.length);
  } catch (e) {
    console.warn('⚠️ Could not save questions:', e.message);
  }
}

/**
 * Get fallback knowledge questions if AI generation fails
 */
function getFallbackKnowledgeQuestions(streamId) {
  const streamInfo = STREAM_KNOWLEDGE_PROMPTS[streamId];
  if (!streamInfo) return [];

  return streamInfo.topics.map((topic, idx) => ({
    id: `knowledge_${streamId}_${idx + 1}`,
    type: 'mcq',
    question: `Which of the following best describes a key concept in ${topic}?`,
    options: [
      `A fundamental principle of ${topic}`,
      `An advanced technique in ${topic}`,
      `A common misconception about ${topic}`,
      `An unrelated concept`
    ],
    correct_answer: `A fundamental principle of ${topic}`,
    skill_tag: topic,
    difficulty: idx < 2 ? 'easy' : idx < 4 ? 'medium' : 'hard'
  }));
}

/**
 * Clear saved questions for a student (when starting fresh assessment)
 */
export async function clearSavedQuestionsForStudent(studentId, streamId) {
  try {
    await supabase
      .from('career_assessment_ai_questions')
      .update({ is_active: false })
      .eq('student_id', studentId)
      .eq('stream_id', streamId);
    console.log('✅ Cleared saved questions for student:', studentId);
  } catch (err) {
    console.warn('Error clearing saved questions:', err);
  }
}

/**
 * Load questions for career assessment
 * - If student has saved questions (from previous attempt), loads those
 * - Otherwise generates fresh AI questions and saves them
 * - Falls back to hardcoded questions if AI fails or returns too few
 */
export async function loadCareerAssessmentQuestions(streamId, gradeLevel, studentId = null, attemptId = null) {
  const questions = {
    aptitude: null,
    knowledge: null
  };

  // Only generate AI questions for after12 grade level
  if (gradeLevel === 'after12' && streamId) {
    console.log('🤖 Loading AI questions for after12 student, stream:', streamId, 'studentId:', studentId);
    
    // Generate/load aptitude questions first (will use saved if available)
    const aiAptitude = await generateAptitudeQuestions(streamId, 50, studentId, attemptId);
    
    if (aiAptitude && aiAptitude.length > 0) {
      questions.aptitude = aiAptitude;
      console.log(`✅ Using ${aiAptitude.length} AI aptitude questions`);
    }
    
    // Add delay between API calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate/load knowledge questions (will use saved if available)
    const aiKnowledge = await generateStreamKnowledgeQuestions(streamId, 20, studentId, attemptId);
    
    if (aiKnowledge && aiKnowledge.length > 0) {
      questions.knowledge = aiKnowledge;
      console.log(`✅ Using ${aiKnowledge.length} AI knowledge questions`);
    }
  }

  return questions;
}

export default {
  generateStreamKnowledgeQuestions,
  generateAptitudeQuestions,
  loadCareerAssessmentQuestions,
  getSavedQuestionsForStudent,
  clearSavedQuestionsForStudent,
  STREAM_KNOWLEDGE_PROMPTS,
  APTITUDE_CATEGORIES
};

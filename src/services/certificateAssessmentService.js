/**
 * Certificate Assessment Service
 * Dynamically loads assessment questions based on certificate/course name
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Fetch assessment questions for a specific certificate/course
 * @param {string} certificateName - Name of the certificate/course
 * @param {string} courseId - Course ID (optional)
 * @returns {Promise<Array>} Array of questions
 */
export async function fetchQuestionsByCertificate(certificateName, courseId = null) {
  try {
    console.log('Fetching questions for certificate:', certificateName, 'courseId:', courseId);

    // Try to fetch from database first
    let query = supabase
      .from('assessment_questions')
      .select('*')
      .eq('enabled', true)
      .order('question_order', { ascending: true });

    // Filter by course_id if provided
    if (courseId && courseId !== 'default') {
      query = query.eq('course_id', courseId);
    } else if (certificateName && certificateName !== 'General Assessment') {
      // Try to match by certificate name or course name
      query = query.or(
        `course_name.ilike.%${certificateName}%,certificate_name.ilike.%${certificateName}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return getFallbackQuestions(certificateName);
    }

    if (!data || data.length === 0) {
      console.log('No questions found in database, using fallback');
      return getFallbackQuestions(certificateName);
    }

    console.log(`Found ${data.length} questions for ${certificateName}`);
    return data.map(transformQuestion);
  } catch (err) {
    console.error('Error in fetchQuestionsByCertificate:', err);
    return getFallbackQuestions(certificateName);
  }
}

/**
 * Transform database question to UI format
 */
function transformQuestion(dbQuestion) {
  return {
    id: dbQuestion.id,
    text: dbQuestion.question_text,
    options: dbQuestion.options || [],
    correctAnswer: dbQuestion.correct_answer,
    type: dbQuestion.question_type || 'mcq',
    difficulty: dbQuestion.difficulty || 'medium',
    category: dbQuestion.category,
    points: dbQuestion.points || 1,
    timeLimit: dbQuestion.time_limit_seconds,
    explanation: dbQuestion.explanation,
  };
}

/**
 * Get fallback questions based on certificate name
 * This provides default questions when database is empty
 */
function getFallbackQuestions(certificateName) {
  const name = certificateName?.toLowerCase() || '';

  // JavaScript/Programming questions
  if (name.includes('javascript') || name.includes('js') || name.includes('programming')) {
    return [
      {
        id: 1,
        text: 'What is the output of: console.log(typeof null)?',
        options: ['null', 'undefined', 'object', 'number'],
        correctAnswer: 'object',
        type: 'mcq',
        difficulty: 'easy',
      },
      {
        id: 2,
        text: 'Which method is used to add an element at the end of an array?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correctAnswer: 'push()',
        type: 'mcq',
        difficulty: 'easy',
      },
      {
        id: 3,
        text: 'What does "=== " check in JavaScript?',
        options: ['Value only', 'Type only', 'Both value and type', 'Neither'],
        correctAnswer: 'Both value and type',
        type: 'mcq',
        difficulty: 'medium',
      },
    ];
  }

  // Python questions
  if (name.includes('python')) {
    return [
      {
        id: 1,
        text: 'Which keyword is used to define a function in Python?',
        options: ['function', 'def', 'func', 'define'],
        correctAnswer: 'def',
        type: 'mcq',
        difficulty: 'easy',
      },
      {
        id: 2,
        text: 'What is the output of: print(type([]))?',
        options: ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "<class 'dict'>"],
        correctAnswer: "<class 'list'>",
        type: 'mcq',
        difficulty: 'easy',
      },
    ];
  }

  // React questions
  if (name.includes('react')) {
    return [
      {
        id: 1,
        text: 'What hook is used to manage state in functional components?',
        options: ['useEffect', 'useState', 'useContext', 'useReducer'],
        correctAnswer: 'useState',
        type: 'mcq',
        difficulty: 'easy',
      },
      {
        id: 2,
        text: 'What is JSX?',
        options: [
          'A JavaScript library',
          'A syntax extension for JavaScript',
          'A CSS framework',
          'A database',
        ],
        correctAnswer: 'A syntax extension for JavaScript',
        type: 'mcq',
        difficulty: 'medium',
      },
    ];
  }

  // Data Science questions
  if (name.includes('data') || name.includes('analytics') || name.includes('science')) {
    return [
      {
        id: 1,
        text: 'Which library is commonly used for data manipulation in Python?',
        options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'],
        correctAnswer: 'Pandas',
        type: 'mcq',
        difficulty: 'easy',
      },
      {
        id: 2,
        text: 'What does SQL stand for?',
        options: [
          'Structured Query Language',
          'Simple Query Language',
          'Standard Query Language',
          'System Query Language',
        ],
        correctAnswer: 'Structured Query Language',
        type: 'mcq',
        difficulty: 'easy',
      },
    ];
  }

  // Generic fallback questions
  return [
    {
      id: 1,
      text: 'What is the primary purpose of this certification?',
      options: ['To validate skills', 'To get a job', 'To learn basics', 'To network'],
      correctAnswer: 'To validate skills',
      type: 'mcq',
      difficulty: 'easy',
    },
    {
      id: 2,
      text: 'How would you rate your understanding of the core concepts?',
      options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      correctAnswer: 'Intermediate',
      type: 'mcq',
      difficulty: 'easy',
    },
    {
      id: 3,
      text: 'Which best describes your learning approach?',
      options: [
        'Hands-on practice',
        'Reading documentation',
        'Video tutorials',
        'All of the above',
      ],
      correctAnswer: 'All of the above',
      type: 'mcq',
      difficulty: 'easy',
    },
  ];
}

/**
 * Save assessment attempt to database
 */
export async function saveAssessmentAttempt(userId, certificateName, courseId, answers, score) {
  try {
    const { data, error } = await supabase
      .from('assessment_attempts')
      .insert({
        user_id: userId,
        certificate_name: certificateName,
        course_id: courseId,
        answers: answers,
        score: score,
        total_questions: answers.length,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error saving assessment attempt:', err);
    throw err;
  }
}

/**
 * Stream Recommendation Service
 * Generates AI-based Science/Commerce/Arts stream recommendations for students
 * Based on: Subject marks, Projects, Experiences, Interests, Hobbies
 * 
 * Uses OpenRouter AI for detailed analysis and personalized recommendations
 */

import { supabase } from '../lib/supabaseClient';
import { getPagesApiUrl } from '../utils/pagesUrl';

// API URL for stream recommendation endpoint
const CAREER_API_URL = getPagesApiUrl('career');

// Subject to stream mapping for scoring
const SUBJECT_STREAM_WEIGHTS = {
  science: {
    'Mathematics': 1.0,
    'Physics': 1.0,
    'Chemistry': 1.0,
    'Biology': 0.9,
    'Science': 0.9,
    'Computer Science': 0.8,
    'Information Technology': 0.7,
    'Environmental Science': 0.6
  },
  commerce: {
    'Mathematics': 0.8,
    'Accountancy': 1.0,
    'Business Studies': 1.0,
    'Economics': 1.0,
    'Commerce': 0.9,
    'Statistics': 0.7,
    'Computer Science': 0.6
  },
  arts: {
    'English': 1.0,
    'Hindi': 0.9,
    'History': 1.0,
    'Geography': 0.9,
    'Political Science': 1.0,
    'Sociology': 0.9,
    'Psychology': 0.9,
    'Fine Arts': 1.0,
    'Music': 0.8,
    'Languages': 0.8
  }
};

// Interest keywords mapping to streams
const INTEREST_STREAM_MAPPING = {
  science: [
    'technology', 'engineering', 'medical', 'research', 'laboratory', 'coding',
    'programming', 'robotics', 'ai', 'machine learning', 'biotechnology',
    'pharmaceutical', 'physics', 'chemistry', 'biology', 'mathematics',
    'space', 'astronomy', 'electronics', 'innovation', 'scientific'
  ],
  commerce: [
    'business', 'finance', 'accounting', 'economics', 'marketing', 'management',
    'entrepreneurship', 'banking', 'investment', 'stock market', 'trading',
    'commerce', 'retail', 'sales', 'startup', 'corporate', 'consulting'
  ],
  arts: [
    'literature', 'writing', 'journalism', 'media', 'communication', 'art',
    'design', 'music', 'dance', 'theatre', 'film', 'photography', 'history',
    'politics', 'sociology', 'psychology', 'philosophy', 'languages', 'culture',
    'creative', 'humanities', 'social work', 'law', 'civil services'
  ]
};

/**
 * Fetch student data for stream recommendation
 */
export const fetchStudentStreamData = async (studentId) => {
  const { data, error } = await supabase
    .rpc('get_student_stream_recommendation_data', { p_student_id: studentId });
  
  if (error) {
    console.error('Error fetching student data:', error);
    throw error;
  }
  
  return data;
};

/**
 * Calculate stream scores based on subject marks
 */
const calculateMarksBasedScores = (subjectMarks) => {
  const scores = { science: 0, commerce: 0, arts: 0 };
  const counts = { science: 0, commerce: 0, arts: 0 };
  
  Object.entries(subjectMarks).forEach(([subject, data]) => {
    const percentage = data.percentage || 0;
    
    // Check each stream's subject weights
    Object.entries(SUBJECT_STREAM_WEIGHTS).forEach(([stream, subjects]) => {
      Object.entries(subjects).forEach(([subjectName, weight]) => {
        if (subject.toLowerCase().includes(subjectName.toLowerCase())) {
          scores[stream] += percentage * weight;
          counts[stream] += 1;
        }
      });
    });
  });
  
  // Calculate averages
  Object.keys(scores).forEach(stream => {
    if (counts[stream] > 0) {
      scores[stream] = scores[stream] / counts[stream];
    }
  });
  
  return scores;
};

/**
 * Calculate stream scores based on interests and hobbies
 */
const calculateInterestBasedScores = (interests, hobbies) => {
  const scores = { science: 0, commerce: 0, arts: 0 };
  const allInterests = [...(interests || []), ...(hobbies || [])];
  
  allInterests.forEach(interest => {
    const interestLower = interest.toLowerCase();
    
    Object.entries(INTEREST_STREAM_MAPPING).forEach(([stream, keywords]) => {
      keywords.forEach(keyword => {
        if (interestLower.includes(keyword)) {
          scores[stream] += 10; // Add 10 points for each matching keyword
        }
      });
    });
  });
  
  // Normalize to 0-100
  const maxScore = Math.max(...Object.values(scores), 1);
  Object.keys(scores).forEach(stream => {
    scores[stream] = Math.min(100, (scores[stream] / maxScore) * 100);
  });
  
  return scores;
};

/**
 * Calculate stream scores based on projects
 */
const calculateProjectBasedScores = (projects) => {
  const scores = { science: 0, commerce: 0, arts: 0 };
  
  (projects || []).forEach(project => {
    const techStack = (project.tech_stack || []).join(' ').toLowerCase();
    const description = (project.description || '').toLowerCase();
    const title = (project.title || '').toLowerCase();
    const combined = `${techStack} ${description} ${title}`;
    
    // Science indicators
    if (combined.match(/programming|coding|software|app|website|react|python|java|ai|ml|data|algorithm|robot/)) {
      scores.science += 15;
    }
    
    // Commerce indicators
    if (combined.match(/business|finance|market|sales|accounting|ecommerce|startup|management/)) {
      scores.commerce += 15;
    }
    
    // Arts indicators
    if (combined.match(/design|art|creative|writing|media|film|music|photography|content/)) {
      scores.arts += 15;
    }
  });
  
  // Normalize
  const maxScore = Math.max(...Object.values(scores), 1);
  Object.keys(scores).forEach(stream => {
    scores[stream] = Math.min(100, (scores[stream] / maxScore) * 100);
  });
  
  return scores;
};

/**
 * Calculate stream scores based on experiences
 */
const calculateExperienceBasedScores = (experiences) => {
  const scores = { science: 0, commerce: 0, arts: 0 };
  
  (experiences || []).forEach(exp => {
    const role = (exp.role || '').toLowerCase();
    const org = (exp.organization || '').toLowerCase();
    const combined = `${role} ${org}`;
    
    // Science indicators
    if (combined.match(/lab|science|tech|computer|research|engineering|medical|hospital/)) {
      scores.science += 15;
    }
    
    // Commerce indicators
    if (combined.match(/business|bank|finance|account|market|sales|office|corporate/)) {
      scores.commerce += 15;
    }
    
    // Arts indicators
    if (combined.match(/library|media|art|design|writing|journalism|social|volunteer|ngo/)) {
      scores.arts += 15;
    }
  });
  
  // Normalize
  const maxScore = Math.max(...Object.values(scores), 1);
  Object.keys(scores).forEach(stream => {
    scores[stream] = Math.min(100, (scores[stream] / maxScore) * 100);
  });
  
  return scores;
};


/**
 * Generate comprehensive stream recommendation
 */
export const generateStreamRecommendation = async (studentId) => {
  // Fetch all student data
  const studentData = await fetchStudentStreamData(studentId);
  
  if (!studentData || !studentData.student) {
    throw new Error('Student data not found');
  }
  
  const { student, subject_marks, projects, experiences } = studentData;
  
  // Calculate scores from different sources
  const marksScores = calculateMarksBasedScores(subject_marks || {});
  const interestScores = calculateInterestBasedScores(student.interests, student.hobbies);
  const projectScores = calculateProjectBasedScores(projects);
  const experienceScores = calculateExperienceBasedScores(experiences);
  
  // Weighted combination (marks: 40%, interests: 25%, projects: 20%, experiences: 15%)
  const finalScores = {
    science: (marksScores.science * 0.4) + (interestScores.science * 0.25) + 
             (projectScores.science * 0.2) + (experienceScores.science * 0.15),
    commerce: (marksScores.commerce * 0.4) + (interestScores.commerce * 0.25) + 
              (projectScores.commerce * 0.2) + (experienceScores.commerce * 0.15),
    arts: (marksScores.arts * 0.4) + (interestScores.arts * 0.25) + 
          (projectScores.arts * 0.2) + (experienceScores.arts * 0.15)
  };
  
  // Determine recommended stream
  const sortedStreams = Object.entries(finalScores)
    .sort(([, a], [, b]) => b - a);
  
  const recommendedStream = sortedStreams[0][0];
  const alternativeStream = sortedStreams[1][0];
  const topScore = sortedStreams[0][1];
  const secondScore = sortedStreams[1][1];
  
  // Determine confidence level
  let confidenceLevel = 'low';
  if (topScore - secondScore > 20) {
    confidenceLevel = 'high';
  } else if (topScore - secondScore > 10) {
    confidenceLevel = 'medium';
  }
  
  // Generate breakdown
  const breakdown = {
    science: {
      marks_contribution: Math.round(marksScores.science * 0.4),
      interest_contribution: Math.round(interestScores.science * 0.25),
      project_contribution: Math.round(projectScores.science * 0.2),
      experience_contribution: Math.round(experienceScores.science * 0.15)
    },
    commerce: {
      marks_contribution: Math.round(marksScores.commerce * 0.4),
      interest_contribution: Math.round(interestScores.commerce * 0.25),
      project_contribution: Math.round(projectScores.commerce * 0.2),
      experience_contribution: Math.round(experienceScores.commerce * 0.15)
    },
    arts: {
      marks_contribution: Math.round(marksScores.arts * 0.4),
      interest_contribution: Math.round(interestScores.arts * 0.25),
      project_contribution: Math.round(projectScores.arts * 0.2),
      experience_contribution: Math.round(experienceScores.arts * 0.15)
    }
  };
  
  // Identify strengths
  const strengths = [];
  if (marksScores[recommendedStream] > 70) {
    strengths.push(`Strong academic performance in ${recommendedStream}-related subjects`);
  }
  if (interestScores[recommendedStream] > 50) {
    strengths.push(`Clear interest alignment with ${recommendedStream} field`);
  }
  if (projectScores[recommendedStream] > 30) {
    strengths.push(`Relevant project experience in ${recommendedStream} domain`);
  }
  if (experienceScores[recommendedStream] > 30) {
    strengths.push(`Practical exposure through ${recommendedStream}-related activities`);
  }
  
  // Career suggestions based on stream
  const careerSuggestions = {
    science: ['Engineering', 'Medicine', 'Research Scientist', 'Data Scientist', 'Software Developer', 'Biotechnologist'],
    commerce: ['Chartered Accountant', 'Business Analyst', 'Investment Banker', 'Entrepreneur', 'Marketing Manager', 'Financial Advisor'],
    arts: ['Journalist', 'Lawyer', 'Civil Services', 'Psychologist', 'Content Creator', 'Designer', 'Social Worker']
  };
  
  // Recommended subjects
  const recommendedSubjects = {
    science: ['Physics', 'Chemistry', 'Mathematics', 'Biology/Computer Science'],
    commerce: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics/Informatics Practices'],
    arts: ['History', 'Political Science', 'Geography', 'Psychology/Sociology', 'Languages']
  };
  
  return {
    student_id: studentId,
    student_name: student.name,
    current_grade: student.grade,
    
    // Scores
    science_score: Math.round(finalScores.science * 100) / 100,
    commerce_score: Math.round(finalScores.commerce * 100) / 100,
    arts_score: Math.round(finalScores.arts * 100) / 100,
    
    // Breakdown
    science_breakdown: breakdown.science,
    commerce_breakdown: breakdown.commerce,
    arts_breakdown: breakdown.arts,
    
    // Recommendation
    recommended_stream: recommendedStream,
    alternative_stream: alternativeStream,
    confidence_level: confidenceLevel,
    
    // Details
    strengths,
    career_suggestions: careerSuggestions[recommendedStream],
    recommended_subjects: recommendedSubjects,
    
    // Input data snapshot
    subject_marks: subject_marks,
    projects_summary: projects,
    experiences_summary: experiences,
    interests: student.interests,
    hobbies: student.hobbies
  };
};

/**
 * Save stream recommendation report to database
 */
export const saveStreamRecommendationReport = async (recommendation) => {
  const { data, error } = await supabase
    .from('stream_recommendation_reports')
    .insert({
      student_id: recommendation.student_id,
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      current_grade: recommendation.current_grade,
      
      subject_marks: recommendation.subject_marks,
      projects_summary: recommendation.projects_summary,
      experiences_summary: recommendation.experiences_summary,
      interests: recommendation.interests,
      hobbies: recommendation.hobbies,
      
      science_score: recommendation.science_score,
      commerce_score: recommendation.commerce_score,
      arts_score: recommendation.arts_score,
      
      science_breakdown: recommendation.science_breakdown,
      commerce_breakdown: recommendation.commerce_breakdown,
      arts_breakdown: recommendation.arts_breakdown,
      
      recommended_stream: recommendation.recommended_stream,
      confidence_level: recommendation.confidence_level,
      alternative_stream: recommendation.alternative_stream,
      
      strengths: recommendation.strengths,
      career_suggestions: recommendation.career_suggestions,
      recommended_subjects: recommendation.recommended_subjects,
      
      ai_model_used: 'rule-based-v1'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving report:', error);
    throw error;
  }
  
  return data;
};

/**
 * Get latest stream recommendation for a student
 */
export const getLatestStreamRecommendation = async (studentId) => {
  const { data, error } = await supabase
    .from('stream_recommendation_reports')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_latest', true)
    .single();
  
  if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
    console.error('Error fetching report:', error);
    throw error;
  }
  
  return data;
};

/**
 * Generate and save stream recommendation
 */
export const generateAndSaveStreamRecommendation = async (studentId) => {
  const recommendation = await generateStreamRecommendation(studentId);
  const savedReport = await saveStreamRecommendationReport(recommendation);
  return { ...recommendation, report_id: savedReport.id };
};

export default {
  fetchStudentStreamData,
  generateStreamRecommendation,
  saveStreamRecommendationReport,
  getLatestStreamRecommendation,
  generateAndSaveStreamRecommendation
};


// ==================== AI-POWERED ANALYSIS ====================

/**
 * Build the AI prompt for stream recommendation
 */
const buildStreamRecommendationPrompt = (studentData) => {
  const { student, subject_marks, projects, experiences } = studentData;
  
  return `You are an expert career counselor helping a Grade ${student.grade || '10'} student choose between Science, Commerce, and Arts streams for their higher secondary education (11th-12th grade).

## Student Profile
- Name: ${student.name}
- Current Grade: ${student.grade || '10'}
- Interests: ${JSON.stringify(student.interests || [])}
- Hobbies: ${JSON.stringify(student.hobbies || [])}

## Academic Performance (Subject-wise Marks)
${Object.entries(subject_marks || {}).map(([subject, data]) => 
  `- ${subject}: ${data.percentage}% (${data.average_marks}/${data.max_marks})`
).join('\n') || 'No marks data available'}

## Projects Completed
${(projects || []).map(p => 
  `- ${p.title}: ${p.description || 'No description'} (Tech: ${(p.tech_stack || []).join(', ') || 'N/A'})`
).join('\n') || 'No projects'}

## Experiences & Activities
${(experiences || []).map(e => 
  `- ${e.role} at ${e.organization} (${e.duration})`
).join('\n') || 'No experiences'}

## Your Task
Analyze this student's profile comprehensively and provide a detailed stream recommendation. Consider:
1. Academic strengths and weaknesses
2. Alignment of interests with each stream
3. Project work indicating aptitude
4. Extracurricular activities and experiences
5. Personality traits inferred from hobbies

## Required JSON Response Format
{
  "science_score": <0-100>,
  "commerce_score": <0-100>,
  "arts_score": <0-100>,
  "recommended_stream": "<science|commerce|arts>",
  "alternative_stream": "<science|commerce|arts>",
  "confidence_level": "<high|medium|low>",
  "analysis": {
    "science_analysis": "<detailed analysis for science suitability>",
    "commerce_analysis": "<detailed analysis for commerce suitability>",
    "arts_analysis": "<detailed analysis for arts suitability>"
  },
  "strengths": ["<strength1>", "<strength2>", ...],
  "areas_to_improve": ["<area1>", "<area2>", ...],
  "career_paths": {
    "science": ["<career1>", "<career2>", ...],
    "commerce": ["<career1>", "<career2>", ...],
    "arts": ["<career1>", "<career2>", ...]
  },
  "recommended_subjects": {
    "science": ["Physics", "Chemistry", "Mathematics", "<optional>"],
    "commerce": ["Accountancy", "Business Studies", "Economics", "<optional>"],
    "arts": ["<subject1>", "<subject2>", "<subject3>", "<optional>"]
  },
  "personalized_advice": "<2-3 sentences of personalized advice for this student>",
  "next_steps": ["<step1>", "<step2>", "<step3>"]
}

Respond ONLY with valid JSON. No markdown, no explanations outside JSON.`;
};

/**
 * Call OpenRouter AI for stream recommendation analysis
 */
const callAIForStreamRecommendation = async (studentData) => {
  // Get auth token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Authentication required for AI analysis');
  }

  const prompt = buildStreamRecommendationPrompt(studentData);

  console.log('🤖 Calling AI for stream recommendation analysis...');

  const response = await fetch(`${CAREER_API_URL}/stream-recommendation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      studentData,
      prompt 
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('AI API Error:', errorData);
    throw new Error(errorData.error || `AI service error: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error('Invalid response from AI service');
  }

  console.log('✅ AI stream recommendation analysis complete');
  return result.data;
};

/**
 * Generate AI-powered stream recommendation
 * Falls back to rule-based if AI fails
 */
export const generateAIStreamRecommendation = async (studentId) => {
  // Fetch all student data
  const studentData = await fetchStudentStreamData(studentId);
  
  if (!studentData || !studentData.student) {
    throw new Error('Student data not found');
  }

  try {
    // Try AI-powered analysis first
    const aiResult = await callAIForStreamRecommendation(studentData);
    
    return {
      student_id: studentId,
      student_name: studentData.student.name,
      current_grade: studentData.student.grade,
      
      // AI scores
      science_score: aiResult.science_score,
      commerce_score: aiResult.commerce_score,
      arts_score: aiResult.arts_score,
      
      // AI recommendation
      recommended_stream: aiResult.recommended_stream,
      alternative_stream: aiResult.alternative_stream,
      confidence_level: aiResult.confidence_level,
      
      // AI analysis
      ai_analysis: aiResult.analysis,
      strengths: aiResult.strengths,
      areas_to_improve: aiResult.areas_to_improve,
      career_suggestions: aiResult.career_paths?.[aiResult.recommended_stream] || [],
      all_career_paths: aiResult.career_paths,
      recommended_subjects: aiResult.recommended_subjects,
      personalized_advice: aiResult.personalized_advice,
      next_steps: aiResult.next_steps,
      
      // Input data snapshot
      subject_marks: studentData.subject_marks,
      projects_summary: studentData.projects,
      experiences_summary: studentData.experiences,
      interests: studentData.student.interests,
      hobbies: studentData.student.hobbies,
      
      // Metadata
      ai_model_used: 'openrouter-gpt-4o-mini',
      is_ai_generated: true
    };
  } catch (aiError) {
    console.warn('AI analysis failed, falling back to rule-based:', aiError.message);
    
    // Fall back to rule-based recommendation
    const ruleBasedResult = await generateStreamRecommendation(studentId);
    return {
      ...ruleBasedResult,
      ai_model_used: 'rule-based-v1',
      is_ai_generated: false,
      fallback_reason: aiError.message
    };
  }
};

/**
 * Generate and save AI-powered stream recommendation
 */
export const generateAndSaveAIStreamRecommendation = async (studentId) => {
  const recommendation = await generateAIStreamRecommendation(studentId);
  
  // Save to database
  const { data, error } = await supabase
    .from('stream_recommendation_reports')
    .insert({
      student_id: recommendation.student_id,
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      current_grade: recommendation.current_grade,
      
      subject_marks: recommendation.subject_marks,
      projects_summary: recommendation.projects_summary,
      experiences_summary: recommendation.experiences_summary,
      interests: recommendation.interests,
      hobbies: recommendation.hobbies,
      
      science_score: recommendation.science_score,
      commerce_score: recommendation.commerce_score,
      arts_score: recommendation.arts_score,
      
      science_breakdown: recommendation.ai_analysis?.science_analysis ? 
        { analysis: recommendation.ai_analysis.science_analysis } : recommendation.science_breakdown,
      commerce_breakdown: recommendation.ai_analysis?.commerce_analysis ? 
        { analysis: recommendation.ai_analysis.commerce_analysis } : recommendation.commerce_breakdown,
      arts_breakdown: recommendation.ai_analysis?.arts_analysis ? 
        { analysis: recommendation.ai_analysis.arts_analysis } : recommendation.arts_breakdown,
      
      recommended_stream: recommendation.recommended_stream,
      confidence_level: recommendation.confidence_level,
      alternative_stream: recommendation.alternative_stream,
      
      ai_analysis: recommendation.personalized_advice,
      strengths: recommendation.strengths,
      areas_to_improve: recommendation.areas_to_improve,
      career_suggestions: recommendation.career_suggestions,
      recommended_subjects: recommendation.recommended_subjects,
      
      ai_model_used: recommendation.ai_model_used
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving AI report:', error);
    throw error;
  }
  
  return { ...recommendation, report_id: data.id };
};

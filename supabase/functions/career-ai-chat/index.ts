import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== TYPES ====================

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  university: string;
  cgpa: string;
  yearOfPassing: string;
  grade: string;
  bio: string;
  technicalSkills: { name: string; level: number; type: string; verified: boolean }[];
  softSkills: { name: string; level: number }[];
  education: any[];
  experience: any[];
  projects: any[];
  trainings: any[];
  certificates: any[];
  hobbies: string[];
  interests: string[];
  languages: { name: string; proficiency: string }[];
}

interface AssessmentResults {
  hasAssessment: boolean;
  riasecCode: string;
  riasecScores: Record<string, number>;
  riasecInterpretation: string;
  aptitudeScores: Record<string, number>;
  aptitudeOverall: number;
  bigFiveScores: Record<string, number>;
  personalityInterpretation: string;
  employabilityScores: Record<string, number>;
  employabilityReadiness: string;
  careerFit: any[];
  skillGaps: any[];
  roadmap: any;
  overallSummary: string;
}

interface CareerProgress {
  appliedJobs: { id: number; title: string; company: string; status: string; appliedAt: string }[];
  savedJobs: { id: number; title: string; company: string }[];
  courseEnrollments: { courseId: string; title: string; progress: number; status: string }[];
  recommendedCourses: { courseId: string; title: string; relevanceScore: number; matchReasons: string[] }[];
}

interface Opportunity {
  id: number;
  title: string;
  company_name: string;
  employment_type: string;
  location: string;
  mode: string;
  experience_required: string;
  skills_required: string[];
  description: string;
  stipend_or_salary: string;
  deadline: string;
  is_active: boolean;
  sector: string;
  department: string;
}

interface ChatRequest {
  conversationId?: string;
  message: string;
  selectedChips?: string[];
}

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type ConversationPhase = 'opening' | 'exploring' | 'deep_dive' | 'follow_up';
type CareerIntent = 
  | 'find-jobs' 
  | 'skill-gap' 
  | 'interview-prep' 
  | 'resume-review' 
  | 'learning-path' 
  | 'career-guidance' 
  | 'assessment-insights'
  | 'application-status'
  | 'networking' 
  | 'general';

interface IntentScore {
  intent: CareerIntent;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  secondaryIntent?: CareerIntent;
}

// ==================== RIASEC INTERPRETATION ====================

const RIASEC_DESCRIPTIONS: Record<string, { name: string; traits: string; careers: string }> = {
  R: { 
    name: 'Realistic', 
    traits: 'practical, hands-on, mechanical aptitude, prefer working with tools/machines',
    careers: 'Engineering, Manufacturing, Construction, Agriculture, Technical roles'
  },
  I: { 
    name: 'Investigative', 
    traits: 'analytical, intellectual, scientific, curious, problem-solver',
    careers: 'Research, Data Science, Medicine, Academia, Scientific roles'
  },
  A: { 
    name: 'Artistic', 
    traits: 'creative, expressive, original, imaginative, values aesthetics',
    careers: 'Design, Media, Arts, Writing, Creative industries'
  },
  S: { 
    name: 'Social', 
    traits: 'helpful, cooperative, empathetic, enjoys teaching/counseling',
    careers: 'Education, Healthcare, HR, Social Work, Customer-facing roles'
  },
  E: { 
    name: 'Enterprising', 
    traits: 'persuasive, ambitious, leadership-oriented, competitive',
    careers: 'Sales, Management, Entrepreneurship, Marketing, Business Development'
  },
  C: { 
    name: 'Conventional', 
    traits: 'organized, detail-oriented, systematic, values structure',
    careers: 'Finance, Administration, Accounting, Data Entry, Operations'
  }
};

function interpretRIASEC(code: string, scores: Record<string, number>): string {
  if (!code || code.length < 2) return 'Assessment not completed';
  
  const topTypes = code.slice(0, 3).split('');
  const interpretations = topTypes.map((type, index) => {
    const desc = RIASEC_DESCRIPTIONS[type];
    if (!desc) return '';
    const score = scores[type] || scores[desc.name] || 0;
    return `${index + 1}. **${desc.name}** (Score: ${score}): ${desc.traits}. Suited for: ${desc.careers}`;
  });
  
  return interpretations.filter(Boolean).join('\n');
}

function interpretBigFive(scores: Record<string, number>): string {
  const traits: string[] = [];
  
  if (scores.openness > 70) traits.push('highly creative and open to new experiences');
  else if (scores.openness < 40) traits.push('practical and prefers familiar approaches');
  
  if (scores.conscientiousness > 70) traits.push('very organized and goal-oriented');
  else if (scores.conscientiousness < 40) traits.push('flexible and spontaneous');
  
  if (scores.extraversion > 70) traits.push('energized by social interaction');
  else if (scores.extraversion < 40) traits.push('prefers independent work');
  
  if (scores.agreeableness > 70) traits.push('collaborative and team-oriented');
  else if (scores.agreeableness < 40) traits.push('direct and competitive');
  
  if (scores.neuroticism > 70) traits.push('may benefit from stress management techniques');
  else if (scores.neuroticism < 40) traits.push('emotionally stable under pressure');
  
  return traits.length > 0 ? traits.join(', ') : 'Balanced personality profile';
}


// ==================== ENHANCED INTENT DETECTION ====================

function detectIntent(message: string, chips: string[], conversationHistory: StoredMessage[] = []): IntentScore {
  const lowerMessage = message.toLowerCase().trim();
  const scores: Record<CareerIntent, number> = {
    'find-jobs': 0,
    'skill-gap': 0,
    'interview-prep': 0,
    'resume-review': 0,
    'learning-path': 0,
    'career-guidance': 0,
    'assessment-insights': 0,
    'application-status': 0,
    'networking': 0,
    'general': 5
  };

  // CHIP DETECTION (Highest Priority - +50 points)
  for (const chip of chips) {
    const lowerChip = chip.toLowerCase();
    if (lowerChip.includes('job') || lowerChip.includes('opportunity') || lowerChip.includes('opening')) scores['find-jobs'] += 50;
    if (lowerChip.includes('skill gap') || lowerChip.includes('missing skill') || lowerChip.includes('improve skill')) scores['skill-gap'] += 50;
    if (lowerChip.includes('interview')) scores['interview-prep'] += 50;
    if (lowerChip.includes('resume') || lowerChip.includes('cv') || lowerChip.includes('profile')) scores['resume-review'] += 50;
    if (lowerChip.includes('learn') || lowerChip.includes('course') || lowerChip.includes('roadmap')) scores['learning-path'] += 50;
    if (lowerChip.includes('career') || lowerChip.includes('guidance') || lowerChip.includes('path')) scores['career-guidance'] += 50;
    if (lowerChip.includes('assessment') || lowerChip.includes('riasec') || lowerChip.includes('personality')) scores['assessment-insights'] += 50;
    if (lowerChip.includes('application') || lowerChip.includes('status') || lowerChip.includes('applied')) scores['application-status'] += 50;
    if (lowerChip.includes('network') || lowerChip.includes('connect') || lowerChip.includes('linkedin')) scores['networking'] += 50;
  }

  // KEYWORD DETECTION with synonyms (+20 for strong, +10 for weak)
  const intentKeywords: Record<CareerIntent, { strong: string[]; weak: string[] }> = {
    'find-jobs': {
      strong: ['find job', 'search job', 'job opening', 'job match', 'recommend job', 'suggest job', 'available job', 
               'looking for job', 'job for me', 'apply for', 'hiring', 'vacancy', 'internship', 'fresher job',
               'campus placement', 'off campus', 'walk-in', 'job hunt', 'job search', 'suitable job', 'matching job',
               'list all job', 'show all job', 'all opportunities', 'what jobs'],
      weak: ['job', 'opportunity', 'position', 'work', 'employment', 'company', 'role', 'opening']
    },
    'skill-gap': {
      strong: ['skill gap', 'missing skill', 'improve skill', 'what skills', 'skills needed', 'skills required', 
               'upskill', 'reskill', 'skill development', 'skills i need', 'skills to learn', 'lacking skill',
               'weak in', 'need to improve', 'skill assessment'],
      weak: ['skill', 'competency', 'ability', 'expertise', 'proficiency', 'capability']
    },
    'interview-prep': {
      strong: ['interview prep', 'prepare interview', 'interview question', 'mock interview', 'interview tips',
               'crack interview', 'interview practice', 'hr round', 'technical round', 'interview ready',
               'common questions', 'behavioral question', 'coding interview', 'system design interview'],
      weak: ['interview', 'round', 'selection', 'screening']
    },
    'resume-review': {
      strong: ['resume review', 'improve resume', 'cv review', 'resume tips', 'ats friendly', 'resume format',
               'profile review', 'resume feedback', 'cv feedback', 'resume score', 'resume check',
               'portfolio review', 'linkedin profile', 'profile improvement'],
      weak: ['resume', 'cv', 'portfolio', 'profile']
    },
    'learning-path': {
      strong: ['learning path', 'roadmap', 'what to learn', 'course recommend', 'tutorial', 'certification',
               'how to become', 'study plan', 'learning plan', 'skill roadmap', 'career roadmap',
               'best course', 'online course', 'free course', 'udemy', 'coursera', 'youtube tutorial'],
      weak: ['learn', 'course', 'study', 'training', 'education', 'tutorial', 'certification']
    },
    'career-guidance': {
      strong: ['career path', 'career guidance', 'career advice', 'career switch', 'career growth', 'future career',
               'career options', 'career choice', 'which field', 'best career', 'career direction',
               'career planning', 'long term career', 'career goal', 'career transition'],
      weak: ['career', 'profession', 'field', 'industry', 'domain', 'sector']
    },
    'assessment-insights': {
      strong: ['assessment result', 'riasec', 'personality test', 'aptitude test', 'my assessment',
               'test result', 'psychometric', 'career test', 'interest test', 'big five',
               'my personality', 'my strengths', 'my weaknesses', 'assessment score'],
      weak: ['assessment', 'test', 'result', 'score', 'personality', 'aptitude']
    },
    'application-status': {
      strong: ['application status', 'my applications', 'applied jobs', 'job status', 'application update',
               'interview scheduled', 'shortlisted', 'rejected', 'offer received', 'application tracking'],
      weak: ['applied', 'application', 'status', 'update', 'progress']
    },
    'networking': {
      strong: ['networking tips', 'build network', 'linkedin tips', 'professional network', 'connect with',
               'reach out', 'cold email', 'informational interview', 'mentorship', 'industry connect'],
      weak: ['network', 'connect', 'community', 'linkedin', 'referral']
    },
    'general': { strong: [], weak: [] }
  };

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    for (const keyword of keywords.strong) {
      if (lowerMessage.includes(keyword)) scores[intent as CareerIntent] += 20;
    }
    for (const keyword of keywords.weak) {
      if (lowerMessage.includes(keyword)) scores[intent as CareerIntent] += 10;
    }
  }

  // CASUAL GREETING DETECTION (Override to general)
  const casualGreetings = ['hi', 'hello', 'hey', 'hii', 'yo', 'sup', 'hola', 'good morning', 'good evening', 'good afternoon', 'namaste'];
  if (casualGreetings.includes(lowerMessage) || lowerMessage.length < 5) {
    scores['general'] += 100;
  }

  // QUESTION PATTERNS
  if (lowerMessage.startsWith('what') || lowerMessage.startsWith('which') || lowerMessage.startsWith('how')) {
    if (lowerMessage.includes('job') || lowerMessage.includes('opportunit')) scores['find-jobs'] += 15;
    if (lowerMessage.includes('skill')) scores['skill-gap'] += 15;
    if (lowerMessage.includes('learn') || lowerMessage.includes('course')) scores['learning-path'] += 15;
    if (lowerMessage.includes('career') || lowerMessage.includes('become')) scores['career-guidance'] += 15;
  }

  // CONTEXT FROM CONVERSATION HISTORY (+15 points)
  if (conversationHistory.length > 0) {
    const lastAssistantMsg = conversationHistory.filter(m => m.role === 'assistant').pop();
    if (lastAssistantMsg) {
      const lastContent = lastAssistantMsg.content.toLowerCase();
      if (lastContent.includes('job') || lastContent.includes('opportunity')) scores['find-jobs'] += 15;
      if (lastContent.includes('skill gap') || lastContent.includes('missing skill')) scores['skill-gap'] += 15;
      if (lastContent.includes('interview')) scores['interview-prep'] += 15;
      if (lastContent.includes('resume') || lastContent.includes('profile')) scores['resume-review'] += 15;
      if (lastContent.includes('learn') || lastContent.includes('course')) scores['learning-path'] += 15;
      if (lastContent.includes('assessment') || lastContent.includes('riasec')) scores['assessment-insights'] += 15;
    }
  }

  // Find highest and second highest scoring intents
  const sortedIntents = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topIntent, topScore] = sortedIntents[0];
  const [secondIntent, secondScore] = sortedIntents[1];

  const confidence = topScore >= 50 ? 'high' : topScore >= 20 ? 'medium' : 'low';
  
  return { 
    intent: topIntent as CareerIntent, 
    score: topScore, 
    confidence,
    secondaryIntent: secondScore > 15 ? secondIntent as CareerIntent : undefined
  };
}

// ==================== CONVERSATION PHASE SYSTEM ====================

function getConversationPhase(messageCount: number): ConversationPhase {
  if (messageCount === 0) return 'opening';
  if (messageCount <= 4) return 'exploring';
  if (messageCount <= 10) return 'deep_dive';
  return 'follow_up';
}

function getPhaseParameters(phase: ConversationPhase, intent?: CareerIntent): { max_tokens: number; temperature: number } {
  // Base parameters by phase
  const params: Record<ConversationPhase, { max_tokens: number; temperature: number }> = {
    opening: { max_tokens: 500, temperature: 0.8 },
    exploring: { max_tokens: 2000, temperature: 0.7 },
    deep_dive: { max_tokens: 4000, temperature: 0.6 },
    follow_up: { max_tokens: 2500, temperature: 0.65 }
  };
  
  // Intent-specific overrides for detailed responses
  if (intent === 'learning-path' || intent === 'career-guidance' || intent === 'skill-gap') {
    return { max_tokens: Math.max(params[phase].max_tokens, 3500), temperature: 0.65 };
  }
  
  return params[phase];
}


// ==================== ENHANCED CONTEXT BUILDERS ====================

async function buildStudentContext(supabase: SupabaseClient, studentId: string): Promise<StudentProfile | null> {
  try {
    // Fetch student basic info
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', studentId)
      .single();
    
    if (error || !student) {
      // Try with id field
      const { data: studentById, error: error2 } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error2 || !studentById) {
        console.error('Error fetching student:', error || error2);
        return null;
      }
      Object.assign(student || {}, studentById);
    }

    const profile = student?.profile || {};

    // Fetch skills from skills table
    const { data: skillsData } = await supabase
      .from('skills')
      .select('name, type, level, verified')
      .eq('student_id', studentId)
      .eq('enabled', true);

    const technicalSkills = (skillsData || [])
      .filter((s: any) => s.type === 'technical')
      .map((s: any) => ({ name: s.name, level: s.level || 3, type: 'technical', verified: s.verified || false }));
    
    const softSkills = (skillsData || [])
      .filter((s: any) => s.type === 'soft')
      .map((s: any) => ({ name: s.name, level: s.level || 3 }));

    // Fetch education
    const { data: educationData } = await supabase
      .from('education')
      .select('*')
      .eq('student_id', studentId)
      .order('year_of_passing', { ascending: false });

    // Fetch experience
    const { data: experienceData } = await supabase
      .from('experience')
      .select('*')
      .eq('student_id', studentId)
      .order('start_date', { ascending: false });

    // Fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', studentId)
      .eq('enabled', true)
      .order('created_at', { ascending: false });

    // Fetch trainings
    const { data: trainingsData } = await supabase
      .from('trainings')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Fetch certificates
    const { data: certificatesData } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)
      .eq('enabled', true)
      .order('issued_on', { ascending: false });

    // Extract additional skills from projects if not in skills table
    if (projectsData) {
      projectsData.forEach((p: any) => {
        const techStack = p.tech_stack || [];
        techStack.forEach((skill: string) => {
          if (skill && !technicalSkills.find(s => s.name?.toLowerCase() === skill.toLowerCase())) {
            technicalSkills.push({ name: skill, level: 3, type: 'technical', verified: false });
          }
        });
      });
    }

    return {
      id: student?.id || studentId,
      name: student?.name || profile.name || 'Student',
      email: student?.email || profile.email || '',
      department: student?.branch_field || profile.branch_field || educationData?.[0]?.department || 'General',
      university: student?.university || profile.university || educationData?.[0]?.university || '',
      cgpa: student?.currentCgpa || educationData?.[0]?.cgpa || '',
      yearOfPassing: educationData?.[0]?.year_of_passing || '',
      grade: student?.grade || '',
      bio: student?.bio || '',
      technicalSkills,
      softSkills,
      education: educationData || [],
      experience: experienceData || [],
      projects: projectsData || [],
      trainings: trainingsData || [],
      certificates: certificatesData || [],
      hobbies: student?.hobbies || [],
      interests: student?.interests || [],
      languages: student?.languages || []
    };
  } catch (error) {
    console.error('Error in buildStudentContext:', error);
    return null;
  }
}

async function buildAssessmentContext(supabase: SupabaseClient, studentId: string): Promise<AssessmentResults> {
  const defaultResult: AssessmentResults = {
    hasAssessment: false,
    riasecCode: '',
    riasecScores: {},
    riasecInterpretation: '',
    aptitudeScores: {},
    aptitudeOverall: 0,
    bigFiveScores: {},
    personalityInterpretation: '',
    employabilityScores: {},
    employabilityReadiness: '',
    careerFit: [],
    skillGaps: [],
    roadmap: null,
    overallSummary: ''
  };

  try {
    const { data: assessment, error } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !assessment) {
      return defaultResult;
    }

    const riasecScores = assessment.riasec_scores || {};
    const bigFiveScores = assessment.bigfive_scores || {};

    return {
      hasAssessment: true,
      riasecCode: assessment.riasec_code || '',
      riasecScores,
      riasecInterpretation: interpretRIASEC(assessment.riasec_code, riasecScores),
      aptitudeScores: assessment.aptitude_scores || {},
      aptitudeOverall: assessment.aptitude_overall || 0,
      bigFiveScores,
      personalityInterpretation: interpretBigFive(bigFiveScores),
      employabilityScores: assessment.employability_scores || {},
      employabilityReadiness: assessment.employability_readiness || 'Not assessed',
      careerFit: assessment.career_fit || [],
      skillGaps: assessment.skill_gap || [],
      roadmap: assessment.roadmap,
      overallSummary: assessment.overall_summary || ''
    };
  } catch (error) {
    console.error('Error in buildAssessmentContext:', error);
    return defaultResult;
  }
}

async function buildCareerProgressContext(supabase: SupabaseClient, studentId: string): Promise<CareerProgress> {
  const defaultProgress: CareerProgress = {
    appliedJobs: [],
    savedJobs: [],
    courseEnrollments: [],
    recommendedCourses: []
  };

  try {
    // Fetch applied jobs
    const { data: appliedData } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        application_status,
        applied_at,
        opportunities (id, title, company_name)
      `)
      .eq('student_id', studentId)
      .order('applied_at', { ascending: false })
      .limit(20);

    // Fetch saved jobs
    const { data: savedData } = await supabase
      .from('saved_jobs')
      .select(`
        id,
        opportunities (id, title, company_name)
      `)
      .eq('student_id', studentId)
      .limit(20);

    // Fetch course enrollments
    const { data: enrollmentsData } = await supabase
      .from('course_enrollments')
      .select('course_id, course_title, progress, status')
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false })
      .limit(10);

    // Fetch recommended courses
    const { data: recommendationsData } = await supabase
      .from('student_course_recommendations')
      .select(`
        course_id,
        relevance_score,
        match_reasons,
        courses (title)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('relevance_score', { ascending: false })
      .limit(10);

    return {
      appliedJobs: (appliedData || []).map((a: any) => ({
        id: a.opportunities?.id,
        title: a.opportunities?.title || 'Unknown',
        company: a.opportunities?.company_name || 'Unknown',
        status: a.application_status,
        appliedAt: a.applied_at
      })),
      savedJobs: (savedData || []).map((s: any) => ({
        id: s.opportunities?.id,
        title: s.opportunities?.title || 'Unknown',
        company: s.opportunities?.company_name || 'Unknown'
      })),
      courseEnrollments: (enrollmentsData || []).map((e: any) => ({
        courseId: e.course_id,
        title: e.course_title,
        progress: e.progress,
        status: e.status
      })),
      recommendedCourses: (recommendationsData || []).map((r: any) => ({
        courseId: r.course_id,
        title: r.courses?.title || 'Unknown',
        relevanceScore: r.relevance_score,
        matchReasons: r.match_reasons || []
      }))
    };
  } catch (error) {
    console.error('Error in buildCareerProgressContext:', error);
    return defaultProgress;
  }
}

async function fetchOpportunities(supabase: SupabaseClient, limit: number = 100): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
    
    return (data || []).map((opp: any) => ({
      ...opp,
      skills_required: Array.isArray(opp.skills_required) 
        ? opp.skills_required 
        : typeof opp.skills_required === 'string' 
          ? JSON.parse(opp.skills_required || '[]') 
          : []
    }));
  } catch (error) {
    console.error('Error in fetchOpportunities:', error);
    return [];
  }
}


// ==================== COMPREHENSIVE SYSTEM PROMPT BUILDER ====================

function buildCareerSystemPrompt(
  profile: StudentProfile,
  assessment: AssessmentResults,
  progress: CareerProgress,
  opportunities: Opportunity[],
  phase: ConversationPhase,
  intentResult: IntentScore
): string {
  const studentName = profile.name.split(' ')[0];
  const intent = intentResult.intent;

  // Build skills context
  const technicalSkillsList = profile.technicalSkills.length > 0
    ? profile.technicalSkills.map(s => `${s.name} (Level: ${s.level}/5${s.verified ? ', ✓ Verified' : ''})`).join(', ')
    : 'None listed yet';
  
  const softSkillsList = profile.softSkills.length > 0
    ? profile.softSkills.map(s => `${s.name}`).join(', ')
    : 'None listed yet';

  // Build education context
  const educationSummary = profile.education.length > 0
    ? profile.education.slice(0, 2).map(e => 
        `${e.degree || e.level} in ${e.department || 'General'} from ${e.university || 'Unknown'} (${e.year_of_passing || 'Ongoing'}${e.cgpa ? `, CGPA: ${e.cgpa}` : ''})`
      ).join('; ')
    : 'Not specified';

  // Build experience context
  const experienceSummary = profile.experience.length > 0
    ? profile.experience.slice(0, 3).map(e => 
        `${e.role} at ${e.organization} (${e.duration || 'Duration not specified'})`
      ).join('; ')
    : 'No work experience listed';

  // Build projects context
  const projectsSummary = profile.projects.length > 0
    ? profile.projects.slice(0, 3).map(p => 
        `"${p.title}" - ${(p.tech_stack || []).slice(0, 4).join(', ')}`
      ).join('; ')
    : 'No projects listed';

  // Build assessment context
  let assessmentContext = '';
  if (assessment.hasAssessment) {
    assessmentContext = `
<assessment_results>
  <riasec_profile>
    <code>${assessment.riasecCode}</code>
    <interpretation>
${assessment.riasecInterpretation}
    </interpretation>
  </riasec_profile>
  
  <personality_profile>
    <big_five_interpretation>${assessment.personalityInterpretation}</big_five_interpretation>
  </personality_profile>
  
  <aptitude>
    <overall_score>${assessment.aptitudeOverall}%</overall_score>
  </aptitude>
  
  <employability>
    <readiness_level>${assessment.employabilityReadiness}</readiness_level>
  </employability>
  
  ${assessment.careerFit.length > 0 ? `<ai_recommended_careers>
${assessment.careerFit.slice(0, 5).map((c: any) => `    - ${c.title || c.career || c}: ${c.reason || c.match_reason || 'Good fit based on profile'}`).join('\n')}
  </ai_recommended_careers>` : ''}
  
  ${assessment.skillGaps.length > 0 ? `<identified_skill_gaps>
${assessment.skillGaps.slice(0, 5).map((g: any) => `    - ${g.skill || g}: ${g.importance || 'Important for career growth'}`).join('\n')}
  </identified_skill_gaps>` : ''}
  
  ${assessment.overallSummary ? `<assessment_summary>${assessment.overallSummary.slice(0, 500)}</assessment_summary>` : ''}
</assessment_results>`;
  } else {
    assessmentContext = `
<assessment_results>
  <status>Not completed</status>
  <recommendation>Encourage student to complete the career assessment for personalized guidance</recommendation>
</assessment_results>`;
  }

  // Build career progress context
  let progressContext = '';
  if (progress.appliedJobs.length > 0 || progress.savedJobs.length > 0 || progress.courseEnrollments.length > 0) {
    progressContext = `
<career_progress>
  ${progress.appliedJobs.length > 0 ? `<applied_jobs count="${progress.appliedJobs.length}">
${progress.appliedJobs.slice(0, 5).map(j => `    - "${j.title}" at ${j.company} - Status: ${j.status}`).join('\n')}
  </applied_jobs>` : '<applied_jobs count="0">No applications yet</applied_jobs>'}
  
  ${progress.savedJobs.length > 0 ? `<saved_jobs count="${progress.savedJobs.length}">
${progress.savedJobs.slice(0, 5).map(j => `    - "${j.title}" at ${j.company}`).join('\n')}
  </saved_jobs>` : ''}
  
  ${progress.courseEnrollments.length > 0 ? `<enrolled_courses>
${progress.courseEnrollments.map(c => `    - "${c.title}" - Progress: ${c.progress}%, Status: ${c.status}`).join('\n')}
  </enrolled_courses>` : ''}
  
  ${progress.recommendedCourses.length > 0 ? `<ai_recommended_courses>
${progress.recommendedCourses.slice(0, 5).map(c => `    - "${c.title}" (Relevance: ${c.relevanceScore}%)`).join('\n')}
  </ai_recommended_courses>` : ''}
</career_progress>`;
  }

  // Build opportunities context for job-related intents
  let opportunitiesContext = '';
  if (['find-jobs', 'skill-gap', 'career-guidance', 'application-status'].includes(intent) && opportunities.length > 0) {
    const jobTitlesList = opportunities.slice(0, 20).map(opp => `"${opp.title}"`).join(', ');
    
    opportunitiesContext = `
<available_opportunities count="${opportunities.length}">
  <CRITICAL_NOTICE>
    ⚠️ These are the ONLY real job opportunities available in our database.
    ⚠️ Valid job titles: ${jobTitlesList}
    ⚠️ NEVER invent, fabricate, or hallucinate job titles or companies not in this list.
    ⚠️ If asked to list all jobs, show ALL jobs from this list.
  </CRITICAL_NOTICE>
  
${opportunities.slice(0, 20).map((opp, i) => `
  <job id="${opp.id}" index="${i + 1}">
    <title>${opp.title}</title>
    <company>${opp.company_name || 'Not specified'}</company>
    <type>${opp.employment_type || 'Not specified'}</type>
    <location>${opp.location || 'Not specified'}</location>
    <mode>${opp.mode || 'Not specified'}</mode>
    <experience>${opp.experience_required || 'Not specified'}</experience>
    <skills>${(opp.skills_required || []).slice(0, 8).join(', ') || 'Not specified'}</skills>
    <salary>${opp.stipend_or_salary || 'Not disclosed'}</salary>
    <sector>${opp.sector || opp.department || 'General'}</sector>
    <deadline>${opp.deadline || 'Open'}</deadline>
  </job>`).join('')}
</available_opportunities>`;
  }

  // Phase-specific instructions
  const phaseInstructions: Record<ConversationPhase, string> = {
    opening: `
<response_constraints phase="opening">
  <rule>This is the FIRST message - keep response SHORT (150-200 words max)</rule>
  <rule>Greet warmly using student's name</rule>
  <rule>Acknowledge their query briefly</rule>
  <rule>Give a concise, helpful initial response</rule>
  <rule>Ask ONE follow-up question to understand needs better</rule>
  <rule>NO lengthy explanations or bullet lists yet</rule>
</response_constraints>`,
    exploring: `
<response_constraints phase="exploring">
  <rule>Early conversation - moderate depth (300-500 words)</rule>
  <rule>Start introducing specific details from student's profile</rule>
  <rule>Reference their skills, education, or projects when relevant</rule>
  <rule>Provide 2-3 specific recommendations or insights</rule>
  <rule>End with a question or offer to explore deeper</rule>
</response_constraints>`,
    deep_dive: `
<response_constraints phase="deep_dive">
  <rule>Deep conversation - comprehensive responses allowed (up to 800 words)</rule>
  <rule>Provide detailed, actionable guidance</rule>
  <rule>Use structured formatting (headers, bullets) for clarity</rule>
  <rule>Include specific examples and resources</rule>
  <rule>Reference assessment results if available</rule>
  <rule>Provide clear next steps</rule>
</response_constraints>`,
    follow_up: `
<response_constraints phase="follow_up">
  <rule>Ongoing conversation - balanced responses (400-600 words)</rule>
  <rule>Build on previous discussion points</rule>
  <rule>Track progress on earlier recommendations</rule>
  <rule>Provide updates or new insights</rule>
  <rule>Maintain continuity with conversation history</rule>
</response_constraints>`
  };

  // Intent-specific task instructions
  const intentInstructions = buildIntentInstructions(intent, profile, assessment, progress, opportunities);

  return `You are an expert Career AI Assistant for students in India. You combine deep career expertise with empathetic, personalized guidance.

<identity>
  <role>Expert Career Counselor, Job Matching Specialist & Student Mentor</role>
  <expertise>
    - Indian job market trends and requirements
    - Campus and off-campus placement processes
    - Skill development and learning pathways
    - Interview preparation and resume optimization
    - Career path planning based on psychometric assessments
    - Industry-specific guidance across IT, Engineering, Management, Sciences
  </expertise>
  <personality>
    - Warm and supportive (like a helpful senior or mentor)
    - Data-driven and specific (uses actual student data, not generic advice)
    - Honest about challenges (sets realistic expectations)
    - Action-oriented (always provides concrete next steps)
    - Encouraging but not patronizing
  </personality>
  <communication_style>
    - Address student by first name (${studentName})
    - Use conversational, friendly Indian English
    - Include relevant emojis sparingly for warmth (1-2 per response)
    - Be concise in opening, detailed when needed
    - Always end with actionable suggestion or thoughtful question
  </communication_style>
</identity>

<student_profile>
  <basic_info>
    <name>${profile.name}</name>
    <email>${profile.email}</email>
    <field_of_study>${profile.department}</field_of_study>
    <university>${profile.university}</university>
    <cgpa>${profile.cgpa || 'Not specified'}</cgpa>
    <year_of_passing>${profile.yearOfPassing || 'Not specified'}</year_of_passing>
    ${profile.bio ? `<bio>${profile.bio.slice(0, 200)}</bio>` : ''}
  </basic_info>
  
  <skills>
    <technical>${technicalSkillsList}</technical>
    <soft>${softSkillsList}</soft>
  </skills>
  
  <background>
    <education>${educationSummary}</education>
    <experience>${experienceSummary}</experience>
    <projects>${projectsSummary}</projects>
    <trainings_count>${profile.trainings.length}</trainings_count>
    <certificates_count>${profile.certificates.length}</certificates_count>
  </background>
  
  ${profile.interests.length > 0 ? `<interests>${profile.interests.join(', ')}</interests>` : ''}
  ${profile.hobbies.length > 0 ? `<hobbies>${profile.hobbies.join(', ')}</hobbies>` : ''}
</student_profile>
${assessmentContext}
${progressContext}
${opportunitiesContext}

<detected_intent confidence="${intentResult.confidence}">${intent}</detected_intent>
${intentResult.secondaryIntent ? `<secondary_intent>${intentResult.secondaryIntent}</secondary_intent>` : ''}

${intentInstructions}

${phaseInstructions[phase]}

<response_guidelines>
  <do>
    - Personalize every response using ${studentName}'s actual profile data
    - Reference specific skills, projects, or experiences when relevant
    - Be honest about limitations and challenges they might face
    - Provide specific, actionable advice (not generic platitudes)
    - Use markdown formatting for readability (bold, bullets, headers when appropriate)
    - End with a helpful follow-up question or clear next step
    - If assessment data is available, use it to inform recommendations
  </do>
  <dont>
    - Don't give generic advice that could apply to anyone
    - Don't inflate job match scores or be overly optimistic
    - Don't overwhelm with too much information at once
    - Don't be preachy, condescending, or use corporate jargon
    - NEVER invent or hallucinate job opportunities, companies, or positions
    - NEVER mention jobs that are not in the <available_opportunities> list
    - Don't recommend jobs the student has already applied to (check career_progress)
  </dont>
</response_guidelines>

<anti_hallucination_rules>
  ⚠️ CRITICAL: Before mentioning ANY job opportunity:
  1. Verify it exists in <available_opportunities>
  2. Use the EXACT job title from the list
  3. If company_name is empty, say "Company not specified"
  4. If no good matches exist, be honest about it
  5. NEVER make up job titles, companies, or opportunities
  
  If you catch yourself about to mention a job not in the list, STOP and only use real jobs.
</anti_hallucination_rules>

<internal_reasoning>
Before responding, mentally work through:
1. What is ${studentName} actually asking? (surface need vs underlying need)
2. What specific data from their profile is relevant to this query?
3. What's the most helpful response given the conversation phase?
4. What concrete action can they take after this response?
5. If recommending jobs: Are ALL jobs from the <available_opportunities> list?
Never output this reasoning - just use it to guide your response.
</internal_reasoning>

Remember: Your goal is to help ${studentName} succeed in their career journey with honest, personalized, data-driven guidance! 🎯`;
}


// ==================== INTENT-SPECIFIC INSTRUCTIONS ====================

function buildIntentInstructions(
  intent: CareerIntent,
  profile: StudentProfile,
  assessment: AssessmentResults,
  progress: CareerProgress,
  opportunities: Opportunity[]
): string {
  const studentName = profile.name.split(' ')[0];
  
  const instructions: Record<CareerIntent, string> = {
    'find-jobs': `
<task name="JOB_MATCHING">
  <objective>Match ${studentName}'s profile against REAL opportunities from the database</objective>
  
  <matching_criteria>
    <criterion weight="40%">Field/Department alignment - Does the job match their ${profile.department} background?</criterion>
    <criterion weight="30%">Skills match - How many required skills does ${studentName} have?</criterion>
    <criterion weight="15%">Experience level - Is the job suitable for their experience (${profile.experience.length} roles)?</criterion>
    <criterion weight="15%">Location/Mode preference - Consider practical factors</criterion>
    ${assessment.hasAssessment ? `<criterion bonus="10%">RIASEC alignment - Does the job type match their ${assessment.riasecCode} profile?</criterion>` : ''}
  </matching_criteria>
  
  <steps>
    <step>Review ALL jobs in <available_opportunities> - these are the ONLY jobs you can recommend</step>
    <step>If user asks to "list all" or "show all", LIST EVERY job from the list</step>
    <step>For recommendations, calculate match score using criteria above</step>
    <step>Check if ${studentName} has already applied (see career_progress) - don't recommend those</step>
    <step>Rank top 3-5 best matches with clear reasoning</step>
  </steps>
  
  <output_format>
    For each recommended job:
    - **[Exact Job Title]** (ID: X) - Match: Y%
    - Company: [From list or "Not specified"]
    - Location: [From list] | Mode: [From list]
    - Why it fits ${studentName}: 2-3 specific reasons using their profile data
    - Skills match: [Which of their skills align]
    - Gap to address: [Any missing skills]
    - Next step: How to apply
  </output_format>
  
  <special_cases>
    <case name="list_all_request">If user says "list all", "show all", "what jobs available" - show ALL jobs from the list with brief details</case>
    <case name="no_good_matches">If no jobs match ${studentName}'s ${profile.department} field well, acknowledge this honestly and suggest closest alternatives or skills to develop</case>
    <case name="already_applied">If recommending a job they've already applied to, mention their application status instead</case>
  </special_cases>
</task>`,

    'skill-gap': `
<task name="SKILL_GAP_ANALYSIS">
  <objective>Identify gaps between ${studentName}'s current skills and market/career requirements</objective>
  
  <analysis_approach>
    <step>List ${studentName}'s current skills: ${profile.technicalSkills.map(s => s.name).slice(0, 10).join(', ')}</step>
    <step>Identify target role requirements based on their ${profile.department} field</step>
    ${assessment.hasAssessment && assessment.skillGaps.length > 0 ? 
      `<step>Reference assessment-identified gaps: ${assessment.skillGaps.slice(0, 5).map((g: any) => g.skill || g).join(', ')}</step>` : ''}
    <step>Compare against in-demand skills for their target industry</step>
    <step>Prioritize gaps by: (1) Job market demand, (2) Career impact, (3) Learning difficulty</step>
  </analysis_approach>
  
  <output_format>
    **Current Strengths** 💪
    - Skills ${studentName} has that are valuable in the market
    
    **Critical Gaps** 🎯 (High Priority)
    - Must-have skills they're missing for their target roles
    - Why each skill matters
    
    **Nice-to-Have** 📈 (Medium Priority)
    - Skills that would boost their profile
    
    **Learning Plan** 📚
    - Specific resources for each gap (courses, tutorials, projects)
    - Suggested timeline
    ${progress.recommendedCourses.length > 0 ? `- Reference their AI-recommended courses` : ''}
  </output_format>
</task>`,

    'interview-prep': `
<task name="INTERVIEW_PREPARATION">
  <objective>Help ${studentName} prepare for job interviews in their field</objective>
  
  <preparation_areas>
    <area name="technical">
      - Questions specific to ${profile.department}
      - Questions about their skills: ${profile.technicalSkills.slice(0, 5).map(s => s.name).join(', ')}
      - Project-based questions using their projects
    </area>
    <area name="behavioral">
      - STAR method examples using their experience
      - Common HR questions with personalized answers
      - Questions about career goals
    </area>
    <area name="company_research">
      - How to research companies
      - Questions to ask interviewers
    </area>
  </preparation_areas>
  
  <approach>
    - Use Socratic method - guide ${studentName} to think, don't just give answers
    - Provide practice questions with frameworks
    - Reference their specific projects for example answers
    - Give constructive feedback
    ${assessment.hasAssessment ? `- Use their personality profile (${assessment.personalityInterpretation}) to suggest communication style` : ''}
  </approach>
  
  <output_format>
    Provide 3-5 relevant interview questions with:
    - The question
    - Why it's commonly asked
    - Framework for answering (e.g., STAR)
    - Example answer outline using ${studentName}'s background
  </output_format>
</task>`,

    'resume-review': `
<task name="RESUME_PROFILE_REVIEW">
  <objective>Analyze and improve ${studentName}'s profile/resume for better job prospects</objective>
  
  <analysis_areas>
    <area name="completeness">
      - Profile sections filled: Education (${profile.education.length}), Experience (${profile.experience.length}), Projects (${profile.projects.length}), Skills (${profile.technicalSkills.length})
      - Missing sections to add
    </area>
    <area name="strengths">
      - What stands out positively
      - Unique selling points
    </area>
    <area name="improvements">
      - Weak areas to strengthen
      - Better ways to present existing content
      - ATS optimization tips
    </area>
    <area name="target_alignment">
      - How well profile aligns with target roles in ${profile.department}
      - Gaps to address
    </area>
  </analysis_areas>
  
  <output_format>
    **Profile Strengths** ✅
    - What's working well
    
    **Areas for Improvement** 📝
    - Specific suggestions with examples
    
    **Missing Elements** ⚠️
    - What to add
    
    **Action Items** 🎯
    - Prioritized list of changes to make
  </output_format>
</task>`,

    'learning-path': `
<task name="LEARNING_PATH_CREATION">
  <objective>Create a personalized, DETAILED learning roadmap for ${studentName}</objective>
  
  <context>
    <current_skills>${profile.technicalSkills.map(s => `${s.name} (L${s.level})`).slice(0, 8).join(', ')}</current_skills>
    <field>${profile.department}</field>
    <education_background>${profile.education.slice(0, 2).map(e => `${e.degree || e.level} in ${e.department || 'General'}`).join(', ') || 'Not specified'}</education_background>
    ${assessment.hasAssessment && assessment.roadmap ? `<assessment_roadmap>Available - use this as primary reference</assessment_roadmap>` : ''}
    ${assessment.hasAssessment ? `<riasec_profile>${assessment.riasecCode} - consider career alignment</riasec_profile>` : ''}
    ${progress.recommendedCourses.length > 0 ? `<ai_recommended_courses>${progress.recommendedCourses.map(c => c.title).join(', ')}</ai_recommended_courses>` : ''}
    ${progress.courseEnrollments.length > 0 ? `<current_courses>${progress.courseEnrollments.map(c => `${c.title} (${c.progress}%)`).join(', ')}</current_courses>` : ''}
  </context>
  
  <critical_rules>
    ⚠️ IMPORTANT: Match the roadmap duration to what user asked for!
    - If user says "6 months" → create 6 phases (24 weeks)
    - If user says "3 months" → create 3 phases (12 weeks)
    - If user says "1 year" → create 12 phases or quarterly milestones
    - Default to 6 months if duration not specified
    
    ⚠️ Skills MUST be relevant to ${profile.department} field!
    - For Biotechnology: Bioinformatics, Lab techniques, R/Python for bio, CRISPR, etc.
    - For Computer Science: Programming, DSA, Web/Mobile dev, Cloud, etc.
    - For Mechanical: CAD, Manufacturing, Thermodynamics, etc.
    - For Commerce: Accounting, Finance, Excel, Tally, etc.
    
    ⚠️ Include SPECIFIC resources - not generic advice!
  </critical_rules>
  
  <roadmap_structure>
    <phase name="foundation" weeks="1-4">Core fundamentals and prerequisites</phase>
    <phase name="intermediate" weeks="5-10">Building domain expertise</phase>
    <phase name="advanced" weeks="11-18">Specialization and industry tools</phase>
    <phase name="mastery" weeks="19-24">Projects, certifications, job prep</phase>
  </roadmap_structure>
  
  <output_format>
    **Current Level** 📍
    - Where ${studentName} stands now (specific skills they have)
    - Gaps to address
    
    **Target Role** 🎯
    - Specific job titles aligned with ${profile.department}
    - Why this suits their profile
    
    **6-Month Learning Roadmap** 🗺️
    
    **Phase 1: Foundation (Weeks 1-4)** 
    - Skill 1: [Specific skill relevant to their field]
      - Resource: [Actual course name on Coursera/Udemy/YouTube]
    - Skill 2: [Another relevant skill]
      - Resource: [Specific resource]
    - Weekly commitment: X hours
    - Milestone: [What they should achieve]
    
    **Phase 2: Intermediate (Weeks 5-10)**
    - [Continue pattern with field-specific skills]
    
    **Phase 3: Advanced (Weeks 11-18)**
    - [Industry tools, frameworks specific to their domain]
    
    **Phase 4: Mastery & Job Prep (Weeks 19-24)**
    - Portfolio projects
    - Certifications to pursue
    - Interview preparation
    
    **Recommended Resources** 📚
    - **Free**: [Specific free courses - Coursera audit, YouTube channels, freeCodeCamp, NPTEL]
    - **Paid**: [Udemy courses, Certification programs]
    - **Books**: [1-2 must-read books for their field]
    - **Communities**: [Discord servers, Reddit communities, LinkedIn groups]
    
    **Projects to Build** 💻
    - Project 1: [Beginner - specific idea related to their field]
    - Project 2: [Intermediate - builds on skills]
    - Project 3: [Advanced - portfolio-worthy]
    
    **Certifications to Consider** 🏆
    - [Industry-recognized certifications for ${profile.department}]
  </output_format>
</task>`,

    'career-guidance': `
<task name="CAREER_GUIDANCE">
  <objective>Provide strategic career advice for ${studentName}</objective>
  
  <guidance_areas>
    <area name="career_paths">
      - Suitable paths based on ${profile.department} and skills
      ${assessment.hasAssessment ? `- RIASEC-aligned careers (${assessment.riasecCode}): ${assessment.riasecInterpretation.slice(0, 200)}` : ''}
      ${assessment.careerFit.length > 0 ? `- Assessment-recommended careers: ${assessment.careerFit.slice(0, 3).map((c: any) => c.title || c.career || c).join(', ')}` : ''}
    </area>
    <area name="industry_insights">
      - Trends in their target industry
      - Growing vs declining areas
      - Salary expectations
    </area>
    <area name="growth_strategy">
      - Short-term goals (6 months)
      - Medium-term goals (1-2 years)
      - Long-term vision (5+ years)
    </area>
    <area name="differentiation">
      - How to stand out in their field
      - Unique value proposition
    </area>
  </guidance_areas>
  
  <output_format>
    **Career Path Options** 🛤️
    - 2-3 suitable paths with pros/cons
    
    **Recommended Path**: Based on ${studentName}'s profile
    - Why this fits them
    - Growth trajectory
    - Required skills
    
    **Action Plan** 📋
    - Immediate steps (this week)
    - Short-term goals (3 months)
    - Medium-term milestones (1 year)
  </output_format>
</task>`,

    'assessment-insights': `
<task name="ASSESSMENT_INSIGHTS">
  <objective>Explain ${studentName}'s assessment results and their career implications</objective>
  
  ${assessment.hasAssessment ? `
  <assessment_data>
    <riasec>
      <code>${assessment.riasecCode}</code>
      <interpretation>${assessment.riasecInterpretation}</interpretation>
    </riasec>
    <personality>${assessment.personalityInterpretation}</personality>
    <aptitude_score>${assessment.aptitudeOverall}%</aptitude_score>
    <employability>${assessment.employabilityReadiness}</employability>
    ${assessment.overallSummary ? `<summary>${assessment.overallSummary}</summary>` : ''}
  </assessment_data>
  
  <explanation_approach>
    - Explain RIASEC code in practical, relatable terms
    - Connect personality traits to work preferences
    - Highlight strengths to leverage
    - Identify areas for growth
    - Link to specific career recommendations
  </explanation_approach>
  ` : `
  <no_assessment>
    ${studentName} hasn't completed the career assessment yet.
    - Explain the benefits of taking the assessment
    - Describe what they'll learn (interests, personality, aptitude)
    - Encourage them to complete it for personalized guidance
  </no_assessment>
  `}
  
  <output_format>
    **Your Interest Profile** 🎯
    - RIASEC code explanation
    - What this means for career choices
    
    **Your Personality Insights** 🧠
    - Key traits and work style
    - Best work environments
    
    **Strengths to Leverage** 💪
    - Natural advantages
    
    **Growth Areas** 📈
    - Skills to develop
    
    **Career Alignment** 🎯
    - Careers that match your profile
  </output_format>
</task>`,

    'application-status': `
<task name="APPLICATION_STATUS">
  <objective>Help ${studentName} track and understand their job applications</objective>
  
  <application_data>
    ${progress.appliedJobs.length > 0 ? `
    <applied_jobs count="${progress.appliedJobs.length}">
${progress.appliedJobs.map(j => `      - "${j.title}" at ${j.company}: ${j.status} (Applied: ${new Date(j.appliedAt).toLocaleDateString()})`).join('\n')}
    </applied_jobs>
    ` : '<applied_jobs count="0">No applications tracked yet</applied_jobs>'}
    
    ${progress.savedJobs.length > 0 ? `
    <saved_jobs count="${progress.savedJobs.length}">
${progress.savedJobs.map(j => `      - "${j.title}" at ${j.company}`).join('\n')}
    </saved_jobs>
    ` : ''}
  </application_data>
  
  <guidance>
    - Summarize application status
    - Provide tips based on current stage
    - Suggest follow-up actions
    - Recommend new opportunities if appropriate
  </guidance>
</task>`,

    'networking': `
<task name="NETWORKING_ADVICE">
  <objective>Help ${studentName} build professional connections</objective>
  
  <networking_areas>
    <area name="linkedin">
      - Profile optimization tips
      - Connection strategies
      - Content to share
    </area>
    <area name="outreach">
      - How to reach out to professionals
      - Cold email/message templates
      - Informational interview requests
    </area>
    <area name="communities">
      - Relevant communities for ${profile.department}
      - Events and meetups
      - Online forums
    </area>
    <area name="mentorship">
      - Finding mentors
      - Building mentor relationships
    </area>
  </networking_areas>
  
  <output_format>
    **LinkedIn Optimization** 💼
    - Profile tips specific to ${studentName}
    
    **Connection Strategy** 🤝
    - Who to connect with
    - How to reach out
    
    **Communities to Join** 👥
    - Relevant groups and forums
    
    **Action Items** 📋
    - This week's networking tasks
  </output_format>
</task>`,

    'general': `
<task name="GENERAL_ASSISTANCE">
  <objective>Be a helpful career assistant for ${studentName}</objective>
  
  <approach>
    - Answer questions directly and helpfully
    - Provide relevant career context
    - Offer actionable suggestions
    - Be encouraging and supportive
    - If the query is unclear, ask clarifying questions
    - If it's a greeting, respond warmly and offer to help with career topics
  </approach>
  
  <topics_to_offer>
    - Job search and matching
    - Skill development
    - Interview preparation
    - Resume/profile review
    - Career path guidance
    ${assessment.hasAssessment ? '- Assessment results interpretation' : '- Taking the career assessment'}
  </topics_to_offer>
</task>`
  };

  return instructions[intent] || instructions['general'];
}


// ==================== UTILITY FUNCTIONS ====================

function generateConversationTitle(message: string): string {
  const cleaned = message.replace(/[^\w\s]/g, '').trim();
  return cleaned.length > 50 ? cleaned.slice(0, 47) + '...' : cleaned;
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Authenticate user
    let user: { id: string } | null = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Method 1: Decode JWT directly
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.sub) {
            user = { id: payload.sub };
            console.log(`Career AI: User authenticated via JWT - ${user.id}`);
          }
        }
      } catch (jwtErr) {
        console.warn('JWT decode failed:', jwtErr);
      }
      
      // Method 2: Fallback to Supabase auth
      if (!user && SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
          
          if (!authError && authUser) {
            user = authUser;
            console.log(`Career AI: User authenticated via service role - ${user.id}`);
          }
        } catch (authErr) {
          console.warn('Service role auth error:', authErr);
        }
      }
    }

    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required. Please log in again.' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const studentId = user.id;

    // Create Supabase clients
    const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;
    
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader! } },
    });
    
    const supabase = supabaseUser;
    const dbClient = supabaseAdmin || supabaseUser;

    // Parse request
    const { conversationId, message, selectedChips = [] }: ChatRequest = await req.json();
    console.log(`Processing - studentId: ${studentId}, conversationId: ${conversationId || 'new'}, message: "${message.slice(0, 50)}..."`);

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch existing conversation messages
    let currentConversationId = conversationId;
    let existingMessages: StoredMessage[] = [];

    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('career_ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('student_id', studentId)
        .single();

      if (!convError && conversation) {
        existingMessages = conversation.messages || [];
      }
    }

    // Determine conversation phase and intent
    const messageCount = existingMessages.length;
    const conversationPhase = getConversationPhase(messageCount);
    const intentResult = detectIntent(message, selectedChips, existingMessages);
    const phaseParams = getPhaseParameters(conversationPhase, intentResult.intent);
    
    console.log(`[Phase] ${conversationPhase} (${messageCount} msgs) | [Intent] ${intentResult.intent} (${intentResult.confidence})${intentResult.secondaryIntent ? ` | [Secondary] ${intentResult.secondaryIntent}` : ''}`);

    // ============================================================
    // EARLY EXIT: Handle job listing requests BEFORE AI processing
    // ============================================================
    const lowerMessage = message.toLowerCase();
    const isJobListRequest = 
      lowerMessage.includes('list all') ||
      lowerMessage.includes('show all') ||
      lowerMessage.includes('all job') ||
      lowerMessage.includes('all opportunities') ||
      lowerMessage.includes('what jobs') ||
      lowerMessage.includes('available job') ||
      lowerMessage.includes('available opportunities') ||
      (lowerMessage.includes('show') && lowerMessage.includes('job')) ||
      (lowerMessage.includes('list') && lowerMessage.includes('job'));

    if (isJobListRequest) {
      console.log('[DIRECT RESPONSE] Job listing request - fetching from database');
      
      const directOpportunities = await fetchOpportunities(supabase, 100);
      console.log(`[DIRECT RESPONSE] Found ${directOpportunities.length} opportunities`);
      
      if (directOpportunities.length > 0) {
        const studentProfile = await buildStudentContext(supabase, studentId);
        const studentName = studentProfile?.name?.split(' ')[0] || 'there';
        
        // Group by employment type
        const internships = directOpportunities.filter(o => o.employment_type?.toLowerCase().includes('intern'));
        const fullTime = directOpportunities.filter(o => !o.employment_type?.toLowerCase().includes('intern'));
        
        let jobListFormatted = '';
        
        if (internships.length > 0) {
          jobListFormatted += `**🎓 Internships (${internships.length})**\n`;
          jobListFormatted += internships.map((opp, i) => 
            `${i + 1}. **${opp.title}** (ID: ${opp.id})\n   📍 ${opp.location || 'Location not specified'} | 🏢 ${opp.company_name || 'Company not specified'}`
          ).join('\n\n');
        }
        
        if (fullTime.length > 0) {
          if (internships.length > 0) jobListFormatted += '\n\n';
          jobListFormatted += `**💼 Full-time/Part-time (${fullTime.length})**\n`;
          jobListFormatted += fullTime.map((opp, i) => 
            `${i + 1}. **${opp.title}** (ID: ${opp.id})\n   📍 ${opp.location || 'Location not specified'} | 🏢 ${opp.company_name || 'Company not specified'}`
          ).join('\n\n');
        }
        
        const directResponse = `Hi ${studentName}! 👋 Here are **all ${directOpportunities.length} active opportunities** in our database:\n\n${jobListFormatted}\n\n---\n📊 **Total:** ${directOpportunities.length} opportunities (${internships.length} internships, ${fullTime.length} jobs)\n\nWould you like me to:\n- **Analyze** which ones best match your profile?\n- **Get details** about a specific opportunity?\n- **Filter** by location, skills, or type?`;
        
        // Save conversation
        const turnId = crypto.randomUUID();
        const userMessage: StoredMessage = { id: turnId, role: 'user', content: message, timestamp: new Date().toISOString() };
        const assistantMessage: StoredMessage = { id: turnId, role: 'assistant', content: directResponse, timestamp: new Date().toISOString() };
        const updatedMessages = [...existingMessages, userMessage, assistantMessage];
        
        if (dbClient) {
          if (currentConversationId) {
            await dbClient.from('career_ai_conversations')
              .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
              .eq('id', currentConversationId).eq('student_id', studentId);
          } else {
            const { data: newConv } = await dbClient.from('career_ai_conversations')
              .insert({ student_id: studentId, title: message.slice(0, 50), messages: updatedMessages })
              .select('id').single();
            if (newConv) currentConversationId = newConv.id;
          }
        }
        
        const encoder = new TextEncoder();
        const directStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: directResponse })}\n\n`));
            controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ conversationId: currentConversationId, messageId: turnId, intent: 'find-jobs', phase: 'direct_response' })}\n\n`));
            controller.close();
          }
        });
        
        return new Response(directStream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
        });
      }
    }

    // ============================================================
    // FULL AI PROCESSING
    // ============================================================

    // Build comprehensive context
    console.log('[Context] Building student profile...');
    const studentProfile = await buildStudentContext(supabase, studentId);
    if (!studentProfile) {
      return new Response(JSON.stringify({ error: 'Unable to load student profile' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('[Context] Building assessment context...');
    const assessmentContext = await buildAssessmentContext(supabase, studentId);
    
    console.log('[Context] Building career progress context...');
    const progressContext = await buildCareerProgressContext(supabase, studentId);

    // Fetch opportunities for relevant intents
    let opportunities: Opportunity[] = [];
    if (['find-jobs', 'skill-gap', 'career-guidance', 'application-status'].includes(intentResult.intent)) {
      opportunities = await fetchOpportunities(supabase, 50);
      console.log(`[Context] Fetched ${opportunities.length} opportunities`);
    }

    // Build comprehensive system prompt
    const systemPrompt = buildCareerSystemPrompt(
      studentProfile, 
      assessmentContext, 
      progressContext, 
      opportunities, 
      conversationPhase, 
      intentResult
    );

    // Prepare messages for AI
    const turnId = crypto.randomUUID();
    const userMessage: StoredMessage = {
      id: turnId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Build conversation history (limit to last 10 messages)
    const recentMessages = existingMessages.slice(-10);
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // Get API key
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('OPENAI_API_KEY');
    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const encoder = new TextEncoder();
    let fullResponse = '';

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': SUPABASE_URL,
              'X-Title': 'Career AI Assistant'
            },
            body: JSON.stringify({
              model: 'openai/gpt-4o-mini',
              messages: aiMessages,
              stream: true,
              max_tokens: phaseParams.max_tokens,
              temperature: phaseParams.temperature
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', response.status, errorText);
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: `AI service error (${response.status})` })}\n\n`));
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'No response stream' })}\n\n`));
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch { /* skip parse errors */ }
              }
            }
          }

          // Save conversation
          const assistantMessage: StoredMessage = {
            id: turnId,
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...existingMessages, userMessage, assistantMessage];

          if (dbClient) {
            if (currentConversationId) {
              await dbClient.from('career_ai_conversations')
                .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
                .eq('id', currentConversationId).eq('student_id', studentId);
              console.log(`[DB] Updated conversation: ${currentConversationId}`);
            } else {
              const title = generateConversationTitle(message);
              const { data: newConv } = await dbClient.from('career_ai_conversations')
                .insert({ student_id: studentId, title: title.slice(0, 255), messages: updatedMessages })
                .select('id').single();
              if (newConv) {
                currentConversationId = newConv.id;
                console.log(`[DB] Created conversation: ${currentConversationId}`);
              }
            }
          }

          // Send completion event
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
            conversationId: currentConversationId,
            messageId: assistantMessage.id,
            intent: intentResult.intent,
            intentConfidence: intentResult.confidence,
            phase: conversationPhase,
            hasAssessment: assessmentContext.hasAssessment
          })}\n\n`));
          controller.close();

        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
    });

  } catch (error) {
    console.error('Error in career-ai-chat:', error);
    return new Response(JSON.stringify({ error: (error as Error)?.message || 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

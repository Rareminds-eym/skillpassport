/**
 * Career API Cloudflare Worker
 * Handles career guidance features:
 * - /chat - Career AI chat with streaming
 * - /recommend-opportunities - Get job recommendations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_OPENROUTER_API_KEY: string;
  EMBEDDING_SERVICE_URL?: string; // Optional: defaults to https://embedings.onrender.com
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ==================== TYPES ====================

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type CareerIntent = 'find-jobs' | 'skill-gap' | 'interview-prep' | 'resume-review' |
  'learning-path' | 'career-guidance' | 'assessment-insights' | 'application-status' |
  'networking' | 'course-progress' | 'course-recommendation' | 'general';

type ConversationPhase = 'opening' | 'exploring' | 'deep_dive' | 'follow_up';

interface IntentScore {
  intent: CareerIntent;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  secondaryIntent?: CareerIntent;
}

interface Opportunity {
  id: string;
  title: string;
  company_name?: string;
  location?: string;
  employment_type?: string;
  skills_required?: string[];
}

interface StudentProfile {
  name: string;
  department?: string;
  university?: string;
  cgpa?: string;
  yearOfPassing?: string;
  technicalSkills: Array<{ name: string; level: number; verified?: boolean }>;
  softSkills: Array<{ name: string }>;
  education: any[];
  experience: any[];
  projects: any[];
  certificates: any[];
}

interface PhaseParameters {
  max_tokens: number;
  temperature: number;
}

// ==================== RATE LIMITING ====================

const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitCache.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitCache.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) return false;
  userLimit.count++;
  return true;
}

// ==================== HELPERS ====================

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function authenticateUser(request: Request, env: Env): Promise<{ user: any; supabase: SupabaseClient; supabaseAdmin: SupabaseClient } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  return { user, supabase, supabaseAdmin };
}

function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, 2000);
}

function generateConversationTitle(message: string): string {
  const cleaned = message.replace(/[^\w\s]/g, '').trim();
  return cleaned.length > 50 ? cleaned.slice(0, 47) + '...' : cleaned;
}

// ==================== INTENT DETECTION ====================

const GREETING_PATTERNS = [
  /^(hi|hello|hey|hii+|yo|sup|hola|namaste|good\s*(morning|afternoon|evening))[\s!.,]*$/i,
  /^(what'?s up|how are you|how's it going)[\s!?.,]*$/i
];

const INTENT_PATTERNS: Array<{
  intent: CareerIntent;
  strongPatterns: RegExp[];
  weakPatterns: RegExp[];
}> = [
    {
      intent: 'find-jobs',
      strongPatterns: [
        /\b(find|search|show|list|get|recommend|suggest)\s*(me\s*)?(a\s*)?(job|jobs|opportunity|opportunities)\b/i,
        /\b(looking for|searching for|need)\s*(a\s*)?(job|work|employment|internship)\b/i,
      ],
      weakPatterns: [/\bjob\b/i, /\bopportunity\b/i, /\bwork\b/i]
    },
    {
      intent: 'skill-gap',
      strongPatterns: [
        /\b(skill|skills)\s*(gap|gaps|missing|lacking|need|improve)\b/i,
        /\b(improve|develop|upgrade|upskill)\s*(my\s*)?(skill|skills)\b/i,
      ],
      weakPatterns: [/\bskill\b/i, /\bimprove\b/i, /\bgap\b/i]
    },
    {
      intent: 'interview-prep',
      strongPatterns: [
        /\b(interview|interviews)\s*(prep|prepare|preparation|practice|tips|questions)\b/i,
        /\b(prepare|preparing)\s*(for|me for)\s*(interview|interviews)\b/i,
      ],
      weakPatterns: [/\binterview\b/i, /\bquestion\b/i]
    },
    {
      intent: 'resume-review',
      strongPatterns: [
        /\b(resume|cv|profile)\s*(review|feedback|improve|check)\b/i,
      ],
      weakPatterns: [/\bresume\b/i, /\bcv\b/i]
    },
    {
      intent: 'learning-path',
      strongPatterns: [
        /\b(learning|study)\s*(path|roadmap|plan)\b/i,
        /\bwhat\s*(should i|to)\s*learn\b/i,
      ],
      weakPatterns: [/\blearn\b/i, /\bcourse\b/i, /\broadmap\b/i]
    },
    {
      intent: 'career-guidance',
      strongPatterns: [
        /\b(career|careers)\s*(guidance|advice|path|direction)\b/i,
        /\bwhat\s*(career|field|domain)\s*(should i|is best)\b/i,
      ],
      weakPatterns: [/\bcareer\b/i, /\bfield\b/i, /\bguidance\b/i]
    },
    {
      intent: 'assessment-insights',
      strongPatterns: [
        /\b(assessment|test)\s*(result|results|insight|insights)\b/i,
        /\b(my|explain)\s*(riasec|personality|aptitude)\b/i,
      ],
      weakPatterns: [/\bassessment\b/i, /\briasec\b/i]
    },
    {
      intent: 'application-status',
      strongPatterns: [
        /\b(application|applications)\s*(status|update|progress)\b/i,
        /\b(my|check)\s*(application|applications)\b/i,
      ],
      weakPatterns: [/\bapplication\b/i, /\bstatus\b/i]
    },
    {
      intent: 'course-progress',
      strongPatterns: [
        /\b(my|enrolled)\s*(course|courses|enrollment)\b/i,
        /\b(course|courses)\s*(progress|status|enrolled)\b/i,
      ],
      weakPatterns: [/\benrolled\b/i, /\bprogress\b/i]
    },
    {
      intent: 'course-recommendation',
      strongPatterns: [
        /\b(recommend|suggest)\s*(me\s*)?(a\s*)?(course|courses)\b/i,
        /\bwhich\s*(course|courses)\s*(should i|to)\s*(take|enroll)\b/i,
      ],
      weakPatterns: [/\bcourse\b/i, /\brecommend\b/i]
    }
  ];

function detectIntent(message: string, existingMessages: StoredMessage[] = []): IntentScore {
  const lowerMessage = message.toLowerCase().trim();
  const scores: Record<CareerIntent, number> = {
    'find-jobs': 0, 'skill-gap': 0, 'interview-prep': 0, 'resume-review': 0,
    'learning-path': 0, 'career-guidance': 0, 'assessment-insights': 0,
    'application-status': 0, 'networking': 0, 'course-progress': 0,
    'course-recommendation': 0, 'general': 5
  };

  if (GREETING_PATTERNS.some(p => p.test(lowerMessage)) || lowerMessage.length < 5) {
    return { intent: 'general', score: 100, confidence: 'high' };
  }

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.strongPatterns) {
      if (regex.test(message)) scores[pattern.intent] += 25;
    }
    for (const regex of pattern.weakPatterns) {
      if (regex.test(message)) scores[pattern.intent] += 8;
    }
  }

  // Context boost from history
  if (existingMessages.length > 0) {
    const lastMessages = existingMessages.slice(-3);
    for (const msg of lastMessages) {
      const content = msg.content.toLowerCase();
      if (content.includes('job') || content.includes('opportunity')) scores['find-jobs'] += 10;
      if (content.includes('skill') || content.includes('gap')) scores['skill-gap'] += 10;
      if (content.includes('interview')) scores['interview-prep'] += 10;
      if (content.includes('career') || content.includes('guidance')) scores['career-guidance'] += 10;
    }
  }

  const sortedIntents = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topIntent, topScore] = sortedIntents[0];
  const [secondIntent, secondScore] = sortedIntents[1];

  let confidence: 'high' | 'medium' | 'low';
  if (topScore >= 50) confidence = 'high';
  else if (topScore >= 25) confidence = 'medium';
  else confidence = 'low';

  if (confidence === 'low' && topScore < 15) {
    return { intent: 'general', score: 5, confidence: 'low' };
  }

  return {
    intent: topIntent as CareerIntent,
    score: topScore,
    confidence,
    secondaryIntent: secondScore > 15 ? secondIntent as CareerIntent : undefined
  };
}

// ==================== CONVERSATION PHASE ====================

function getConversationPhase(messageCount: number): ConversationPhase {
  if (messageCount === 0) return 'opening';
  if (messageCount <= 4) return 'exploring';
  if (messageCount <= 10) return 'deep_dive';
  return 'follow_up';
}

function getPhaseParameters(phase: ConversationPhase, intent?: CareerIntent): PhaseParameters {
  const baseParams: Record<ConversationPhase, PhaseParameters> = {
    opening: { max_tokens: 600, temperature: 0.7 },
    exploring: { max_tokens: 2000, temperature: 0.5 },
    deep_dive: { max_tokens: 4000, temperature: 0.4 },
    follow_up: { max_tokens: 2500, temperature: 0.45 }
  };

  const result = { ...baseParams[phase] };

  // Factual intents need lower temperature
  const factualIntents: CareerIntent[] = ['find-jobs', 'application-status', 'course-progress'];
  if (intent && factualIntents.includes(intent)) {
    result.temperature = Math.min(result.temperature, 0.35);
  }

  return result;
}


// ==================== CONTEXT BUILDERS ====================

async function buildStudentContext(supabase: SupabaseClient, studentId: string): Promise<StudentProfile | null> {
  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', studentId)
    .maybeSingle();

  if (error || !student) {
    // Try by id as fallback
    const { data: studentById } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (!studentById) return null;
    return parseStudentProfile(studentById);
  }

  return parseStudentProfile(student);
}

function parseStudentProfile(student: any): StudentProfile {
  const profile = student.profile || {};
  return {
    name: student.name || profile.name || 'Student',
    department: student.department || profile.department,
    university: student.university || profile.university,
    cgpa: student.cgpa || profile.cgpa,
    yearOfPassing: student.year_of_passing || profile.yearOfPassing,
    technicalSkills: parseSkills(student.skills || profile.skills || []),
    softSkills: parseSoftSkills(profile.softSkills || []),
    education: profile.education || [],
    experience: profile.experience || [],
    projects: profile.projects || [],
    certificates: profile.certificates || []
  };
}

function parseSkills(skills: any[]): Array<{ name: string; level: number; verified?: boolean }> {
  if (!Array.isArray(skills)) return [];
  return skills.map(s => ({
    name: typeof s === 'string' ? s : s.name || s.skill || '',
    level: s.level || s.proficiency || 3,
    verified: s.verified || false
  })).filter(s => s.name);
}

function parseSoftSkills(skills: any[]): Array<{ name: string }> {
  if (!Array.isArray(skills)) return [];
  return skills.map(s => ({ name: typeof s === 'string' ? s : s.name || '' })).filter(s => s.name);
}


async function fetchOpportunities(supabase: SupabaseClient, limit: number = 50): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, company_name, location, employment_type, skills_required')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

async function buildAssessmentContext(supabase: SupabaseClient, studentId: string): Promise<{
  hasAssessment: boolean;
  riasecCode?: string;
  riasecInterpretation?: string;
  personalityInterpretation?: string;
  aptitudeOverall?: number;
  employabilityReadiness?: string;
  careerFit: any[];
  skillGaps: any[];
}> {
  const { data: assessment } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!assessment) {
    return { hasAssessment: false, careerFit: [], skillGaps: [] };
  }

  return {
    hasAssessment: true,
    riasecCode: assessment.riasec_code,
    riasecInterpretation: assessment.riasec_interpretation,
    personalityInterpretation: assessment.personality_interpretation,
    aptitudeOverall: assessment.aptitude_overall,
    employabilityReadiness: assessment.employability_readiness,
    careerFit: assessment.career_fit || [],
    skillGaps: assessment.skill_gaps || []
  };
}

async function buildCareerProgressContext(supabase: SupabaseClient, studentId: string): Promise<{
  appliedJobs: any[];
  savedJobs: any[];
  courseEnrollments: any[];
}> {
  const [applications, saved, enrollments] = await Promise.all([
    supabase.from('applications').select('*, opportunities(title, company_name)').eq('student_id', studentId).limit(10),
    supabase.from('saved_opportunities').select('*, opportunities(title, company_name)').eq('student_id', studentId).limit(10),
    supabase.from('course_enrollments').select('*, courses(title)').eq('student_id', studentId).limit(10)
  ]);

  return {
    appliedJobs: (applications.data || []).map(a => ({
      title: a.opportunities?.title || 'Unknown',
      company: a.opportunities?.company_name || 'Unknown',
      status: a.status || 'applied'
    })),
    savedJobs: (saved.data || []).map(s => ({
      title: s.opportunities?.title || 'Unknown',
      company: s.opportunities?.company_name || 'Unknown'
    })),
    courseEnrollments: (enrollments.data || []).map(e => ({
      title: e.courses?.title || 'Unknown',
      progress: e.progress || 0,
      status: e.status || 'enrolled'
    }))
  };
}


// ==================== SYSTEM PROMPT BUILDER ====================

function buildSystemPrompt(
  profile: StudentProfile,
  assessment: any,
  progress: any,
  opportunities: Opportunity[],
  phase: ConversationPhase,
  intentResult: IntentScore
): string {
  const studentName = profile.name.split(' ')[0];
  const techSkills = profile.technicalSkills.length > 0
    ? profile.technicalSkills.map(s => `${s.name} (L${s.level})`).join(', ')
    : 'None listed';

  const opportunitiesXML = opportunities.length > 0
    ? `<opportunities count="${opportunities.length}">
${opportunities.slice(0, 15).map(o =>
      `- ID:${o.id} | ${o.title} | ${o.company_name || 'N/A'} | ${o.location || 'N/A'} | Skills: ${(o.skills_required || []).slice(0, 5).join(', ')}`
    ).join('\n')}
</opportunities>`
    : '';

  const phaseRules: Record<ConversationPhase, string> = {
    opening: 'Keep response SHORT (150-200 words). Greet warmly, give concise insight, ask ONE follow-up question.',
    exploring: 'Moderate depth (300-500 words). Provide 2-3 concrete recommendations with structure.',
    deep_dive: 'Comprehensive response (up to 800 words). Detailed guidance with clear roadmap.',
    follow_up: 'Balanced response (400-600 words). Build on previous discussion, track progress.'
  };

  return `<system>
<role>Career AI - Expert Career Counselor for Indian Students</role>

<personality>
- Friendly, professional, data-driven
- Uses student's name (${studentName}) naturally
- Action-oriented with clear next steps
- Uses 2-3 contextual emojis per response
</personality>

<response_rules>
<phase>${phase}</phase>
${phaseRules[phase]}
</response_rules>

<student_profile>
<name>${profile.name}</name>
<field>${profile.department || 'Not specified'}</field>
<university>${profile.university || 'Not specified'}</university>
<cgpa>${profile.cgpa || 'Not specified'}</cgpa>
<skills>${techSkills}</skills>
<experience_count>${profile.experience.length}</experience_count>
<projects_count>${profile.projects.length}</projects_count>
</student_profile>

<assessment status="${assessment.hasAssessment ? 'completed' : 'not_completed'}">
${assessment.hasAssessment ? `
<riasec>${assessment.riasecCode || 'N/A'}</riasec>
<employability>${assessment.employabilityReadiness || 'N/A'}</employability>
` : '<note>Student has not completed career assessment yet</note>'}
</assessment>

${opportunitiesXML}

<detected_intent confidence="${intentResult.confidence}">
<primary>${intentResult.intent}</primary>
${intentResult.secondaryIntent ? `<secondary>${intentResult.secondaryIntent}</secondary>` : ''}
</detected_intent>

<critical_rules>
1. ONLY mention jobs from <opportunities> section
2. ONLY attribute skills listed in student profile
3. If data is missing, acknowledge it honestly
4. Never fabricate companies, salaries, or statistics
5. End with actionable suggestion or question
</critical_rules>
</system>`;
}


// ==================== HANDLER: CAREER CHAT ====================

async function handleCareerChat(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const startTime = Date.now();

  // Authentication
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { user, supabase, supabaseAdmin } = auth;
  const studentId = user.id;

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Too many requests. Please wait a moment.' }, 429);
  }

  // Parse request
  const body = await request.json() as { conversationId?: string; message?: string; selectedChips?: string[] };
  const { conversationId, message, selectedChips = [] } = body;

  if (!message || typeof message !== 'string') {
    return jsonResponse({ error: 'Message is required' }, 400);
  }

  const sanitizedMessage = sanitizeInput(message);
  if (!sanitizedMessage) {
    return jsonResponse({ error: 'Invalid message' }, 400);
  }

  // Fetch existing conversation
  let currentConversationId = conversationId;
  let existingMessages: StoredMessage[] = [];

  if (conversationId) {
    const { data: conversation } = await supabase
      .from('career_ai_conversations')
      .select('messages')
      .eq('id', conversationId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (conversation) {
      existingMessages = conversation.messages || [];
    }
  }

  // Determine phase and intent
  const messageCount = existingMessages.length;
  const conversationPhase = getConversationPhase(messageCount);
  const intentResult = detectIntent(sanitizedMessage, existingMessages);
  const phaseParams = getPhaseParameters(conversationPhase, intentResult.intent);

  // Build context in parallel
  const [studentProfile, assessmentContext, progressContext] = await Promise.all([
    buildStudentContext(supabase, studentId),
    buildAssessmentContext(supabaseAdmin, studentId),
    buildCareerProgressContext(supabase, studentId)
  ]);

  if (!studentProfile) {
    return jsonResponse({ error: 'Unable to load student profile' }, 500);
  }

  // Fetch opportunities for relevant intents
  let opportunities: Opportunity[] = [];
  const jobRelatedIntents: CareerIntent[] = ['find-jobs', 'skill-gap', 'career-guidance', 'application-status'];
  if (jobRelatedIntents.includes(intentResult.intent)) {
    opportunities = await fetchOpportunities(supabase, 50);
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(
    studentProfile, assessmentContext, progressContext,
    opportunities, conversationPhase, intentResult
  );

  // Prepare messages for AI
  const turnId = crypto.randomUUID();
  const userMessage: StoredMessage = {
    id: turnId,
    role: 'user',
    content: sanitizedMessage,
    timestamp: new Date().toISOString()
  };

  const recentMessages = existingMessages.slice(-10);
  const aiMessages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: sanitizedMessage }
  ];

  // Stream response
  return streamCareerResponse({
    env, aiMessages, phaseParams, supabaseAdmin, studentId,
    existingMessages, userMessage, currentConversationId,
    message: sanitizedMessage, intentResult, conversationPhase,
    assessmentContext, startTime
  });
}


interface StreamParams {
  env: Env;
  aiMessages: any[];
  phaseParams: PhaseParameters;
  supabaseAdmin: SupabaseClient;
  studentId: string;
  existingMessages: StoredMessage[];
  userMessage: StoredMessage;
  currentConversationId: string | undefined;
  message: string;
  intentResult: IntentScore;
  conversationPhase: ConversationPhase;
  assessmentContext: any;
  startTime: number;
}

async function streamCareerResponse(params: StreamParams): Promise<Response> {
  const {
    env, aiMessages, phaseParams, supabaseAdmin, studentId,
    existingMessages, userMessage, currentConversationId,
    message, intentResult, conversationPhase, assessmentContext, startTime
  } = params;

  const encoder = new TextEncoder();
  let fullResponse = '';
  let convId = currentConversationId;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.VITE_SUPABASE_URL || '',
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
          console.error('[AI ERROR]', response.status, errorText);
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
          id: userMessage.id,
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString()
        };

        const updatedMessages = [...existingMessages, userMessage, assistantMessage];

        try {
          if (convId) {
            await supabaseAdmin.from('career_ai_conversations')
              .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
              .eq('id', convId)
              .eq('student_id', studentId);
          } else {
            const title = generateConversationTitle(message);
            const { data: newConv } = await supabaseAdmin.from('career_ai_conversations')
              .insert({ student_id: studentId, title: title.slice(0, 255), messages: updatedMessages })
              .select('id')
              .single();
            if (newConv) convId = newConv.id;
          }
        } catch (dbError) {
          console.error('[DB ERROR]', dbError);
        }

        // Send completion event
        const executionTime = Date.now() - startTime;
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
          conversationId: convId,
          messageId: assistantMessage.id,
          intent: intentResult.intent,
          intentConfidence: intentResult.confidence,
          phase: conversationPhase,
          hasAssessment: assessmentContext.hasAssessment,
          executionTime
        })}\n\n`));
        controller.close();

      } catch (error) {
        console.error('[STREAM ERROR]', error);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}


// ==================== HANDLER: RECOMMEND OPPORTUNITIES ====================

const RECOMMEND_CONFIG = {
  MATCH_THRESHOLD: 0.20,
  MAX_RECOMMENDATIONS: 50,
  DEFAULT_LIMIT: 20
};

function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

async function handleRecommendOpportunities(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const startTime = Date.now();

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON', recommendations: [] }, 400);
  }

  const { studentId, forceRefresh = false, limit = RECOMMEND_CONFIG.DEFAULT_LIMIT } = body;

  if (!studentId) {
    return jsonResponse({ error: 'studentId is required', recommendations: [] }, 400);
  }

  if (!isValidUUID(studentId)) {
    return jsonResponse({ error: 'Invalid studentId format', recommendations: [] }, 400);
  }

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded', recommendations: [] }, 429);
  }

  const safeLimit = Math.min(Math.max(1, limit), RECOMMEND_CONFIG.MAX_RECOMMENDATIONS);
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Get student profile
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('embedding, id, name, profile')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError || !student) {
    // Fallback to popular opportunities
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'no_profile');
  }

  if (!student.embedding) {
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'no_embedding');
  }

  // Get dismissed opportunities
  const { data: dismissed } = await supabase
    .from('opportunity_interactions')
    .select('opportunity_id')
    .eq('student_id', studentId)
    .eq('action', 'dismiss');

  const dismissedIds = dismissed?.map(d => d.opportunity_id) || [];

  // Run enhanced matching
  const { data: recommendations, error: matchError } = await supabase.rpc('match_opportunities_enhanced', {
    query_embedding: student.embedding,
    student_id_param: studentId,
    dismissed_ids: dismissedIds,
    match_threshold: RECOMMEND_CONFIG.MATCH_THRESHOLD,
    match_count: RECOMMEND_CONFIG.MAX_RECOMMENDATIONS
  });

  if (matchError) {
    console.error('Match error:', matchError);
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'match_error');
  }

  if (!recommendations || recommendations.length === 0) {
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'no_matches');
  }

  const topRecommendations = recommendations.slice(0, safeLimit);
  const executionTime = Date.now() - startTime;

  return jsonResponse({
    recommendations: topRecommendations,
    cached: false,
    count: topRecommendations.length,
    totalMatches: recommendations.length,
    executionTime
  });
}

async function getPopularFallback(
  supabase: SupabaseClient,
  studentId: string,
  limit: number,
  startTime: number,
  reason: string
): Promise<Response> {
  try {
    const { data: popular, error } = await supabase.rpc('get_popular_opportunities', {
      student_id_param: studentId,
      limit_count: limit
    });

    if (error) throw error;

    const executionTime = Date.now() - startTime;
    return jsonResponse({
      recommendations: popular || [],
      fallback: true,
      reason,
      count: popular?.length || 0,
      executionTime
    });
  } catch (fallbackError) {
    console.error('Fallback failed:', fallbackError);
    const executionTime = Date.now() - startTime;
    return jsonResponse({
      recommendations: [],
      fallback: true,
      reason,
      count: 0,
      executionTime
    });
  }
}


// ==================== HANDLER: GENERATE EMBEDDING ====================

interface GenerateEmbeddingRequest {
  text: string;
  table: string;
  id: string;
  type?: 'opportunity' | 'student';
}

async function handleGenerateEmbedding(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: GenerateEmbeddingRequest;
  try {
    body = await request.json() as GenerateEmbeddingRequest;
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
  }

  const { text, table, id, type = 'opportunity' } = body;

  // Validate required parameters
  if (!text || !table || !id) {
    return jsonResponse({
      success: false,
      error: 'Missing required parameters: text, table, id'
    }, 400);
  }

  // Validate table name to prevent SQL injection (only allow specific tables)
  const allowedTables = ['opportunities', 'students', 'profiles', 'courses'];
  if (!allowedTables.includes(table)) {
    return jsonResponse({
      success: false,
      error: `Invalid table. Allowed tables: ${allowedTables.join(', ')}`
    }, 400);
  }

  // Validate ID format (UUID)
  if (!isValidUUID(id)) {
    return jsonResponse({
      success: false,
      error: 'Invalid id format. Must be a valid UUID.'
    }, 400);
  }

  console.log(`Generating embedding for ${type} #${id}`);

  try {
    // Use the embedding service (FREE Transformers.js on Render.com)
    const embeddingServiceUrl = env.EMBEDDING_SERVICE_URL || 'https://embedings.onrender.com';

    const embeddingResponse = await fetch(`${embeddingServiceUrl}/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding service error:', embeddingResponse.status, errorText);
      return jsonResponse({
        success: false,
        error: `Embedding service error: ${embeddingResponse.status} - ${errorText}`
      }, 500);
    }

    const { embedding } = await embeddingResponse.json() as { embedding: number[] };

    if (!embedding || !Array.isArray(embedding)) {
      return jsonResponse({
        success: false,
        error: 'Invalid embedding response from service'
      }, 500);
    }

    console.log(`Generated embedding with ${embedding.length} dimensions`);

    // Update the record in Supabase
    const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { error: updateError } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return jsonResponse({
        success: false,
        error: `Failed to update ${table}: ${updateError.message}`
      }, 500);
    }

    console.log(`✅ Successfully updated ${table} #${id} with embedding`);

    return jsonResponse({
      success: true,
      message: `Embedding generated for ${type} #${id}`,
      dimensions: embedding.length
    });

  } catch (error) {
    console.error('Error generating embedding:', error);
    return jsonResponse({
      success: false,
      error: (error as Error).message || 'Unknown error generating embedding'
    }, 500);
  }
}

// ==================== HANDLER: ANALYZE ASSESSMENT ====================

/**
 * Build the analysis prompt for Claude AI
 */
const buildAnalysisPrompt = (assessmentData: any) => {
  // Create a hash of the answers for consistency tracking
  const answersHash = JSON.stringify(assessmentData).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  return `You are a career counselor and psychometric assessment expert. Analyze the following student assessment data and provide comprehensive results.

## CONSISTENCY REQUIREMENT - CRITICAL:
This analysis must be DETERMINISTIC and CONSISTENT. Given the same input data, you must ALWAYS produce the SAME output.
- Use ONLY the provided data to make calculations - do not introduce randomness
- Calculate scores using EXACT mathematical formulas provided below
- Career recommendations must be derived DIRECTLY from the calculated scores
- If this same data is analyzed again, the results MUST be identical
- Session ID for consistency verification: ${answersHash}

## Student Stream: ${assessmentData.stream.toUpperCase()}

## RIASEC Career Interest Responses (1-5 scale: 1=Strongly Dislike, 2=Dislike, 3=Neutral, 4=Like, 5=Strongly Like):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

RIASEC SCORING RULES:
- Response 1 (Strongly Dislike): 0 points - DO NOT count
- Response 2 (Dislike): 0 points - DO NOT count  
- Response 3 (Neutral): 0 points
- Response 4 (Like): 1 point
- Response 5 (Strongly Like): 2 points
- Maximum score per type = 20 (10 questions × 2 points max)

## MULTI-APTITUDE BATTERY RESULTS (DAT/GATB Style):
Pre-calculated Scores:
- Verbal Reasoning: ${assessmentData.aptitudeScores?.verbal?.correct || 0}/${assessmentData.aptitudeScores?.verbal?.total || 8} correct
- Numerical Ability: ${assessmentData.aptitudeScores?.numerical?.correct || 0}/${assessmentData.aptitudeScores?.numerical?.total || 8} correct
- Abstract/Logical Reasoning: ${assessmentData.aptitudeScores?.abstract?.correct || 0}/${assessmentData.aptitudeScores?.abstract?.total || 8} correct
- Spatial/Mechanical Reasoning: ${assessmentData.aptitudeScores?.spatial?.correct || 0}/${assessmentData.aptitudeScores?.spatial?.total || 6} correct
- Clerical Speed & Accuracy: ${assessmentData.aptitudeScores?.clerical?.correct || 0}/${assessmentData.aptitudeScores?.clerical?.total || 20} correct

Detailed Aptitude Answers:
${JSON.stringify(assessmentData.aptitudeAnswers, null, 2)}

APTITUDE SCORING RULES:
- Each correct answer = 1 point
- Convert raw scores to percentages for each domain
- Identify top 2-3 cognitive strengths based on highest percentage scores
- Use aptitude profile to inform career cluster recommendations

## Big Five Personality Responses (1-5 scale: 1=Very Inaccurate, 5=Very Accurate):
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

## Work Values Responses (1-5 scale: 1=Not Important, 5=Extremely Important):
${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

## EMPLOYABILITY / 21st-CENTURY SKILLS DIAGNOSTIC:

### Part A: Self-Rating Skills (25 items, 1-5 scale: 1=Not like me, 5=Very much like me)
${JSON.stringify(assessmentData.employabilityAnswers?.selfRating || {}, null, 2)}

EMPLOYABILITY SCORING RULES:
- Average each domain (Communication, Teamwork, Problem Solving, Adaptability, Leadership, Digital Fluency, Professionalism, Career Readiness)
- Create a readiness heat-map based on domain averages
- Identify strength areas (avg >= 4) and improvement areas (avg <= 2.5)

### Part B: Situational Judgement Test (6 scenarios)
${JSON.stringify(assessmentData.employabilityAnswers?.sjt || [], null, 2)}

SJT SCORING RULES:
- Best answer = 2 points, Worst answer = 0 points, Other answers = 1 point
- Calculate total SJT score out of 12 (6 scenarios × 2 max points)
- Convert to percentage for overall SJT score

## Stream Knowledge Test Results:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}
Total Questions: ${assessmentData.totalKnowledgeQuestions}

## SECTION TIMING DATA (Time spent by student on each section):
- RIASEC (Career Interests): ${assessmentData.sectionTimings?.riasec?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.riasec?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.riasec?.avgSecondsPerQuestion || 0}s per question)
- Multi-Aptitude Battery: ${assessmentData.sectionTimings?.aptitude?.formatted || 'Not recorded'} of 45 minutes allowed (First 30 questions: 1 min each individual timer, Last 20 questions: 15 min shared timer) (${assessmentData.sectionTimings?.aptitude?.questionsCount || 0} questions total, avg ${assessmentData.sectionTimings?.aptitude?.avgSecondsPerQuestion || 0}s per question)
- Big Five (Personality): ${assessmentData.sectionTimings?.bigfive?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.bigfive?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.bigfive?.avgSecondsPerQuestion || 0}s per question)
- Work Values: ${assessmentData.sectionTimings?.values?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.values?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.values?.avgSecondsPerQuestion || 0}s per question)
- Employability Skills: ${assessmentData.sectionTimings?.employability?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.employability?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.employability?.avgSecondsPerQuestion || 0}s per question)
- Knowledge Test: ${assessmentData.sectionTimings?.knowledge?.formatted || 'Not recorded'} of 30 minutes allowed (${assessmentData.sectionTimings?.knowledge?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.knowledge?.avgSecondsPerQuestion || 0}s per question)
- TOTAL ASSESSMENT TIME: ${assessmentData.sectionTimings?.totalFormatted || 'Not recorded'}

## TIMING ANALYSIS GUIDELINES:
- Fast responses (< 3 seconds/question) may indicate impulsive answering or high confidence
- Moderate responses (3-8 seconds/question) indicate thoughtful consideration
- Slow responses (> 10 seconds/question) may indicate careful deliberation or uncertainty
- Use timing patterns to inform your assessment of the student's decision-making style and confidence level
- Include timing insights in the personality and employability analysis where relevant

---

Analyze all responses and return ONLY a valid JSON object with this exact structure:

\`\`\`json
{
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "<Enjoyment pattern based on Interests>",
      "strength": "<Strength pattern based on Aptitude/Knowledge>",
      "workStyle": "<Work-style pattern based on Personality>",
      "motivation": "<Motivation pattern based on Values>"
    },
    "aptitudeStrengths": [
      {"name": "<Strength 1>", "percentile": "<Estimated Percentile>"},
      {"name": "<Strength 2>", "percentile": "<Estimated Percentile>"}
    ]
  },
  "riasec": {
    "scores": {
      "R": <TOTAL using scoring rules: 0 for responses 1-3, 1 for response 4, 2 for response 5>,
      "I": <TOTAL using scoring rules>,
      "A": <TOTAL using scoring rules>,
      "S": <TOTAL using scoring rules>,
      "E": <TOTAL using scoring rules>,
      "C": <TOTAL using scoring rules>
    },
    "maxScore": 20,
    "code": "<3-letter code formed by the 3 letters with HIGHEST scores, sorted from highest to lowest>",
    "topThree": ["<letter with HIGHEST score>", "<letter with 2nd HIGHEST score>", "<letter with 3rd HIGHEST score>"],
    "interpretation": "<2-3 sentence interpretation of their career interests>"
  },
  "aptitude": {
    "scores": {
      "verbal": { "correct": <number>, "total": 8, "percentage": <number 0-100> },
      "numerical": { "correct": <number>, "total": 8, "percentage": <number 0-100> },
      "abstract": { "correct": <number>, "total": 8, "percentage": <number 0-100> },
      "spatial": { "correct": <number>, "total": 6, "percentage": <number 0-100> },
      "clerical": { "correct": <number>, "total": 20, "percentage": <number 0-100> }
    },
    "overallScore": <percentage 0-100>,
    "topStrengths": ["<strongest aptitude domain>", "<second strongest>"],
    "areasToImprove": ["<weakest domain>"],
    "cognitiveProfile": "<2-3 sentence summary of cognitive strengths and how they relate to career paths>",
    "careerImplications": "<1-2 sentence insight on what careers suit this aptitude profile>"
  },
  "bigFive": {
    "O": <number 0-5>,
    "C": <number 0-5>,
    "E": <number 0-5>,
    "A": <number 0-5>,
    "N": <number 0-5>,
    "dominantTraits": ["<trait name>", "<trait name>"],
    "workStyleSummary": "<2-3 sentence summary of their work style>"
  },
  "workValues": {
    "scores": {
      "Security": <number 0-5>,
      "Autonomy": <number 0-5>,
      "Creativity": <number 0-5>,
      "Status": <number 0-5>,
      "Impact": <number 0-5>,
      "Financial": <number 0-5>,
      "Leadership": <number 0-5>,
      "Lifestyle": <number 0-5>
    },
    "topThree": [
      {"value": "<value name>", "score": <number>},
      {"value": "<value name>", "score": <number>},
      {"value": "<value name>", "score": <number>}
    ],
    "motivationSummary": "<2-3 sentence summary of what motivates them>"
  },
  "employability": {
    "skillScores": {
      "Communication": <number 0-5>,
      "Teamwork": <number 0-5>,
      "ProblemSolving": <number 0-5>,
      "Adaptability": <number 0-5>,
      "Leadership": <number 0-5>,
      "DigitalFluency": <number 0-5>,
      "Professionalism": <number 0-5>,
      "CareerReadiness": <number 0-5>
    },
    "sjtScore": <number 0-100>,
    "overallReadiness": "<High/Medium/Low>",
    "strengthAreas": ["<skill>", "<skill>"],
    "improvementAreas": ["<skill>", "<skill>"]
  },
  "knowledge": {
    "score": <percentage 0-100>,
    "correctCount": <number>,
    "totalQuestions": <number>,
    "strongTopics": ["<topic>", "<topic>"],
    "weakTopics": ["<topic>", "<topic>"],
    "recommendation": "<1-2 sentence study recommendation>"
  },
  "careerFit": {
    "clusters": [
      {
        "title": "<Cluster Name>",
        "fit": "<High/Medium/Explore>",
        "matchScore": <percentage 0-100>,
        "evidence": {
            "interest": "<Interest evidence>",
            "aptitude": "<Aptitude evidence>",
            "personality": "<Personality/values evidence>"
        },
        "roles": {
          "entry": ["<role 1>", "<role 2>"],
          "mid": ["<role 1>", "<role 2>"]
        },
        "domains": ["<domain 1>", "<domain 2>"]
      },
      {
        "title": "<Cluster 2 Name - REQUIRED>",
        "fit": "Medium",
        "matchScore": <percentage 70-85>,
        "evidence": {
            "interest": "<Interest evidence - REQUIRED>",
            "aptitude": "<Aptitude evidence - REQUIRED>",
            "personality": "<Personality evidence - REQUIRED>"
        },
        "roles": {
          "entry": ["<entry role 1 - REQUIRED>", "<entry role 2 - REQUIRED>"],
          "mid": ["<mid role 1 - REQUIRED>", "<mid role 2 - REQUIRED>"]
        },
        "domains": ["<domain 1 - REQUIRED>", "<domain 2 - REQUIRED>"]
      },
      {
        "title": "<Cluster 3 Name - REQUIRED>",
        "fit": "Explore",
        "matchScore": <percentage 60-75>,
        "evidence": {
            "interest": "<Interest evidence - REQUIRED>",
            "aptitude": "<Aptitude evidence - REQUIRED>",
            "personality": "<Personality evidence - REQUIRED>"
        },
        "roles": {
          "entry": ["<entry role 1 - REQUIRED>", "<entry role 2 - REQUIRED>"],
          "mid": ["<mid role 1 - REQUIRED>", "<mid role 2 - REQUIRED>"]
        },
        "domains": ["<domain 1 - REQUIRED>", "<domain 2 - REQUIRED>"]
      }
    ],
    "specificOptions": {
      "highFit": ["<role 1>", "<role 2>", "<role 3>"],
      "mediumFit": ["<role 1>", "<role 2>", "<role 3>"],
      "exploreLater": ["<role 1>", "<role 2>"]
    }
  },
  "skillGap": {
    "currentStrengths": ["<skill 1>", "<skill 2>", "<skill 3>"],
    "priorityA": [
      {
        "skill": "<Skill Name>",
        "currentLevel": <number 1-5>,
        "targetLevel": <number 1-5>,
        "whyNeeded": "<Reason linked to careers>",
        "howToBuild": "<Actionable step>"
      },
      {
        "skill": "<Skill Name>",
        "currentLevel": <number 1-5>,
        "targetLevel": <number 1-5>,
        "whyNeeded": "<Reason>",
        "howToBuild": "<Actionable step>"
      }
    ],
    "priorityB": [
      { "skill": "<Skill Name>" },
      { "skill": "<Skill Name>" }
    ],
    "learningTracks": [
      {
        "track": "<Track Name>",
        "suggestedIf": "<Condition>",
        "topics": "<Core topics/tools>"
      },
      {
        "track": "<Track Name>",
        "suggestedIf": "<Condition>",
        "topics": "<Core topics/tools>"
      }
    ],
    "recommendedTrack": "<One specific track name>"
  },
  "roadmap": {
    "projects": [
      {
        "title": "<Project Title>",
        "purpose": "<Purpose>",
        "output": "<Output/Portfolio Proof>"
      },
      {
        "title": "<Project Title>",
        "purpose": "<Purpose>",
        "output": "<Output/Portfolio Proof>"
      }
    ],
    "internship": {
      "types": ["<type 1>", "<type 2>"],
      "timeline": "<Target timeline>",
      "preparation": {
        "resume": "<Focus area>",
        "portfolio": "<Focus area>",
        "interview": "<Focus area>"
      }
    },
    "exposure": {
      "activities": ["<activity 1>", "<activity 2>"],
      "certifications": ["<cert 1>", "<cert 2>"]
    }
  },
  "finalNote": {
    "advantage": "<Biggest advantage>",
    "growthFocus": "<Top growth focus>",
    "nextReview": "<Suggested review time, e.g. End of 5th Sem>"
  },
  "timingAnalysis": {
    "overallPace": "<Fast/Moderate/Deliberate - based on average time per question across all sections>",
    "decisionStyle": "<Intuitive/Balanced/Analytical - inferred from timing patterns>",
    "confidenceIndicator": "<High/Medium/Low - based on response speed consistency>",
    "sectionInsights": {
      "riasec": "<Brief insight about their pace in interests section>",
      "personality": "<Brief insight about their pace in personality section>",
      "values": "<Brief insight about their pace in values section>",
      "employability": "<Brief insight about their pace in employability section>",
      "knowledge": "<Brief insight about their pace and time management in knowledge test>"
    },
    "recommendation": "<1-2 sentence recommendation based on timing patterns, e.g., 'Consider taking more time for self-reflection' or 'Good balance of speed and thoughtfulness'>"
  },
  "overallSummary": "<4-5 sentence comprehensive summary of the student's profile, strengths, and career potential. Include a brief mention of their assessment-taking style based on timing.>"
}
\`\`\`

CRITICAL REQUIREMENTS - YOU MUST FOLLOW ALL OF THESE:

## CONSISTENCY & DETERMINISM (MOST IMPORTANT):
- This analysis MUST be 100% DETERMINISTIC - same input = same output EVERY TIME
- DO NOT use any random or variable elements in your analysis
- All scores must be calculated using EXACT formulas from the data provided
- Career recommendations must follow a FIXED mapping based on calculated scores
- If the same assessment data is submitted multiple times, your response MUST be IDENTICAL
- Use the following deterministic rules for career matching:
  * Highest RIASEC score determines primary career cluster
  * Second highest determines secondary cluster
  * Third highest determines exploratory cluster

## APTITUDE STRENGTHS - INTERPRETATION RULES (MANDATORY):
- aptitudeStrengths should reflect the student's TOP 2 demonstrated strengths based on ALL assessment data
- Analyze the knowledge test performance, employability skills, and RIASEC interests holistically
- Choose strengths that are MOST EVIDENT from the data (e.g., high scores in specific areas)
- For percentiles: Use the actual score percentages from the relevant sections
- Be SPECIFIC - use concrete skill names like "Analytical Reasoning", "Technical Problem Solving", "Communication", "Logical Thinking", etc.
- The strengths should align with the student's stream and career direction
- IMPORTANT: Base your interpretation on the HIGHEST scoring areas in the assessment data

## SCORING RULES:

1. RIASEC SCORING: For each response, convert using: 1,2,3→0 points, 4→1 point, 5→2 points. Sum these converted scores for each type. Max score per type is 20.

2. RIASEC TOP THREE: Sort all 6 types (R,I,A,S,E,C) by their calculated scores in DESCENDING order. The "topThree" array MUST contain the 3 letters with the HIGHEST scores.

3. Calculate Big Five by averaging responses for each trait (O, C, E, A, N based on question ID prefixes). Each trait MUST have a numeric value 0-5. Round to 1 decimal place.

4. For knowledge score, count correct answers and calculate percentage. This must be EXACT.

## DATA COMPLETENESS (MANDATORY):

5. CAREER CLUSTERS - THIS IS ABSOLUTELY MANDATORY FOR ALL 3 CLUSTERS:
   - You MUST provide exactly 3 career clusters
   - EVERY SINGLE CLUSTER (cluster 1, 2, AND 3) MUST have ALL fields filled:
     * title: A specific career cluster name
     * fit: "High" for cluster 1, "Medium" for cluster 2, "Explore" for cluster 3
     * matchScore: cluster 1: 80-95%, cluster 2: 70-85%, cluster 3: 60-75%
     * evidence.interest: Specific interest-based reason (NOT empty)
     * evidence.aptitude: Specific aptitude-based reason (NOT empty)
     * evidence.personality: Specific personality-based reason (NOT empty)
     * roles.entry: MUST have 2+ entry-level job titles (e.g., ["Junior Developer", "Associate Analyst"])
     * roles.mid: MUST have 2+ mid-level job titles (e.g., ["Senior Developer", "Team Lead"])
     * domains: MUST have 2+ industry domains (e.g., ["Technology", "Finance", "Healthcare"])
   - CRITICAL: NO EMPTY ARRAYS! Every cluster needs roles.entry, roles.mid, and domains filled!
   - If you leave any roles or domains empty, the report will be incomplete!

6. SKILL GAP - MANDATORY:
   - priorityA: Must have at least 2 skills with all fields (skill, currentLevel, targetLevel, whyNeeded, howToBuild)
   - priorityB: Must have at least 2 skills
   - learningTracks: Must have at least 2 tracks with all fields

7. ROADMAP - MANDATORY:
   - projects: Must have at least 2 projects with title, purpose, and output
   - internship.types: Must have at least 2 internship types
   - internship.preparation: Must have resume, portfolio, and interview fields filled
   - exposure.activities: Must have at least 2 activities
   - exposure.certifications: Must have at least 2 certifications

8. Be specific to their stream (${assessmentData.stream}) when recommending careers, roles, and skills.

9. Provide actionable, encouraging, and SPECIFIC career guidance - avoid generic responses.

10. ALL arrays must contain actual data - NO empty arrays allowed!`;
};

async function handleAnalyzeAssessment(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Authentication
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { user } = auth;
  const studentId = user.id;

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  let body;
  try {
    body = await request.json() as { assessmentData: any };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { assessmentData } = body;

  if (!assessmentData) {
    return jsonResponse({ error: 'Assessment data is required' }, 400);
  }

  const prompt = buildAnalysisPrompt(assessmentData);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.VITE_SUPABASE_URL || '',
        'X-Title': 'Assessment Analyzer'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor and psychometric analyst. You provide detailed, deterministic, and consistent career analysis based on assessment data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 8192
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI ERROR]', response.status, errorText);
      return jsonResponse({ error: `AI service error: ${response.status}` }, 500);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: 'Empty response from AI' }, 500);
    }

    // Clean up response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return jsonResponse({ error: 'Invalid response format from AI' }, 500);
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    let parsedResults;

    try {
      parsedResults = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      return jsonResponse({ error: 'Failed to parse AI response' }, 500);
    }

    return jsonResponse({ success: true, data: parsedResults });

  } catch (error) {
    console.error('Assessment analysis error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

// ==================== HANDLER: PARSE RESUME ====================

async function handleParseResume(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Authentication
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { user } = auth;
  const studentId = user.id;

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  let body;
  try {
    body = await request.json() as { resumeText: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { resumeText } = body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.length < 50) {
    return jsonResponse({ error: 'Valid resume text is required' }, 400);
  }

  const prompt = `Extract information from this resume and return ONLY a valid JSON object.

CRITICAL RULES:
- name: Extract ONLY the person's full name (2-4 words)
- DO NOT dump entire resume text into any single field
- Parse each section into separate array items with unique IDs
- Return ONLY the JSON object, no markdown formatting or backticks

Return ONLY the JSON object with this structure:
{
  "name": "",
  "email": "",
  "contact_number": "",
  "college_school_name": "",
  "university": "",
  "branch_field": "",
  "education": [{"id": 1, "degree": "", "department": "", "university": "", "yearOfPassing": "", "cgpa": "", "level": "Bachelor's", "status": "completed"}],
  "experience": [{"id": 1, "organization": "", "role": "", "duration": "", "description": "", "verified": false}],
  "projects": [{"id": 1, "title": "", "description": "", "technologies": [], "link": "", "status": "Completed"}],
  "technicalSkills": [{"id": 1, "name": "", "category": "", "level": 3, "verified": false}],
  "softSkills": [{"id": 1, "name": "", "level": 3}],
  "certificates": [{"id": 1, "title": "", "issuer": "", "issuedOn": "", "credentialId": "", "link": ""}],
  "training": []
}

Resume Text:
"""
${resumeText.slice(0, 15000)}
"""
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.VITE_SUPABASE_URL || '',
        'X-Title': 'Resume Parser'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume parser. You extract structured data from resume text with high accuracy. You always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI ERROR]', response.status, errorText);
      return jsonResponse({ error: `AI service error: ${response.status}` }, 500);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: 'Empty response from AI' }, 500);
    }

    // Clean up response (remove markdown code blocks if present)
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      return jsonResponse({ error: 'Failed to parse AI response' }, 500);
    }

    return jsonResponse({ success: true, data: parsedData });

  } catch (error) {
    console.error('Resume parsing error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}


// ==================== MAIN HANDLER ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Validate environment
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    try {
      // Route requests
      if (path === '/chat' || path === '/career-ai-chat') {
        if (!env.VITE_OPENROUTER_API_KEY) {
          return jsonResponse({ error: 'AI service not configured' }, 500);
        }
        return await handleCareerChat(request, env);
      }

      if (path === '/recommend-opportunities' || path === '/recommend') {
        return await handleRecommendOpportunities(request, env);
      }

      if (path === '/generate-embedding') {
        return await handleGenerateEmbedding(request, env);
      }

      if (path === '/parse-resume') {
        if (!env.VITE_OPENROUTER_API_KEY) {
          return jsonResponse({ error: 'AI service not configured' }, 500);
        }
        return await handleParseResume(request, env);
      }

      if (path === '/analyze-assessment') {
        if (!env.VITE_OPENROUTER_API_KEY) {
          return jsonResponse({ error: 'AI service not configured' }, 500);
        }
        return await handleAnalyzeAssessment(request, env);
      }

      // Health check
      if (path === '/health' || path === '/') {
        return jsonResponse({
          status: 'ok',
          service: 'career-api',
          endpoints: ['/chat', '/recommend-opportunities', '/generate-embedding', '/parse-resume', '/analyze-assessment'],
          timestamp: new Date().toISOString()
        });
      }

      return jsonResponse({ error: 'Not found', availableEndpoints: ['/chat', '/recommend-opportunities', '/generate-embedding', '/parse-resume', '/analyze-assessment'] }, 404);

    } catch (error) {
      console.error('[ERROR] career-api:', error);
      return jsonResponse({ error: (error as Error)?.message || 'Internal server error' }, 500);
    }
  }
};

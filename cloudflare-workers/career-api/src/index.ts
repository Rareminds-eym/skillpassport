/**
 * Career API Cloudflare Worker
 * Handles career guidance features:
 * - /chat - Career AI chat with streaming
 * - /recommend-opportunities - Get job recommendations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
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
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
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
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.SUPABASE_URL || '',
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
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

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
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

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
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    try {
      // Route requests
      if (path === '/chat' || path === '/career-ai-chat') {
        if (!env.OPENROUTER_API_KEY) {
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

      // Health check
      if (path === '/health' || path === '/') {
        return jsonResponse({
          status: 'ok',
          service: 'career-api',
          endpoints: ['/chat', '/recommend-opportunities', '/generate-embedding'],
          timestamp: new Date().toISOString()
        });
      }

      return jsonResponse({ error: 'Not found', availableEndpoints: ['/chat', '/recommend-opportunities', '/generate-embedding'] }, 404);

    } catch (error) {
      console.error('[ERROR] career-api:', error);
      return jsonResponse({ error: (error as Error)?.message || 'Internal server error' }, 500);
    }
  }
};

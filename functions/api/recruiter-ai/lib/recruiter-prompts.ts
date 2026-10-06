/**
 * Recruiter copilot prompt builders (server copy).
 *
 * Verbatim ports of the LLM layer-3 classification prompt
 * (`advancedIntentClassifier.llmBasedClassification`) and the query-parsing
 * prompt (`queryParser.buildParsingPrompt`) from
 * `src/features/recruiter-copilot/api/`. Analysis/general prompts are
 * assembled browser-side from already-fetched data using the unchanged
 * application templates and executed through the `analyze` / `respond` ops
 * below with server-fixed models and budgets.
 */

export interface Layer3Classification {
  primary: string;
  confidence: number;
}

export function buildLayer3ClassifyPrompt(query: string, conversationHistory: Array<{ query?: string; intent?: string }>): {
  system: string;
  user: string;
} {
  const historyContext =
    conversationHistory.length > 0
      ? `\n\nPrevious conversation:\n${conversationHistory
          .slice(-3)
          .map((h) => `User: ${(h.query ?? '').toString().slice(0, 500)}\nIntent: ${(h.intent ?? '').toString().slice(0, 60)}`)
          .join('\n')}`
      : '';
  return {
    system: 'You are an expert at understanding recruiter intent. Always respond with valid JSON only.',
    user: `Classify this recruiter query into the most appropriate intent.

Available intents:
- hiring-decision: Getting AI recommendation on which applicant to hire from current applications
- opportunity-applications: Viewing candidates who ALREADY applied to recruiter's job opportunities/openings (e.g., "who applied to my jobs?", "show applications")
- job-matching: Finding/recommending candidates FOR specific job positions/roles (e.g., "candidates for my position", "match to role", "top candidates for my jobs")
- hiring-recommendations: Getting AI analysis on which candidates are READY TO HIRE NOW (based on profile quality, skills)
- candidate-search: Finding or searching for NEW candidates based on skills, experience, or other criteria (e.g., "find React developers")
- talent-pool-analytics: Analytics about the overall talent pool
- skill-insights: Understanding skill distribution and gaps
- market-trends: Market intelligence and competitive landscape
- interview-guidance: Interview tips and assessment strategies
- candidate-assessment: Evaluating or comparing specific candidates
- pipeline-review: Reviewing recruitment pipeline status
- general: General questions or unclear queries

CRITICAL RULES (follow these EXACTLY):
- If query asks "who should I HIRE FOR [position]" or "hire for [role]" → use "job-matching" (finding candidates FOR a position)
- If query asks "candidates FOR my positions/jobs/roles" or "top candidates FOR [role]" → use "job-matching" NOT "opportunity-applications"
- If query asks "who APPLIED to my jobs" or "show applications" → use "opportunity-applications"
- If query contains "Find [SKILL] developers/engineers" (e.g., "Find React developers") → use "candidate-search"
- If query asks "ready to hire", "hire now", "who is hire-ready" → use "hiring-recommendations"
- If query asks "suggest who to hire FROM applicants", "recommend from applied", "which applicant", "best from applied" → use "hiring-decision"
- "job-matching" = finding/matching candidates FOR a specific position
- "hiring-decision" = choosing BETWEEN existing applicants
- "opportunity-applications" = viewing who applied TO positions (backward)

Query: "${query.slice(0, 2000)}"${historyContext}

Respond with ONLY a JSON object in this exact format:
{
  "primary": "intent-name",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`,
  };
}

export function parseLayer3Result(raw: string): Layer3Classification {
  let jsonContent = raw.trim();
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
  }
  const parsed = JSON.parse(jsonContent) as { primary?: string; confidence?: number };
  if (!parsed.primary || typeof parsed.primary !== 'string') {
    throw new Error('Invalid classification result');
  }
  return { primary: parsed.primary, confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7 };
}

export function buildParsePrompt(query: string): { system: string; user: string } {
  return {
    system:
      'You are an expert at extracting structured recruitment criteria from natural language. Always respond with valid JSON only.',
    user: `Extract recruitment criteria from this query. Return ONLY valid JSON with these fields:

{
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill3"],
  "experience_level": "fresher|junior|mid|senior|any",
  "experience_years_min": 0,
  "experience_years_max": 5,
  "education_level": "string or null",
  "specific_institutions": ["IIT", "NIT"],
  "locations": ["Bangalore", "Remote"],
  "work_mode": "remote|onsite|hybrid|any",
  "employment_type": "full-time|part-time|internship|contract|null",
  "job_role": "Software Engineer",
  "department": "Engineering",
  "min_cgpa": 7.5,
  "availability": "immediate|within_month|flexible|null",
  "has_certifications": true,
  "has_training": true,
  "has_projects": true,
  "min_projects": 2,
  "intent": "search|match_to_job|analyze_pool|compare|recommend",
  "urgency": "high|medium|low",
  "confidence_score": 0.85
}

IMPORTANT: This system works for ALL DOMAINS (Tech, Medical, HR, Mechanical, etc.)

EXAMPLE ROLE-TO-SKILLS MAPPINGS:

TECH:
- "Full Stack Developer" → ["JavaScript", "React", "Node.js", "SQL"]
- "Data Scientist" → ["Python", "Machine Learning", "SQL"]
- "DevOps Engineer" → ["Docker", "Kubernetes", "AWS"]

MEDICAL:
- "Cardiac Surgeon" → ["Cardiac Surgery", "Critical Care", "MBBS", "MS/MCh"]
- "Radiologist" → ["Radiology", "Medical Imaging", "MBBS", "MD"]
- "Nurse" → ["Patient Care", "Medical Procedures", "BSc Nursing"]

HR:
- "HR Manager" → ["Recruitment", "Employee Relations", "HR Management"]
- "Talent Acquisition" → ["Recruitment", "Sourcing", "Interviewing"]

MECHANICAL:
- "Mechanical Engineer" → ["AutoCAD", "SolidWorks", "Mechanical Design"]
- "CAD Designer" → ["AutoCAD", "CATIA", "3D Modeling"]

FINANCE:
- "Financial Analyst" → ["Financial Modeling", "Excel", "Data Analysis"]
- "Accountant" → ["Accounting", "Tally", "GST", "Tax Filing"]

CRITICAL EXAMPLES FOR INSTITUTION FILTERING:
- "top universities" → specific_institutions: ["IIT", "NIT", "IIIT", "BITS"]
- "tier-1 colleges" → specific_institutions: ["IIT", "NIT", "IIIT", "BITS"]
- "premier institutions" → specific_institutions: ["IIT", "NIT", "IIIT", "BITS"]
- "IIT learners" → specific_institutions: ["IIT"]
- "from NIT" → specific_institutions: ["NIT"]
- "IIT Delhi, NIT Trichy" → specific_institutions: ["IIT Delhi", "NIT Trichy"]

RULES:
- If query mentions a ROLE (like "full stack developer"), extract the role AND add relevant skills
- Extract skills as specific as possible (React, Python, AWS, etc.)
- **IMPORTANT: If query says "top universities", "tier-1", "premier", "elite colleges", MUST set specific_institutions to ["IIT", "NIT", "IIIT", "BITS"]**
- If specific college names mentioned, extract exact names in specific_institutions
- Infer experience level from context (e.g., "freshers" = "fresher", "5+ years" = "senior")
- Detect urgency from words like "urgent", "asap", "immediately"
- If query mentions "applicants", "who applied", "applications", set intent to "recommend"
- Use null for missing information, don't guess
- Confidence score: how confident you are in extraction (0.0 to 1.0)

QUERY: "${query.slice(0, 2000)}"

Respond with JSON only:`,
  };
}

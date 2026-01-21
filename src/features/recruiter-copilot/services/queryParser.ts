import OpenAI from 'openai';

/**
 * Advanced Query Parser for Recruiter AI
 * Uses LLM to extract structured information from natural language queries
 *
 * Extracts:
 * - Skills (required & preferred)
 * - Experience level
 * - Location preferences
 * - Education requirements
 * - Employment type
 * - Query intent and context
 */

export interface ParsedRecruiterQuery {
  // Core requirements
  required_skills: string[];
  preferred_skills: string[];

  // Experience & Education
  experience_level: 'fresher' | 'junior' | 'mid' | 'senior' | 'any';
  experience_years_min?: number;
  experience_years_max?: number;
  education_level?: string;
  specific_institutions?: string[];

  // Location & Mode
  locations: string[];
  work_mode?: 'remote' | 'onsite' | 'hybrid' | 'any';

  // Job details
  employment_type?: 'full-time' | 'part-time' | 'internship' | 'contract';
  job_role?: string;
  department?: string;

  // Filters & Criteria
  min_cgpa?: number;
  availability?: 'immediate' | 'within_month' | 'flexible';
  has_certifications?: boolean;
  has_training?: boolean;
  has_projects?: boolean;
  min_projects?: number;

  // Contextual understanding
  intent: 'search' | 'match_to_job' | 'analyze_pool' | 'compare' | 'recommend';
  urgency: 'high' | 'medium' | 'low';
  specific_opportunity_id?: number;

  // Original query for reference
  original_query: string;
  confidence_score: number;
}

class QueryParserService {
  private openaiClient: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.openaiClient) {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      this.openaiClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        defaultHeaders: {
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'SkillPassport Query Parser',
        },
        dangerouslyAllowBrowser: true,
      });
    }
    return this.openaiClient;
  }

  /**
   * Parse recruiter query into structured format using AI
   */
  async parseQuery(query: string): Promise<ParsedRecruiterQuery> {
    try {
      const prompt = this.buildParsingPrompt(query);
      const client = this.getClient();

      const response = await client.chat.completions.create({
        model: 'nvidia/nemotron-nano-12b-v2-vl:free',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at extracting structured recruitment criteria from natural language. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return this.getFallbackParsing(query);
      }

      // Parse JSON response
      const parsed = JSON.parse(content);

      console.log('✅ AI Parser Result:', parsed);

      const result = {
        ...this.getDefaultParsing(query),
        ...parsed,
        original_query: query,
      };

      // Post-processing: Catch missing institution filters that AI missed
      const queryLower = query.toLowerCase();
      if (!result.specific_institutions || result.specific_institutions.length === 0) {
        if (
          queryLower.includes('top universit') ||
          queryLower.includes('tier-1') ||
          queryLower.includes('tier 1') ||
          queryLower.includes('premier') ||
          queryLower.includes('elite')
        ) {
          result.specific_institutions = ['IIT', 'NIT', 'IIIT', 'BITS'];
          console.log('🔧 Post-processing: Added top universities filter');
        } else if (queryLower.includes('iit')) {
          result.specific_institutions = ['IIT'];
          console.log('🔧 Post-processing: Added IIT filter');
        } else if (queryLower.includes('nit')) {
          result.specific_institutions = ['NIT'];
          console.log('🔧 Post-processing: Added NIT filter');
        }
      }

      console.log('📦 Final Parsed Query:', result);
      return result;
    } catch (error) {
      console.error('Query parsing error:', error);
      return this.getFallbackParsing(query);
    }
  }

  /**
   * Build comprehensive parsing prompt
   */
  private buildParsingPrompt(query: string): string {
    return `Extract recruitment criteria from this query. Return ONLY valid JSON with these fields:

{
  "required_skills": ["skill1", "skill2"],  // Must-have technical/professional skills
  "preferred_skills": ["skill3"],           // Nice-to-have skills
  "experience_level": "fresher|junior|mid|senior|any",
  "experience_years_min": 0,                // Number or null
  "experience_years_max": 5,                // Number or null
  "education_level": "string or null",      // e.g., "Bachelor's", "Master's"
  "specific_institutions": ["IIT", "NIT"],  // Specific colleges/universities
  "locations": ["Bangalore", "Remote"],     // Cities or "Remote"
  "work_mode": "remote|onsite|hybrid|any",
  "employment_type": "full-time|part-time|internship|contract|null",
  "job_role": "Software Engineer",          // Role title if mentioned
  "department": "Engineering",              // Department if mentioned
  "min_cgpa": 7.5,                          // Number or null
  "availability": "immediate|within_month|flexible|null",
  "has_certifications": true,               // Boolean or null
  "has_training": true,                     // Boolean or null
  "has_projects": true,                     // Boolean or null
  "min_projects": 2,                        // Number or null
  "intent": "search|match_to_job|analyze_pool|compare|recommend",
  "urgency": "high|medium|low",
  "confidence_score": 0.85                  // Your confidence (0-1)
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
- "IIT students" → specific_institutions: ["IIT"]
- "from NIT" → specific_institutions: ["NIT"]
- "IIT Delhi, NIT Trichy" → specific_institutions: ["IIT Delhi", "NIT Trichy"]

RULES:
- If query mentions a ROLE (like "full stack developer"), extract the role AND add relevant skills
- Extract skills as specific as possible (React, Python, AWS, etc.)
- For generic roles, add common related skills to improve search results
- **IMPORTANT: If query says "top universities", "tier-1", "premier", "elite colleges", MUST set specific_institutions to ["IIT", "NIT", "IIIT", "BITS"]**
- If specific college names mentioned, extract exact names in specific_institutions
- Infer experience level from context (e.g., "freshers" = "fresher", "5+ years" = "senior")
- Detect urgency from words like "urgent", "asap", "immediately"
- Set intent based on query type:
  * "search" - finding/looking for candidates (when looking for NEW candidates)
  * "match_to_job" - matching to specific role/opportunity
  * "analyze_pool" - analytics/insights request
  * "compare" - comparing candidates
  * "recommend" - asking for recommendations from APPLICANTS/APPLIED candidates
- If query mentions "applicants", "who applied", "applications", set intent to "recommend"
- Use null for missing information, don't guess
- Confidence score: how confident you are in extraction (0.0 to 1.0)

QUERY: "${query}"

Respond with JSON only:`;
  }

  /**
   * Fallback parsing using simple pattern matching
   */
  private getFallbackParsing(query: string): ParsedRecruiterQuery {
    const queryLower = query.toLowerCase();

    // Role-to-skills mapping
    const roleToSkills: Record<string, string[]> = {
      'full stack developer': ['JavaScript', 'React', 'Node.js', 'SQL'],
      'fullstack developer': ['JavaScript', 'React', 'Node.js', 'SQL'],
      'full-stack developer': ['JavaScript', 'React', 'Node.js', 'SQL'],
      'frontend developer': ['React', 'JavaScript', 'HTML', 'CSS'],
      'front-end developer': ['React', 'JavaScript', 'HTML', 'CSS'],
      'backend developer': ['Node.js', 'Python', 'Java', 'SQL'],
      'back-end developer': ['Node.js', 'Python', 'Java', 'SQL'],
      'python developer': ['Python'],
      'react developer': ['React', 'JavaScript'],
      'java developer': ['Java', 'Spring'],
      'data scientist': ['Python', 'Machine Learning', 'SQL'],
      'devops engineer': ['Docker', 'Kubernetes', 'AWS'],
      'ml engineer': ['Python', 'Machine Learning', 'TensorFlow'],
    };

    // Check if query contains a role
    let foundSkills: string[] = [];
    let job_role: string | undefined;

    for (const [role, skills] of Object.entries(roleToSkills)) {
      if (queryLower.includes(role)) {
        foundSkills = skills;
        job_role = role
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        console.log(`🎯 Detected role: ${job_role}, mapped to skills:`, skills);
        break;
      }
    }

    // If no role matched, extract skills directly
    if (foundSkills.length === 0) {
      const commonSkills = [
        'react',
        'angular',
        'vue',
        'javascript',
        'typescript',
        'python',
        'java',
        'node.js',
        'nodejs',
        'django',
        'flask',
        'spring',
        'sql',
        'mongodb',
        'aws',
        'azure',
        'gcp',
        'docker',
        'kubernetes',
        'git',
        'machine learning',
        'ml',
        'ai',
        'data science',
        'analytics',
        'html',
        'css',
        'tailwind',
        'backend',
        'frontend',
        'devops',
      ];

      foundSkills = commonSkills.filter((skill) => queryLower.includes(skill.toLowerCase()));
    }

    // Detect experience level
    let experience_level: ParsedRecruiterQuery['experience_level'] = 'any';
    if (
      queryLower.includes('fresher') ||
      queryLower.includes('entry level') ||
      queryLower.includes('graduate')
    ) {
      experience_level = 'fresher';
    } else if (
      queryLower.includes('junior') ||
      queryLower.includes('1-2 year') ||
      queryLower.includes('0-2 year')
    ) {
      experience_level = 'junior';
    } else if (
      queryLower.includes('senior') ||
      queryLower.includes('5+ year') ||
      queryLower.includes('lead')
    ) {
      experience_level = 'senior';
    } else if (queryLower.includes('mid-level') || queryLower.includes('2-5 year')) {
      experience_level = 'mid';
    }

    // Detect intent
    let intent: ParsedRecruiterQuery['intent'] = 'search';
    if (queryLower.includes('match') || queryLower.includes('for this role')) {
      intent = 'match_to_job';
    } else if (
      queryLower.includes('analytics') ||
      queryLower.includes('overview') ||
      queryLower.includes('stats')
    ) {
      intent = 'analyze_pool';
    } else if (queryLower.includes('compare') || queryLower.includes('versus')) {
      intent = 'compare';
    } else if (
      queryLower.includes('recommend') ||
      queryLower.includes('suggest') ||
      queryLower.includes('best')
    ) {
      intent = 'recommend';
    }

    // Detect urgency
    let urgency: ParsedRecruiterQuery['urgency'] = 'medium';
    if (
      queryLower.includes('urgent') ||
      queryLower.includes('asap') ||
      queryLower.includes('immediate')
    ) {
      urgency = 'high';
    }

    // Detect CGPA requirements
    let min_cgpa: number | undefined;
    const cgpaMatch = queryLower.match(/(\d+\.?\d*)\s*\+?\s*(cgpa|gpa)/i);
    if (cgpaMatch) {
      min_cgpa = parseFloat(cgpaMatch[1]);
    } else if (queryLower.includes('good cgpa') || queryLower.includes('high cgpa')) {
      min_cgpa = 7.5;
    } else if (queryLower.includes('excellent')) {
      min_cgpa = 8.5;
    }

    // Detect locations
    const commonLocations = [
      'bangalore',
      'bengaluru',
      'mumbai',
      'delhi',
      'hyderabad',
      'pune',
      'chennai',
      'kolkata',
      'ahmedabad',
      'gurugram',
      'gurgaon',
      'noida',
      'remote',
      'work from home',
      'wfh',
    ];

    const foundLocations = commonLocations
      .filter((loc) => queryLower.includes(loc))
      .map((loc) => {
        // Normalize location names
        if (loc === 'bengaluru') return 'Bangalore';
        if (loc === 'gurgaon') return 'Gurugram';
        if (loc === 'work from home' || loc === 'wfh') return 'Remote';
        return loc.charAt(0).toUpperCase() + loc.slice(1);
      });

    // Detect top universities/institutions
    let specific_institutions: string[] | undefined;
    if (
      queryLower.includes('top universit') ||
      queryLower.includes('tier-1') ||
      queryLower.includes('tier 1') ||
      queryLower.includes('premier') ||
      queryLower.includes('elite')
    ) {
      specific_institutions = ['IIT', 'NIT', 'IIIT', 'BITS'];
      console.log('🏛️ Detected top universities filter:', specific_institutions);
    }
    // Detect specific institutions
    else if (queryLower.includes('iit')) {
      specific_institutions = ['IIT'];
    } else if (queryLower.includes('nit')) {
      specific_institutions = ['NIT'];
    }

    return {
      required_skills: foundSkills,
      preferred_skills: [],
      experience_level,
      locations: foundLocations,
      min_cgpa,
      specific_institutions,
      job_role,
      intent,
      urgency,
      original_query: query,
      confidence_score: foundSkills.length > 0 ? 0.8 : 0.6,
    };
  }

  /**
   * Get default structure with null values
   */
  private getDefaultParsing(query: string): ParsedRecruiterQuery {
    return {
      required_skills: [],
      preferred_skills: [],
      experience_level: 'any',
      locations: [],
      intent: 'search',
      urgency: 'medium',
      original_query: query,
      confidence_score: 0.5,
    };
  }

  /**
   * Validate and enrich parsed query with contextual intelligence
   */
  enrichParsedQuery(
    parsed: ParsedRecruiterQuery,
    context: {
      recent_opportunities?: any[];
      company_focus?: string[];
    }
  ): ParsedRecruiterQuery {
    // Add skill synonyms and related technologies
    const enrichedSkills = this.expandSkills(parsed.required_skills);

    // Infer missing details from context
    if (!parsed.department && context.company_focus && context.company_focus.length > 0) {
      parsed.department = context.company_focus[0];
    }

    return {
      ...parsed,
      required_skills: enrichedSkills,
    };
  }

  /**
   * Expand skills with synonyms and related technologies
   */
  private expandSkills(skills: string[]): string[] {
    const skillMap: Record<string, string[]> = {
      react: ['React', 'ReactJS', 'React.js'],
      node: ['Node.js', 'NodeJS', 'Node'],
      python: ['Python'],
      javascript: ['JavaScript', 'JS'],
      typescript: ['TypeScript', 'TS'],
      ml: ['Machine Learning', 'ML'],
      ai: ['Artificial Intelligence', 'AI'],
    };

    const expanded = new Set<string>();
    skills.forEach((skill) => {
      const key = skill.toLowerCase();
      const matches = skillMap[key] || [skill];
      matches.forEach((m) => expanded.add(m));
    });

    return Array.from(expanded);
  }
}

export const queryParser = new QueryParserService();

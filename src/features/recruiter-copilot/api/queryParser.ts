import { ssoClient } from '@/shared/api/ssoClient';

/**
 * Advanced Query Parser for Recruiter AI
 * Structured extraction runs server-side (Cloudflare Workers AI) via the
 * authenticated recruiter-ai endpoint. Merging, defaults and fallbacks below
 * are unchanged.
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
  private endpointPromise: Promise<string> | null = null;

  private async getEndpoint(): Promise<string> {
    if (!this.endpointPromise) {
      this.endpointPromise = import('@/shared/api/apiUtils').then(({ getApiUrl }) => getApiUrl('recruiter-ai/chat'));
    }
    return this.endpointPromise;
  }

  /**
   * Parse recruiter query into structured format using AI
   */
  async parseQuery(query: string): Promise<ParsedRecruiterQuery> {
    try {
      const url = await this.getEndpoint();
      const response = await ssoClient.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'parse', query }),
      });
      if (!response.ok) {
        return this.getFallbackParsing(query);
      }
      const json = (await response.json()) as { success: boolean; data: { text: string } };
      const content = json.data?.text?.trim();
      if (!content) {
        return this.getFallbackParsing(query);
      }

      // Parse JSON response
      const parsed = JSON.parse(content);
      
        
      let result = {
        ...this.getDefaultParsing(query),
        ...parsed,
        original_query: query
      };
      
      // Post-processing: Catch missing institution filters that AI missed
      const queryLower = query.toLowerCase();
      if (!result.specific_institutions || result.specific_institutions.length === 0) {
        if (queryLower.includes('top universit') || 
            queryLower.includes('tier-1') || 
            queryLower.includes('tier 1') ||
            queryLower.includes('premier') ||
            queryLower.includes('elite')) {
          result.specific_institutions = ['IIT', 'NIT', 'IIIT', 'BITS'];
            } else if (queryLower.includes('iit')) {
          result.specific_institutions = ['IIT'];
            } else if (queryLower.includes('nit')) {
          result.specific_institutions = ['NIT'];
            }
      }
      
        return result;

    } catch (error) {
      // Error handled
      return this.getFallbackParsing(query);
    }
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
        job_role = role.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          break;
      }
    }
    
    // If no role matched, extract skills directly
    if (foundSkills.length === 0) {
      const commonSkills = [
        'react', 'angular', 'vue', 'javascript', 'typescript', 'python', 'java',
        'node.js', 'nodejs', 'django', 'flask', 'spring', 'sql', 'mongodb',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'machine learning',
        'ml', 'ai', 'data science', 'analytics', 'html', 'css', 'tailwind',
        'backend', 'frontend', 'devops'
      ];
      
      foundSkills = commonSkills.filter(skill => 
        queryLower.includes(skill.toLowerCase())
      );
    }

    // Detect experience level
    let experience_level: ParsedRecruiterQuery['experience_level'] = 'any';
    if (queryLower.includes('fresher') || queryLower.includes('entry level') || queryLower.includes('graduate')) {
      experience_level = 'fresher';
    } else if (queryLower.includes('junior') || queryLower.includes('1-2 year') || queryLower.includes('0-2 year')) {
      experience_level = 'junior';
    } else if (queryLower.includes('senior') || queryLower.includes('5+ year') || queryLower.includes('lead')) {
      experience_level = 'senior';
    } else if (queryLower.includes('mid-level') || queryLower.includes('2-5 year')) {
      experience_level = 'mid';
    }

    // Detect intent
    let intent: ParsedRecruiterQuery['intent'] = 'search';
    if (queryLower.includes('match') || queryLower.includes('for this role')) {
      intent = 'match_to_job';
    } else if (queryLower.includes('analytics') || queryLower.includes('overview') || queryLower.includes('stats')) {
      intent = 'analyze_pool';
    } else if (queryLower.includes('compare') || queryLower.includes('versus')) {
      intent = 'compare';
    } else if (queryLower.includes('recommend') || queryLower.includes('suggest') || queryLower.includes('best')) {
      intent = 'recommend';
    }

    // Detect urgency
    let urgency: ParsedRecruiterQuery['urgency'] = 'medium';
    if (queryLower.includes('urgent') || queryLower.includes('asap') || queryLower.includes('immediate')) {
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
      'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'pune',
      'chennai', 'kolkata', 'ahmedabad', 'gurugram', 'gurgaon', 'noida',
      'remote', 'work from home', 'wfh'
    ];
    
    const foundLocations = commonLocations.filter(loc => 
      queryLower.includes(loc)
    ).map(loc => {
      // Normalize location names
      if (loc === 'bengaluru') return 'Bangalore';
      if (loc === 'gurgaon') return 'Gurugram';
      if (loc === 'work from home' || loc === 'wfh') return 'Remote';
      return loc.charAt(0).toUpperCase() + loc.slice(1);
    });

    // Detect top universities/institutions
    let specific_institutions: string[] | undefined;
    if (queryLower.includes('top universit') || 
        queryLower.includes('tier-1') || 
        queryLower.includes('tier 1') ||
        queryLower.includes('premier') ||
        queryLower.includes('elite')) {
      specific_institutions = ['IIT', 'NIT', 'IIIT', 'BITS'];
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
      confidence_score: foundSkills.length > 0 ? 0.8 : 0.6
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
      confidence_score: 0.5
    };
  }

  /**
   * Validate and enrich parsed query with contextual intelligence
   */
  enrichParsedQuery(parsed: ParsedRecruiterQuery, context: {
    recent_opportunities?: any[];
    company_focus?: string[];
  }): ParsedRecruiterQuery {
    // Add skill synonyms and related technologies
    const enrichedSkills = this.expandSkills(parsed.required_skills);
    
    // Infer missing details from context
    if (!parsed.department && context.company_focus && context.company_focus.length > 0) {
      parsed.department = context.company_focus[0];
    }

    return {
      ...parsed,
      required_skills: enrichedSkills
    };
  }

  /**
   * Expand skills with synonyms and related technologies
   */
  private expandSkills(skills: string[]): string[] {
    const skillMap: Record<string, string[]> = {
      'react': ['React', 'ReactJS', 'React.js'],
      'node': ['Node.js', 'NodeJS', 'Node'],
      'python': ['Python'],
      'javascript': ['JavaScript', 'JS'],
      'typescript': ['TypeScript', 'TS'],
      'ml': ['Machine Learning', 'ML'],
      'ai': ['Artificial Intelligence', 'AI'],
    };

    const expanded = new Set<string>();
    skills.forEach(skill => {
      const key = skill.toLowerCase();
      const matches = skillMap[key] || [skill];
      matches.forEach(m => expanded.add(m));
    });

    return Array.from(expanded);
  }
}

export const queryParser = new QueryParserService();

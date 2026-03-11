/**
 * Resume Parser Service
 * Handles parsing resumes using Claude AI
 */

import { getLogger } from '../config/logging';

const logger = getLogger('resume-parser');

// Type definitions
interface Education {
  id?: string;
  level?: string;
  degree?: string;
  department?: string;
  university?: string;
  yearOfPassing?: string;
  cgpa?: string;
  status?: string;
}

interface Experience {
  id?: string;
  organization?: string;
  role?: string;
  duration?: string;
  verified?: boolean;
}

interface Skill {
  id?: string;
  name?: string;
  level?: number;
  category?: string;
  description?: string;
  type?: string;
  verified?: boolean;
}

interface Certificate {
  id?: string;
  title?: string;
  issuer?: string;
  level?: string;
  credentialId?: string;
  link?: string;
  issuedOn?: string | null;
  description?: string;
  status?: string;
}

interface Project {
  id?: string;
  title?: string;
  organization?: string;
  duration?: string;
  description?: string;
  status?: string;
  technologies?: string[];
  techStack?: string[];
  tech?: string[];
  skills?: string[];
  demoLink?: string;
  demo?: string;
  link?: string;
  url?: string;
  github?: string;
}

interface Training {
  id?: string;
  course?: string;
  skill?: string;
  trainer?: string;
  status?: string;
  progress?: number;
}

interface ParsedResumeData {
  name?: string;
  email?: string;
  contact_number?: string;
  college_school_name?: string;
  university?: string;
  branch_field?: string;
  training?: Training[];
  education?: Education[];
  experience?: Experience[];
  projects?: Project[];
  technicalSkills?: Skill[];
  softSkills?: Skill[];
  certificates?: Certificate[];
  imported_at?: string;
}

interface ApiResponse {
  success: boolean;
  data?: ParsedResumeData;
  error?: string;
}

export const parseResumeWithAI = async (resumeText: string): Promise<ParsedResumeData> => {
  try {
    // Call backend API directly
    try {
      const result = await parseWithClaude(resumeText);

      const hasData = result && (
        (result.education?.length ?? 0) > 0 ||
        (result.experience?.length ?? 0) > 0 ||
        (result.technicalSkills?.length ?? 0) > 0 ||
        (result.softSkills?.length ?? 0) > 0 ||
        (result.projects?.length ?? 0) > 0
      );

      if (!hasData) {
        logger.warn('AI returned empty data, using fallback parser');
        return parseFallback(resumeText);
      }

      return result;
    } catch (aiError) {
      logger.error('AI parsing failed', aiError as Error);
      return parseFallback(resumeText);
    }
  } catch (error) {
    logger.error('Error parsing resume', error as Error);
    throw error;
  }
};

/**
 * Parse resume using Career API (Cloudflare Worker)
 */
const parseWithClaude = async (resumeText: string): Promise<ParsedResumeData> => {
  try {
    const { getPagesApiUrl } = await import('../utils/pagesUrl');
    const API_URL = getPagesApiUrl('career');

    // Get current session for auth token
    const { data: { session } } = await import('../lib/supabaseClient').then(m => m.supabase.auth.getSession());
    const token = session?.access_token;

    if (!token) {
      throw new Error('Authentication required for resume parsing');
    }

    const response = await fetch(`${API_URL}/parse-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ resumeText })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json() as ApiResponse;

    if (!result.success || !result.data) {
      throw new Error('Invalid response from server');
    }

    logger.info('Resume parsing successful via backend');

    let parsedData = result.data;

    if (parsedData.name && parsedData.name.length > 100) {
      parsedData.name = extractNameFromText(parsedData.name);
    }

    return addMetadata(parsedData);
  } catch (error) {
    logger.error('Backend parsing failed', error as Error);
    throw error;
  }
};

/**
 * Extract name from text (fallback for bad AI responses)
 */
const extractNameFromText = (text: string): string => {
  const lines = text.split('\n');
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (trimmed.length > 2 && trimmed.length < 50 && !trimmed.includes('@')) {
      const words = trimmed.split(/\s+/);
      if (words.length >= 1 && words.length <= 4) {
        return trimmed;
      }
    }
  }
  return text.slice(0, 50);
};

/**
 * Add metadata to parsed data
 */
const addMetadata = (data: ParsedResumeData): ParsedResumeData => {
  const timestamp = Date.now();

  const addIds = <T extends { id?: string }>(arr: T[] | undefined, prefix: string): T[] => {
    return (arr || []).map((item, idx) => ({
      ...item,
      id: item.id || `${prefix}_${timestamp}_${idx + 1}`
    }));
  };

  return {
    ...data,
    education: addIds(data.education, 'edu'),
    experience: addIds(data.experience, 'exp'),
    projects: addIds(data.projects, 'proj'),
    technicalSkills: addIds(data.technicalSkills, 'tech'),
    softSkills: addIds(data.softSkills, 'soft'),
    certificates: addIds(data.certificates, 'cert'),
    training: addIds(data.training, 'train'),
    imported_at: new Date().toISOString()
  };
};

/**
 * Fallback parser using regex patterns
 */
const parseFallback = (resumeText: string): ParsedResumeData => {
  const result: ParsedResumeData = {
    name: '',
    email: '',
    contact_number: '',
    college_school_name: '',
    university: '',
    branch_field: '',
    training: [],
    education: [],
    experience: [],
    projects: [],
    technicalSkills: [],
    softSkills: [],
    certificates: [],
    imported_at: new Date().toISOString()
  };

  // Extract email
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  result.email = emailMatch?.[0] || '';

  // Extract phone
  const phoneMatch = resumeText.match(/(?:\+91\s?)?[\d\s-]{10,}/);
  result.contact_number = phoneMatch?.[0]?.replace(/\s+/g, ' ').trim() || '';

  // Extract name from first few lines
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines.slice(0, 5)) {
    if (line.length > 2 && line.length < 50 && !line.includes('@') && !/\d{10}/.test(line)) {
      const words = line.split(/\s+/);
      if (words.length >= 1 && words.length <= 4 && /^[A-Z]/.test(line)) {
        result.name = line;
        break;
      }
    }
  }

  return addMetadata(result);
};

type ResumeDataValue = string | number | boolean | string[] | 
  Education[] | Experience[] | Project[] | Skill[] | Certificate[] | Training[] | null | undefined;

/**
 * Merge parsed resume data with existing profile data
 * @param existingData - Current profile data
 * @param parsedData - Newly parsed resume data
 * @returns Merged data with parsed data taking precedence for empty fields
 */
export const mergeResumeData = (
  existingData: ParsedResumeData | null | undefined,
  parsedData: ParsedResumeData | null | undefined
): ParsedResumeData => {
  if (!parsedData) return existingData || {};
  if (!existingData) return parsedData;

  const merged = { ...existingData };

  // Merge simple string fields (only if existing is empty)
  const stringFields: (keyof ParsedResumeData)[] = [
    'name', 'email', 'contact_number', 'college_school_name', 'university', 'branch_field'
  ];
  
  stringFields.forEach(field => {
    const parsedValue = parsedData[field];
    const existingValue = existingData[field];
    
    if (parsedValue && (!existingValue || String(existingValue).trim() === '')) {
      (merged as Record<string, ResumeDataValue>)[field] = parsedValue;
    }
  });

  // Merge array fields (append new items, avoid duplicates)
  const arrayFields: (keyof ParsedResumeData)[] = [
    'education', 'experience', 'projects', 'technicalSkills', 'softSkills', 'certificates', 'training'
  ];
  
  arrayFields.forEach(field => {
    const existing = (existingData[field] as Array<Education | Experience | Project | Skill | Certificate | Training>) || [];
    const parsed = (parsedData[field] as Array<Education | Experience | Project | Skill | Certificate | Training>) || [];

    if (parsed.length > 0) {
      // Simple deduplication by checking if item already exists
      const newItems = parsed.filter(newItem => {
        return !existing.some(existingItem => {
          // Check by title/name/degree depending on field type
          if (field === 'education') {
            return (existingItem as Education).degree === (newItem as Education).degree && 
                   (existingItem as Education).university === (newItem as Education).university;
          }
          if (field === 'experience') {
            return (existingItem as Experience).organization === (newItem as Experience).organization && 
                   (existingItem as Experience).role === (newItem as Experience).role;
          }
          if (field === 'projects') {
            return (existingItem as Project).title === (newItem as Project).title;
          }
          if (field === 'technicalSkills' || field === 'softSkills') {
            return (existingItem as Skill).name?.toLowerCase() === (newItem as Skill).name?.toLowerCase();
          }
          if (field === 'certificates') {
            return (existingItem as Certificate).title === (newItem as Certificate).title;
          }
          return false;
        });
      });

      (merged as Record<string, ResumeDataValue>)[field] = [...existing, ...newItems];
    }
  });

  merged.imported_at = parsedData.imported_at || new Date().toISOString();

  return merged;
};

export default { parseResumeWithAI, mergeResumeData };
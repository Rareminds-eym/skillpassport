import { apiPost } from '@/shared/api/apiClient';
/**
 * Resume Parser Service
 * Handles parsing resumes using Claude AI
 */

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('resume-parser');

type ResumeParserApiResponse = {
  success: boolean;
  data?: ResumeParsedData | { data?: ResumeParsedData };
};

type ResumeParsedData = {
  name?: string;
  email?: string;
  contact_number?: string;
  alternate_number?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  college_school_name?: string;
  university?: string;
  branch_field?: string;
  registration_number?: string;
  bio?: string;
  linkedin_link?: string;
  github_link?: string;
  portfolio_link?: string;
  twitter_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  interests?: string[] | string;
  languages?: string[] | string;
  hobbies?: string[] | string;
  education?: Array<Record<string, unknown>>;
  experience?: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  technicalSkills?: Array<Record<string, unknown>>;
  softSkills?: Array<Record<string, unknown>>;
  certificates?: Array<Record<string, unknown>>;
  training?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export const parseResumeWithAI = async (resumeText) => {
  try {
    // Call backend API directly
    try {
      const result = await parseWithClaude(resumeText);

      const hasData = result && (
        result.education?.length > 0 ||
        result.experience?.length > 0 ||
        result.technicalSkills?.length > 0 ||
        result.softSkills?.length > 0 ||
        result.projects?.length > 0
      );

      if (!hasData) {
        logger.warn('AI returned empty data, using fallback parser');
        return parseFallback(resumeText);
      }

      return result;
    } catch (aiError) {
      logger.error('AI parsing failed', aiError);
      return parseFallback(resumeText);
    }
  } catch (error) {
    logger.error('Error parsing resume', error);
    throw error;
  }
};

/**
 * Parse resume using Claude AI
 */
/**
 * Parse resume using Career API (Cloudflare Worker)
 */
const parseWithClaude = async (resumeText) => {
  try {
    const result = await apiPost<ResumeParserApiResponse>('/career/parse-resume', { resumeText });

    if (!result.success || !result.data) {
      throw new Error('Invalid response from server');
    }

    logger.info('Resume parsing successful via backend');

    const parsedData = 'data' in result.data && result.data.data
      ? result.data.data
      : result.data;

    if (parsedData.name && parsedData.name.length > 100) {
      parsedData.name = extractNameFromText(parsedData.name);
    }

    return addMetadata(parsedData);
  } catch (error) {
    logger.error('Backend parsing failed', error);
    throw error;
  }
};

/**
 * Extract name from text (fallback for bad AI responses)
 */
const extractNameFromText = (text) => {
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
const addMetadata = (data) => {
  const timestamp = Date.now();

  const addIds = (arr, prefix) => {
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
const parseFallback = (resumeText) => {
  const result = {
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

const collectStringItems = (value, output) => {
  if (Array.isArray(value)) {
    value.forEach(item => collectStringItems(item, output));
    return;
  }

  if (typeof value !== 'string') {
    if (value !== null && value !== undefined) output.push(value);
    return;
  }

  const trimmed = value.trim();
  if (!trimmed) return;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed !== value) {
      collectStringItems(parsed, output);
      return;
    }
  } catch {
    // Non-JSON text is handled below.
  }

  if (trimmed.includes(',') || trimmed.includes(';') || trimmed.includes('\n')) {
    trimmed.split(/[,;\n]/).forEach(item => collectStringItems(item, output));
    return;
  }

  output.push(trimmed);
};

const normalizeStringArray = (value) => {
  const seen = new Set();
  const items = [];
  const rawItems = [];

  collectStringItems(value, rawItems);
  rawItems.forEach(item => {
    const normalized = String(item ?? '')
      .trim()
      .replace(/\\"/g, '"')
      .replace(/^[\s"'[\]]+|[\s"'[\]]+$/g, '')
      .replace(/\s+/g, ' ');
    const key = normalized.toLowerCase();
    if (!normalized || normalized === '[]' || normalized === '{}' || seen.has(key)) return;
    seen.add(key);
    items.push(normalized);
  });

  return items;
};

/**
 * Merge parsed resume data with existing profile data
 * @param {Object} existingData - Current profile data
 * @param {Object} parsedData - Newly parsed resume data
 * @returns {Object} Merged data with parsed data taking precedence for empty fields
 */
export const mergeResumeData = (existingData, parsedData) => {
  if (!parsedData) return existingData;
  if (!existingData) return parsedData;

  const merged = { ...existingData };

  // Merge simple string fields (only if existing is empty)
  const stringFields = [
    'name',
    'email',
    'phone',
    'contact_number',
    'alternatePhone',
    'alternate_number',
    'dateOfBirth',
    'date_of_birth',
    'college_school_name',
    'university',
    'branch_field',
    'registrationNumber',
    'registration_number',
    'address',
    'location',
    'city',
    'state',
    'country',
    'pincode',
    'bio',
    'linkedIn',
    'linkedin_link',
    'github',
    'github_link',
    'portfolio',
    'portfolio_link',
    'twitter',
    'twitter_link',
    'facebook',
    'facebook_link',
    'instagram',
    'instagram_link'
  ];
  stringFields.forEach(field => {
    if (parsedData[field] && (!existingData[field] || existingData[field].trim() === '')) {
      merged[field] = parsedData[field];
    }
  });

  ['interests', 'languages', 'hobbies'].forEach(field => {
    const existing = normalizeStringArray(existingData[field]);
    const parsed = normalizeStringArray(parsedData[field]);
    const existingKeys = new Set(existing.map(item => item.toLowerCase()));
    const newItems = parsed.filter(item => !existingKeys.has(item.toLowerCase()));

    if (existing.length || newItems.length) {
      merged[field] = [...existing, ...newItems];
    }
  });

  // Merge array fields (append new items, avoid duplicates)
  const arrayFields = ['education', 'experience', 'projects', 'technicalSkills', 'softSkills', 'certificates', 'training'];
  arrayFields.forEach(field => {
    const existing = existingData[field] || [];
    const parsed = parsedData[field] || [];

    if (parsed.length > 0) {
      // Simple deduplication by checking if item already exists
      const newItems = parsed.filter(newItem => {
        return !existing.some(existingItem => {
          // Check by title/name/degree depending on field type
          if (field === 'education') {
            return existingItem.degree === newItem.degree && existingItem.university === newItem.university;
          }
          if (field === 'experience') {
            return existingItem.organization === newItem.organization && existingItem.role === newItem.role;
          }
          if (field === 'projects') {
            return existingItem.title === newItem.title;
          }
          if (field === 'technicalSkills' || field === 'softSkills') {
            return existingItem.name?.toLowerCase() === newItem.name?.toLowerCase();
          }
          if (field === 'certificates') {
            return existingItem.title === newItem.title;
          }
          return false;
        });
      });

      merged[field] = [...existing, ...newItems];
    }
  });

  merged.imported_at = parsedData.imported_at || new Date().toISOString();

  return merged;
};

export default { parseResumeWithAI, mergeResumeData };

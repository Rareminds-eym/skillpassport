/**
 * Resume Parser Service
 * Handles parsing resumes using Claude AI
 */

export const parseResumeWithAI = async (resumeText) => {
  try {
    // Call backend API directly
    try {
      const result = await parseWithClaude(resumeText);

      const hasData =
        result &&
        (result.education?.length > 0 ||
          result.experience?.length > 0 ||
          result.technicalSkills?.length > 0 ||
          result.softSkills?.length > 0 ||
          result.projects?.length > 0);

      if (!hasData) {
        console.log('⚠️ AI returned empty data, using fallback parser');
        return parseFallback(resumeText);
      }

      return result;
    } catch (aiError) {
      console.error('❌ AI parsing failed:', aiError.message);
      return parseFallback(resumeText);
    }
  } catch (error) {
    console.error('Error parsing resume:', error);
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
    const API_URL =
      import.meta.env.VITE_CAREER_API_URL || 'https://career-api.rareminds.workers.dev';

    // Get current session for auth token
    const {
      data: { session },
    } = await import('../lib/supabaseClient').then((m) => m.supabase.auth.getSession());
    const token = session?.access_token;

    if (!token) {
      throw new Error('Authentication required for resume parsing');
    }

    const response = await fetch(`${API_URL}/parse-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ resumeText }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error('Invalid response from server');
    }

    console.log('✅ Resume parsing successful via backend');

    const parsedData = result.data;

    if (parsedData.name && parsedData.name.length > 100) {
      parsedData.name = extractNameFromText(parsedData.name);
    }

    return addMetadata(parsedData);
  } catch (error) {
    console.error('Backend parsing failed:', error);
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
      id: item.id || `${prefix}_${timestamp}_${idx + 1}`,
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
    imported_at: new Date().toISOString(),
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
    imported_at: new Date().toISOString(),
  };

  // Extract email
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  result.email = emailMatch?.[0] || '';

  // Extract phone
  const phoneMatch = resumeText.match(/(?:\+91\s?)?[\d\s-]{10,}/);
  result.contact_number = phoneMatch?.[0]?.replace(/\s+/g, ' ').trim() || '';

  // Extract name from first few lines
  const lines = resumeText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
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
    'contact_number',
    'college_school_name',
    'university',
    'branch_field',
  ];
  stringFields.forEach((field) => {
    if (parsedData[field] && (!existingData[field] || existingData[field].trim() === '')) {
      merged[field] = parsedData[field];
    }
  });

  // Merge array fields (append new items, avoid duplicates)
  const arrayFields = [
    'education',
    'experience',
    'projects',
    'technicalSkills',
    'softSkills',
    'certificates',
    'training',
  ];
  arrayFields.forEach((field) => {
    const existing = existingData[field] || [];
    const parsed = parsedData[field] || [];

    if (parsed.length > 0) {
      // Simple deduplication by checking if item already exists
      const newItems = parsed.filter((newItem) => {
        return !existing.some((existingItem) => {
          // Check by title/name/degree depending on field type
          if (field === 'education') {
            return (
              existingItem.degree === newItem.degree &&
              existingItem.university === newItem.university
            );
          }
          if (field === 'experience') {
            return (
              existingItem.organization === newItem.organization &&
              existingItem.role === newItem.role
            );
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

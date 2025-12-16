/**
 * Resume Parser Service
 * Handles parsing resumes using Claude AI
 */

import { callClaudeJSON, isClaudeConfigured } from './claudeService';

/**
 * Parse resume text using Claude AI
 * @param {string} resumeText - The extracted text from the resume
 * @returns {Promise<Object>} Parsed resume data in structured format
 */
export const parseResumeWithAI = async (resumeText) => {
  try {
    if (!isClaudeConfigured()) {
      console.log('⚠️ Claude API not configured, using fallback parser');
      return parseFallback(resumeText);
    }

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
const parseWithClaude = async (resumeText) => {
  const prompt = `Extract information from this resume and return ONLY a valid JSON object.

CRITICAL RULES:
- name: Extract ONLY the person's full name (2-4 words)
- DO NOT dump entire resume text into any single field
- Parse each section into separate array items with unique IDs

Return ONLY the JSON object:
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
${resumeText}
"""
`;

  const parsedData = await callClaudeJSON(prompt, {
    maxTokens: 4096,
    temperature: 0.1,
    useCache: false
  });

  console.log('✅ Claude resume parsing successful');

  if (parsedData.name && parsedData.name.length > 100) {
    parsedData.name = extractNameFromText(parsedData.name);
  }

  return addMetadata(parsedData);
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

export default { parseResumeWithAI };

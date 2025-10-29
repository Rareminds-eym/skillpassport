/**
 * Resume Parser Service
 * Handles parsing resumes using AI (Google Gemini or OpenAI)
 */

/**
 * Parse resume text using AI
 * @param {string} resumeText - The extracted text from the resume
 * @returns {Promise<Object>} Parsed resume data in structured format
 */
export const parseResumeWithAI = async (resumeText) => {
  try {
    // Check if we have an API key configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   import.meta.env.VITE_OPENAI_API_KEY || 
                   import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ No AI API key configured. Using fallback parser.');
      return parseFallback(resumeText);
    }

    // Try AI parsing first
    let result;
    try {
      // Determine which API to use
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        result = await parseWithGemini(resumeText);
      } else if (import.meta.env.VITE_OPENROUTER_API_KEY) {
        result = await parseWithOpenRouter(resumeText);
      } else if (import.meta.env.VITE_OPENAI_API_KEY) {
        result = await parseWithOpenAI(resumeText);
      }
      
      // Validate AI result - if arrays are empty, use fallback
      const hasData = result && (
        result.education?.length > 0 ||
        result.experience?.length > 0 ||
        result.technicalSkills?.length > 0 ||
        result.softSkills?.length > 0 ||
        result.projects?.length > 0
      );
      
      if (!hasData) {
        console.warn('⚠️ AI parsing returned empty data. Using fallback parser.');
        return parseFallback(resumeText);
      }
      
      return result;
    } catch (aiError) {
      console.error('❌ AI parsing failed:', aiError.message);
      
      // Special handling for rate limits
      if (aiError.message === 'RATE_LIMIT_EXCEEDED') {
        console.log('📄 OpenRouter rate limit exceeded. Using enhanced regex-based parser...');
        return parseFallback(resumeText);
      }
      
      console.log('📄 Falling back to regex-based parser...');
      return parseFallback(resumeText);
    }
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
};

/**
 * Parse resume using Google Gemini API
 */
const parseWithGemini = async (resumeText) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  const prompt = `Extract information from this resume and return ONLY a valid JSON object.

CRITICAL RULES:
- name: Extract ONLY the person's full name (2-4 words like "P. Durkadevi" or "John Doe")
- DO NOT dump entire resume text into any single field
- Parse each section (education, experience, projects, skills, certificates) into separate array items
- Each array item should be a separate object with its own fields
- Generate unique numeric IDs for each item (use timestamp-based IDs)

SECTIONS TO PARSE:
1. education: Degrees and academic qualifications
2. training: Courses, workshops, training programs
3. experience: Work experience, internships, jobs
4. projects: Personal or professional projects with tech stack and description
5. technicalSkills: Programming languages, frameworks, tools
6. softSkills: Communication, teamwork, leadership, etc.
7. certificates: Professional certifications with credential IDs

IMPORTANT: 
- The "name" field should ONLY contain the person's name (2-4 words max)
- DO NOT include contact info, skills, or resume content in the name field
- For projects: extract title, organization, duration, description, technologies/tech stack, links
- For certificates: extract title, issuer, credential ID, issue date, description, link
- If a field is not found, use empty string "" or empty array []

Example for name field:
✓ CORRECT: "P. Durkadevi"
✗ WRONG: "CONTACT EMAIL john@email.com PHONE..."

Return ONLY the JSON object (no markdown, no explanation):

{
  "name": "",
  "email": "",
  "contact_number": "",
  "age": "",
  "date_of_birth": "",
  "college_school_name": "",
  "university": "",
  "registration_number": "",
  "district_name": "",
  "branch_field": "",
  "trainer_name": "",
  "nm_id": "",
  "course": "",
  "skill": "",
  "training": [
    {
      "id": 1,
      "skill": "",
      "course": "",
      "status": "ongoing",
      "trainer": "",
      "progress": 0
    }
  ],
  "education": [
    {
      "id": 1,
      "cgpa": "",
      "level": "Bachelor's",
      "degree": "",
      "status": "completed",
      "department": "",
      "university": "",
      "yearOfPassing": ""
    }
  ],
  "experience": [
    {
      "id": 1,
      "organization": "",
      "role": "",
      "duration": "",
      "verified": false
    }
  ],
  "projects": [
    {
      "id": 1,
      "title": "",
      "organization": "",
      "duration": "",
      "description": "",
      "technologies": [],
      "techStack": [],
      "tech": [],
      "skills": [],
      "link": "",
      "url": "",
      "github": "",
      "demo": "",
      "demoLink": "",
      "status": "Completed"
    }
  ],
  "technicalSkills": [
    {
      "id": 1,
      "name": "",
      "category": "",
      "level": 3,
      "verified": false
    }
  ],
  "softSkills": [
    {
      "id": 1,
      "name": "",
      "type": "",
      "level": 3,
      "description": ""
    }
  ],
  "certificates": [
    {
      "id": 1,
      "title": "",
      "issuer": "",
      "level": "Professional",
      "issuedOn": "",
      "credentialId": "",
      "link": "",
      "description": "",
      "status": "pending"
    }
  ],
  "alternate_number": "",
  "contact_number_dial_code": "",
  "imported_at": ""
}

Resume Text:
"""
${resumeText}
"""
`;

  try {
    console.log('🤖 Calling Gemini API for resume parsing...');
    console.log('📝 Resume text length:', resumeText.length);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.0,  // More deterministic
            maxOutputTokens: 4096,  // More space for full extraction
            topP: 0.8,
            topK: 10
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    console.log('🤖 Gemini raw response:', generatedText.substring(0, 500));
    
    // Extract JSON from the response - handle markdown code blocks
    let jsonText = generatedText;
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response:', generatedText);
      throw new Error('Failed to extract JSON from AI response');
    }
    
    console.log('📝 Extracted JSON text:', jsonMatch[0].substring(0, 300));
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    console.log('✅ Parsed data:', parsedData);
    
    // Validate that name field doesn't contain entire resume
    if (parsedData.name && parsedData.name.length > 100) {
      console.warn('⚠️ Name field too long, attempting to extract actual name...');
      parsedData.name = extractNameFromText(parsedData.name);
    }
    
    // Add unique IDs and timestamps
    return addMetadata(parsedData);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to parse resume with Gemini API');
  }
};

/**
 * Parse resume using OpenAI API
 */
const parseWithOpenAI = async (resumeText) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  const prompt = `
You are an expert resume parsing assistant. Your task is to carefully analyze the resume text and extract specific information into structured JSON format.

CRITICAL INSTRUCTIONS:
1. Extract ONLY the person's actual name for the "name" field (e.g., "John Doe", "P. Durkadevi")
2. DO NOT put the entire resume text in any single field
3. Parse each section carefully and place data in the correct fields
4. For arrays (education, experience, projects, skills, certificates), create separate objects for each item
5. Generate unique numeric IDs for each array item (use sequential numbers like 1, 2, 3)
6. If a field is not found in the resume, use an empty string "" or empty array []
7. Look for sections like EDUCATION, EXPERIENCE, PROJECTS, SKILLS, CERTIFICATES and parse them accordingly

IMPORTANT SECTIONS:
- education: Parse degrees, universities, years, CGPA
- experience: Parse job titles, companies, durations
- projects: Parse project titles, descriptions, technologies used, links
- technicalSkills: Parse programming languages, frameworks, tools
- softSkills: Parse communication, teamwork, leadership skills
- certificates: Parse certifications with issuers, credential IDs, dates

EXAMPLE:
If resume says "EDUCATION: B.Sc Computer Science, MIT University, 2024"
Then education array should have ONE object with degree="B.Sc Computer Science", university="MIT University", yearOfPassing="2024"

Return ONLY valid JSON (no markdown, no explanation, no text outside the JSON object).

JSON STRUCTURE:

{
  "name": "",
  "email": "",
  "contact_number": "",
  "age": "",
  "date_of_birth": "",
  "college_school_name": "",
  "university": "",
  "registration_number": "",
  "district_name": "",
  "branch_field": "",
  "trainer_name": "",
  "nm_id": "",
  "course": "",
  "skill": "",
  "training": [],
  "education": [],
  "experience": [],
  "projects": [],
  "technicalSkills": [],
  "softSkills": [],
  "certificates": [],
  "alternate_number": "",
  "contact_number_dial_code": "",
  "imported_at": ""
}

Resume Text:
"""
${resumeText}
"""
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a resume parsing assistant. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Add unique IDs and timestamps
    return addMetadata(parsedData);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to parse resume with OpenAI API');
  }
};

/**
 * Parse resume using OpenRouter API
 */
const parseWithOpenRouter = async (resumeText) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  const prompt = `
You are an expert resume parsing assistant. Your task is to carefully analyze the resume text and extract specific information into structured JSON format.

CRITICAL INSTRUCTIONS:
1. Extract ONLY the person's actual name for the "name" field (e.g., "John Doe", "P. Durkadevi")
2. DO NOT put the entire resume text in any single field
3. Parse each section carefully and place data in the correct array
4. For arrays (education, experience, projects, skills, certificates), create separate objects for each item
5. Generate unique numeric IDs for each array item
6. If a field is not found, use empty string "" or empty array []
7. Look for EDUCATION, EXPERIENCE, PROJECTS, SKILLS, CERTIFICATES sections

IMPORTANT SECTIONS:
- education: Parse degrees, universities, years, CGPA, departments
- experience: Parse job titles, companies, durations, descriptions
- projects: Parse project titles, descriptions, technologies/tech stack, links (GitHub, demo, website)
- technicalSkills: Parse programming languages, frameworks, tools, technologies
- softSkills: Parse communication, teamwork, leadership, problem-solving skills
- certificates: Parse certifications with issuers, credential IDs, issue dates, links
- training: Parse courses, workshops, training programs

EXAMPLE FOR PROJECTS:
Input: "AI-Based Career Counseling System | Jan 2024 – Mar 2024
SkillEco
Developed an AI-powered platform using React, Node.js, Express.js, PostgreSQL, OpenAI API
Link: https://career-ai.skill-eco.io"

Output: {
  "id": 1,
  "title": "AI-Based Career Counseling System",
  "organization": "SkillEco",
  "duration": "Jan 2024 – Mar 2024",
  "description": "Developed an AI-powered platform that provides personalized career guidance",
  "technologies": ["React", "Node.js", "Express.js", "PostgreSQL", "OpenAI API"],
  "link": "https://career-ai.skill-eco.io",
  "status": "Completed"
}

Return ONLY valid JSON (no markdown blocks, no explanation).

JSON STRUCTURE:
{
  "name": "",
  "email": "",
  "contact_number": "",
  "age": "",
  "date_of_birth": "",
  "college_school_name": "",
  "university": "",
  "registration_number": "",
  "district_name": "",
  "branch_field": "",
  "trainer_name": "",
  "nm_id": "",
  "course": "",
  "skill": "",
  "training": [],
  "education": [],
  "experience": [],
  "projects": [],
  "technicalSkills": [],
  "softSkills": [],
  "certificates": [],
  "alternate_number": "",
  "contact_number_dial_code": "",
  "imported_at": ""
}

Resume Text:
"""
${resumeText}
"""
`;

  try {
    console.log('🤖 Calling OpenRouter API for resume parsing...');
    console.log('📝 Resume text length:', resumeText.length);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Resume Parser'
      },
      body: JSON.stringify({
        model: 'z-ai/glm-4.5-air:free',
        messages: [
          {
            role: 'system',
            content: 'You are a resume parsing assistant. Extract information from resumes and return ONLY valid JSON. Do not include markdown code blocks or explanations.'
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
      console.error('OpenRouter API error:', errorText);
      
      // Handle rate limiting (429) - fall back to regex parser
      if (response.status === 429) {
        console.warn('⚠️ OpenRouter API rate limit reached. Using fallback parser...');
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('🤖 OpenRouter raw response:', generatedText.substring(0, 500));
    
    // Extract JSON from the response - handle markdown code blocks
    let jsonText = generatedText;
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response:', generatedText);
      throw new Error('Failed to extract JSON from AI response');
    }
    
    console.log('📝 Extracted JSON text:', jsonMatch[0].substring(0, 300));
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    console.log('✅ Parsed data:', parsedData);
    
    // Validate that name field doesn't contain entire resume
    if (parsedData.name && parsedData.name.length > 100) {
      console.warn('⚠️ Name field too long, attempting to extract actual name...');
      parsedData.name = extractNameFromText(parsedData.name);
    }
    
    // Add unique IDs and timestamps
    return addMetadata(parsedData);
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw new Error('Failed to parse resume with OpenRouter API');
  }
};

/**
 * Fallback parser using regex patterns and section detection
 * Used when AI API fails or is not available
 */
const parseFallback = (resumeText) => {
  console.log('📄 Using ENHANCED fallback resume parser');
  console.log('📝 Resume text:', resumeText.substring(0, 500));
  
  const result = {
    name: '',
    email: '',
    contact_number: '',
    age: '',
    date_of_birth: '',
    college_school_name: '',
    university: '',
    registration_number: '',
    district_name: '',
    branch_field: '',
    trainer_name: '',
    nm_id: '',
    course: '',
    training: [],
    education: [],
    experience: [],
    projects: [],  // Added projects array
    technicalSkills: [],
    softSkills: [],
    certificates: [],
    alternate_number: '',
    contact_number_dial_code: '',
    imported_at: new Date().toISOString(),
    skill: ''
  };
  
  // Extract email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  result.email = resumeText.match(emailRegex)?.[0] || '';
  console.log('📧 Found email:', result.email);
  
  // Extract phone number
  const phoneRegex = /(?:\+91\s?)?[\d\s-]{10,}/;
  const phoneMatch = resumeText.match(phoneRegex);
  if (phoneMatch) {
    result.contact_number = phoneMatch[0].replace(/\s+/g, ' ').trim();
    console.log('📞 Found phone:', result.contact_number);
  }
  
  // Extract name - look for pattern like "P.DURKADEVI" or name before CONTACT/EMAIL
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Strategy 1: Look for name pattern at the very beginning (first 3 lines)
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim();
    
    // Skip if line has email or phone patterns
    if (trimmed.match(/@|[\d-]{10,}/)) continue;
    
    // Look for all-caps name with optional dots (P.DURKADEVI)
    const capsWithDots = trimmed.match(/^([A-Z]\.?\s*)?[A-Z]{3,}$/);
    if (capsWithDots && trimmed.length < 50) {
      result.name = trimmed;
      console.log('👤 Found name (caps with dots, first lines):', result.name);
      break;
    }
    
    // Look for proper case names
    const properCase = trimmed.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/);
    if (properCase && trimmed.length < 50) {
      result.name = trimmed;
      console.log('👤 Found name (proper case, first lines):', result.name);
      break;
    }
  }
  
  // Strategy 2: Find name before CONTACT/EMAIL section
  if (!result.name) {
    const beforeContact = resumeText.split(/\b(CONTACT|EMAIL|PHONE|MOBILE)\b/i)[0];
    if (beforeContact) {
      const nameLines = beforeContact.trim().split(/\n/).filter(l => l.trim().length > 0);
      
      // Look for a line that looks like a name (1-4 words, proper case or all caps)
      for (const line of nameLines.slice(0, 5)) { // Check first 5 lines only
        const trimmed = line.trim();
        
        // Skip if line has email or phone patterns
        if (trimmed.match(/@|[\d-]{10,}/)) continue;
        
        // Check for name patterns
        const words = trimmed.split(/\s+/);
        const validWords = words.filter(w => /^[A-Z][A-Za-z.]*$/.test(w) && w.length > 1);
        
        // Name should be 1-4 words and less than 50 characters
        if (validWords.length >= 1 && validWords.length <= 4 && trimmed.length < 50) {
          result.name = validWords.join(' ');
          console.log('👤 Found name (before contact):', result.name);
          break;
        }
      }
    }
  }
  
  // Strategy 3: Look for all-caps name pattern in first few lines
  if (!result.name) {
    for (const line of lines.slice(0, 10)) {
      const trimmed = line.trim();
      
      // Skip lines with email, phone, or common resume keywords
      if (trimmed.match(/@|[\d-]{10,}|CONTACT|EMAIL|RESUME|CV|PROFILE|OBJECTIVE/i)) continue;
      
      // Look for all-caps names (common resume format) - including P.DURKADEVI pattern
      if (/^[A-Z]\.?\s*[A-Z]{3,}$/i.test(trimmed) && trimmed.length > 3 && trimmed.length < 40) {
        result.name = trimmed;
        console.log('👤 Found name (all-caps with optional dot):', result.name);
        break;
      }
      
      if (/^[A-Z][A-Z.\s]+$/.test(trimmed) && trimmed.length > 3 && trimmed.length < 40) {
        const words = trimmed.split(/\s+/);
        if (words.length >= 1 && words.length <= 4) {
          result.name = trimmed;
          console.log('👤 Found name (all-caps):', result.name);
          break;
        }
      }
      
      // Look for proper case names (like "John Doe")
      if (/^[A-Z][a-z]+(\s+[A-Z][a-z.]+)*$/.test(trimmed) && trimmed.length < 40) {
        const words = trimmed.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          result.name = trimmed;
          console.log('👤 Found name (proper case):', result.name);
          break;
        }
      }
    }
  }
  
  // Strategy 4: Search in the entire text for name patterns (last resort)
  if (!result.name) {
    // Look for patterns like "P.DURKADEVI" or "P.DURKADEVID" anywhere in text
    const namePattern = /\b([A-Z]\.?\s*[A-Z]{4,20})\b/g;
    const matches = resumeText.match(namePattern);
    if (matches && matches.length > 0) {
      // Take the first match that's not a common abbreviation
      for (const match of matches) {
        const cleaned = match.trim();
        if (cleaned.length > 5 && cleaned.length < 50 && 
            !cleaned.match(/CONTACT|EMAIL|PHONE|SKILLS|EDUCATION|EXPERIENCE|PROJECT/i)) {
          result.name = cleaned;
          console.log('👤 Found name (pattern match):', result.name);
          break;
        }
      }
    }
  }
  
  // Extract EDUCATION section
  const eduSection = extractSection(resumeText, 'EDUCATION', ['EXPERIENCE', 'WORK EXPERIENCE', 'CERTIFICATES', 'SKILLS']);
  if (eduSection) {
    console.log('🎓 Found education section:', eduSection);
    const eduItems = parseEducation(eduSection);
    result.education = eduItems;
    
    // Extract university from education
    if (eduItems.length > 0) {
      result.university = eduItems[0].university || '';
    }
  }
  
  // Extract EXPERIENCE/WORK EXPERIENCE section
  const expSection = extractSection(resumeText, 'EXPERIENCE|WORK EXPERIENCE', ['EDUCATION', 'CERTIFICATES', 'SKILLS', 'PROJECTS']);
  if (expSection) {
    console.log('💼 Found experience section:', expSection);
    result.experience = parseExperience(expSection);
  }
  
  // Extract PROJECTS section
  const projectsSection = extractSection(resumeText, 'PROJECTS', ['EDUCATION', 'EXPERIENCE', 'WORK EXPERIENCE', 'CERTIFICATES', 'SKILLS']);
  if (projectsSection) {
    console.log('🚀 Found projects section:', projectsSection);
    result.projects = parseProjects(projectsSection);
  }
  
  // Extract SKILLS section
  const skillsSection = extractSection(resumeText, 'SKILLS', ['EDUCATION', 'EXPERIENCE', 'WORK EXPERIENCE', 'CERTIFICATES', 'PROJECTS']);
  if (skillsSection) {
    console.log('🔧 Found skills section:', skillsSection);
    const { technical, soft } = parseSkills(skillsSection);
    result.technicalSkills = technical;
    result.softSkills = soft;
  }
  
  // Extract CERTIFICATES section
  const certsSection = extractSection(resumeText, 'CERTIFICATES|CERTIFICATIONS', ['EDUCATION', 'EXPERIENCE', 'SKILLS', 'PROJECTS']);
  if (certsSection) {
    console.log('📜 Found certificates section:', certsSection);
    result.certificates = parseCertificates(certsSection);
  }
  
  console.log('✅ Fallback parsing complete:', result);
  return addMetadata(result);
};

/**
 * Extract a section from resume text
 */
const extractSection = (text, sectionName, endMarkers) => {
  const regex = new RegExp(`(${sectionName})([\\s\\S]*?)(?=${endMarkers.map(m => `\\b${m}\\b`).join('|')}|$)`, 'i');
  const match = text.match(regex);
  return match ? match[2].trim() : null;
};

/**
 * Parse education section
 */
const parseEducation = (section) => {
  const education = [];
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentEdu = null;
  for (const line of lines) {
    // Look for degree patterns
    const degreePattern = /B\.[A-Z][a-z]+|M\.[A-Z][a-z]+|Bachelor|Master|Diploma|PhD|B\.Tech|M\.Tech|B\.E\.|M\.E\.|BCA|MCA|BSc|MSc/i;
    
    if (degreePattern.test(line)) {
      if (currentEdu) {
        education.push(currentEdu);
      }
      
      // Try to separate degree from university if they're on the same line
      let degree = line;
      let university = '';
      
      // Look for university keywords in the same line
      const universityMatch = line.match(/(.*?)\s+(.*?University|.*?College|.*?Institute)/i);
      if (universityMatch) {
        degree = universityMatch[1].trim();
        university = universityMatch[2].trim();
      }
      
      // Remove any trailing year or CGPA from degree
      degree = degree.replace(/\s+\d{4}\s*$/, '').trim(); // Remove trailing year
      degree = degree.replace(/\s+\d+\.\d+\s*$/, '').trim(); // Remove trailing CGPA
      
      currentEdu = {
        id: education.length + 1,
        degree: degree,
        university: university,
        department: '',
        yearOfPassing: '',
        cgpa: '',
        level: line.match(/Bachelor|B\.|BSc|BCA|B\.Tech|B\.E\./i) ? "Bachelor's" : 
               line.match(/Master|M\.|MSc|MCA|M\.Tech|M\.E\./i) ? "Master's" : "Bachelor's",
        status: 'completed'
      };
    } else if (currentEdu) {
      // Look for university (if not already set)
      if (!currentEdu.university && /University|College|Institute/i.test(line)) {
        currentEdu.university = line;
      }
      // Look for department
      else if (!currentEdu.department && /Department|Faculty|School of/i.test(line)) {
        currentEdu.department = line;
      }
      // Look for year
      else if (!currentEdu.yearOfPassing) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          currentEdu.yearOfPassing = yearMatch[0];
        }
      }
      // Look for CGPA
      if (!currentEdu.cgpa) {
        const cgpaMatch = line.match(/\b(\d+\.\d+)\b/);
        if (cgpaMatch && parseFloat(cgpaMatch[0]) <= 10) {
          currentEdu.cgpa = cgpaMatch[0];
        }
      }
    }
  }
  
  if (currentEdu) {
    education.push(currentEdu);
  }
  
  return education;
};

/**
 * Parse experience section
 */
const parseExperience = (section) => {
  const experience = [];
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log('🔧 Parsing experience section:', lines.length, 'lines');
  
  let currentExp = null;
  let lineIndex = 0;
  
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    console.log(`🔍 Processing experience line ${lineIndex}: "${line}"`);
    
    // Look for date patterns (Jan 2024 - Jan 2025)
    const datePattern = /([A-Z][a-z]{2}\s+\d{4})\s*[-–]\s*([A-Z][a-z]{2}\s+\d{4}|Present)/;
    const dateMatch = line.match(datePattern);
    
    if (dateMatch) {
      console.log('📅 Found date pattern in experience');
      
      // Save previous experience if exists
      if (currentExp) {
        console.log('💾 Saving previous experience:', currentExp.role, 'at', currentExp.organization);
        experience.push(currentExp);
      }
      
      // Check if role/organization are on the same line before date
      const beforeDate = line.substring(0, dateMatch.index).trim();
      const duration = dateMatch[0];
      
      console.log('🆕 Creating new experience - Before date:', beforeDate, 'Duration:', duration);
      
      currentExp = {
        id: experience.length + 1,
        role: beforeDate || '',  // Use text before date as role
        organization: '',
        duration: duration,
        verified: false
      };
      
      // Next line might be organization or role (if role wasn't before date)
      if (lineIndex + 1 < lines.length) {
        const nextLine = lines[lineIndex + 1];
        // If we don't have a role yet, next line is role
        if (!currentExp.role) {
          currentExp.role = nextLine;
          lineIndex++;
          
          // Line after that might be organization
          if (lineIndex + 1 < lines.length && !lines[lineIndex + 1].match(datePattern)) {
            currentExp.organization = lines[lineIndex + 1];
            lineIndex++;
          }
        } else {
          // We have role, so next line is organization
          if (!nextLine.match(datePattern) && !nextLine.match(/^[•\-\*]/)) {
            currentExp.organization = nextLine;
            lineIndex++;
          }
        }
      }
    } else if (!currentExp) {
      // Line without date - might be start of experience (role title)
      // Look ahead for date in next few lines
      let foundDate = false;
      for (let j = lineIndex + 1; j < Math.min(lineIndex + 3, lines.length); j++) {
        if (lines[j].match(datePattern)) {
          foundDate = true;
          break;
        }
      }
      
      if (foundDate) {
        currentExp = {
          id: experience.length + 1,
          role: line,
          organization: '',
          duration: '',
          verified: false
        };
      }
    } else {
      // Continuation line - might be additional info
      if (!currentExp.organization && !line.match(datePattern) && !line.match(/^[•\-\*]/)) {
        currentExp.organization = line;
      }
    }
    
    lineIndex++;
  }
  
  // Save last experience
  if (currentExp) {
    experience.push(currentExp);
  }
  
  return experience.filter(exp => exp.role || exp.organization || exp.duration);
};

/**
 * Parse projects section
 * Extracts: title, organization, duration, description, technologies, link
 */
const parseProjects = (section) => {
  const projects = [];
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log('🔧 Parsing projects section:', lines.length, 'lines');
  
  let currentProject = null;
  let descriptionLines = [];
  let usedAsTitle = new Set(); // Track which line indices were used as titles
  
  // Common technology keywords to look for
  const techKeywords = [
    'python', 'java', 'javascript', 'react', 'node', 'angular', 'vue', 'django', 'flask',
    'spring', 'sql', 'mysql', 'postgresql', 'mongodb', 'firebase', 'aws', 'azure', 'gcp',
    'docker', 'kubernetes', 'html', 'css', 'typescript', 'express', 'fastapi', 'nextjs',
    'redux', 'git', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'opencv',
    'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'dart', 'flutter',
    'android', 'ios', 'reactnative', 'graphql', 'rest', 'api', 'bootstrap', 'tailwind',
    'material-ui', 'sass', 'less', 'webpack', 'vite', 'jest', 'mocha', 'cypress'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`🔍 Processing line ${i}: "${line.substring(0, 80)}..."`);
    
    // Check for Technologies line (labeled or in bullet)
    // Patterns: "Technologies: Python, React" or "Technologies - Python, React" or "Technologies Python, React"
    if (line.match(/^(Technologies|Tech Stack|Built with|Tools|Tech Used|Stack)[\s:–-]+/i)) {
      console.log('🎯 Found technology label on line:', line);
      if (currentProject) {
        const techList = line.replace(/^(Technologies|Tech Stack|Built with|Tools|Tech Used|Stack)[\s:–-]+/i, '').trim();
        const techs = techList.split(/[,;|&]/).map(t => t.trim()).filter(t => t.length > 0);
        
        console.log('🔧 Extracted tech list from label:', techList);
        console.log('🔧 Split into techs:', techs);
        
        // If technologies array already has items, merge without duplicates
        const existingTechs = new Set(currentProject.technologies.map(t => t.toLowerCase()));
        techs.forEach(tech => {
          if (!existingTechs.has(tech.toLowerCase())) {
            currentProject.technologies.push(tech);
            console.log('➕ Added tech:', tech);
          }
        });
        
        console.log('🔧 Current project technologies after merge:', currentProject.technologies);
      } else {
        console.warn('⚠️ Found technology line but no current project! Line:', line);
      }
      continue;
    }
    
    // Also check for inline tech mentions (e.g., "• Used Python, React, Node.js")
    if (currentProject && line.match(/\b(used|built|developed|implemented|utilizing|leveraging|with)\s+(with|using|in|technologies|tools)?/i)) {
      const techMatch = line.match(/\b(used|built|developed|implemented|utilizing|leveraging)\s+(with|using|in)?\s*:?\s*(.+)/i);
      if (techMatch) {
        const techList = techMatch[3];
        const techs = techList.split(/[,;|]/).map(t => t.trim()).filter(t => t.length > 0 && t.length < 50);
        currentProject.technologies.push(...techs);
        console.log('🔧 Found inline technologies:', techs);
      }
    }
    
    // Check for Link line
    if (line.match(/^Link:/i)) {
      if (currentProject) {
        const url = line.replace(/^Link:/i, '').trim();
        // Add https if not present
        currentProject.link = url.startsWith('http') ? url : `https://${url}`;
      }
      continue;
    }
    
    // Check for GitHub line
    if (line.match(/^GitHub:/i)) {
      if (currentProject) {
        const url = line.replace(/^GitHub:/i, '').trim();
        currentProject.github = url.startsWith('http') ? url : `https://${url}`;
      }
      continue;
    }
    
    // Check for Demo line
    if (line.match(/^Demo:/i)) {
      if (currentProject) {
        const url = line.replace(/^Demo:/i, '').trim();
        currentProject.demo = url.startsWith('http') ? url : `https://${url}`;
      }
      continue;
    }
    
    // Check for date pattern (Jan 2024 – Mar 2024)
    const datePattern = /([A-Z][a-z]{2}\s+\d{4})\s*[-–]\s*([A-Z][a-z]{2}\s+\d{4}|Present)/;
    const dateMatch = line.match(datePattern);
    
    if (dateMatch) {
      console.log('📅 Found date pattern, creating new project. Line:', line);
      
      // Save previous project if exists
      if (currentProject) {
        currentProject.description = descriptionLines.join(' ').trim();
        
        // Extract technologies from description if not already found
        if (currentProject.technologies.length === 0) {
          console.log('🔧 No labeled technologies found, extracting from description...');
          console.log('🔧 Title:', currentProject.title);
          console.log('🔧 Description:', currentProject.description.substring(0, 200));
          const fullText = (currentProject.title + ' ' + currentProject.description).toLowerCase();
          const foundTechs = new Set();
          
          techKeywords.forEach(keyword => {
            if (fullText.includes(keyword.toLowerCase())) {
              foundTechs.add(keyword);
            }
          });
          
          currentProject.technologies = Array.from(foundTechs);
          console.log('🔧 Extracted technologies from text:', currentProject.technologies);
        } else {
          console.log('✅ Project already has technologies from labeled extraction:', currentProject.technologies);
        }
        
        console.log('💾 Saving project:', currentProject.title, 'with', currentProject.technologies.length, 'technologies:', currentProject.technologies);
        projects.push(currentProject);
        descriptionLines = [];
      }
      
      // Extract title (everything before the date on the same line, or previous line if date is alone)
      let titlePart = line.substring(0, dateMatch.index).trim();
      
      // If title is empty, the date is on its own line - use previous line as title
      if (!titlePart && i > 0) {
        titlePart = lines[i - 1].trim();
        usedAsTitle.add(i - 1); // Mark previous line as used for title
        console.log('🔧 Date on separate line, using previous line as title:', titlePart);
      }
      
      const duration = dateMatch[0];
      
      console.log('🆕 Creating new project:', titlePart, 'Duration:', duration);
      
      // Next line might be organization
      let organization = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // Check if next line is not a bullet point or special field
        if (!nextLine.match(/^[•\-\*]|^Technologies:|^Tech Stack:|^Link:|^GitHub:|^Demo:/i)) {
          organization = nextLine;
          i++; // Skip next line since we used it as organization
        }
      }
      
      currentProject = {
        id: Date.now() + projects.length,
        title: titlePart,
        organization: organization,
        duration: duration,
        description: '',
        technologies: [],
        link: '',
        github: '',
        demo: '',
        status: 'Completed'
      };
    } else if (currentProject) {
      // Collect description lines (bullet points or regular text)
      // Skip if this line was used as a title
      if (usedAsTitle.has(i)) {
        console.log('🔧 Skipping line', i, '- used as project title');
        // Don't add to description
      } else if (line.match(/^[•\-\*]/)) {
        descriptionLines.push(line.replace(/^[•\-\*]\s*/, ''));
      } else if (!line.match(/^Technologies:|^Tech Stack:|^Link:|^GitHub:|^Demo:/i)) {
        // Only add if it's not a special field we already handled
        const isOrg = (i === 0 || lines[i-1].match(datePattern));
        if (!isOrg) {
          descriptionLines.push(line);
        }
      }
    }
  }
  
  // Save last project
  if (currentProject) {
    currentProject.description = descriptionLines.join(' ').trim();
    
    // Extract technologies from description if not already found
    if (currentProject.technologies.length === 0) {
      console.log('🔧 Last project: No labeled technologies found, extracting from description...');
      console.log('🔧 Title:', currentProject.title);
      console.log('🔧 Description:', currentProject.description.substring(0, 200));
      const fullText = (currentProject.title + ' ' + currentProject.description).toLowerCase();
      const foundTechs = new Set();
      
      techKeywords.forEach(keyword => {
        if (fullText.includes(keyword.toLowerCase())) {
          foundTechs.add(keyword);
        }
      });
      
      currentProject.technologies = Array.from(foundTechs);
      console.log('🔧 Last project extracted technologies:', currentProject.technologies);
    } else {
      console.log('✅ Last project already has technologies:', currentProject.technologies);
    }
    
    console.log('💾 Saving last project:', currentProject.title, 'with', currentProject.technologies.length, 'technologies:', currentProject.technologies);
    projects.push(currentProject);
  }
  
  console.log('✅ Parsed projects:', projects.length);
  
  if (projects.length === 0) {
    console.warn('⚠️ WARNING: No projects were created!');
    console.warn('⚠️ This might mean:');
    console.warn('  1. No date patterns found (looking for format: Jan 2024 - Mar 2024)');
    console.warn('  2. Projects section is empty or not formatted correctly');
    console.warn('  3. Check the input text format');
    console.warn('📋 Projects section received:', section.substring(0, 500));
  }
  
  projects.forEach(p => {
    console.log(`  📊 Project: ${p.title}`);
    console.log(`     - Technologies (${p.technologies.length}):`, p.technologies);
    console.log(`     - Duration: ${p.duration}`);
    console.log(`     - Description length: ${p.description?.length || 0} chars`);
  });
  
  // Clean up empty fields
  return projects.map(p => ({
    ...p,
    link: p.link || undefined,
    github: p.github || undefined,
    demo: p.demo || undefined,
  })).map(p => {
    // Remove undefined fields
    Object.keys(p).forEach(key => {
      if (p[key] === undefined || p[key] === '') {
        delete p[key];
      }
    });
    return p;
  });
};

/**
 * Parse skills section
 */
const parseSkills = (section) => {
  const technical = [];
  const soft = [];
  
  console.log('🔧 Parsing skills section:', section.substring(0, 200));
  
  // Strategy 1: Split by common delimiters
  let skillWords = section
    .split(/[\n,•\-\*\|;]+/)  // Split by various delimiters
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // Strategy 2: Further split by multiple spaces (2 or more)
  skillWords = skillWords.flatMap(s => 
    s.split(/\s{2,}/).map(x => x.trim()).filter(x => x.length > 0)
  );
  
  // Strategy 3: Split by "and" when appropriate
  skillWords = skillWords.flatMap(part => {
    if (part.includes(' and ') && part.length > 20) {
      return part.split(/\s+and\s+/i).map(x => x.trim()).filter(x => x.length > 2);
    }
    return [part];
  });
  
  // Strategy 4: If still too long, try to split by capital letters (camelCase or space before capitals)
  // This handles cases like "testing Communication Teamwork Test"
  skillWords = skillWords.flatMap(skill => {
    if (skill.length > 50 && /[a-z][A-Z]/.test(skill)) {
      // Has lowercase followed by uppercase - likely concatenated words
      console.log('🔧 Splitting by capital letters:', skill);
      
      // Split before each capital letter that follows a lowercase letter
      const parts = skill.split(/(?<=[a-z])(?=[A-Z])/);
      return parts.map(p => p.trim()).filter(p => p.length > 0);
    }
    
    // Also try splitting when we have known skill keywords followed by more text
    if (skill.length > 40) {
      const softSkillKeywords = ['Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Analytical', 'Critical Thinking'];
      for (const keyword of softSkillKeywords) {
        if (skill.includes(keyword) && skill.length > keyword.length + 5) {
          console.log('🔧 Splitting by keyword:', keyword, 'in', skill);
          // Split by the keyword, keeping the keyword
          const parts = skill.split(new RegExp(`(${keyword})`, 'i')).filter(p => p.trim().length > 0);
          return parts;
        }
      }
    }
    
    return [skill];
  });
  
  console.log('🔧 Found skill words:', skillWords.length, skillWords.slice(0, 10));
  
  const softSkillKeywords = ['communication', 'teamwork', 'leadership', 'problem', 'analytical', 'critical', 'creative', 'collaboration', 'management', 'presentation', 'interpersonal', 'organizational', 'test'];
  const technicalKeywords = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'html', 'css', 'git', 'aws', 'docker', 'kubernetes', 'programming', 'development', 'framework', 'database', 'testing', 'evaluation'];
  
  skillWords.forEach((skill, index) => {
    // Skip if skill is too long (likely not a single skill)
    if (skill.length > 100) {
      console.warn('⚠️ Skipping overly long skill:', skill.substring(0, 50));
      return;
    }
    
    // Skip if it looks like a name (all caps with optional initial)
    if (/^[A-Z]\.?\s*[A-Z]{4,}$/.test(skill)) {
      console.warn('⚠️ Skipping name-like text in skills:', skill);
      return;
    }
    
    const skillLower = skill.toLowerCase();
    const isSoftSkill = softSkillKeywords.some(keyword => skillLower.includes(keyword));
    const isTechnicalSkill = technicalKeywords.some(keyword => skillLower.includes(keyword));
    
    if (isSoftSkill) {
      soft.push({
        id: soft.length + 1,
        name: skill,
        type: 'soft',
        level: 3,
        description: ''
      });
    } else if (isTechnicalSkill || !isSoftSkill) {
      // Default to technical if unclear
      technical.push({
        id: technical.length + 1,
        name: skill,
        category: 'Technical',
        level: 3,
        verified: false
      });
    }
  });
  
  console.log('✅ Parsed skills - Technical:', technical.length, 'Soft:', soft.length);
  
  return { technical, soft };
};

/**
 * Parse certificates section
 */
const parseCertificates = (section) => {
  const certificates = [];
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log('🔧 Parsing certificates section:', lines.length, 'lines');
  
  let currentCert = null;
  let descriptionLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`🔍 Processing certificate line ${i}: "${line}"`);
    
    // Check if this looks like a new certificate (usually starts with title)
    // Certificates often have patterns like "Certificate Name | Issuer | Date"
    // or "Certificate Name - Issuer - Date"
    
    // Try to detect new certificate by looking for certificate keywords or date patterns
    const isCertStart = (
      line.match(/Certificate|Certification|Course|Training|Specialization/i) ||
      line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i) ||
      (line.length > 20 && !line.match(/^[•\-\*]/) && i === 0)
    );
    
    console.log(`  isCertStart: ${isCertStart}`);
    
    if (isCertStart && (currentCert === null || descriptionLines.length > 0)) {
      // Save previous certificate
      if (currentCert) {
        currentCert.description = descriptionLines.join(' ').trim();
        console.log('💾 Saving certificate:', currentCert.title);
        certificates.push(currentCert);
        descriptionLines = [];
      }
      
      // Parse the new certificate line
      // Try to extract: Title | Issuer | Date
      let title = line;
      let issuer = '';
      let issuedOn = '';
      
      // Check for bullet points in the title
      const bulletMatch = line.match(/^[•\-\*]\s*(.+)/);
      if (bulletMatch) {
        title = bulletMatch[1];
      }
      
      // Try to extract date
      const dateMatch = title.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i);
      if (dateMatch) {
        issuedOn = dateMatch[0];
        // Title is everything before the date
        title = line.substring(0, dateMatch.index).trim();
        // Issuer might be between title and date or after date
        const afterDate = line.substring(dateMatch.index + dateMatch[0].length).trim();
        if (afterDate) {
          issuer = afterDate;
        }
        
        // Try to extract issuer from title if it contains known platforms
        const knownIssuers = ['Coursera', 'Udemy', 'edX', 'LinkedIn', 'Google', 'Microsoft', 'Amazon', 'AWS', 'Oracle', 'Cisco', 'IBM', 'Meta', 'Facebook'];
        for (const platform of knownIssuers) {
          const platformRegex = new RegExp(`\\b${platform}\\b`, 'i');
          if (title.match(platformRegex)) {
            // Extract issuer from title
            const parts = title.split(platformRegex);
            if (parts.length > 1) {
              title = parts[0].trim();
              if (!issuer) {
                issuer = platform;
              }
            }
          }
        }
      }
      
      // Clean title - remove trailing separators and common words
      title = title.replace(/\s*[-|–]\s*$/, '').trim();
      
      // Limit title length to avoid descriptions being included
      if (title.length > 150) {
        // If title is too long, try to extract just the certificate name
        const firstSentence = title.split(/[.•]/).filter(s => s.trim().length > 0)[0];
        if (firstSentence && firstSentence.length < title.length) {
          descriptionLines.push(title.substring(firstSentence.length).trim());
          title = firstSentence.trim();
        }
      }
      
      currentCert = {
        id: certificates.length + 1,
        title: title,
        issuer: issuer,
        level: 'Professional',
        issuedOn: issuedOn,
        credentialId: '',
        link: '',
        description: ''
      };
    } else if (currentCert) {
      // This is a continuation line (description or details)
      
      // Check for issuer patterns
      if (!currentCert.issuer && line.match(/^(Coursera|Udemy|edX|LinkedIn|Google|Microsoft|Amazon|AWS|Oracle|Cisco)/i)) {
        currentCert.issuer = line;
      }
      // Check for credential ID
      else if (line.match(/Credential ID:|ID:/i)) {
        const credId = line.replace(/Credential ID:|ID:/i, '').trim();
        currentCert.credentialId = credId;
      }
      // Check for link
      else if (line.match(/^https?:\/\//)) {
        currentCert.link = line;
      }
      // Otherwise it's description
      else if (line.match(/^[•\-\*]/)) {
        descriptionLines.push(line.replace(/^[•\-\*]\s*/, ''));
      } else {
        descriptionLines.push(line);
      }
    }
  }
  
  // Save last certificate
  if (currentCert) {
    currentCert.description = descriptionLines.join(' ').trim();
    certificates.push(currentCert);
  }
  
  return certificates;
};

/**
 * Clean and validate parsed data to prevent data dumping in single fields
 */
const cleanParsedData = (data) => {
  console.log('🧹 Cleaning parsed data...');
  
  // Clean name field - ensure it's not too long
  if (data.name && data.name.length > 100) {
    console.warn('⚠️ Name field too long, extracting...');
    data.name = extractNameFromText(data.name);
  }
  
  // Validate and clean arrays
  if (Array.isArray(data.education)) {
    data.education = data.education.map(item => {
      // If degree is too long, it might contain university info - try to split
      if (item.degree && item.degree.length > 150) {
        const parts = item.degree.split(/\s+(University|College|Institute)\s+/i);
        if (parts.length > 1) {
          item.degree = parts[0].trim();
          item.university = parts.slice(1).join(' ').trim();
        } else {
          // Just truncate if we can't split
          item.degree = item.degree.substring(0, 150);
        }
      }
      return item;
    }).filter(item => item.degree && item.degree.trim().length > 0);
  }
  
  // Clean experience
  if (Array.isArray(data.experience)) {
    data.experience = data.experience
      .filter(item => {
        // Filter out entries with no role or organization
        return item.role || item.organization || item.duration;
      })
      .map(item => {
        // Truncate overly long fields
        if (item.role && item.role.length > 200) {
          item.role = item.role.substring(0, 200);
        }
        if (item.organization && item.organization.length > 150) {
          item.organization = item.organization.substring(0, 150);
        }
        return item;
      });
  }
  
  // Clean projects
  if (Array.isArray(data.projects)) {
    data.projects = data.projects
      .filter(item => item.title && item.title.trim().length > 0)
      .map(item => {
        // Truncate title if too long
        if (item.title && item.title.length > 200) {
          item.title = item.title.substring(0, 200);
        }
        // Ensure description doesn't get too long
        if (item.description && item.description.length > 500) {
          item.description = item.description.substring(0, 500);
        }
        return item;
      });
  }
  
  // Clean skills - split if multiple skills in one field
  if (Array.isArray(data.technicalSkills)) {
    const cleaned = [];
    data.technicalSkills.forEach(item => {
      if (item.name && item.name.length > 100) {
        // Likely multiple skills concatenated - try to split
        const skills = item.name.split(/[,;\n•\-]/);
        skills.forEach(skill => {
          const trimmed = skill.trim();
          if (trimmed.length > 0 && trimmed.length < 100) {
            cleaned.push({
              ...item,
              name: trimmed
            });
          }
        });
      } else if (item.name && item.name.trim().length > 0) {
        cleaned.push(item);
      }
    });
    data.technicalSkills = cleaned;
  }
  
  // Clean soft skills - split if multiple skills in one field and remove names
  if (Array.isArray(data.softSkills)) {
    const cleaned = [];
    data.softSkills.forEach(item => {
      if (item.name && item.name.length > 30) { // Changed from 100 to 30 to catch more cases
        console.log('🧹 Splitting soft skill:', item.name.substring(0, 100));
        
        // Likely multiple skills concatenated - try multiple split strategies
        // First try: split by common delimiters
        let skills = item.name.split(/[,;\n•\-\|]/);
        
        // If still long, try splitting by "and" 
        if (skills.some(s => s.length > 80)) {
          skills = skills.flatMap(s => s.split(/\s+and\s+/i));
        }
        
        // If still long, try splitting by multiple spaces (2+)
        if (skills.some(s => s.length > 60)) {
          skills = skills.flatMap(s => s.split(/\s{2,}/));
        }
        
        // NEW: If still concatenated, split by capital letters (e.g., "testingCommunicationTeamwork")
        if (skills.some(s => s.length > 40 && /[a-z][A-Z]/.test(s))) {
          console.log('🧹 Splitting by capital letters...');
          skills = skills.flatMap(s => {
            if (s.length > 40 && /[a-z][A-Z]/.test(s)) {
              return s.split(/(?<=[a-z])(?=[A-Z])/);
            }
            return [s];
          });
        }
        
        // NEW: If STILL long and has single spaces between words with capitals, split by space
        // This handles: "testing Communication Teamwork Test testtest P.DURKADEVID"
        if (skills.some(s => s.length > 30 && s.includes(' '))) {
          console.log('🧹 Splitting by single space for capitalized words...');
          skills = skills.flatMap(s => {
            if (s.length > 30 && s.includes(' ')) {
              // Split by space, then filter out common filler words
              const words = s.split(/\s+/);
              const meaningfulWords = words.filter(w => {
                // Keep words that start with capital letter or are known skill words
                return w.length > 2 && (
                  /^[A-Z]/.test(w) || 
                  ['testing', 'test', 'communication', 'teamwork', 'leadership'].some(kw => w.toLowerCase().includes(kw))
                );
              });
              return meaningfulWords.length > 0 ? meaningfulWords : [s];
            }
            return [s];
          });
        }
        
        skills.forEach(skill => {
          const trimmed = skill.trim();
          
          // Check if this looks like a name (all caps, starts with initial)
          const namePattern = /^[A-Z]\.?\s*[A-Z]{4,}$/;
          if (namePattern.test(trimmed)) {
            // This looks like a name - extract it if we don't have one yet
            if (!data.name || data.name === '') {
              data.name = trimmed;
              console.log('👤 Found name in soft skills:', trimmed);
            }
            return; // Skip adding this as a skill
          }
          
          // Only add valid skills (not too short, not too long, not a name)
          if (trimmed.length > 2 && trimmed.length < 100 && !namePattern.test(trimmed)) {
            cleaned.push({
              ...item,
              name: trimmed
            });
          }
        });
      } else if (item.name && item.name.trim().length > 0) {
        // Check if the entire skill name looks like a person's name
        const namePattern = /^[A-Z]\.?\s*[A-Z]{4,}$/;
        if (namePattern.test(item.name.trim())) {
          if (!data.name || data.name === '') {
            data.name = item.name.trim();
            console.log('👤 Found name in soft skills:', item.name.trim());
          }
        } else {
          cleaned.push(item);
        }
      }
    });
    
    console.log(`🧹 Soft skills cleaned: ${data.softSkills.length} → ${cleaned.length} items`);
    data.softSkills = cleaned;
  }
  
  // Clean certificates - ensure title and description are separate
  if (Array.isArray(data.certificates)) {
    data.certificates = data.certificates
      .filter(item => item.title && item.title.trim().length > 0)
      .map(item => {
        // If title is too long, move extra content to description
        if (item.title && item.title.length > 200) {
          const firstSentence = item.title.split(/[.•]/).filter(s => s.trim().length > 0)[0];
          if (firstSentence && firstSentence.length < item.title.length) {
            const rest = item.title.substring(firstSentence.length).trim();
            item.description = rest + (item.description ? ' ' + item.description : '');
            item.title = firstSentence.trim();
          } else {
            // Just truncate
            item.title = item.title.substring(0, 200);
          }
        }
        
        // Truncate description
        if (item.description && item.description.length > 500) {
          item.description = item.description.substring(0, 500);
        }
        
        return item;
      });
  }
  
  console.log('✅ Data cleaned');
  return data;
};

/**
 * Parse duration string into startDate and endDate
 * Example: "Jan 2024 – Mar 2024" => { startDate: "2024-01", endDate: "2024-03" }
 */
const parseDurationToDateFields = (duration) => {
  if (!duration) return { startDate: '', endDate: '' };
  
  // Month mapping
  const monthMap = {
    'jan': '01', 'january': '01',
    'feb': '02', 'february': '02',
    'mar': '03', 'march': '03',
    'apr': '04', 'april': '04',
    'may': '05',
    'jun': '06', 'june': '06',
    'jul': '07', 'july': '07',
    'aug': '08', 'august': '08',
    'sep': '09', 'sept': '09', 'september': '09',
    'oct': '10', 'october': '10',
    'nov': '11', 'november': '11',
    'dec': '12', 'december': '12'
  };
  
  // Try to match pattern: "Jan 2024 - Mar 2024" or "Jan 2024 – Mar 2024"
  const dateRangePattern = /([A-Za-z]+)\s+(\d{4})\s*[-–]\s*([A-Za-z]+)\s+(\d{4}|Present)/i;
  const match = duration.match(dateRangePattern);
  
  if (match) {
    const [_, startMonth, startYear, endMonth, endYear] = match;
    const startMonthNum = monthMap[startMonth.toLowerCase()];
    const endMonthNum = endMonth.toLowerCase() === 'present' ? '' : monthMap[endMonth.toLowerCase()];
    
    return {
      startDate: startMonthNum ? `${startYear}-${startMonthNum}` : '',
      endDate: endYear === 'Present' ? '' : (endMonthNum ? `${endYear}-${endMonthNum}` : '')
    };
  }
  
  // Try single date: "Jan 2024"
  const singleDatePattern = /([A-Za-z]+)\s+(\d{4})/i;
  const singleMatch = duration.match(singleDatePattern);
  
  if (singleMatch) {
    const [_, month, year] = singleMatch;
    const monthNum = monthMap[month.toLowerCase()];
    
    return {
      startDate: monthNum ? `${year}-${monthNum}` : '',
      endDate: ''
    };
  }
  
  return { startDate: '', endDate: '' };
};

/**
 * Add metadata (IDs, timestamps) to parsed data
 */
const addMetadata = (parsedData) => {
  const timestamp = new Date().toISOString();
  
  // Clean and validate the data first
  parsedData = cleanParsedData(parsedData);
  
  // Add IDs to arrays if missing
  if (Array.isArray(parsedData.education)) {
    parsedData.education = parsedData.education.map((item, index) => ({
      ...item,
      id: item.id || Date.now() + index,
      enabled: true,
      processing: true
    }));
  }
  
  if (Array.isArray(parsedData.training)) {
    parsedData.training = parsedData.training.map((item, index) => ({
      ...item,
      id: item.id || Date.now() + index + 1000,
      enabled: true,
      processing: true
    }));
  }
  
  if (Array.isArray(parsedData.experience)) {
    parsedData.experience = parsedData.experience.map((item, index) => {
      // Parse duration into startDate and endDate
      const dates = parseDurationToDateFields(item.duration);
      
      console.log(`📅 Experience: "${item.role}" - Duration: "${item.duration}" => Start: ${dates.startDate}, End: ${dates.endDate}`);
      
      return {
        ...item,
        id: item.id || Date.now() + index + 2000,
        startDate: dates.startDate,
        endDate: dates.endDate,
        enabled: true,
        processing: true
      };
    });
  }
  
  if (Array.isArray(parsedData.projects)) {
    parsedData.projects = parsedData.projects.map((item, index) => {
      // Normalize tech stack fields - combine into all possible field names
      const allTech = [
        ...(item.technologies || []),
        ...(item.techStack || []),
        ...(item.tech || []),
        ...(item.skills || [])
      ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
      
      // Parse duration into startDate and endDate
      const dates = parseDurationToDateFields(item.duration);
      
      console.log(`📅 Project: "${item.title}" - Duration: "${item.duration}" => Start: ${dates.startDate}, End: ${dates.endDate}`);
      
      return {
        ...item,
        id: item.id || Date.now() + index + 3000,
        startDate: dates.startDate,
        endDate: dates.endDate,
        enabled: true,
        processing: true,
        // Include all tech field variations for compatibility
        technologies: allTech,
        techStack: allTech,
        tech: allTech,
        skills: allTech,
        url: item.url || item.link || '',
        demoLink: item.demoLink || item.demo || '',
        status: item.status || 'Completed'
      };
    });
  }
  
  if (Array.isArray(parsedData.technicalSkills)) {
    parsedData.technicalSkills = parsedData.technicalSkills.map((item, index) => ({
      ...item,
      id: item.id || Date.now() + index + 4000,
      enabled: true,
      processing: true
    }));
  }
  
  if (Array.isArray(parsedData.softSkills)) {
    parsedData.softSkills = parsedData.softSkills.map((item, index) => ({
      ...item,
      id: item.id || Date.now() + index + 5000,
      enabled: true,
      processing: true
    }));
  }
  
  if (Array.isArray(parsedData.certificates)) {
    parsedData.certificates = parsedData.certificates.map((item, index) => {
      // Parse issuedOn date to YYYY-MM format if it's a string like "Jan 2024"
      let issuedOnFormatted = item.issuedOn || '';
      
      if (issuedOnFormatted && !issuedOnFormatted.match(/^\d{4}-\d{2}$/)) {
        // If not already in YYYY-MM format, try to parse it
        const parsed = parseDurationToDateFields(issuedOnFormatted);
        issuedOnFormatted = parsed.startDate || issuedOnFormatted;
      }
      
      console.log(`📅 Certificate: "${item.title}" - IssuedOn: "${item.issuedOn}" => Formatted: ${issuedOnFormatted}`);
      
      return {
        ...item,
        id: item.id || Date.now() + index + 6000,
        issuedOn: issuedOnFormatted,
        enabled: true,
        processing: true,
        status: item.status || 'pending'
      };
    });
  }
  
  // Add imported_at timestamp
  parsedData.imported_at = timestamp;
  
  // Ensure projects array exists even if empty
  if (!parsedData.projects) {
    parsedData.projects = [];
  }
  
  return parsedData;
};

/**
 * Extract actual name from text if AI put too much in name field
 */
const extractNameFromText = (text) => {
  console.log('🔍 Attempting to extract name from long text:', text.substring(0, 200));
  
  // Split into words and lines
  const lines = text.split(/[\n]+/).map(l => l.trim()).filter(l => l.length > 0);
  const words = text.split(/\s+/);
  
  // Strategy 1: Look for name pattern with proper case (like "P.DURKADEVI" or "P. Durkadevi")
  for (const line of lines) {
    // Check for pattern like "P.DURKADEVI" or "P. Durkadevi" (starts with initial)
    const initialsPattern = /^[A-Z]\.\s*[A-Z][a-z]+$/;
    const fullNamePattern = /^[A-Z][a-z]+\s+[A-Z][a-z]+$/;
    const allCapsPattern = /^[A-Z]\.\s*[A-Z]+$/;
    
    if (initialsPattern.test(line) || fullNamePattern.test(line) || allCapsPattern.test(line)) {
      console.log('✅ Found name using pattern:', line);
      return line;
    }
  }
  
  // Strategy 2: Look for words that appear to be a name (2-4 words, proper case)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineWords = line.split(/\s+/);
    
    if (lineWords.length >= 2 && lineWords.length <= 4) {
      // Check if all words start with capital letter and have mostly letters
      const isNameLike = lineWords.every(word => 
        /^[A-Z][a-z.]*$/.test(word) && word.length > 1
      );
      
      if (isNameLike && !line.includes('EMAIL') && !line.includes('PHONE') && !line.includes('CONTACT')) {
        console.log('✅ Found name-like pattern:', line);
        return line;
      }
    }
  }
  
  // Strategy 3: Find text between start and "CONTACT" or "EMAIL"
  const beforeContact = text.split(/CONTACT|EMAIL|PHONE/)[0];
  if (beforeContact && beforeContact.length < 50) {
    const cleanName = beforeContact.trim().split(/\s+/).slice(0, 4).join(' ');
    if (cleanName.length > 2 && cleanName.length < 50) {
      console.log('✅ Found name before contact section:', cleanName);
      return cleanName;
    }
  }
  
  // Strategy 4: Just take first 2-3 words that look like a name
  for (let i = 0; i < Math.min(10, words.length - 1); i++) {
    const potentialName = words.slice(i, Math.min(i + 3, words.length)).join(' ');
    if (/^[A-Z][a-z.]*(\s+[A-Z][a-z.]*)*$/.test(potentialName) && potentialName.length < 30) {
      console.log('✅ Found name in first words:', potentialName);
      return potentialName;
    }
  }
  
  // Fallback: Return first line or "Unknown"
  const fallback = lines[0]?.substring(0, 50) || 'Unknown';
  console.log('⚠️ Using fallback name:', fallback);
  return fallback;
};

/**
 * Merge parsed resume data with existing profile data
 * @param {Object} existingData - Current profile data
 * @param {Object} parsedData - Newly parsed resume data
 * @returns {Object} Merged profile data
 */
export const mergeResumeData = (existingData, parsedData) => {
  return {
    // Personal info - prefer parsed data if not empty
    name: parsedData.name || existingData.name || '',
    email: parsedData.email || existingData.email || '',
    contact_number: parsedData.contact_number || existingData.contact_number || '',
    age: parsedData.age || existingData.age || '',
    date_of_birth: parsedData.date_of_birth || existingData.date_of_birth || '',
    college_school_name: parsedData.college_school_name || existingData.college_school_name || '',
    university: parsedData.university || existingData.university || '',
    registration_number: parsedData.registration_number || existingData.registration_number || '',
    district_name: parsedData.district_name || existingData.district_name || '',
    branch_field: parsedData.branch_field || existingData.branch_field || '',
    trainer_name: parsedData.trainer_name || existingData.trainer_name || '',
    nm_id: parsedData.nm_id || existingData.nm_id || '',
    course: parsedData.course || existingData.course || '',
    alternate_number: parsedData.alternate_number || existingData.alternate_number || '',
    contact_number_dial_code: parsedData.contact_number_dial_code || existingData.contact_number_dial_code || '',
    skill: parsedData.skill || existingData.skill || '',
    
    // Arrays - merge and deduplicate
    education: mergeArrays(existingData.education, parsedData.education, 'degree'),
    training: mergeArrays(existingData.training, parsedData.training, 'course'),
    experience: mergeArrays(existingData.experience, parsedData.experience, 'organization'),
    projects: mergeArrays(existingData.projects, parsedData.projects, 'title'),
    technicalSkills: mergeArrays(existingData.technicalSkills, parsedData.technicalSkills, 'name'),
    softSkills: mergeArrays(existingData.softSkills, parsedData.softSkills, 'name'),
    certificates: mergeArrays(existingData.certificates, parsedData.certificates, 'title'),
    
    // Metadata
    imported_at: parsedData.imported_at || new Date().toISOString()
  };
};

/**
 * Merge two arrays and deduplicate based on a key
 */
const mergeArrays = (existing = [], newItems = [], key) => {
  const merged = [...existing];
  
  newItems.forEach(newItem => {
    // Check if item already exists
    const isDuplicate = existing.some(existingItem => 
      existingItem[key]?.toLowerCase() === newItem[key]?.toLowerCase()
    );
    
    if (!isDuplicate && newItem[key]) {
      merged.push(newItem);
    }
  });
  
  return merged;
};

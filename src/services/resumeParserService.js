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
  
  // Strategy 1: Find name before CONTACT section
  const beforeContact = resumeText.split(/CONTACT|EMAIL|PHONE/)[0];
  const potentialNames = beforeContact.trim().split(/\s+/).filter(w => 
    /^[A-Z][A-Za-z.]*$/.test(w) && w.length > 1
  );
  if (potentialNames.length > 0 && potentialNames.length <= 4) {
    result.name = potentialNames.join(' ');
    console.log('👤 Found name:', result.name);
  }
  
  // Strategy 2: Look for all-caps name pattern
  if (!result.name) {
    for (const line of lines) {
      if (/^[A-Z][A-Z.\s]+$/.test(line) && line.length < 40 && line.length > 3) {
        result.name = line;
        console.log('👤 Found name (caps):', result.name);
        break;
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
    if (/B\.[A-Z][a-z]+|M\.[A-Z][a-z]+|Bachelor|Master|Diploma/i.test(line)) {
      if (currentEdu) {
        education.push(currentEdu);
      }
      currentEdu = {
        id: education.length + 1,
        degree: line,
        university: '',
        department: '',
        yearOfPassing: '',
        cgpa: '',
        level: line.match(/Bachelor|B\./i) ? "Bachelor's" : "Master's",
        status: 'completed'
      };
    } else if (currentEdu) {
      // Look for university
      if (/University|College|Institute/i.test(line)) {
        currentEdu.university = line;
      }
      // Look for year
      const yearMatch = line.match(/20\d{2}/);
      if (yearMatch) {
        currentEdu.yearOfPassing = yearMatch[0];
      }
      // Look for CGPA
      const cgpaMatch = line.match(/\d+\.\d+/);
      if (cgpaMatch && !currentEdu.cgpa) {
        currentEdu.cgpa = cgpaMatch[0];
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
  
  let currentExp = null;
  for (const line of lines) {
    // Look for date patterns (Jan 2024 - Jan 2025)
    const datePattern = /([A-Z][a-z]{2}\s+\d{4})\s*[-–]\s*([A-Z][a-z]{2}\s+\d{4}|Present)/;
    if (datePattern.test(line)) {
      if (currentExp) {
        experience.push(currentExp);
      }
      currentExp = {
        id: experience.length + 1,
        role: '',
        organization: '',
        duration: line.match(datePattern)[0],
        verified: false
      };
    } else if (currentExp) {
      // First line after date is usually role
      if (!currentExp.role) {
        currentExp.role = line;
      } else if (!currentExp.organization) {
        currentExp.organization = line;
      }
    } else if (lines.indexOf(line) < lines.length - 1) {
      // Start new experience entry
      currentExp = {
        id: experience.length + 1,
        role: line,
        organization: '',
        duration: '',
        verified: false
      };
    }
  }
  
  if (currentExp) {
    experience.push(currentExp);
  }
  
  return experience;
};

/**
 * Parse projects section
 * Extracts: title, organization, duration, description, technologies, link
 */
const parseProjects = (section) => {
  const projects = [];
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentProject = null;
  let descriptionLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for Technologies line
    if (line.match(/^Technologies:/i)) {
      if (currentProject) {
        const techList = line.replace(/^Technologies:/i, '').trim();
        currentProject.technologies = techList.split(',').map(t => t.trim()).filter(t => t.length > 0);
      }
      continue;
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
      // Save previous project if exists
      if (currentProject) {
        currentProject.description = descriptionLines.join(' ').trim();
        projects.push(currentProject);
        descriptionLines = [];
      }
      
      // Extract title (everything before the date)
      const titlePart = line.substring(0, dateMatch.index).trim();
      const duration = dateMatch[0];
      
      // Next line might be organization
      let organization = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // Check if next line is not a bullet point or special field
        if (!nextLine.match(/^[•\-\*]|^Technologies:|^Link:|^GitHub:|^Demo:/i)) {
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
      if (line.match(/^[•\-\*]/)) {
        descriptionLines.push(line.replace(/^[•\-\*]\s*/, ''));
      } else if (!line.match(/^Technologies:|^Link:|^GitHub:|^Demo:/i)) {
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
    projects.push(currentProject);
  }
  
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
  
  const skillWords = section.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  const softSkillKeywords = ['communication', 'teamwork', 'leadership', 'problem', 'analytical', 'critical', 'creative'];
  
  skillWords.forEach((skill, index) => {
    const isSoftSkill = softSkillKeywords.some(keyword => skill.toLowerCase().includes(keyword));
    
    if (isSoftSkill) {
      soft.push({
        id: soft.length + 1,
        name: skill,
        type: 'soft',
        level: 3,
        description: ''
      });
    } else {
      technical.push({
        id: technical.length + 1,
        name: skill,
        category: 'Technical',
        level: 3,
        verified: false
      });
    }
  });
  
  return { technical, soft };
};

/**
 * Parse certificates section
 */
const parseCertificates = (section) => {
  const certificates = [];
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentCert = null;
  for (const line of lines) {
    if (line.length > 10 && !currentCert) {
      currentCert = {
        id: certificates.length + 1,
        title: line,
        issuer: '',
        level: 'Professional',
        issuedOn: '',
        credentialId: '',
        link: '',
        description: ''
      };
    } else if (currentCert && !currentCert.issuer) {
      currentCert.issuer = line;
      certificates.push(currentCert);
      currentCert = null;
    }
  }
  
  if (currentCert) {
    certificates.push(currentCert);
  }
  
  return certificates;
};

/**
 * Add metadata (IDs, timestamps) to parsed data
 */
const addMetadata = (parsedData) => {
  const timestamp = new Date().toISOString();
  
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
    parsedData.experience = parsedData.experience.map((item, index) => ({
      ...item,
      id: item.id || Date.now() + index + 2000,
      enabled: true,
      processing: true
    }));
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
      
      return {
        ...item,
        id: item.id || Date.now() + index + 3000,
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
    parsedData.certificates = parsedData.certificates.map((item, index) => ({
      ...item,
      id: item.id || Date.now() + index + 6000,
      enabled: true,
      processing: true,
      status: item.status || 'pending'
    }));
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

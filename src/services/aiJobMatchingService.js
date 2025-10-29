/**
 * AI Job Matching Service
 * Uses OpenAI to match student profiles with job opportunities
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Rate limiting configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

// Cache for AI responses (simple in-memory cache)
const matchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Match student profile with opportunities using AI
 * @param {Object} studentProfile - Student profile data with skills, education, training, experience
 * @param {Array} opportunities - Array of job opportunities from database
 * @param {number} topN - Number of top matches to return (default: 3)
 * @returns {Promise<Array>} Top N matched jobs with scores and reasons
 */
export async function matchJobsWithAI(studentProfile, opportunities, topN = 3) {
  try {
    console.log('🤖 AI Job Matching: Starting analysis...');
    console.log('📊 Student Profile received:', {
      hasProfile: !!studentProfile,
      profileKeys: studentProfile ? Object.keys(studentProfile) : [],
      hasNestedProfile: !!studentProfile?.profile,
      nestedProfileKeys: studentProfile?.profile ? Object.keys(studentProfile.profile) : []
    });
    console.log('💼 Total Opportunities:', opportunities?.length || 0);

    // Validate inputs
    if (!studentProfile) {
      console.warn('⚠️ No student profile provided');
      return [];
    }

    if (!opportunities || opportunities.length === 0) {
      console.warn('⚠️ No opportunities available');
      return [];
    }

    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to .env file');
    }

    // Extract student profile data
    console.log('🔄 Extracting student data from profile...');
    const studentData = extractStudentData(studentProfile);
    
    // Debug: Log extracted student data
    console.log('📋 Extracted Student Data:', {
      name: studentData.name,
      department: studentData.department,
      technical_skills_count: studentData.technical_skills.length,
      technical_skills: studentData.technical_skills.map(s => s.name),
      soft_skills_count: studentData.soft_skills.length,
      projects_count: studentData.projects.length,
      training_count: studentData.training.length,
      experience_count: studentData.experience.length,
      certificates_count: studentData.certificates.length
    });
    
    // Prepare opportunities data for AI analysis
    const opportunitiesData = opportunities.map(opp => ({
      id: opp.id,
      job_title: opp.job_title || opp.title,
      company_name: opp.company_name || opp.company,
      department: opp.department,
      employment_type: opp.employment_type,
      location: opp.location,
      mode: opp.mode,
      experience_level: opp.experience_level,
      experience_required: opp.experience_required,
      skills_required: opp.skills_required,
      requirements: opp.requirements,
      responsibilities: opp.responsibilities,
      description: opp.description,
      stipend_or_salary: opp.stipend_or_salary,
      deadline: opp.deadline
    }));

    // Create AI prompt
    const prompt = createMatchingPrompt(studentData, opportunitiesData, topN);

    console.log('🚀 Sending request to OpenRouter...');
    console.log('🔑 API Key present:', !!OPENAI_API_KEY);
    console.log('📧 User identifier:', studentProfile?.email || studentProfile?.profile?.email || 'anonymous');

    // Call OpenAI API via OpenRouter
    const requestBody = {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career counselor and job matching AI. Your task is to analyze student profiles and match them with the most suitable job opportunities based on their skills, education, training, and experience.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    console.log('📤 Request body prepared, making fetch call...');

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'HTTP-Referer': window.location.origin || 'http://localhost:3001',
        'X-Title': 'SkillPassport Job Matching'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response received, status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('❌ OpenRouter API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // More specific error message
      if (response.status === 401) {
        throw new Error('API authentication failed. Please verify your OpenRouter API key is valid and active.');
      }
      
      throw new Error(`OpenRouter API error: ${errorData.error?.message || errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ AI Response received successfully');
    console.log('📊 Response data:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      firstChoice: data.choices?.[0],
      usage: data.usage
    });

    // Parse AI response
    const aiContent = data.choices[0]?.message?.content;
    console.log('📝 AI Content received:', aiContent?.substring(0, 500) + '...');
    
    if (!aiContent) {
      console.error('❌ No content in AI response');
      throw new Error('No content in AI response');
    }

    // Extract JSON from AI response
    console.log('🔍 Parsing AI response for job matches...');
    const matches = parseAIResponse(aiContent);
    console.log('🎯 Matched Jobs Count:', matches.length);
    console.log('🎯 Matched Jobs Details:', matches);

    // Safety check: If AI returned no matches, create basic matches from available opportunities
    if (!matches || matches.length === 0) {
      console.warn('⚠️ AI returned no matches, creating fallback matches...');
      const fallbackMatches = opportunities.slice(0, topN).map((opp, idx) => ({
        job_id: opp.id,
        job_title: opp.job_title || opp.title,
        company_name: opp.company_name || opp.company,
        match_score: 50 - (idx * 5), // Decreasing scores: 50, 45, 40
        match_reason: `This is an available opportunity in ${opp.department || 'your field'}. Consider applying to gain experience and expand your skills.`,
        key_matching_skills: studentData.technical_skills.slice(0, 3).map(s => s.name),
        skills_gap: [],
        recommendation: 'Review the job requirements and consider this as a learning opportunity.'
      }));
      
      // Enrich with opportunity data
      const enrichedFallbackMatches = fallbackMatches.map(match => {
        const fullOpportunity = opportunities.find(opp => opp.id === match.job_id);
        return {
          ...match,
          opportunity: fullOpportunity
        };
      });
      
      console.log('✨ Returning fallback matches:', enrichedFallbackMatches.length);
      return enrichedFallbackMatches;
    }

    // Enrich matches with full opportunity data
    const enrichedMatches = matches.map(match => {
      const fullOpportunity = opportunities.find(opp => opp.id === match.job_id);
      return {
        ...match,
        opportunity: fullOpportunity
      };
    }).filter(match => match.opportunity); // Filter out any matches without opportunity data

    console.log('✨ Final Enriched Matches:', enrichedMatches);
    return enrichedMatches;

  } catch (error) {
    console.error('❌ AI Job Matching Error:', error);
    throw error;
  }
}

/**
 * Extract relevant student data from profile
 * @param {Object} studentProfile - Raw student profile
 * @returns {Object} Extracted student data
 */
function extractStudentData(studentProfile) {
  const profile = studentProfile?.profile || {};
  
  // Debug log the raw profile structure
  console.log('🔍 Raw Student Profile Structure:', {
    hasProfile: !!studentProfile?.profile,
    profileKeys: Object.keys(profile),
    technicalSkillsType: typeof profile.technicalSkills,
    technicalSkillsValue: profile.technicalSkills,
    skillType: typeof profile.skill,
    skillValue: profile.skill,
    courseValue: profile.course,
    branchField: profile.branch_field
  });
  
  // Extract technical skills from various possible field names
  let technicalSkills = [];
  if (Array.isArray(profile.technicalSkills)) {
    technicalSkills = profile.technicalSkills;
  } else if (Array.isArray(profile.technical_skills)) {
    technicalSkills = profile.technical_skills;
  } else if (Array.isArray(profile.skills)) {
    technicalSkills = profile.skills;
  } else if (Array.isArray(profile.skill)) {
    technicalSkills = profile.skill;
  } else if (typeof profile.skill === 'string' && profile.skill) {
    // Handle single skill string - split by comma or treat as one skill
    technicalSkills = profile.skill.includes(',') 
      ? profile.skill.split(',').map(s => s.trim()) 
      : [profile.skill];
  }
  
  // Also add course as a skill if it exists
  if (profile.course && typeof profile.course === 'string') {
    technicalSkills.push(profile.course);
  }
  
  // Extract soft skills
  let softSkills = [];
  if (Array.isArray(profile.softSkills)) {
    softSkills = profile.softSkills;
  } else if (Array.isArray(profile.soft_skills)) {
    softSkills = profile.soft_skills;
  }
  
  return {
    name: studentProfile.name || profile.name || 'Student',
    department: studentProfile.department || profile.branch_field || profile.department,
    university: studentProfile.university || profile.university,
    year_of_passing: studentProfile.year_of_passing || profile.year_of_passing,
    cgpa: studentProfile.cgpa || profile.cgpa,
    
    // Technical Skills
    technical_skills: technicalSkills.map(skill => ({
      name: skill.name || skill.skill_name || skill,
      level: skill.level || skill.proficiency || 3,
      category: skill.category || skill.type || 'General'
    })),
    
    // Soft Skills
    soft_skills: softSkills.map(skill => ({
      name: skill.name || skill.skill_name || skill,
      level: skill.level || 3,
      type: skill.type || 'General'
    })),
    
    // Education
    education: (profile.education || []).map(edu => ({
      degree: edu.degree,
      department: edu.department,
      university: edu.university,
      year_of_passing: edu.year_of_passing,
      cgpa: edu.cgpa,
      level: edu.level,
      status: edu.status
    })),
    
    // Training/Courses
    training: (profile.training || []).map(train => ({
      course: train.course,
      status: train.status,
      progress: train.progress,
      start_date: train.start_date,
      end_date: train.end_date
    })),
    
    // Experience
    experience: (profile.experience || []).map(exp => ({
      role: exp.role,
      organization: exp.organization,
      duration: exp.duration,
      description: exp.description,
      is_current: exp.is_current,
      start_date: exp.start_date,
      end_date: exp.end_date
    })),
    
    // Projects
    projects: (profile.projects || []).map(proj => ({
      name: proj.name || proj.title,
      description: proj.description,
      technologies: proj.technologies || proj.tech || [],
      link: proj.link || proj.url
    })),
    
    // Certificates
    certificates: (profile.certificates || []).map(cert => ({
      name: cert.name || cert.title,
      issuer: cert.issuer || cert.organization,
      issue_date: cert.issue_date || cert.date,
      description: cert.description
    }))
  };
}

/**
 * Create AI matching prompt
 * @param {Object} studentData - Extracted student data
 * @param {Array} opportunities - Job opportunities
 * @param {number} topN - Number of matches to return
 * @returns {string} AI prompt
 */
function createMatchingPrompt(studentData, opportunities, topN) {
  return `
You are analyzing a student profile to find the best job matches from available opportunities.

**STUDENT PROFILE:**
Name: ${studentData.name}
Department/Field: ${studentData.department}
University: ${studentData.university}
Year of Passing: ${studentData.year_of_passing}
CGPA: ${studentData.cgpa}

**CRITICAL**: This student is from **${studentData.department}** background. PRIORITIZE jobs that match this field/domain!

Technical Skills & Expertise (${studentData.technical_skills.length}):
${studentData.technical_skills.map(s => `- ${s.name} (Level: ${s.level}/5)${s.category ? ` [${s.category}]` : ''}`).join('\n') || '- None listed'}

Soft Skills (${studentData.soft_skills.length}):
${studentData.soft_skills.map(s => `- ${s.name}${s.type ? ` (${s.type})` : ''}`).join('\n') || '- None listed'}

Education:
${studentData.education.map(e => `- ${e.degree} in ${e.department} from ${e.university} (${e.year_of_passing})`).join('\n') || '- See above'}

Training/Courses Completed or Ongoing:
${studentData.training.map(t => `- ${t.course} (${t.status}, ${t.progress || 0}% complete)`).join('\n') || '- None listed'}

Work Experience:
${studentData.experience.map(e => `- ${e.role} at ${e.organization} (${e.duration})${e.is_current ? ' [Current]' : ''}`).join('\n') || '- No experience yet'}

Projects:
${studentData.projects.map(p => `- ${p.name}: ${p.description}`).join('\n') || '- None listed'}

Certificates:
${studentData.certificates.map(c => `- ${c.name} by ${c.issuer}`).join('\n') || '- None listed'}

---

**AVAILABLE JOB OPPORTUNITIES (${opportunities.length} total):**

${opportunities.map((opp, idx) => `
${idx + 1}. ID: ${opp.id}
   Job Title: ${opp.job_title}
   Company: ${opp.company_name}
   Department: ${opp.department}
   Employment Type: ${opp.employment_type}
   Location: ${opp.location} (${opp.mode || 'Not specified'})
   Experience Level: ${opp.experience_level || opp.experience_required || 'Not specified'}
   Skills Required: ${JSON.stringify(opp.skills_required)}
   Requirements: ${JSON.stringify(opp.requirements)}
   Responsibilities: ${JSON.stringify(opp.responsibilities)}
   Description: ${opp.description?.substring(0, 200) || 'N/A'}
   Salary/Stipend: ${opp.stipend_or_salary || 'Not disclosed'}
   Deadline: ${opp.deadline || 'Open'}
`).join('\n---\n')}

---

**TASK:**
Analyze the student profile against ALL ${opportunities.length} job opportunities and select the TOP ${topN} BEST MATCHES.

**YOUR GOAL: ALWAYS RETURN ${topN} JOBS - Never return empty results!**

**CRITICAL MATCHING RULES:**
1. **RESPECT THE STUDENT'S FIELD FIRST**: Match jobs to their educational background and course!
   - Food Science/Quality Management student → Food Safety, Quality Analyst, QC jobs
   - Botany student → Agriculture, Food, Research, Lab jobs
   - Computer Science student → Software, Developer, IT jobs
   
2. **DON'T MISMATCH FIELDS**: 
   - Don't suggest Developer jobs to non-technical students unless they have programming skills
   - Don't suggest Food Safety jobs to IT students
   
3. **Consider Domain Skills**: Skills like "Sampling", "Inspection", "Quality Management" are VALUABLE - match to QA/QC/Food Safety roles!

**MATCHING STRATEGY (in priority order):**
1. **Field/Domain Match (80-100% score)**: Jobs in SAME field as student's department/course
2. **Related Field (60-79% score)**: Jobs in adjacent/related industries  
3. **Transferable Skills (40-59% score)**: Jobs where student's domain skills transfer
4. **Entry Level General (30-39% score)**: Only if no relevant jobs exist

**MATCHING CRITERIA:**
1. **Field & Domain Alignment (50% weight)**: Does the job match student's educational field and course?
2. **Skills Match (30% weight)**: Student's actual skills (technical AND domain skills like Quality, Sampling, etc.)
3. **Industry Alignment (15% weight)**: Same or related industry
4. **Experience Level (5% weight)**: Appropriate for student's level

**SCORING GUIDELINES:**
- **90-100%**: Perfect match - Student has 80%+ of required skills
- **75-89%**: Strong match - Student has 60-79% of required skills OR related skills
- **60-74%**: Good match - Student has 40-59% of required skills OR transferable skills
- **50-59%**: Moderate match - Related field/industry, some skill overlap
- **30-49%**: Growth opportunity - Student can learn, has foundational skills
- **Below 30%**: Only if no better options exist

**IMPORTANT RULES:**
1. **MUST return exactly ${topN} jobs** - Never return empty array
2. If perfect matches don't exist, find the BEST available matches
3. Consider related technologies (e.g., if job needs React and student knows Angular, that's related)
4. Consider transferable skills (e.g., problem-solving, coding, analysis)
5. Look at the student's projects and training to find relevant experience
6. Be creative but honest in matching

**OUTPUT FORMAT:**
Return ONLY a valid JSON array with exactly ${topN} matches, ordered by match score (highest first).

[
  {
    "job_id": <number>,
    "job_title": "<exact job title>",
    "company_name": "<exact company name>",
    "match_score": <number 30-100>,
    "match_reason": "<Explain the match - be specific about skills/technologies that align or are related>",
    "key_matching_skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
    "skills_gap": ["<missing skill 1>", "<missing skill 2>"] or [],
    "recommendation": "<Honest advice - mention if it's a perfect fit, growth opportunity, or what to learn>"
  }
]

**CRITICAL:**
- Return ONLY the JSON array, no additional text
- All job_id values must be valid (from the opportunities list)
- Be realistic with scores but find the BEST ${topN} matches available
- key_matching_skills can include related/transferable skills
- Always explain WHY you chose each job, even if it's not a perfect match
- If a student has limited skills, focus on entry-level roles and learning potential
`;
}

/**
 * Parse AI response to extract job matches
 * @param {string} aiContent - Raw AI response
 * @returns {Array} Parsed job matches
 */
function parseAIResponse(aiContent) {
  try {
    console.log('🔍 Attempting to parse AI response...');
    
    // Try to find JSON array in the response
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ No JSON array found in AI response');
      console.error('📄 AI Content preview:', aiContent.substring(0, 500));
      return [];
    }

    console.log('✅ Found JSON pattern in response');
    const matches = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!Array.isArray(matches)) {
      console.error('❌ Parsed content is not an array');
      return [];
    }

    console.log(`✅ Successfully parsed ${matches.length} matches from AI`);

    return matches.map(match => ({
      job_id: match.job_id,
      job_title: match.job_title,
      company_name: match.company_name,
      match_score: match.match_score,
      match_reason: match.match_reason,
      key_matching_skills: match.key_matching_skills || [],
      skills_gap: match.skills_gap || [],
      recommendation: match.recommendation
    }));

  } catch (error) {
    console.error('❌ Error parsing AI response:', error);
    console.error('📄 AI Content that failed to parse:', aiContent?.substring(0, 1000));
    return [];
  }
}

export default {
  matchJobsWithAI
};

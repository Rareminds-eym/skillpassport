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
    // Get student identifier for logging and caching
    const studentId = studentProfile?.id || studentProfile?.email || studentProfile?.profile?.email || 'unknown';
    const studentEmail = studentProfile?.email || studentProfile?.profile?.email || 'unknown@email.com';
    
    console.log('🤖 AI Job Matching: Starting analysis...');
    console.log('👤 Matching for Student:', {
      id: studentId,
      email: studentEmail,
      name: studentProfile?.name || studentProfile?.profile?.name || 'Unknown'
    });
    console.log('📊 Student Profile received:', {
      hasProfile: !!studentProfile,
      profileKeys: studentProfile ? Object.keys(studentProfile) : [],
      hasNestedProfile: !!studentProfile?.profile,
      nestedProfileKeys: studentProfile?.profile ? Object.keys(studentProfile.profile) : []
    });
    console.log('💼 Total Opportunities:', opportunities?.length || 0);
    
    // Create cache key specific to this student and opportunities
    const opportunitiesHash = opportunities.map(o => o.id).sort().join(',');
    const cacheKey = `${studentId}_${opportunitiesHash}_${topN}`;
    
    // Check cache
    const cached = matchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Using cached matches for student:', studentEmail);
      return cached.matches;
    }

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
    // Note: skills_required, requirements, responsibilities are JSONB fields from database
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
      // JSONB fields - already parsed as JS objects/arrays from Supabase
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
    console.log('📧 Matching for student:', studentEmail);
    console.log('🎯 Student Department:', studentData.department);
    console.log('🛠️ Student Skills:', studentData.technical_skills.map(s => s.name).join(', '));

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
      
      // Cache fallback matches too
      matchCache.set(cacheKey, {
        matches: enrichedFallbackMatches,
        timestamp: Date.now()
      });
      
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

    // Warning: Check for cross-field matching (low scores might indicate database issue)
    const averageScore = enrichedMatches.reduce((sum, m) => sum + m.match_score, 0) / enrichedMatches.length;
    if (averageScore < 40) {
      console.warn('⚠️ WARNING: Low average match score (' + averageScore.toFixed(1) + '%)');
      console.warn('📌 Student field:', studentData.department);
      console.warn('📌 Student skills:', studentData.technical_skills.map(s => s.name).join(', '));
      console.warn('📌 Matched jobs:', enrichedMatches.map(m => m.job_title).join(', '));
      console.warn('💡 Possible issue: No jobs in database match the student\'s field. Consider adding more diverse opportunities.');
    }

    console.log('✨ Final Enriched Matches:', enrichedMatches);
    console.log('💾 Caching matches for student:', studentEmail);
    
    // Cache the results
    matchCache.set(cacheKey, {
      matches: enrichedMatches,
      timestamp: Date.now()
    });
    
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
 * Format JSONB field for AI prompt
 * Handles arrays, objects, and strings from JSONB fields
 * @param {*} field - JSONB field value (can be array, object, string, or null)
 * @param {string} type - Type hint ('array', 'object', 'string')
 * @returns {string} Formatted string for prompt
 */
function formatJSONBField(field, type = 'array') {
  if (!field) return 'Not specified';
  
  // If it's already a string, return it
  if (typeof field === 'string') return field;
  
  // If it's an array
  if (Array.isArray(field)) {
    if (field.length === 0) return 'None';
    // Join array items with commas
    return field.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        // Handle objects in array (e.g., {skill: "JavaScript", level: "intermediate"})
        return Object.values(item).join(': ');
      }
      return String(item);
    }).join(', ');
  }
  
  // If it's an object
  if (typeof field === 'object' && field !== null) {
    // Convert object to readable format
    return Object.entries(field)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
  
  // Fallback to JSON.stringify for complex structures
  return JSON.stringify(field);
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
   Skills Required: ${formatJSONBField(opp.skills_required, 'array')}
   Requirements: ${formatJSONBField(opp.requirements, 'array')}
   Responsibilities: ${formatJSONBField(opp.responsibilities, 'array')}
   Description: ${opp.description?.substring(0, 200) || 'N/A'}
   Salary/Stipend: ${opp.stipend_or_salary || 'Not disclosed'}
   Deadline: ${opp.deadline || 'Open'}
`).join('\n---\n')}

---

**TASK:**
Analyze the student profile against ALL ${opportunities.length} job opportunities and select the TOP ${topN} BEST MATCHES.

**CRITICAL INSTRUCTIONS:**

1. **FIELD MATCH IS MANDATORY FOR SCORES ABOVE 50%**
   - A student from Food Science/Botany/Quality Management CANNOT get >50% match for Developer/IT jobs
   - A student from Computer Science CANNOT get >50% match for Food Safety/Agriculture jobs
   - Cross-field matching is ONLY allowed if match score is ≤40%

2. **STRICT SCORING RULES:**
   - 80-100%: Perfect field match + has 80%+ required skills
   - 60-79%: Same field + has 50-79% required skills
   - 40-59%: Related field OR transferable domain skills
   - 20-39%: Different field but entry-level learning opportunity
   - Below 20%: Completely mismatched - DO NOT RECOMMEND

3. **EXAMPLES OF CORRECT MATCHING:**
   - Food Science student with HACCP → Food Safety Quality Analyst (90%)
   - Food Science student with HACCP → Quality Control Inspector (85%)
   - Food Science student with HACCP → Developer Job (MAX 30% - wrong field!)
   - Computer Science student → Software Developer (90%)
   - Computer Science student → Food Safety Job (MAX 25% - wrong field!)

4. **IF NO GOOD MATCHES EXIST:**
   - If all jobs are in different fields, assign scores ≤35%
   - Be HONEST in match_reason: "This job is in a different field..."
   - Clearly state in recommendation: "Consider exploring jobs in your field (Food Science/Quality)"

**YOUR GOAL:**
Return ${topN} jobs, but BE HONEST about poor matches. Low scores (20-35%) are acceptable when no good matches exist!**

**CRITICAL MATCHING RULES:**
1. **FIELD ALIGNMENT IS MOST IMPORTANT (60% of score)**
   - Food Science/Quality Management/Botany → Food Safety, Quality Analyst, QC, Agriculture, Research
   - Computer Science/IT → Software, Developer, IT Support, Web Development
   - Mechanical/Electrical → Engineering, Manufacturing, Design
   - NEVER give high scores (>50%) to jobs outside student's field!
   
2. **RECOGNIZE DOMAIN-SPECIFIC SKILLS**: 
   - HACCP, Food Safety, Quality Management, Sampling, Inspection → FOOD/QC ROLES
   - JavaScript, React, Python, Git → DEVELOPER/IT ROLES
   - These are NOT transferable across fields!
   
3. **BE STRICT ABOUT MISMATCHES**: 
   - Food Science student → Developer job = MAX 30% (different field)
   - Developer → Food Safety job = MAX 25% (different field)
   - Only allow cross-field if it's entry-level general role (admin, sales, etc.)

**MATCHING STRATEGY (in strict priority order):**
1. **Perfect Field Match (75-100% score)**: Job department/field EXACTLY matches student's education
   - Food Safety job for Food Science student
   - Developer job for CS student
   
2. **Related Field Match (50-74% score)**: Job is in adjacent/complementary field
   - Agriculture/Research for Botany student
   - QA/Testing for CS student with no coding preference
   
3. **Transferable Skills (30-49% score)**: Different field but some skills apply
   - Entry-level analyst role for any background
   - General business roles
   
4. **Learning Opportunity (20-29% score)**: Completely different field
   - ONLY if no relevant jobs exist
   - MUST clearly state "This is not in your field"

**SCORING CRITERIA:**
1. **Field & Department Match (60% weight)** - MOST IMPORTANT!
2. **Skills Match (25% weight)** - Domain-specific skills must match
3. **Industry Alignment (10% weight)** - Same or related industry
4. **Experience Level (5% weight)** - Appropriate for student's level

**STRICT SCORING GUIDELINES:**
- **90-100%**: Perfect match - Same field + student has 80%+ required skills
- **75-89%**: Strong match - Same field + student has 60-79% required skills  
- **50-74%**: Good match - Related field OR same field with 40-59% skills
- **30-49%**: Weak match - Different field but transferable skills
- **20-29%**: Poor match - Different field, entry-level opportunity only
- **Below 20%**: DO NOT RECOMMEND - Completely unsuitable
4. **Experience Level (5% weight)**: Appropriate for student's level

**SCORING GUIDELINES:**
- **90-100%**: Perfect match - Student has 80%+ of required skills
- **75-89%**: Strong match - Student has 60-79% of required skills OR related skills
- **60-74%**: Good match - Student has 40-59% of required skills OR transferable skills
- **50-59%**: Moderate match - Related field/industry, some skill overlap
- **30-49%**: Growth opportunity - Student can learn, has foundational skills
- **Below 30%**: Only if no better options exist

**IMPORTANT RULES:**
1. **BE HONEST ABOUT POOR MATCHES**
   - If no jobs match the student's field, assign low scores (20-35%)
   - Clearly state in match_reason: "This position is in a different field (IT/Development) than your background (Food Science/Botany)"
   - In recommendation, suggest: "Consider exploring opportunities in Food Safety, Quality Control, or Agriculture that match your qualifications"

2. **NEVER INFLATE SCORES**
   - A Food Science student CANNOT get >35% for a Developer job
   - A CS student CANNOT get >30% for a Food Safety job
   - Be realistic and helpful, not misleading

3. **FIELD-SPECIFIC EXAMPLES:**
   - Student: Food Science, Skills: HACCP, Quality Management
     * Food Safety Quality Analyst → Score: 90-95% (Perfect match!)
     * Quality Control Inspector → Score: 85-90% (Excellent match!)
     * Developer → Score: MAX 25% (Wrong field - DO NOT recommend unless no other options)
   
   - Student: Computer Science, Skills: JavaScript, React
     * Software Developer → Score: 90-95% (Perfect match!)
     * Frontend Developer → Score: 85-90% (Excellent match!)
     * Food Safety → Score: MAX 20% (Wrong field - DO NOT recommend unless no other options)

4. **CROSS-FIELD MATCHING IS RARE**
   - Only valid for: HR, Admin, Sales, Customer Service (general roles)
   - Technical roles (Developer, QA Inspector, etc.) REQUIRE matching education

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

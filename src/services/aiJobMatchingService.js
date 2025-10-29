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
    console.log('📊 Student Profile:', studentProfile);
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
    const studentData = extractStudentData(studentProfile);
    
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

    console.log('🚀 Sending request to OpenAI...');

    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Student Job Matching'
      },
      body: JSON.stringify({
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
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ AI Response received:', data);

    // Parse AI response
    const aiContent = data.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    // Extract JSON from AI response
    const matches = parseAIResponse(aiContent);
    console.log('🎯 Matched Jobs:', matches);

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
  
  return {
    name: studentProfile.name || profile.name || 'Student',
    department: studentProfile.department || profile.branch_field || profile.department,
    university: studentProfile.university,
    year_of_passing: studentProfile.year_of_passing,
    cgpa: studentProfile.cgpa,
    
    // Technical Skills
    technical_skills: profile.technicalSkills?.map(skill => ({
      name: skill.name,
      level: skill.level,
      category: skill.category
    })) || [],
    
    // Soft Skills
    soft_skills: profile.softSkills?.map(skill => ({
      name: skill.name,
      level: skill.level,
      type: skill.type
    })) || [],
    
    // Education
    education: profile.education?.map(edu => ({
      degree: edu.degree,
      department: edu.department,
      university: edu.university,
      year_of_passing: edu.year_of_passing,
      cgpa: edu.cgpa,
      level: edu.level,
      status: edu.status
    })) || [],
    
    // Training/Courses
    training: profile.training?.map(train => ({
      course: train.course,
      status: train.status,
      progress: train.progress,
      start_date: train.start_date,
      end_date: train.end_date
    })) || [],
    
    // Experience
    experience: profile.experience?.map(exp => ({
      role: exp.role,
      organization: exp.organization,
      duration: exp.duration,
      description: exp.description,
      is_current: exp.is_current,
      start_date: exp.start_date,
      end_date: exp.end_date
    })) || [],
    
    // Projects
    projects: profile.projects?.map(proj => ({
      name: proj.name,
      description: proj.description,
      technologies: proj.technologies,
      link: proj.link
    })) || [],
    
    // Certificates
    certificates: profile.certificates?.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      issue_date: cert.issue_date,
      description: cert.description
    })) || []
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
Department: ${studentData.department}
University: ${studentData.university}
Year of Passing: ${studentData.year_of_passing}
CGPA: ${studentData.cgpa}

Technical Skills (${studentData.technical_skills.length}):
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

**MATCHING CRITERIA (in order of importance):**
1. **Technical Skills Match**: How well do the student's technical skills align with job requirements?
2. **Educational Background**: Does the student's department/degree match the job's department/field?
3. **Experience Level**: Is the student's experience appropriate for the role?
4. **Training & Certifications**: Do completed courses/certs align with job needs?
5. **Career Growth Potential**: Will this job help the student grow based on their profile?
6. **Location & Work Mode**: Consider student preferences if evident from profile

**OUTPUT FORMAT:**
Return ONLY a valid JSON array with exactly ${topN} matches, ordered by match score (highest first).

[
  {
    "job_id": <number>,
    "job_title": "<exact job title>",
    "company_name": "<exact company name>",
    "match_score": <number 0-100>,
    "match_reason": "<2-3 sentences explaining why this is a great match, highlighting specific skills/qualifications>",
    "key_matching_skills": ["skill1", "skill2", "skill3"],
    "recommendation": "<Brief advice for the student about this opportunity>"
  }
]

**IMPORTANT:**
- Return ONLY the JSON array, no additional text
- Ensure all job_id values are valid (from the list above)
- Match scores should be realistic (60-95 range typically)
- Focus on concrete matches, not just general fit
- Be specific about WHY each job matches
`;
}

/**
 * Parse AI response to extract job matches
 * @param {string} aiContent - Raw AI response
 * @returns {Array} Parsed job matches
 */
function parseAIResponse(aiContent) {
  try {
    // Try to find JSON array in the response
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ No JSON array found in AI response');
      return [];
    }

    const matches = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!Array.isArray(matches)) {
      console.error('❌ AI response is not an array');
      return [];
    }

    return matches.map(match => ({
      job_id: match.job_id,
      job_title: match.job_title,
      company_name: match.company_name,
      match_score: match.match_score,
      match_reason: match.match_reason,
      key_matching_skills: match.key_matching_skills || [],
      recommendation: match.recommendation
    }));

  } catch (error) {
    console.error('❌ Error parsing AI response:', error);
    console.error('📄 AI Content:', aiContent);
    return [];
  }
}

export default {
  matchJobsWithAI
};

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Career Path Generator',
  },
});

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  dept: string;
  college: string;
  currentCgpa?: number;
  ai_score_overall?: number;
  skills?: string[];
  certificates?: string[];
  experience?: string[];
  trainings?: string[];
  interests?: string[];
}

export interface CareerPathStep {
  roleTitle: string;
  level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
  timeline: string;
  estimatedTimeline: string;
  description: string;
  skillsNeeded: string[];
  skillsToGain: string[];
  learningResources: string[];
  salaryRange?: string;
  keyResponsibilities?: string[];
}

export interface CareerPathResponse {
  studentName: string;
  currentRole: string;
  careerGoal: string;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  recommendedPath: CareerPathStep[];
  alternativePaths: string[];
  actionItems: string[];
  nextSteps: string[];
  generatedAt: string;
}

const CAREER_PATH_SYSTEM_PROMPT = `You are an expert career counsellor and AI career path advisor specializing in student career development. Your role is to analyze student profiles and generate comprehensive, personalized career development paths.

Analyze the student based on:
1. **Skill-Based Roles**: Match their technical skills to relevant job roles and positions
2. **Interest Alignment**: Consider their stated interests and career aspirations
3. **Skill Gap Analysis**: Identify missing skills needed for target roles
4. **Development Roadmap**: Create a step-by-step skill development plan
5. **Salary Expectations**: Provide realistic salary ranges for each career stage

Generate career paths that are:
- Realistic and achievable based on current profile
- Aligned with industry trends and job market demands (2024-2025)
- Practical with specific skill gaps and development areas
- Actionable with concrete next steps and learning resources
- Include salary expectations for each role level
- Diversified with alternative career directions

Always format your response as valid JSON. Be specific, encouraging, and data-driven with current market insights.`;

function buildStudentProfileContext(student: StudentProfile): string {
  let context = `\n=== STUDENT PROFILE ===\n`;
  context += `Name: ${student.name}\n`;
  context += `Email: ${student.email}\n`;
  context += `Department/Field: ${student.dept}\n`;
  context += `College/University: ${student.college}\n`;
  
  if (student.currentCgpa) {
    context += `Current CGPA: ${student.currentCgpa}/4.0\n`;
  }
  
  if (student.ai_score_overall !== undefined) {
    context += `AI Assessment Score: ${student.ai_score_overall}%\n`;
  }
  
  if (student.skills && student.skills.length > 0) {
    context += `\nSkills:\n`;
    student.skills.forEach(skill => {
      context += `  • ${skill}\n`;
    });
  }
  
  if (student.certificates && student.certificates.length > 0) {
    context += `\nCertificates & Credentials:\n`;
    student.certificates.forEach(cert => {
      context += `  • ${cert}\n`;
    });
  }
  
  if (student.experience && student.experience.length > 0) {
    context += `\nExperience:\n`;
    student.experience.forEach(exp => {
      context += `  • ${exp}\n`;
    });
  }
  
  if (student.trainings && student.trainings.length > 0) {
    context += `\nTrainings & Courses:\n`;
    student.trainings.forEach(training => {
      context += `  • ${training}\n`;
    });
  }
  
  if (student.interests && student.interests.length > 0) {
    context += `\nInterests & Goals:\n`;
    student.interests.forEach(interest => {
      context += `  • ${interest}\n`;
    });
  }
  
  context += `\n==================\n`;
  return context;
}

function parseCareerPathResponse(content: string): CareerPathResponse {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    studentName: parsed.studentName || '',
    currentRole: parsed.currentRole || 'Entry Level',
    careerGoal: parsed.careerGoal || 'Career Development',
    overallScore: Math.min(100, Math.max(0, parsed.overallScore || 65)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
    recommendedPath: Array.isArray(parsed.recommendedPath) ? parsed.recommendedPath.map((step: any) => ({
      roleTitle: step.roleTitle || 'Role',
      level: ['entry', 'junior', 'mid', 'senior', 'lead'].includes(step.level) ? step.level : 'entry',
      timeline: step.timeline || '1-2 years',
      estimatedTimeline: step.estimatedTimeline || 'Based on skill development',
      description: step.description || '',
      skillsNeeded: Array.isArray(step.skillsNeeded) ? step.skillsNeeded : [],
      skillsToGain: Array.isArray(step.skillsToGain) ? step.skillsToGain : [],
      learningResources: Array.isArray(step.learningResources) ? step.learningResources : [],
      salaryRange: step.salaryRange || 'Market rate',
      keyResponsibilities: Array.isArray(step.keyResponsibilities) ? step.keyResponsibilities : [],
    })) : [],
    alternativePaths: Array.isArray(parsed.alternativePaths) ? parsed.alternativePaths : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    generatedAt: new Date().toISOString(),
  };
}

export async function generateCareerPath(student: StudentProfile): Promise<CareerPathResponse> {
  try {
    const profileContext = buildStudentProfileContext(student);
    
    const userPrompt = `Based on the following student profile, generate a comprehensive career development path with focus on:
1. Skill-based job/role recommendations
2. Interest-aligned career paths
3. Detailed skill gap analysis
4. Skill development roadmap
5. Realistic salary expectations

${profileContext}

Generate a detailed JSON response with:
1. **currentRole**: Current assessed role/level based on skills (entry, junior, mid, senior, lead)
2. **careerGoal**: Primary career goal based on interests and skills
3. **overallScore**: Career readiness score (0-100) based on skills, experience, and education
4. **strengths**: Key strengths (4-6 items) - what they're good at
5. **gaps**: Skill gaps to address (4-6 items) - what they need to learn
6. **recommendedPath**: Career progression with 3-4 steps, each containing:
   - roleTitle: Specific job title (e.g., "Junior Full Stack Developer")
   - level: entry/junior/mid/senior/lead
   - timeline: Duration (e.g., "1-2 years")
   - estimatedTimeline: Detailed timeline explanation
   - description: Role description and what they'll do
   - skillsNeeded: Skills they already have that match this role (array)
   - skillsToGain: New skills to develop for this role (array)
   - learningResources: Specific courses/platforms/certifications (array)
   - salaryRange: Expected salary in INR/USD (e.g., "₹4-6 LPA" or "$50k-70k")
   - keyResponsibilities: Main job responsibilities (array, 3-4 items)
7. **alternativePaths**: 2-3 different career directions they could pursue
8. **actionItems**: Immediate action items to start (4-5 items)
9. **nextSteps**: Specific next steps for this month (4-5 items)

Be specific with Indian job market context if the college is in India. Include realistic salary ranges based on 2024-2025 market rates.
Ensure all arrays are properly formatted and the JSON is valid.`;

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: CAREER_PATH_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';
    
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    const careerPath = parseCareerPathResponse(responseContent);
    careerPath.studentName = student.name;
    
    return careerPath;
  } catch (error) {
    console.error('Error generating career path:', error);
    
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse career path response. Please try again.');
    }
    
    throw error;
  }
}

export async function generateCareerPathStreaming(
  student: StudentProfile
): Promise<AsyncGenerator<string, void, unknown>> {
  const profileContext = buildStudentProfileContext(student);
  
  const userPrompt = `Based on the following student profile, generate a comprehensive career development path. Consider their skills, interests, background, and market demands.

${profileContext}

Generate a detailed JSON response with:
1. Current assessed role/level (entry, junior, mid, senior, lead)
2. Career goal based on interests and skills
3. Overall career readiness score (0-100)
4. Key strengths (3-5 items)
5. Skill gaps to address (3-5 items)
6. Recommended career path with 3-4 progression steps
7. Alternative career paths (2-3 different directions)
8. Immediate action items (3-4 items)
9. Next steps for this month (3-4 items)

Ensure all arrays are properly formatted and the JSON is valid.`;

  const stream = await openai.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: CAREER_PATH_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    max_tokens: 1500,
    temperature: 0.7,
    stream: true,
  });

  return (async function* () {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  })();
}

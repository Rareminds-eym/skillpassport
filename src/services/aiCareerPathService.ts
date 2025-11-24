import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
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

const CAREER_PATH_SYSTEM_PROMPT = `You are an expert career counsellor and AI career path advisor. Your role is to analyze student profiles and generate comprehensive, personalized career development paths based on their:
- Current skills and certifications
- Educational background and GPA
- Interests and career aspirations
- Work experience
- Technical and soft skills
- Training and professional development

Generate career paths that are:
1. Realistic and achievable based on current profile
2. Aligned with industry trends and job market demands
3. Practical with specific skill gaps and development areas
4. Actionable with concrete next steps
5. Diversified with alternative career directions

Always format your response as valid JSON. Be specific, encouraging, and data-driven.`;

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
    
    const userPrompt = `Based on the following student profile, generate a comprehensive career development path. Consider their skills, interests, background, and market demands.

${profileContext}

Generate a detailed JSON response with:
1. Current assessed role/level (entry, junior, mid, senior, lead)
2. Career goal based on interests and skills
3. Overall career readiness score (0-100)
4. Key strengths (3-5 items)
5. Skill gaps to address (3-5 items)
6. Recommended career path with 3-4 progression steps, each containing:
   - roleTitle: Job title or position
   - level: entry/junior/mid/senior/lead
   - timeline: Duration (e.g., "1-2 years")
   - estimatedTimeline: Detailed timeline
   - description: Role description and responsibilities
   - skillsNeeded: Current relevant skills (array)
   - skillsToGain: Skills to develop (array)
   - learningResources: Recommended courses/resources (array)
7. Alternative career paths (2-3 different directions)
8. Immediate action items (3-4 items)
9. Next steps for this month (3-4 items)

Ensure all arrays are properly formatted and the JSON is valid.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
      max_tokens: 2500,
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
    model: 'gpt-4o',
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
    max_tokens: 2500,
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

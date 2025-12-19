// Career AI Agent Tools - Production Ready
// Implements ReAct pattern with tool calling for modern AI agent behavior

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: Record<string, any>, context: AgentContext) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  shouldContinue?: boolean;
}

export interface AgentContext {
  supabase: any;
  studentId: string;
  studentProfile?: any;
  conversationHistory?: any[];
}

// Tool: Search Jobs with semantic matching
export const searchJobsTool: AgentTool = {
  name: 'search_jobs',
  description: 'Search for job opportunities matching student profile and criteria',
  parameters: {
    query: { type: 'string', description: 'Search query or job title', required: false },
    skills: { type: 'array', description: 'Required skills to filter by', required: false },
    location: { type: 'string', description: 'Preferred location', required: false },
    employment_type: { type: 'string', description: 'internship, full-time, part-time', required: false },
    limit: { type: 'number', description: 'Max results to return', required: false }
  },
  execute: async (params, context) => {
    try {
      let query = context.supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (params.employment_type) {
        query = query.ilike('employment_type', `%${params.employment_type}%`);
      }
      if (params.location) {
        query = query.ilike('location', `%${params.location}%`);
      }

      const { data, error } = await query.limit(params.limit || 20);
      
      if (error) throw error;
      
      // Score jobs against student profile
      const scoredJobs = scoreJobMatches(data || [], context.studentProfile, params.skills);
      
      return { success: true, data: scoredJobs };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Tool: Analyze Skill Gaps
export const analyzeSkillGapsTool: AgentTool = {
  name: 'analyze_skill_gaps',
  description: 'Analyze gaps between student skills and target role requirements',
  parameters: {
    target_role: { type: 'string', description: 'Target job role or career path', required: false },
    job_id: { type: 'number', description: 'Specific job ID to analyze against', required: false }
  },
  execute: async (params, context) => {
    try {
      const studentSkills = context.studentProfile?.technicalSkills || [];
      let requiredSkills: string[] = [];

      if (params.job_id) {
        const { data: job } = await context.supabase
          .from('opportunities')
          .select('skills_required, title')
          .eq('id', params.job_id)
          .single();
        
        requiredSkills = job?.skills_required || [];
      } else {
        // Get common skills for the target role from job postings
        const { data: jobs } = await context.supabase
          .from('opportunities')
          .select('skills_required')
          .ilike('title', `%${params.target_role || context.studentProfile?.department}%`)
          .limit(10);
        
        const skillCounts: Record<string, number> = {};
        jobs?.forEach((job: any) => {
          (job.skills_required || []).forEach((skill: string) => {
            skillCounts[skill.toLowerCase()] = (skillCounts[skill.toLowerCase()] || 0) + 1;
          });
        });
        
        requiredSkills = Object.entries(skillCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([skill]) => skill);
      }

      const studentSkillNames = studentSkills.map((s: any) => s.name?.toLowerCase());
      const gaps = requiredSkills.filter(skill => 
        !studentSkillNames.some((ss: string) => 
          ss.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ss)
        )
      );
      const matches = requiredSkills.filter(skill =>
        studentSkillNames.some((ss: string) => 
          ss.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ss)
        )
      );

      return {
        success: true,
        data: {
          currentSkills: studentSkills.map((s: any) => s.name),
          requiredSkills,
          matchingSkills: matches,
          missingSkills: gaps,
          matchPercentage: Math.round((matches.length / Math.max(requiredSkills.length, 1)) * 100)
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Tool: Get Course Recommendations
export const getCoursesTool: AgentTool = {
  name: 'get_course_recommendations',
  description: 'Get personalized course recommendations based on skill gaps or career goals',
  parameters: {
    skill_gaps: { type: 'array', description: 'Skills to learn', required: false },
    category: { type: 'string', description: 'Course category filter', required: false },
    skill_type: { type: 'string', description: 'technical or soft', required: false }
  },
  execute: async (params, context) => {
    try {
      let query = context.supabase
        .from('courses')
        .select('course_id, title, code, description, duration, category, skill_type, enrollment_count')
        .eq('status', 'Active')
        .order('enrollment_count', { ascending: false });

      if (params.skill_type) {
        query = query.eq('skill_type', params.skill_type);
      }
      if (params.category) {
        query = query.ilike('category', `%${params.category}%`);
      }

      const { data, error } = await query.limit(15);
      if (error) throw error;

      // Score courses against skill gaps
      const scoredCourses = (data || []).map((course: any) => {
        let relevanceScore = 50; // Base score
        const skillGaps = params.skill_gaps || [];
        
        skillGaps.forEach((gap: string) => {
          if (course.title?.toLowerCase().includes(gap.toLowerCase()) ||
              course.description?.toLowerCase().includes(gap.toLowerCase())) {
            relevanceScore += 20;
          }
        });
        
        return { ...course, relevanceScore: Math.min(relevanceScore, 100) };
      }).sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

      return { success: true, data: scoredCourses };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Tool: Get Student Progress
export const getProgressTool: AgentTool = {
  name: 'get_student_progress',
  description: 'Get student learning progress, applications, and achievements',
  parameters: {
    include_courses: { type: 'boolean', description: 'Include enrolled courses', required: false },
    include_applications: { type: 'boolean', description: 'Include job applications', required: false }
  },
  execute: async (params, context) => {
    try {
      const result: any = {};

      if (params.include_courses !== false) {
        const { data: enrollments } = await context.supabase
          .from('course_enrollments')
          .select('course_id, course_title, progress, status, enrolled_at, completed_at')
          .eq('student_id', context.studentId)
          .order('enrolled_at', { ascending: false });
        
        result.courses = {
          enrolled: enrollments || [],
          totalEnrolled: enrollments?.length || 0,
          inProgress: enrollments?.filter((e: any) => e.status === 'active' && e.progress < 100).length || 0,
          completed: enrollments?.filter((e: any) => e.status === 'completed' || e.progress === 100).length || 0
        };
      }

      if (params.include_applications !== false) {
        const { data: applications } = await context.supabase
          .from('applications')
          .select('id, opportunity_id, status, created_at, opportunities(title, company_name)')
          .eq('student_id', context.studentId)
          .order('created_at', { ascending: false });
        
        result.applications = applications || [];
      }

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Tool: Get Assessment Insights
export const getAssessmentTool: AgentTool = {
  name: 'get_assessment_insights',
  description: 'Get student assessment results including RIASEC, personality, and career fit',
  parameters: {},
  execute: async (params, context) => {
    try {
      const { data: assessment } = await context.supabase
        .from('personal_assessment_results')
        .select('*')
        .eq('student_id', context.studentId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!assessment) {
        return { 
          success: true, 
          data: { hasAssessment: false, message: 'No completed assessment found' }
        };
      }

      return {
        success: true,
        data: {
          hasAssessment: true,
          riasecCode: assessment.riasec_code,
          riasecScores: assessment.riasec_scores,
          aptitudeOverall: assessment.aptitude_overall,
          employabilityReadiness: assessment.employability_readiness,
          careerFit: assessment.career_fit || [],
          skillGaps: assessment.skill_gap || [],
          overallSummary: assessment.overall_summary
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Helper: Score job matches
function scoreJobMatches(jobs: any[], profile: any, filterSkills?: string[]): any[] {
  if (!profile) return jobs.map(j => ({ ...j, matchScore: 50 }));

  const studentSkills = (profile.technicalSkills || []).map((s: any) => s.name?.toLowerCase());
  const studentDept = profile.department?.toLowerCase() || '';

  return jobs.map(job => {
    let score = 0;
    const jobSkills = (job.skills_required || []).map((s: string) => s.toLowerCase());
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    // Skill matching (40%)
    jobSkills.forEach((skill: string) => {
      const hasSkill = studentSkills.some((ss: string) => 
        ss.includes(skill) || skill.includes(ss)
      );
      if (hasSkill) {
        matchingSkills.push(skill);
        score += 40 / Math.max(jobSkills.length, 1);
      } else {
        missingSkills.push(skill);
      }
    });

    // Department alignment (30%)
    if (job.department?.toLowerCase().includes(studentDept) || 
        job.title?.toLowerCase().includes(studentDept)) {
      score += 30;
    }

    // Experience level (20%)
    const expRequired = job.experience_required?.toLowerCase() || '';
    if (expRequired.includes('fresher') || expRequired.includes('0') || expRequired.includes('entry')) {
      score += 20;
    } else if (expRequired.includes('1') || expRequired.includes('2')) {
      score += 10;
    }

    // Base score (10%)
    score += 10;

    return {
      ...job,
      matchScore: Math.round(Math.min(score, 100)),
      matchingSkills,
      missingSkills
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

// Export all tools
export const agentTools: AgentTool[] = [
  searchJobsTool,
  analyzeSkillGapsTool,
  getCoursesTool,
  getProgressTool,
  getAssessmentTool
];

export function getToolByName(name: string): AgentTool | undefined {
  return agentTools.find(t => t.name === name);
}

export function getToolDescriptions(): string {
  return agentTools.map(tool => 
    `- ${tool.name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.parameters)}`
  ).join('\n\n');
}

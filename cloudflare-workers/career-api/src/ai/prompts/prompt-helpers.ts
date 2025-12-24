// Prompt Helper Functions - Cloudflare Workers Version

import type { 
  StudentProfile, 
  AssessmentResults, 
  CareerProgress, 
  Opportunity, 
  ConversationPhase,
  CourseContext
} from '../../types/career-ai';

export function getPhaseRules(phase: ConversationPhase): string {
  const rules: Record<ConversationPhase, string> = {
    opening: `
- Keep response SHORT (150-200 words)
- Greet warmly, acknowledge their query
- Give concise initial insight
- Ask ONE follow-up question
- NO lengthy lists or explanations yet`,
    exploring: `
- Moderate depth (300-500 words)
- Introduce specific profile details
- Provide 2-3 concrete recommendations
- Use some structure (bullets/headers)
- End with offer to explore deeper`,
    deep_dive: `
- Comprehensive response (up to 800 words)
- Detailed, actionable guidance
- Use structured formatting
- Include specific examples
- Provide clear roadmap/next steps`,
    follow_up: `
- Balanced response (400-600 words)
- Build on previous discussion
- Reference earlier points
- Track progress on recommendations
- Maintain conversation continuity`
  };
  return rules[phase];
}

export function buildStudentContextXML(profile: StudentProfile): string {
  const techSkills = profile.technicalSkills.length > 0
    ? profile.technicalSkills.map(s => `${s.name} (L${s.level}${s.verified ? '✓' : ''})`).join(', ')
    : 'None listed';
  
  const softSkills = profile.softSkills.length > 0
    ? profile.softSkills.map(s => s.name).join(', ')
    : 'None listed';

  return `
<student_profile>
<name>${profile.name}</name>
<field>${profile.department || 'Not specified'}</field>
<university>${profile.university || 'Not specified'}</university>
<cgpa>${profile.cgpa || 'Not specified'}</cgpa>
<year>${profile.yearOfPassing || 'Not specified'}</year>

<student_skills>
<technical>${techSkills}</technical>
<soft>${softSkills}</soft>
</student_skills>

<background>
<education_count>${profile.education.length}</education_count>
<experience_count>${profile.experience.length}</experience_count>
<projects_count>${profile.projects.length}</projects_count>
<certificates_count>${profile.certificates.length}</certificates_count>
</background>

${profile.experience.length > 0 ? `<recent_experience>
${profile.experience.slice(0, 2).map((e: any) => `- ${e.role} at ${e.organization}`).join('\n')}
</recent_experience>` : ''}

${profile.projects.length > 0 ? `<recent_projects>
${profile.projects.slice(0, 2).map((p: any) => `- ${p.title}: ${(p.tech_stack || []).slice(0, 3).join(', ')}`).join('\n')}
</recent_projects>` : ''}
</student_profile>`;
}

export function buildAssessmentXML(assessment: AssessmentResults): string {
  if (!assessment.hasAssessment) {
    return `
<assessment status="not_completed">
<note>Student hasn't completed career assessment yet</note>
<suggestion>Encourage them to take the assessment for personalized guidance</suggestion>
</assessment>`;
  }

  return `
<assessment status="completed">
<riasec code="${assessment.riasecCode}">${assessment.riasecInterpretation}</riasec>
<personality>${assessment.personalityInterpretation}</personality>
<aptitude_score>${assessment.aptitudeOverall}%</aptitude_score>
<employability>${assessment.employabilityReadiness}</employability>

${assessment.careerFit.length > 0 ? `<recommended_careers>
${assessment.careerFit.slice(0, 5).map((c: any) => `- ${c.title || c.career || c}`).join('\n')}
</recommended_careers>` : ''}

${assessment.skillGaps.length > 0 ? `<identified_gaps>
${assessment.skillGaps.slice(0, 5).map((g: any) => `- ${g.skill || g}`).join('\n')}
</identified_gaps>` : ''}
</assessment>`;
}

export function buildProgressXML(progress: CareerProgress): string {
  if (progress.appliedJobs.length === 0 && progress.savedJobs.length === 0 && progress.courseEnrollments.length === 0) {
    return '';
  }

  return `
<career_progress>
${progress.appliedJobs.length > 0 ? `<applications count="${progress.appliedJobs.length}">
${progress.appliedJobs.slice(0, 5).map(j => `- ${j.title} at ${j.company}: ${j.status}`).join('\n')}
</applications>` : ''}

${progress.courseEnrollments.length > 0 ? `<enrolled_courses>
${progress.courseEnrollments.map(c => `- ${c.title}: ${c.progress}% (${c.status})`).join('\n')}
</enrolled_courses>` : ''}
</career_progress>`;
}

export function buildCourseXML(courseContext?: CourseContext): string {
  if (!courseContext) return '';

  return `
<courses>
<summary>
<enrolled>${courseContext.totalEnrolled}</enrolled>
<in_progress>${courseContext.inProgress}</in_progress>
<completed>${courseContext.completed}</completed>
</summary>

${courseContext.enrolledCourses.length > 0 ? `<my_courses>
${courseContext.enrolledCourses.slice(0, 5).map(c => 
  `- ${c.courseTitle}: ${c.progress}% progress`
).join('\n')}
</my_courses>` : ''}

${courseContext.availableCourses.length > 0 ? `<available_courses>
${courseContext.availableCourses.slice(0, 10).map(c => 
  `- ${c.title} (${c.code}): ${c.duration}, ${c.skillType}`
).join('\n')}
</available_courses>` : ''}
</courses>`;
}

export function buildOpportunitiesXML(intent: string, opportunities: Opportunity[]): string {
  const relevantIntents = ['find-jobs', 'skill-gap', 'career-guidance', 'application-status'];
  if (!relevantIntents.includes(intent) || opportunities.length === 0) {
    return '';
  }

  const jobList = opportunities.slice(0, 15).map(opp => 
    `- ID:${opp.id} | ${opp.title} | ${opp.company_name || 'Company N/A'} | ${opp.location || 'Location N/A'} | ${opp.employment_type || 'Type N/A'} | Skills: ${(opp.skills_required || []).slice(0, 5).join(', ')}`
  ).join('\n');

  return `
<opportunities count="${opportunities.length}">
<IMPORTANT>These are the ONLY real jobs. Never mention jobs not in this list.</IMPORTANT>
${jobList}
</opportunities>`;
}

export function buildIntentGuidance(intent: string, ctx: { profile: StudentProfile }): string {
  const studentName = ctx.profile.name.split(' ')[0];
  
  const guidance: Record<string, string> = {
    'find-jobs': `
<task>JOB_MATCHING</task>
<instructions>
1. Match ${studentName}'s skills against <opportunities>
2. Calculate honest match scores based on skill overlap
3. Highlight matching skills AND skill gaps
4. Recommend top 3-5 jobs with specific reasons
5. Offer to filter by location/type if needed
</instructions>`,

    'skill-gap': `
<task>SKILL_GAP_ANALYSIS</task>
<instructions>
1. List ${studentName}'s current skills from <student_skills>
2. Compare against market requirements for their field
3. Identify critical gaps with priority levels
4. Suggest specific courses from <courses> to fill gaps
5. Provide learning timeline estimate
</instructions>`,

    'interview-prep': `
<task>INTERVIEW_PREPARATION</task>
<instructions>
1. Tailor prep to ${studentName}'s field: ${ctx.profile.department}
2. Include technical questions for their skills
3. Provide behavioral questions with STAR framework
4. Reference their projects for example answers
5. Offer mock interview practice
</instructions>`,

    'learning-path': `
<task>LEARNING_ROADMAP</task>
<instructions>
1. Assess current level from <student_skills>
2. Define target skill/role based on user's request
3. Create phased roadmap (foundation → advanced)
4. For courses: ONLY recommend from <courses> IF relevant
5. Add milestones and project suggestions
</instructions>`,

    'career-guidance': `
<task>CAREER_GUIDANCE</task>
<instructions>
1. Analyze ${studentName}'s profile holistically
2. Consider assessment results if available
3. Present 2-3 career path options
4. Explain growth trajectory for each
5. Recommend immediate next steps
</instructions>`,

    'general': `
<task>GENERAL_ASSISTANCE</task>
<instructions>
1. Respond helpfully to ${studentName}'s query
2. Offer relevant career assistance options
3. If greeting, welcome warmly and offer help
4. Keep response concise and friendly
5. Suggest specific ways you can help
</instructions>`
  };

  return guidance[intent] || guidance['general'];
}

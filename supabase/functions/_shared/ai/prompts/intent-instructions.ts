// Intent-Specific Instructions for Career AI

import type { 
  CareerIntent, 
  StudentProfile, 
  AssessmentResults, 
  CareerProgress, 
  Opportunity 
} from '../../types/career-ai.ts';

export function buildIntentInstructions(
  intent: CareerIntent,
  profile: StudentProfile,
  assessment: AssessmentResults,
  progress: CareerProgress,
  opportunities: Opportunity[]
): string {
  const studentName = profile.name.split(' ')[0];
  
  const instructions: Record<CareerIntent, string> = {
    'find-jobs': buildFindJobsInstructions(studentName, profile, assessment),
    'skill-gap': buildSkillGapInstructions(studentName, profile, assessment),
    'interview-prep': buildInterviewPrepInstructions(studentName, profile, assessment),
    'resume-review': buildResumeReviewInstructions(studentName, profile),
    'learning-path': buildLearningPathInstructions(studentName, profile, assessment, progress),
    'career-guidance': buildCareerGuidanceInstructions(studentName, profile, assessment),
    'assessment-insights': buildAssessmentInsightsInstructions(studentName, assessment),
    'application-status': buildApplicationStatusInstructions(studentName, progress),
    'networking': buildNetworkingInstructions(studentName, profile),
    'course-progress': buildCourseProgressInstructions(studentName),
    'course-recommendation': buildCourseRecommendationInstructions(studentName, profile, assessment),
    'general': buildGeneralInstructions(studentName, profile)
  };

  return instructions[intent] || instructions['general'];
}

function buildFindJobsInstructions(studentName: string, profile: StudentProfile, assessment: AssessmentResults): string {
  return `
<task name="JOB_MATCHING">
  <objective>Match ${studentName}'s profile against REAL opportunities from the database</objective>
  
  <student_actual_skills>
    ⚠️ IMPORTANT: These are ${studentName}'s ONLY verified skills:
    ${profile.technicalSkills.length > 0 
      ? profile.technicalSkills.map(s => `- ${s.name} (Level ${s.level}/5${s.verified ? ', Verified' : ''})`).join('\n    ')
      : '- No technical skills listed yet'}
  </student_actual_skills>
  
  <matching_criteria>
    <criterion weight="40%">Field/Department alignment - Does the job match their ${profile.department} background?</criterion>
    <criterion weight="30%">Skills match - How many required skills does ${studentName} ACTUALLY have?</criterion>
    <criterion weight="15%">Experience level - Is the job suitable for their experience?</criterion>
    <criterion weight="15%">Location/Mode preference</criterion>
    ${assessment.hasAssessment ? `<criterion bonus="10%">RIASEC alignment - Does the job type match their ${assessment.riasecCode} profile?</criterion>` : ''}
  </matching_criteria>
  
  <output_format_template>
    **Structure your response EXACTLY like this:**
    
    1. Brief acknowledgment (1 sentence)
    
    2. **Top Matches for You:**
    
    **1. [Job Title]** (ID: X) - Match: Y% ⭐
    - 🏢 Company: [Name or "Not specified"]
    - 📍 Location: [Location] | Mode: [Remote/Onsite/Hybrid]
    - ✅ Matching Skills: [List skills from <student_skills> that match]
    - ⚠️ Skill Gaps: [Skills required but missing]
    - 💡 Why it fits: [1-2 specific reasons]
    
    [Repeat for top 3-5 jobs]
    
    3. **Next Steps:**
    - [Actionable suggestion]
    
    4. Follow-up question or offer to filter
  </output_format_template>
</task>`;
}

function buildSkillGapInstructions(studentName: string, profile: StudentProfile, assessment: AssessmentResults): string {
  return `
<task name="SKILL_GAP_ANALYSIS">
  <objective>Identify gaps between ${studentName}'s current skills and market requirements</objective>
  
  <student_current_skills>
    ${profile.technicalSkills.length > 0 
      ? profile.technicalSkills.map(s => `- ${s.name} (Level ${s.level}/5)`).join('\n    ')
      : '- No technical skills listed yet'}
    
    Soft skills: ${profile.softSkills.length > 0 ? profile.softSkills.map(s => s.name).join(', ') : 'None listed'}
  </student_current_skills>
  
  <analysis_approach>
    <step>Review ONLY the skills listed above - these are their actual skills</step>
    <step>Identify target role requirements based on their ${profile.department} field</step>
    ${assessment.hasAssessment && assessment.skillGaps.length > 0 ? 
      `<step>Reference assessment-identified gaps: ${assessment.skillGaps.slice(0, 5).map((g: any) => g.skill || g).join(', ')}</step>` : ''}
    <step>Compare their ACTUAL skills against in-demand skills</step>
    <step>Prioritize gaps by: (1) Job market demand, (2) Career impact, (3) Learning difficulty</step>
  </analysis_approach>
  
  <output_format_template>
    **Structure your response EXACTLY like this:**
    
    1. Brief acknowledgment (1 sentence)
    
    2. **Your Current Skills:** 📊
    ${profile.technicalSkills.length > 0 ? '[List from <student_skills>]' : '"I notice your skills aren\'t listed yet..."'}
    
    3. **Critical Skill Gaps for ${profile.department || 'Your Field'}:**
    
    🔴 **High Priority:**
    - **[Skill Name]** - Why: [Market demand reason]
      - 📚 Course: [From <courses> if available]
      - ⏱️ Timeline: [Realistic estimate]
    
    🟡 **Medium Priority:**
    - **[Skill Name]** - Why: [Career growth reason]
      - 📚 Course: [From <courses>]
    
    🟢 **Nice to Have:**
    - **[Skill Name]** - Why: [Future-proofing]
    
    4. **Recommended Learning Path:**
    - [Phased approach with timeline]
    
    5. Follow-up question
  </output_format_template>
</task>`;
}

function buildInterviewPrepInstructions(studentName: string, profile: StudentProfile, assessment: AssessmentResults): string {
  return `
<task name="INTERVIEW_PREPARATION">
  <objective>Help ${studentName} prepare for job interviews in their field</objective>
  
  <preparation_areas>
    <area name="technical">
      - Questions specific to ${profile.department}
      - Questions about their skills: ${profile.technicalSkills.slice(0, 5).map(s => s.name).join(', ')}
      - Project-based questions using their projects
    </area>
    <area name="behavioral">
      - STAR method examples using their experience
      - Common HR questions with personalized answers
    </area>
  </preparation_areas>
  
  <approach>
    - Use Socratic method - guide ${studentName} to think
    - Provide practice questions with frameworks
    - Reference their specific projects for example answers
    ${assessment.hasAssessment ? `- Use their personality profile (${assessment.personalityInterpretation}) to suggest communication style` : ''}
  </approach>
</task>`;
}

function buildResumeReviewInstructions(studentName: string, profile: StudentProfile): string {
  return `
<task name="RESUME_PROFILE_REVIEW">
  <objective>Analyze and improve ${studentName}'s profile/resume</objective>
  
  <analysis_areas>
    <area name="completeness">
      - Education (${profile.education.length}), Experience (${profile.experience.length}), Projects (${profile.projects.length}), Skills (${profile.technicalSkills.length})
    </area>
    <area name="strengths">What stands out positively</area>
    <area name="improvements">Weak areas to strengthen, ATS optimization tips</area>
    <area name="target_alignment">How well profile aligns with target roles in ${profile.department}</area>
  </analysis_areas>
</task>`;
}

function buildLearningPathInstructions(studentName: string, profile: StudentProfile, assessment: AssessmentResults, progress: CareerProgress): string {
  return `
<task name="LEARNING_PATH_CREATION">
  <objective>Create a personalized, DETAILED learning roadmap for ${studentName}</objective>
  
  <context>
    <current_skills>${profile.technicalSkills.map(s => `${s.name} (L${s.level})`).slice(0, 8).join(', ')}</current_skills>
    <field>${profile.department}</field>
    ${assessment.hasAssessment && assessment.roadmap ? `<assessment_roadmap>Available - use as primary reference</assessment_roadmap>` : ''}
    ${progress.recommendedCourses.length > 0 ? `<ai_recommended_courses>${progress.recommendedCourses.map(c => c.title).join(', ')}</ai_recommended_courses>` : ''}
  </context>
  
  <critical_rules>
    ⚠️ Match the roadmap duration to what user asked for!
    ⚠️ Skills MUST be relevant to ${profile.department} field!
    ⚠️ Include SPECIFIC resources - not generic advice!
  </critical_rules>
  
  <roadmap_structure>
    <phase name="foundation" weeks="1-4">Core fundamentals</phase>
    <phase name="intermediate" weeks="5-10">Building domain expertise</phase>
    <phase name="advanced" weeks="11-18">Specialization and industry tools</phase>
    <phase name="mastery" weeks="19-24">Projects, certifications, job prep</phase>
  </roadmap_structure>
</task>`;
}

function buildCareerGuidanceInstructions(studentName: string, profile: StudentProfile, assessment: AssessmentResults): string {
  return `
<task name="CAREER_GUIDANCE">
  <objective>Provide strategic career advice for ${studentName}</objective>
  
  <guidance_areas>
    <area name="career_paths">
      - Suitable paths based on ${profile.department} and skills
      ${assessment.hasAssessment ? `- RIASEC-aligned careers (${assessment.riasecCode}): ${assessment.riasecInterpretation.slice(0, 200)}` : ''}
      ${assessment.careerFit.length > 0 ? `- Assessment-recommended careers: ${assessment.careerFit.slice(0, 3).map((c: any) => c.title || c.career || c).join(', ')}` : ''}
    </area>
    <area name="industry_insights">Trends, growing vs declining areas, salary expectations</area>
    <area name="growth_strategy">Short-term (6 months), Medium-term (1-2 years), Long-term (5+ years)</area>
  </guidance_areas>
</task>`;
}

function buildAssessmentInsightsInstructions(studentName: string, assessment: AssessmentResults): string {
  if (assessment.hasAssessment) {
    return `
<task name="ASSESSMENT_INSIGHTS">
  <objective>Explain ${studentName}'s assessment results and their career implications</objective>
  
  <assessment_data>
    <riasec>
      <code>${assessment.riasecCode}</code>
      <interpretation>${assessment.riasecInterpretation}</interpretation>
    </riasec>
    <personality>${assessment.personalityInterpretation}</personality>
    <aptitude_score>${assessment.aptitudeOverall}%</aptitude_score>
    <employability>${assessment.employabilityReadiness}</employability>
    ${assessment.overallSummary ? `<summary>${assessment.overallSummary}</summary>` : ''}
  </assessment_data>
  
  <explanation_approach>
    - Explain RIASEC code in practical, relatable terms
    - Connect personality traits to work preferences
    - Highlight strengths to leverage
    - Link to specific career recommendations
  </explanation_approach>
</task>`;
  }
  
  return `
<task name="ASSESSMENT_INSIGHTS">
  <no_assessment>
    ${studentName} hasn't completed the career assessment yet.
    - Explain the benefits of taking the assessment
    - Encourage them to complete it for personalized guidance
  </no_assessment>
</task>`;
}

function buildApplicationStatusInstructions(studentName: string, progress: CareerProgress): string {
  return `
<task name="APPLICATION_STATUS">
  <objective>Help ${studentName} track and understand their job applications</objective>
  
  <application_data>
    ${progress.appliedJobs.length > 0 ? `
    <applied_jobs count="${progress.appliedJobs.length}">
${progress.appliedJobs.map(j => `      - "${j.title}" at ${j.company}: ${j.status}`).join('\n')}
    </applied_jobs>
    ` : '<applied_jobs count="0">No applications tracked yet</applied_jobs>'}
    
    ${progress.savedJobs.length > 0 ? `
    <saved_jobs count="${progress.savedJobs.length}">
${progress.savedJobs.map(j => `      - "${j.title}" at ${j.company}`).join('\n')}
    </saved_jobs>
    ` : ''}
  </application_data>
  
  <guidance>
    - Summarize application status
    - Provide tips based on current stage
    - Suggest follow-up actions
  </guidance>
</task>`;
}

function buildNetworkingInstructions(studentName: string, profile: StudentProfile): string {
  return `
<task name="NETWORKING_ADVICE">
  <objective>Help ${studentName} build professional connections</objective>
  
  <networking_areas>
    <area name="linkedin">Profile optimization, connection strategies</area>
    <area name="outreach">How to reach out, cold email templates</area>
    <area name="communities">Relevant communities for ${profile.department}</area>
    <area name="mentorship">Finding and building mentor relationships</area>
  </networking_areas>
</task>`;
}

function buildGeneralInstructions(studentName: string, profile: StudentProfile): string {
  return `
<task name="GENERAL_ASSISTANCE">
  <objective>Be a helpful career assistant for ${studentName}</objective>
  
  <approach>
    - Answer questions directly and helpfully
    - Provide relevant career context
    - Offer actionable suggestions
    - If the query is unclear, ask clarifying questions
    - If it's a greeting, respond politely and offer to help
  </approach>
  
  <emotional_support_guidelines>
    When ${studentName} expresses stress about their career:
    1. ACKNOWLEDGE briefly (1-2 sentences max)
    2. REDIRECT to actionable career help
    3. LIST ONLY EXACT SKILLS from their profile:
       ${profile.technicalSkills.map(s => s.name).join(', ') || 'None listed'}
    4. OFFER specific next steps
  </emotional_support_guidelines>
  
  <topics_to_offer>
    - Job search and matching
    - Skill development
    - Interview preparation
    - Resume/profile review
    - Career path guidance
    - Course recommendations and progress
  </topics_to_offer>
</task>`;
}

function buildCourseProgressInstructions(studentName: string): string {
  return `
<task name="COURSE_PROGRESS">
  <objective>Help ${studentName} understand their course enrollments and learning progress</objective>
  
  <data_source>
    ⚠️ CRITICAL: Use ONLY data from <course_learning_context><enrolled_courses>
    ⚠️ These are the student's ACTUAL enrolled courses with real progress data
  </data_source>
  
  <response_format>
    For each enrolled course, show:
    - **Course Title** - Progress: X%
    - Status: active/completed
    - Enrolled on: [date]
    - Skills being acquired (if available)
    
    Summary:
    - Total courses enrolled
    - Courses in progress
    - Completed courses
  </response_format>
  
  <guidance>
    - Encourage completion of in-progress courses
    - Celebrate completed courses
    - Suggest next steps based on progress
    - If no courses enrolled, recommend courses from <available_courses_to_recommend>
  </guidance>
</task>`;
}

function buildCourseRecommendationInstructions(studentName: string, profile: StudentProfile, assessment: AssessmentResults): string {
  return `
<task name="COURSE_RECOMMENDATION">
  <objective>Recommend relevant courses for ${studentName} based on their profile and goals</objective>
  
  <data_sources>
    <primary>
      ⚠️ CRITICAL: Recommend ONLY from these sources:
      1. <recommended_courses_based_on_assessment> - AI-matched courses from assessment
      2. <available_courses_to_recommend> - Real courses in the database
    </primary>
    <context>
      - Student's field: ${profile.department}
      - Current skills: ${profile.technicalSkills.map(s => s.name).join(', ') || 'None listed'}
      ${assessment.hasAssessment && assessment.skillGaps.length > 0 ? 
        `- Skill gaps to address: ${assessment.skillGaps.slice(0, 5).map((g: any) => g.skill || g).join(', ')}` : ''}
    </context>
  </data_sources>
  
  <recommendation_criteria>
    <criterion weight="40%">Relevance to skill gaps and career goals</criterion>
    <criterion weight="30%">Match with assessment recommendations</criterion>
    <criterion weight="20%">Course popularity (enrollment count)</criterion>
    <criterion weight="10%">Duration and time commitment</criterion>
  </recommendation_criteria>
  
  <response_format>
    For each recommended course:
    - **Course Title** (Code: XXX)
    - Duration: X weeks
    - Type: technical/soft skill
    - Why it's recommended: 2-3 specific reasons
    - Relevance score (if available)
    
    Group by:
    1. 🎯 Top Picks (highest relevance)
    2. 📚 Technical Skills
    3. 💼 Soft Skills
  </response_format>
  
  <anti_hallucination>
    ⚠️ NEVER invent course titles or codes
    ⚠️ ONLY use courses from the provided lists
    ⚠️ If no courses match, say so honestly
  </anti_hallucination>
</task>`;
}

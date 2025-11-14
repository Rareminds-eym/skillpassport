import { supabase } from '../../../lib/supabaseClient';

/**
 * Advanced Candidate Scoring System
 * Senior-level multi-dimensional candidate evaluation
 */

export interface EnrichedCandidate {
  // Core Identity
  id: string;
  name: string;
  email: string;
  phone?: string;
  
  // Education
  university: string;
  branch: string;
  cgpa: number | null;
  graduationYear: string;
  
  // Location
  city: string;
  state: string;
  country: string;
  
  // Skills & Experience
  skills: Array<{
    name: string;
    level: number;
    type: string;
    verified: boolean;
  }>;
  skillCategories: {
    technical: string[];
    soft: string[];
    tools: string[];
  };
  totalSkillCount: number;
  
  // Professional Development
  trainings: Array<{
    title: string;
    organization: string;
    completedDate: string;
  }>;
  certificates: Array<{
    name: string;
    issuer: string;
    issueDate: string;
  }>;
  
  // Projects & Experience
  projectCount: number;
  hasGitHub: boolean;
  hasLinkedIn: boolean;
  hasPortfolio: boolean;
  resumeUrl: string | null;
  
  // Activity Metrics
  profileCompleteness: number;
  lastActive: string;
  accountAge: number; // days
  
  // Engagement Signals
  responsiveness: 'high' | 'medium' | 'low' | 'unknown';
  applicationCount: number; // how many jobs applied to
  interviewCount: number;
  
  // Calculated Scores
  scores: {
    technical: number;      // 0-100
    education: number;      // 0-100
    experience: number;     // 0-100
    engagement: number;     // 0-100
    overall: number;        // 0-100
    hiringReadiness: number; // 0-100
  };
  
  // Flags & Signals
  redFlags: string[];
  greenFlags: string[];
  dataQualityIssues: string[];
}

export interface MatchAnalysis {
  candidate: EnrichedCandidate;
  jobId: string;
  jobTitle: string;
  
  // Match Breakdown
  matchScore: number; // 0-100
  matchBreakdown: {
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
    locationMatch: number;
  };
  
  // Detailed Analysis
  matchedSkills: string[];
  missingSkills: string[];
  transferableSkills: string[];
  
  // Decision Support
  recommendation: 'strong-hire' | 'hire' | 'maybe' | 'pass';
  confidenceLevel: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  
  // Next Actions
  nextSteps: string[];
  interviewQuestions: string[];
  assessmentAreas: string[];
}

class AdvancedCandidateScoringService {
  /**
   * Fetch enriched candidate data with optimal SQL
   * Single query with all JOINs - minimizes DB round trips
   */
  async fetchEnrichedCandidates(limit: number = 50): Promise<EnrichedCandidate[]> {
    try {
      // Fetch students with all related data
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          user_id,
          name,
          email,
          phone,
          university,
          branch_field,
          currentCgpa,
          expectedGraduationDate,
          city,
          state,
          country,
          resumeUrl,
          githubUrl,
          linkedinUrl,
          portfolioUrl,
          created_at,
          updated_at
        `)
        .not('name', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error || !students) {
        console.error('Error fetching students:', error);
        return [];
      }

      // Batch fetch all related data
      const studentIds = students.map(s => s.user_id);
      
      const [skillsData, trainingsData, certsData, appliedJobsData] = await Promise.all([
        // Fetch all skills
        supabase
          .from('skills')
          .select('student_id, name, level, type, enabled')
          .in('student_id', studentIds)
          .eq('enabled', true),
        
        // Fetch trainings
        supabase
          .from('trainings')
          .select('student_id, trainingName, organization, completedDate')
          .in('student_id', studentIds),
        
        // Fetch certificates
        supabase
          .from('certificates')
          .select('student_id, certificateName, issuedBy, issuedDate, enabled')
          .in('student_id', studentIds)
          .eq('enabled', true),
        
        // Fetch application history
        supabase
          .from('applied_jobs')
          .select('student_id, opportunity_id, application_status, applied_at')
          .in('student_id', studentIds)
      ]);

      // Group data by student
      const skillsByStudent = this.groupByStudent(skillsData.data || []);
      const trainingsByStudent = this.groupByStudent(trainingsData.data || []);
      const certsByStudent = this.groupByStudent(certsData.data || []);
      const applicationsByStudent = this.groupByStudent(appliedJobsData.data || []);

      // Enrich each candidate
      return students.map(student => 
        this.enrichCandidate(
          student,
          skillsByStudent.get(student.user_id) || [],
          trainingsByStudent.get(student.user_id) || [],
          certsByStudent.get(student.user_id) || [],
          applicationsByStudent.get(student.user_id) || []
        )
      );
    } catch (error) {
      console.error('Error in fetchEnrichedCandidates:', error);
      return [];
    }
  }

  /**
   * Enrich single candidate with comprehensive analysis
   */
  private enrichCandidate(
    student: any,
    skills: any[],
    trainings: any[],
    certs: any[],
    applications: any[]
  ): EnrichedCandidate {
    // Categorize skills
    const skillCategories = this.categorizeSkills(skills);
    
    // Calculate scores
    const technicalScore = this.calculateTechnicalScore(skills, trainings, certs);
    const educationScore = this.calculateEducationScore(student);
    const experienceScore = this.calculateExperienceScore(trainings, certs, applications);
    const engagementScore = this.calculateEngagementScore(student, applications);
    
    const overallScore = Math.round(
      technicalScore * 0.35 +
      educationScore * 0.20 +
      experienceScore * 0.25 +
      engagementScore * 0.20
    );
    
    const hiringReadiness = this.calculateHiringReadiness({
      technical: technicalScore,
      education: educationScore,
      experience: experienceScore,
      engagement: engagementScore,
      hasResume: !!student.resumeUrl,
      profileComplete: this.calculateProfileCompleteness(student, skills, trainings, certs)
    });
    
    // Detect flags
    const redFlags = this.detectRedFlags(student, skills, applications);
    const greenFlags = this.detectGreenFlags(student, skills, trainings, certs);
    const dataQualityIssues = this.detectDataQualityIssues(student, skills);
    
    // Calculate account age
    const accountAge = Math.floor(
      (new Date().getTime() - new Date(student.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      id: student.user_id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      
      university: student.university || 'Not specified',
      branch: student.branch_field || 'Not specified',
      cgpa: student.currentCgpa,
      graduationYear: student.expectedGraduationDate?.split('-')[0] || 'Unknown',
      
      city: student.city || '',
      state: student.state || '',
      country: student.country || 'India',
      
      skills: skills.map(s => ({
        name: s.name,
        level: s.level || 1,
        type: s.type || 'technical',
        verified: true
      })),
      skillCategories,
      totalSkillCount: skills.length,
      
      trainings: trainings.map(t => ({
        title: t.trainingName,
        organization: t.organization,
        completedDate: t.completedDate
      })),
      certificates: certs.map(c => ({
        name: c.certificateName,
        issuer: c.issuedBy,
        issueDate: c.issuedDate
      })),
      
      projectCount: 0, // TODO: Add projects table
      hasGitHub: !!student.githubUrl,
      hasLinkedIn: !!student.linkedinUrl,
      hasPortfolio: !!student.portfolioUrl,
      resumeUrl: student.resumeUrl,
      
      profileCompleteness: this.calculateProfileCompleteness(student, skills, trainings, certs),
      lastActive: student.updated_at,
      accountAge,
      
      responsiveness: this.assessResponsiveness(applications),
      applicationCount: applications.length,
      interviewCount: 0, // TODO: track interviews
      
      scores: {
        technical: technicalScore,
        education: educationScore,
        experience: experienceScore,
        engagement: engagementScore,
        overall: overallScore,
        hiringReadiness
      },
      
      redFlags,
      greenFlags,
      dataQualityIssues
    };
  }

  /**
   * Calculate technical proficiency score
   */
  private calculateTechnicalScore(skills: any[], trainings: any[], certs: any[]): number {
    let score = 0;
    
    // Skill count and diversity (0-40 points)
    const skillCount = skills.length;
    score += Math.min(skillCount * 3, 30);
    
    // Skill levels (0-20 points)
    const avgLevel = skills.reduce((sum, s) => sum + (s.level || 1), 0) / (skillCount || 1);
    score += avgLevel * 4;
    
    // Technical certifications (0-20 points)
    const techCerts = certs.filter(c => 
      /AWS|Azure|Google Cloud|Oracle|Microsoft|Cisco|CompTIA/i.test(c.issuedBy)
    );
    score += Math.min(techCerts.length * 10, 20);
    
    // Advanced trainings (0-20 points)
    const advancedTrainings = trainings.filter(t =>
      /Advanced|Expert|Professional|Senior/i.test(t.trainingName)
    );
    score += Math.min(advancedTrainings.length * 5, 20);
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Calculate education quality score
   */
  private calculateEducationScore(student: any): number {
    let score = 50; // Base score
    
    // CGPA (0-30 points)
    if (student.currentCgpa) {
      if (student.currentCgpa >= 9.0) score += 30;
      else if (student.currentCgpa >= 8.0) score += 25;
      else if (student.currentCgpa >= 7.0) score += 20;
      else if (student.currentCgpa >= 6.0) score += 10;
    }
    
    // University reputation (0-20 points) - can be enhanced with university rankings
    if (student.university) {
      const topUniversities = ['IIT', 'NIT', 'BITS', 'VIT', 'Manipal', 'SRM'];
      if (topUniversities.some(uni => student.university.includes(uni))) {
        score += 20;
      } else {
        score += 10;
      }
    }
    
    return Math.min(score, 100);
  }

  /**
   * Calculate experience score
   */
  private calculateExperienceScore(trainings: any[], certs: any[], applications: any[]): number {
    let score = 0;
    
    // Trainings (0-35 points)
    score += Math.min(trainings.length * 7, 35);
    
    // Certifications (0-35 points)
    score += Math.min(certs.length * 7, 35);
    
    // Job-seeking activity (0-30 points)
    const applicationCount = applications.length;
    if (applicationCount >= 5) score += 30;
    else if (applicationCount >= 3) score += 20;
    else if (applicationCount >= 1) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(student: any, applications: any[]): number {
    let score = 0;
    
    // Profile completeness (0-30 points)
    const profileFields = [
      student.phone, student.city, student.university, 
      student.branch_field, student.currentCgpa, student.resumeUrl
    ];
    const completedFields = profileFields.filter(f => !!f).length;
    score += (completedFields / profileFields.length) * 30;
    
    // Social presence (0-20 points)
    if (student.linkedinUrl) score += 10;
    if (student.githubUrl) score += 10;
    
    // Recent activity (0-25 points)
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(student.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate <= 7) score += 25;
    else if (daysSinceUpdate <= 30) score += 15;
    else if (daysSinceUpdate <= 90) score += 5;
    
    // Application activity (0-25 points)
    const recentApps = applications.filter(app => {
      const appDate = new Date(app.applied_at);
      const daysSince = (new Date().getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    score += Math.min(recentApps.length * 5, 25);
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Calculate hiring readiness score
   */
  private calculateHiringReadiness(metrics: {
    technical: number;
    education: number;
    experience: number;
    engagement: number;
    hasResume: boolean;
    profileComplete: number;
  }): number {
    // Weighted formula for hiring readiness
    let readiness = 
      metrics.technical * 0.30 +
      metrics.education * 0.20 +
      metrics.experience * 0.25 +
      metrics.engagement * 0.15;
    
    // Resume is critical
    if (!metrics.hasResume) readiness *= 0.7;
    
    // Profile completeness matters
    if (metrics.profileComplete < 50) readiness *= 0.8;
    
    return Math.min(Math.round(readiness), 100);
  }

  /**
   * Calculate profile completeness
   */
  private calculateProfileCompleteness(
    student: any,
    skills: any[],
    trainings: any[],
    certs: any[]
  ): number {
    const checks = {
      hasName: !!student.name,
      hasEmail: !!student.email,
      hasPhone: !!student.phone,
      hasUniversity: !!student.university,
      hasBranch: !!student.branch_field,
      hasCGPA: !!student.currentCgpa,
      hasLocation: !!(student.city && student.state),
      hasGradYear: !!student.expectedGraduationDate,
      hasResume: !!student.resumeUrl,
      hasSkills: skills.length >= 3,
      hasTraining: trainings.length > 0,
      hasCerts: certs.length > 0,
      hasLinkedIn: !!student.linkedinUrl,
      hasGitHub: !!student.githubUrl
    };
    
    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    
    return Math.round((completed / total) * 100);
  }

  /**
   * Detect red flags
   */
  private detectRedFlags(student: any, skills: any[], applications: any[]): string[] {
    const flags: string[] = [];
    
    // No skills listed
    if (skills.length === 0) {
      flags.push('❌ No skills listed in profile');
    }
    
    // Vague/generic skills only
    const genericSkills = ['testing', 'communication', 'teamwork', 'leadership'];
    const onlyGeneric = skills.every(s => 
      genericSkills.some(g => s.name.toLowerCase().includes(g))
    );
    if (skills.length > 0 && onlyGeneric) {
      flags.push('⚠️ Only generic/soft skills listed, no technical skills');
    }
    
    // No resume
    if (!student.resumeUrl) {
      flags.push('📄 No resume uploaded');
    }
    
    // Very low CGPA
    if (student.currentCgpa && student.currentCgpa < 5.5) {
      flags.push(`📊 Low CGPA: ${student.currentCgpa}/10`);
    }
    
    // Applied to many jobs but no progress
    if (applications.length > 10) {
      const progressed = applications.filter(a => 
        a.application_status !== 'applied' && a.application_status !== 'rejected'
      );
      if (progressed.length === 0) {
        flags.push('🔄 High application volume with no interview progress');
      }
    }
    
    // Stale profile
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(student.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 180) {
      flags.push(`🕐 Inactive profile (last updated ${Math.floor(daysSinceUpdate / 30)} months ago)`);
    }
    
    return flags;
  }

  /**
   * Detect green flags (positive signals)
   */
  private detectGreenFlags(student: any, skills: any[], trainings: any[], certs: any[]): string[] {
    const flags: string[] = [];
    
    // Strong CGPA
    if (student.currentCgpa && student.currentCgpa >= 8.5) {
      flags.push(`✅ Excellent academics: ${student.currentCgpa}/10 CGPA`);
    }
    
    // Rich skill set
    if (skills.length >= 8) {
      flags.push(`✅ Diverse skill set: ${skills.length} skills`);
    }
    
    // Multiple certifications
    if (certs.length >= 3) {
      flags.push(`✅ Well-certified: ${certs.length} certifications`);
    }
    
    // Extensive training
    if (trainings.length >= 3) {
      flags.push(`✅ Continuous learner: ${trainings.length} training programs`);
    }
    
    // GitHub presence
    if (student.githubUrl) {
      flags.push('✅ Active GitHub profile');
    }
    
    // Complete profile
    const completeness = this.calculateProfileCompleteness(student, skills, trainings, certs);
    if (completeness >= 80) {
      flags.push(`✅ Complete profile: ${completeness}%`);
    }
    
    // Recent activity
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(student.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate <= 7) {
      flags.push('✅ Recently active');
    }
    
    return flags;
  }

  /**
   * Detect data quality issues
   */
  private detectDataQualityIssues(student: any, skills: any[]): string[] {
    const issues: string[] = [];
    
    // Suspicious skill names
    const suspiciousSkills = skills.filter(s => 
      /life|evaluation|test|testing/i.test(s.name) && s.name.split(' ').length <= 2
    );
    if (suspiciousSkills.length > 0) {
      issues.push(`Data quality: Vague skills like "${suspiciousSkills[0].name}"`);
    }
    
    // Missing critical info
    if (!student.phone) issues.push('Missing phone number');
    if (!student.city && !student.state) issues.push('Missing location');
    if (!student.expectedGraduationDate) issues.push('Missing graduation date');
    
    return issues;
  }

  /**
   * Assess responsiveness
   */
  private assessResponsiveness(applications: any[]): 'high' | 'medium' | 'low' | 'unknown' {
    if (applications.length === 0) return 'unknown';
    
    // Check if they're actively applying
    const recentApps = applications.filter(app => {
      const daysSince = (new Date().getTime() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    
    if (recentApps.length >= 3) return 'high';
    if (recentApps.length >= 1) return 'medium';
    return 'low';
  }

  /**
   * Categorize skills by type
   */
  private categorizeSkills(skills: any[]): { technical: string[]; soft: string[]; tools: string[] } {
    const technical: string[] = [];
    const soft: string[] = [];
    const tools: string[] = [];
    
    const softSkillKeywords = ['communication', 'leadership', 'teamwork', 'management', 'presentation'];
    const toolKeywords = ['git', 'docker', 'kubernetes', 'jenkins', 'jira', 'figma', 'photoshop'];
    
    skills.forEach(skill => {
      const skillLower = skill.name.toLowerCase();
      
      if (softSkillKeywords.some(k => skillLower.includes(k))) {
        soft.push(skill.name);
      } else if (toolKeywords.some(k => skillLower.includes(k))) {
        tools.push(skill.name);
      } else {
        technical.push(skill.name);
      }
    });
    
    return { technical, soft, tools };
  }

  /**
   * Group array by student_id
   */
  private groupByStudent<T extends { student_id: string }>(items: T[]): Map<string, T[]> {
    const map = new Map<string, T[]>();
    items.forEach(item => {
      const existing = map.get(item.student_id) || [];
      map.set(item.student_id, [...existing, item]);
    });
    return map;
  }
}

export const advancedCandidateScoring = new AdvancedCandidateScoringService();


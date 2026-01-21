/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STREAM RECOMMENDATION ENGINE FOR AFTER 10TH STUDENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Uses the same multi-dimensional analysis as courseMatchingEngine to recommend
 * the best 11th/12th stream (Science/Commerce/Arts) based on:
 * - Subject marks and academic performance
 * - Projects and practical experience
 * - RIASEC interests
 * - Outside experiences
 */

// ═══════════════════════════════════════════════════════════════════════════════
// STREAM KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════════

const STREAM_KNOWLEDGE_BASE = {
  pcmb: {
    name: 'PCMB (Physics, Chemistry, Maths, Biology)',
    category: 'Science',
    riasec: { primary: ['I', 'R'], secondary: ['C'], weights: { I: 0.4, R: 0.35, C: 0.25 } },
    subjects: {
      core: { physics: 0.25, chemistry: 0.25, mathematics: 0.25, biology: 0.25 },
      aliases: ['phy', 'chem', 'bio', 'maths', 'math', 'science', 'zoology', 'botany'],
    },
    keywords: {
      high: ['research', 'medical', 'doctor', 'scientist', 'lab', 'experiment'],
      medium: ['biology', 'healthcare', 'medicine'],
    },
    careerPaths: [
      'Doctor/MBBS',
      'Research Scientist',
      'Biotechnologist',
      'Pharmacist',
      'Veterinarian',
    ],
    entranceExams: ['NEET', 'AIIMS', 'JIPMER', 'State Medical Exams'],
    bestFor: 'Students interested in medicine, biology, and life sciences',
  },
  pcms: {
    name: 'PCMS (Physics, Chemistry, Maths, Computer Science)',
    category: 'Science',
    riasec: { primary: ['I', 'R'], secondary: ['C'], weights: { I: 0.35, R: 0.4, C: 0.25 } },
    subjects: {
      core: { physics: 0.3, chemistry: 0.2, mathematics: 0.3, computer: 0.2 },
      aliases: ['phy', 'chem', 'maths', 'math', 'cs', 'it', 'programming', 'computer science'],
    },
    keywords: {
      high: ['software', 'coding', 'programming', 'app', 'web', 'technology', 'ai', 'data'],
      medium: ['computer', 'tech', 'digital'],
    },
    careerPaths: [
      'Software Engineer',
      'Data Scientist',
      'AI/ML Engineer',
      'Cybersecurity Expert',
      'Game Developer',
    ],
    entranceExams: ['JEE Main', 'JEE Advanced', 'BITSAT', 'State Engineering Exams'],
    bestFor: 'Students interested in technology, programming, and computer science',
  },
  pcm: {
    name: 'PCM (Physics, Chemistry, Maths)',
    category: 'Science',
    riasec: { primary: ['R', 'I'], secondary: ['C'], weights: { R: 0.4, I: 0.35, C: 0.25 } },
    subjects: {
      core: { physics: 0.35, chemistry: 0.25, mathematics: 0.4 },
      aliases: ['phy', 'chem', 'maths', 'math', 'science'],
    },
    keywords: {
      high: ['engineering', 'design', 'mechanical', 'electrical', 'civil', 'robot'],
      medium: ['build', 'construct', 'machine'],
    },
    careerPaths: [
      'Engineer (Mechanical/Civil/Electrical)',
      'Architect',
      'Pilot',
      'Defense Services',
      'Physicist',
    ],
    entranceExams: ['JEE Main', 'JEE Advanced', 'NDA', 'State Engineering Exams'],
    bestFor: 'Students interested in engineering, physics, and mathematics',
  },
  pcb: {
    name: 'PCB (Physics, Chemistry, Biology)',
    category: 'Science',
    riasec: { primary: ['I', 'S'], secondary: ['R'], weights: { I: 0.35, S: 0.4, R: 0.25 } },
    subjects: {
      core: { physics: 0.25, chemistry: 0.35, biology: 0.4 },
      aliases: ['phy', 'chem', 'bio', 'zoology', 'botany', 'life science'],
    },
    keywords: {
      high: ['medical', 'nursing', 'healthcare', 'patient', 'clinical'],
      medium: ['biology', 'health', 'care'],
    },
    careerPaths: ['Doctor/MBBS', 'Nurse', 'Physiotherapist', 'Medical Lab Technician', 'Dentist'],
    entranceExams: ['NEET', 'AIIMS', 'Nursing Entrance Exams'],
    bestFor: 'Students interested in healthcare and medical sciences',
  },
  commerce_maths: {
    name: 'Commerce with Maths',
    category: 'Commerce',
    riasec: { primary: ['E', 'C'], secondary: ['I'], weights: { E: 0.35, C: 0.4, I: 0.25 } },
    subjects: {
      core: { accountancy: 0.3, economics: 0.25, business: 0.2, mathematics: 0.25 },
      aliases: ['accounts', 'eco', 'commerce', 'maths', 'math', 'business studies'],
    },
    keywords: {
      high: ['finance', 'investment', 'stock', 'banking', 'ca', 'accounting'],
      medium: ['business', 'money', 'trade'],
    },
    careerPaths: [
      'Chartered Accountant',
      'Investment Banker',
      'Financial Analyst',
      'Actuary',
      'Economist',
    ],
    entranceExams: ['CA Foundation', 'CS Foundation', 'CMA', 'CUET'],
    bestFor: 'Students interested in finance, accounting, and quantitative analysis',
  },
  commerce: {
    name: 'Commerce without Maths',
    category: 'Commerce',
    riasec: { primary: ['E', 'C'], secondary: ['S'], weights: { E: 0.4, C: 0.35, S: 0.25 } },
    subjects: {
      core: { accountancy: 0.35, economics: 0.3, business: 0.35 },
      aliases: ['accounts', 'eco', 'commerce', 'business studies'],
    },
    keywords: {
      high: ['business', 'entrepreneur', 'marketing', 'sales', 'management'],
      medium: ['trade', 'company', 'startup'],
    },
    careerPaths: [
      'Business Manager',
      'Marketing Executive',
      'HR Manager',
      'Entrepreneur',
      'Company Secretary',
    ],
    entranceExams: ['CUET', 'IPM', 'BBA Entrance Exams'],
    bestFor: 'Students interested in business, management, and entrepreneurship',
  },
  arts_psychology: {
    name: 'Arts with Psychology',
    category: 'Arts',
    riasec: { primary: ['S', 'I'], secondary: ['A'], weights: { S: 0.4, I: 0.35, A: 0.25 } },
    subjects: {
      core: { english: 0.25, psychology: 0.35, sociology: 0.2, history: 0.2 },
      aliases: ['eng', 'psych', 'socio', 'hist', 'humanities'],
    },
    keywords: {
      high: ['psychology', 'counseling', 'mental health', 'behavior', 'therapy'],
      medium: ['human', 'mind', 'social'],
    },
    careerPaths: [
      'Psychologist',
      'Counselor',
      'HR Professional',
      'Social Worker',
      'Clinical Therapist',
    ],
    entranceExams: ['CUET', 'DU JAT', 'Psychology Entrance Exams'],
    bestFor: 'Students interested in understanding human behavior and mental health',
  },
  arts_economics: {
    name: 'Arts with Economics',
    category: 'Arts',
    riasec: { primary: ['I', 'E'], secondary: ['S'], weights: { I: 0.4, E: 0.35, S: 0.25 } },
    subjects: {
      core: { economics: 0.35, english: 0.25, political: 0.2, history: 0.2 },
      aliases: ['eco', 'eng', 'civics', 'pol sci', 'hist'],
    },
    keywords: {
      high: ['economics', 'policy', 'government', 'civil services', 'ias'],
      medium: ['society', 'politics', 'development'],
    },
    careerPaths: [
      'Economist',
      'Civil Services (IAS/IPS)',
      'Policy Analyst',
      'Journalist',
      'Professor',
    ],
    entranceExams: ['UPSC', 'CUET', 'Economics Honors Entrance'],
    bestFor: 'Students interested in economics, policy-making, and civil services',
  },
  arts: {
    name: 'Arts/Humanities General',
    category: 'Arts',
    riasec: { primary: ['A', 'S'], secondary: ['I'], weights: { A: 0.4, S: 0.35, I: 0.25 } },
    subjects: {
      core: { english: 0.3, history: 0.25, political: 0.2, geography: 0.25 },
      aliases: ['eng', 'hist', 'civics', 'geo', 'literature', 'hindi'],
    },
    keywords: {
      high: ['writing', 'journalism', 'content', 'creative', 'media', 'law'],
      medium: ['art', 'culture', 'literature'],
    },
    careerPaths: ['Journalist', 'Content Writer', 'Lawyer', 'Teacher', 'Civil Services'],
    entranceExams: ['CLAT', 'CUET', 'Mass Communication Entrance'],
    bestFor: 'Students interested in humanities, writing, and creative fields',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1: INTEREST DNA ANALYZER (Deep RIASEC Analysis)
// ═══════════════════════════════════════════════════════════════════════════════

const analyzeInterestDNA = (riasecScores) => {
  if (!riasecScores || Object.keys(riasecScores).length === 0) {
    return { hasData: false, normalizedScores: {}, dominantTypes: [], strengthLevel: 0 };
  }
  const total = Object.values(riasecScores).reduce((sum, v) => sum + (v || 0), 0);
  if (total === 0)
    return { hasData: false, normalizedScores: {}, dominantTypes: [], strengthLevel: 0 };

  const maxPossible = Math.max(...Object.values(riasecScores), 1);
  const normalizedScores = {};
  Object.entries(riasecScores).forEach(([type, score]) => {
    normalizedScores[type] = Math.round(((score || 0) / maxPossible) * 100);
  });

  const sortedTypes = Object.entries(normalizedScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);
  const scores = Object.values(normalizedScores);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const strengthLevel = Math.min(100, Math.sqrt(variance) * 3);

  return {
    hasData: true,
    normalizedScores,
    dominantTypes: sortedTypes,
    strengthLevel,
    primaryType: sortedTypes[0],
    secondaryType: sortedTypes[1],
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2: ACADEMIC INTELLIGENCE PROFILER
// ═══════════════════════════════════════════════════════════════════════════════

const profileAcademicIntelligence = (marks) => {
  if (!marks || marks.length === 0) {
    return {
      hasData: false,
      subjectScores: {},
      streamAffinity: { science: 0, commerce: 0, arts: 0 },
      academicStrength: 0,
      topSubjects: [],
    };
  }

  const subjectScores = {};
  const streamScores = { science: [], commerce: [], arts: [] };
  const streamMap = {
    science: [
      'physics',
      'phy',
      'chemistry',
      'chem',
      'biology',
      'bio',
      'mathematics',
      'maths',
      'math',
      'science',
      'computer',
      'cs',
      'it',
    ],
    commerce: [
      'accountancy',
      'accounts',
      'accounting',
      'economics',
      'eco',
      'commerce',
      'business',
      'finance',
    ],
    arts: [
      'english',
      'eng',
      'history',
      'hist',
      'political',
      'civics',
      'sociology',
      'psychology',
      'geography',
      'hindi',
      'literature',
    ],
  };

  marks.forEach((mark) => {
    const subjectName = (
      mark.curriculum_subjects?.name ||
      mark.subject_name ||
      mark.subject_id ||
      ''
    )
      .toLowerCase()
      .trim();
    if (!subjectName) return;
    const percentage =
      mark.percentage ||
      (mark.marks_obtained && mark.total_marks
        ? (mark.marks_obtained / mark.total_marks) * 100
        : 0);
    if (percentage > 0) {
      if (!subjectScores[subjectName] || subjectScores[subjectName] < percentage)
        subjectScores[subjectName] = percentage;
      Object.entries(streamMap).forEach(([stream, subjects]) => {
        if (subjects.some((s) => subjectName.includes(s))) streamScores[stream].push(percentage);
      });
    }
  });

  const streamAffinity = {};
  Object.entries(streamScores).forEach(([stream, scores]) => {
    streamAffinity[stream] =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  });

  const sortedSubjects = Object.entries(subjectScores).sort((a, b) => b[1] - a[1]);
  const topSubjects = sortedSubjects
    .slice(0, 5)
    .map(([name, score]) => ({ name, score: Math.round(score) }));
  const allScores = Object.values(subjectScores);
  const academicStrength =
    allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const dominantStream =
    Object.entries(streamAffinity).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  return {
    hasData: true,
    subjectScores,
    streamAffinity,
    academicStrength,
    topSubjects,
    dominantStream,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3: PROJECT ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

const analyzeProjects = (projects) => {
  if (!projects || projects.length === 0) {
    return { hasData: false, domains: [], technologies: [], projectCount: 0 };
  }

  const domainCounts = {};
  const technologies = new Set();

  const domainPatterns = {
    technology:
      /\b(software|app|web|mobile|python|java|react|coding|programming|computer|robot)\b/gi,
    business: /\b(startup|entrepreneur|business|marketing|sales|strategy)\b/gi,
    research: /\b(research|experiment|scientific|hypothesis|lab|data)\b/gi,
    creative: /\b(design|art|creative|content|media|video|graphic)\b/gi,
    social: /\b(ngo|volunteer|community|social|charity)\b/gi,
    medical: /\b(medical|health|clinical|patient|biology)\b/gi,
  };

  projects.forEach((project) => {
    const text = `${project.title || ''} ${project.description || ''}`.toLowerCase();
    Object.entries(domainPatterns).forEach(([domain, pattern]) => {
      const matches = (text.match(pattern) || []).length;
      if (matches > 0) domainCounts[domain] = (domainCounts[domain] || 0) + matches;
    });
    if (project.tech_stack && Array.isArray(project.tech_stack)) {
      project.tech_stack.forEach((tech) => technologies.add(tech.toLowerCase()));
    }
  });

  const domains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([domain]) => domain);
  return {
    hasData: true,
    domains,
    technologies: Array.from(technologies),
    projectCount: projects.length,
    primaryDomain: domains[0] || null,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 4: EXPERIENCE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

const analyzeExperiences = (experiences) => {
  if (!experiences || experiences.length === 0) {
    return { hasData: false, experienceTypes: [], verifiedCount: 0 };
  }

  const typeCounts = {};
  let verifiedCount = 0;

  const typePatterns = {
    technology: /\b(tech|software|it|developer|coding|computer)\b/gi,
    business: /\b(business|marketing|sales|management)\b/gi,
    research: /\b(research|lab|scientist|academic)\b/gi,
    creative: /\b(design|content|media|writer|art)\b/gi,
    social: /\b(volunteer|ngo|social|community|teaching)\b/gi,
    medical: /\b(hospital|clinic|medical|health)\b/gi,
  };

  experiences.forEach((exp) => {
    const text = `${exp.organization || ''} ${exp.role || ''}`.toLowerCase();
    Object.entries(typePatterns).forEach(([type, pattern]) => {
      const matches = (text.match(pattern) || []).length;
      if (matches > 0) typeCounts[type] = (typeCounts[type] || 0) + matches;
    });
    if (exp.verified) verifiedCount++;
  });

  return {
    hasData: true,
    experienceTypes: Object.keys(typeCounts),
    verifiedCount,
    primaryType: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCORING ENGINE - Calculate stream match scores
// ═══════════════════════════════════════════════════════════════════════════════

const calculateStreamScore = (
  streamId,
  streamProfile,
  interestDNA,
  academicProfile,
  projectAnalysis,
  experienceAnalysis
) => {
  let totalScore = 0;
  const matchReasons = [];
  const scoreBreakdown = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEREST ALIGNMENT SCORE (25%)
  // ═══════════════════════════════════════════════════════════════════════════
  let interestScore = 0;
  if (interestDNA.hasData) {
    const primaryMatch = interestDNA.dominantTypes.filter((t) =>
      streamProfile.riasec.primary.includes(t)
    ).length;
    const secondaryMatch = interestDNA.dominantTypes.filter((t) =>
      streamProfile.riasec.secondary.includes(t)
    ).length;
    interestScore = primaryMatch * 12 + secondaryMatch * 6;
    interestScore = Math.min(25, interestScore);
    if (primaryMatch > 0) {
      matchReasons.push(`Your ${interestDNA.dominantTypes[0]} interests align well`);
    }
  }
  scoreBreakdown.interest = Math.round(interestScore);
  totalScore += interestScore;

  // ═══════════════════════════════════════════════════════════════════════════
  // ACADEMIC PERFORMANCE SCORE (35%)
  // ═══════════════════════════════════════════════════════════════════════════
  let academicScore = 0;
  if (academicProfile.hasData) {
    // Stream affinity bonus
    if (academicProfile.dominantStream === streamProfile.category.toLowerCase()) {
      academicScore += 15;
      matchReasons.push(`Strong ${streamProfile.category} subject performance`);
    }

    // Subject-specific scoring
    let subjectMatchScore = 0;
    Object.entries(streamProfile.subjects.core).forEach(([subject, weight]) => {
      const aliases = [subject, ...(streamProfile.subjects.aliases || [])];
      Object.entries(academicProfile.subjectScores).forEach(([studentSubject, score]) => {
        if (aliases.some((a) => studentSubject.includes(a))) {
          subjectMatchScore += (score / 100) * weight * 20;
        }
      });
    });
    academicScore += Math.min(20, subjectMatchScore);

    // Top subject mention
    if (academicProfile.topSubjects.length > 0) {
      const topSubject = academicProfile.topSubjects[0];
      if (topSubject.score >= 70) {
        matchReasons.push(`Strong in ${topSubject.name} (${topSubject.score}%)`);
      }
    }
  }
  scoreBreakdown.academic = Math.round(Math.min(35, academicScore));
  totalScore += scoreBreakdown.academic;

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT RELEVANCE SCORE (20%)
  // ═══════════════════════════════════════════════════════════════════════════
  let projectScore = 0;
  if (projectAnalysis.hasData) {
    const streamDomainMap = {
      Science: ['technology', 'research', 'medical'],
      Commerce: ['business'],
      Arts: ['creative', 'social'],
    };
    const relevantDomains = projectAnalysis.domains.filter((d) =>
      (streamDomainMap[streamProfile.category] || []).includes(d)
    );
    if (relevantDomains.length > 0) {
      projectScore += relevantDomains.length * 8;
      matchReasons.push(`Relevant projects in ${relevantDomains[0]}`);
    }
    projectScore += Math.min(8, projectAnalysis.projectCount * 3);
  }
  scoreBreakdown.projects = Math.round(Math.min(20, projectScore));
  totalScore += scoreBreakdown.projects;

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPERIENCE RELEVANCE SCORE (20%)
  // ═══════════════════════════════════════════════════════════════════════════
  let experienceScore = 0;
  if (experienceAnalysis.hasData) {
    const streamExpMap = {
      Science: ['technology', 'research', 'medical'],
      Commerce: ['business'],
      Arts: ['creative', 'social'],
    };
    const relevantTypes = experienceAnalysis.experienceTypes.filter((t) =>
      (streamExpMap[streamProfile.category] || []).includes(t)
    );
    if (relevantTypes.length > 0) {
      experienceScore += relevantTypes.length * 8;
      matchReasons.push(`Experience in ${relevantTypes[0]} field`);
    }
    if (experienceAnalysis.verifiedCount > 0) {
      experienceScore += 5;
    }
  }
  scoreBreakdown.experience = Math.round(Math.min(20, experienceScore));
  totalScore += scoreBreakdown.experience;

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL SCORE
  // ═══════════════════════════════════════════════════════════════════════════
  const finalScore = Math.min(98, Math.max(20, Math.round(totalScore)));

  let matchLevel = 'Low';
  if (finalScore >= 80) matchLevel = 'High';
  else if (finalScore >= 60) matchLevel = 'Medium';

  return {
    streamId,
    streamName: streamProfile.name,
    category: streamProfile.category,
    matchScore: finalScore,
    matchLevel,
    reasons: matchReasons.slice(0, 4),
    scoreBreakdown,
    careerPaths: streamProfile.careerPaths || [],
    entranceExams: streamProfile.entranceExams || [],
    bestFor: streamProfile.bestFor || '',
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: calculateStreamRecommendations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate stream recommendations for after 10th students
 * @param {Object} assessmentResults - RIASEC and other assessment results
 * @param {Object} academicData - Subject marks, projects, experiences
 * @returns {Object} Stream recommendations with scores
 */
export const calculateStreamRecommendations = (assessmentResults, academicData = {}) => {
  // Extract RIASEC scores
  const riasecScores = assessmentResults?.riasec?.scores || {};

  // Analyze all dimensions
  const interestDNA = analyzeInterestDNA(riasecScores);
  const academicProfile = profileAcademicIntelligence(academicData.subjectMarks || []);
  const projectAnalysis = analyzeProjects(academicData.projects || []);
  const experienceAnalysis = analyzeExperiences(academicData.experiences || []);

  // Calculate scores for all streams
  const streamScores = [];
  Object.entries(STREAM_KNOWLEDGE_BASE).forEach(([streamId, streamProfile]) => {
    const score = calculateStreamScore(
      streamId,
      streamProfile,
      interestDNA,
      academicProfile,
      projectAnalysis,
      experienceAnalysis
    );
    streamScores.push(score);
  });

  // Sort by match score
  streamScores.sort((a, b) => b.matchScore - a.matchScore);

  // Get top recommendation and alternative
  const topRecommendation = streamScores[0];
  const alternativeRecommendation = streamScores[1];

  return {
    isAfter10: true,
    recommendedStream: topRecommendation?.streamName || 'Science',
    streamFit: topRecommendation?.matchLevel || 'Medium',
    confidenceScore: topRecommendation?.matchScore || 50,
    reasoning: {
      interests:
        topRecommendation?.reasons?.find((r) => r.includes('interest')) ||
        `Based on your RIASEC profile`,
      aptitude:
        topRecommendation?.reasons?.find((r) => r.includes('Strong') || r.includes('subject')) ||
        `Based on your academic performance`,
      personality:
        topRecommendation?.reasons?.find(
          (r) => r.includes('project') || r.includes('experience')
        ) || `Based on your activities`,
    },
    scoreBasedAnalysis: {
      riasecTop3: interestDNA.dominantTypes || [],
      strongAptitudes:
        academicProfile.topSubjects?.slice(0, 2).map((s) => `${s.name} (${s.score}%)`) || [],
      matchingPattern: `${topRecommendation?.category || 'Science'} stream alignment`,
    },
    alternativeStream: alternativeRecommendation?.streamName || null,
    alternativeReason: alternativeRecommendation
      ? `Also a good fit with ${alternativeRecommendation.matchScore}% match`
      : null,
    subjectsToFocus: getSubjectsForStream(topRecommendation?.streamId),
    careerPathsAfter12: topRecommendation?.careerPaths || [],
    entranceExams: topRecommendation?.entranceExams || [],
    collegeTypes: getCollegeTypesForStream(topRecommendation?.category),
    allStreamScores: streamScores,
    dataUsed: {
      hasRiasec: interestDNA.hasData,
      hasAcademicData: academicProfile.hasData,
      hasProjects: projectAnalysis.hasData,
      hasExperiences: experienceAnalysis.hasData,
    },
  };
};

// Helper functions
const getSubjectsForStream = (streamId) => {
  const subjectMap = {
    pcmb: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    pcms: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science'],
    pcm: ['Physics', 'Chemistry', 'Mathematics'],
    pcb: ['Physics', 'Chemistry', 'Biology'],
    commerce_maths: ['Accountancy', 'Economics', 'Business Studies', 'Mathematics'],
    commerce: ['Accountancy', 'Economics', 'Business Studies'],
    arts_psychology: ['English', 'Psychology', 'Sociology', 'History'],
    arts_economics: ['Economics', 'English', 'Political Science', 'History'],
    arts: ['English', 'History', 'Political Science', 'Geography'],
  };
  return subjectMap[streamId] || ['Core Subjects'];
};

const getCollegeTypesForStream = (category) => {
  const collegeMap = {
    Science: ['IITs', 'NITs', 'Medical Colleges', 'Science Universities'],
    Commerce: ['Top Commerce Colleges', 'Business Schools', 'CA Institutes'],
    Arts: ['Central Universities', 'Law Schools', 'Mass Communication Institutes'],
  };
  return collegeMap[category] || ['Universities'];
};

export default { calculateStreamRecommendations, STREAM_KNOWLEDGE_BASE };

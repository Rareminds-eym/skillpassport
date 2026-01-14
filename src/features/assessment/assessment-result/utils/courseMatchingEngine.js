/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ADVANCED AI-POWERED COURSE RECOMMENDATION ENGINE v2.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * A sophisticated multi-dimensional analysis system that performs deep micro-level
 * profiling of students to generate highly accurate, personalized recommendations.
 * 
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                        STUDENT PROFILE ANALYZER                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │  Layer 1: Interest DNA Analysis (RIASEC Deep Mapping)                       │
 * │  Layer 2: Academic Intelligence Profiling                                   │
 * │  Layer 3: Skill Signature Extraction (Projects + Tech Stack)                │
 * │  Layer 4: Experience Pattern Recognition                                    │
 * │  Layer 5: Cross-Domain Synergy Detection                                    │
 * │  Layer 6: Future Potential Prediction                                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * SCORING WEIGHTS (Adaptive based on data availability):
 * - Interest Alignment (RIASEC)      : 20% base → up to 35% if strong signal
 * - Academic Performance             : 25% base → up to 40% if comprehensive data
 * - Project Portfolio Analysis       : 20% base → up to 30% if rich projects
 * - Experience Relevance             : 15% base → up to 25% if verified
 * - Cross-Domain Synergy Bonus       : 10% bonus for multi-factor alignment
 * - Future Growth Potential          : 10% bonus for emerging field fit
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE COURSE KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════════

export const COURSE_KNOWLEDGE_BASE = {
  bsc: {
    name: "B.Sc (Physics/Chemistry/Biology/Maths)",
    stream: "science",
    riasec: { primary: ["I", "R"], secondary: ["C"], weights: { I: 0.4, R: 0.35, C: 0.25 } },
    subjects: {
      core: { physics: 0.3, chemistry: 0.25, biology: 0.25, mathematics: 0.2 },
      aliases: ["phy", "chem", "bio", "maths", "math", "science", "zoology", "botany"]
    },
    keywords: { high: ["research", "experiment", "scientific", "lab", "hypothesis", "data"], medium: ["study", "analysis", "testing"] },
    careerPaths: [{ role: "Research Scientist", salary: { min: 6, max: 15 } }, { role: "Data Analyst", salary: { min: 5, max: 12 } }],
    futureRelevance: 0.85
  },
  bca: {
    name: "BCA (Computer Applications)",
    stream: "science",
    riasec: { primary: ["I", "R"], secondary: ["C"], weights: { I: 0.35, R: 0.4, C: 0.25 } },
    subjects: {
      core: { computer: 0.4, mathematics: 0.35, physics: 0.15, english: 0.1 },
      aliases: ["cs", "it", "programming", "maths", "math", "computer science"]
    },
    keywords: { high: ["software", "app", "web", "python", "java", "react", "database", "api", "ai", "ml"], medium: ["coding", "programming", "automation"] },
    careerPaths: [{ role: "Software Developer", salary: { min: 6, max: 25 } }, { role: "Data Scientist", salary: { min: 8, max: 30 } }],
    futureRelevance: 0.98
  },
  engineering: {
    name: "B.Tech / Engineering",
    stream: "science",
    riasec: { primary: ["R", "I"], secondary: ["C"], weights: { R: 0.4, I: 0.35, C: 0.25 } },
    subjects: {
      core: { physics: 0.35, mathematics: 0.4, chemistry: 0.25 },
      aliases: ["phy", "maths", "math", "chem", "science"]
    },
    keywords: { high: ["engineering", "design", "prototype", "robot", "circuit", "mechanical"], medium: ["build", "construct", "simulation"] },
    careerPaths: [{ role: "Software Engineer", salary: { min: 8, max: 35 } }, { role: "Data Engineer", salary: { min: 10, max: 30 } }],
    futureRelevance: 0.92
  },
  medical: {
    name: "MBBS / Medical Sciences",
    stream: "science",
    riasec: { primary: ["I", "S"], secondary: ["R"], weights: { I: 0.35, S: 0.4, R: 0.25 } },
    subjects: {
      core: { biology: 0.45, chemistry: 0.35, physics: 0.2 },
      aliases: ["bio", "chem", "phy", "zoology", "botany", "life science"]
    },
    keywords: { high: ["medical", "health", "clinical", "patient", "disease", "treatment"], medium: ["biology", "anatomy", "healthcare"] },
    careerPaths: [{ role: "Doctor/Physician", salary: { min: 10, max: 50 } }, { role: "Surgeon", salary: { min: 20, max: 100 } }],
    futureRelevance: 0.95
  },
  bba: {
    name: "BBA General",
    stream: "commerce",
    riasec: { primary: ["E", "C"], secondary: ["S"], weights: { E: 0.4, C: 0.35, S: 0.25 } },
    subjects: {
      core: { business: 0.3, economics: 0.25, accountancy: 0.25, english: 0.2 },
      aliases: ["commerce", "accounts", "eco", "management"]
    },
    keywords: { high: ["business", "startup", "entrepreneur", "marketing", "strategy"], medium: ["plan", "analysis", "market", "sales"] },
    careerPaths: [{ role: "Business Analyst", salary: { min: 6, max: 18 } }, { role: "Marketing Manager", salary: { min: 8, max: 25 } }],
    futureRelevance: 0.82
  },
  dm: {
    name: "BBA Digital Marketing",
    stream: "commerce",
    riasec: { primary: ["A", "E"], secondary: ["S"], weights: { A: 0.35, E: 0.4, S: 0.25 } },
    subjects: {
      core: { business: 0.25, english: 0.3, computer: 0.25, economics: 0.2 },
      aliases: ["commerce", "marketing", "media", "communication", "it"]
    },
    keywords: { high: ["digital", "marketing", "social media", "seo", "content", "campaign", "brand"], medium: ["online", "advertising", "promotion"] },
    careerPaths: [{ role: "Digital Marketing Manager", salary: { min: 6, max: 20 } }, { role: "SEO Specialist", salary: { min: 4, max: 12 } }],
    futureRelevance: 0.94
  },
  finance: {
    name: "BBA Finance / Banking",
    stream: "commerce",
    riasec: { primary: ["C", "I"], secondary: ["E"], weights: { C: 0.4, I: 0.35, E: 0.25 } },
    subjects: {
      core: { accountancy: 0.35, economics: 0.3, mathematics: 0.25, business: 0.1 },
      aliases: ["accounts", "eco", "maths", "math", "finance", "commerce"]
    },
    keywords: { high: ["finance", "investment", "stock", "banking", "accounting", "portfolio"], medium: ["financial", "capital", "audit", "tax"] },
    careerPaths: [{ role: "Financial Analyst", salary: { min: 6, max: 20 } }, { role: "Investment Banker", salary: { min: 12, max: 50 } }],
    futureRelevance: 0.88
  },
  bcom: {
    name: "B.Com (Commerce)",
    stream: "commerce",
    riasec: { primary: ["C", "E"], secondary: ["I"], weights: { C: 0.45, E: 0.3, I: 0.25 } },
    subjects: {
      core: { accountancy: 0.4, economics: 0.25, business: 0.2, mathematics: 0.15 },
      aliases: ["accounts", "eco", "commerce", "maths", "math"]
    },
    keywords: { high: ["accounting", "tax", "audit", "financial", "gst", "tally"], medium: ["commerce", "business", "accounts"] },
    careerPaths: [{ role: "Chartered Accountant", salary: { min: 8, max: 30 } }, { role: "Tax Consultant", salary: { min: 5, max: 15 } }],
    futureRelevance: 0.78
  },
  ba: {
    name: "BA (English/History/Political Science)",
    stream: "arts",
    riasec: { primary: ["A", "S"], secondary: ["I"], weights: { A: 0.4, S: 0.35, I: 0.25 } },
    subjects: {
      core: { english: 0.3, history: 0.25, political: 0.25, sociology: 0.2 },
      aliases: ["eng", "hist", "civics", "pol sci", "literature", "geography", "psychology"]
    },
    keywords: { high: ["writing", "research", "essay", "journalism", "content", "blog"], medium: ["social", "cultural", "historical", "political"] },
    careerPaths: [{ role: "Content Writer", salary: { min: 3, max: 12 } }, { role: "Civil Services", salary: { min: 8, max: 25 } }],
    futureRelevance: 0.72
  },
  law: {
    name: "LLB / Law",
    stream: "arts",
    riasec: { primary: ["E", "I"], secondary: ["S"], weights: { E: 0.4, I: 0.35, S: 0.25 } },
    subjects: {
      core: { english: 0.3, political: 0.3, history: 0.2, economics: 0.2 },
      aliases: ["eng", "civics", "pol sci", "hist", "eco"]
    },
    keywords: { high: ["legal", "law", "rights", "constitution", "court", "case study"], medium: ["justice", "policy", "governance"] },
    careerPaths: [{ role: "Lawyer/Advocate", salary: { min: 5, max: 50 } }, { role: "Corporate Counsel", salary: { min: 12, max: 40 } }],
    futureRelevance: 0.80
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEGREE PROGRAMS LIST FOR AFTER 12TH STUDENTS
// ═══════════════════════════════════════════════════════════════════════════════
// This array is used to generate degree program recommendations for after12 students
// instead of platform training courses. Each entry maps to COURSE_KNOWLEDGE_BASE.

export const DEGREE_PROGRAMS = [
  { courseId: 'engineering', courseName: 'B.Tech / Engineering', category: 'Science', description: 'Design, build, and innovate with cutting-edge technology' },
  { courseId: 'bca', courseName: 'BCA (Computer Applications)', category: 'Science', description: 'Master software development and IT solutions' },
  { courseId: 'bsc', courseName: 'B.Sc (Physics/Chemistry/Biology/Maths)', category: 'Science', description: 'Explore scientific research and analytical thinking' },
  { courseId: 'medical', courseName: 'MBBS / Medical Sciences', category: 'Science', description: 'Heal and care for patients in healthcare' },
  { courseId: 'bba', courseName: 'BBA General', category: 'Commerce', description: 'Lead businesses and manage organizations' },
  { courseId: 'dm', courseName: 'BBA Digital Marketing', category: 'Commerce', description: 'Drive brand growth through digital strategies' },
  { courseId: 'finance', courseName: 'BBA Finance / Banking', category: 'Commerce', description: 'Manage investments and financial planning' },
  { courseId: 'bcom', courseName: 'B.Com (Commerce)', category: 'Commerce', description: 'Excel in accounting, taxation, and commerce' },
  { courseId: 'ba', courseName: 'BA (English/History/Political Science)', category: 'Arts', description: 'Explore humanities, writing, and social sciences' },
  { courseId: 'law', courseName: 'LLB / Law', category: 'Arts', description: 'Advocate for justice and legal expertise' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1: INTEREST DNA ANALYZER (Deep RIASEC Analysis)
// ═══════════════════════════════════════════════════════════════════════════════

const analyzeInterestDNA = (riasecScores) => {
  if (!riasecScores || Object.keys(riasecScores).length === 0) {
    return { hasData: false, normalizedScores: {}, dominantTypes: [], strengthLevel: 0 };
  }
  const total = Object.values(riasecScores).reduce((sum, v) => sum + (v || 0), 0);
  if (total === 0) return { hasData: false, normalizedScores: {}, dominantTypes: [], strengthLevel: 0 };

  const maxPossible = Math.max(...Object.values(riasecScores), 1);
  const normalizedScores = {};
  Object.entries(riasecScores).forEach(([type, score]) => {
    normalizedScores[type] = Math.round(((score || 0) / maxPossible) * 100);
  });

  const sortedTypes = Object.entries(normalizedScores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type]) => type);
  const scores = Object.values(normalizedScores);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const strengthLevel = Math.min(100, Math.sqrt(variance) * 3);

  return { hasData: true, normalizedScores, dominantTypes: sortedTypes, strengthLevel, primaryType: sortedTypes[0], secondaryType: sortedTypes[1] };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2: ACADEMIC INTELLIGENCE PROFILER
// ═══════════════════════════════════════════════════════════════════════════════

const profileAcademicIntelligence = (marks) => {
  if (!marks || marks.length === 0) {
    return { hasData: false, subjectScores: {}, streamAffinity: { science: 0, commerce: 0, arts: 0 }, academicStrength: 0, topSubjects: [] };
  }

  const subjectScores = {};
  const streamScores = { science: [], commerce: [], arts: [] };
  const streamMap = {
    science: ["physics", "phy", "chemistry", "chem", "biology", "bio", "mathematics", "maths", "math", "science", "computer", "cs", "it", "zoology", "botany"],
    commerce: ["accountancy", "accounts", "accounting", "economics", "eco", "commerce", "business", "finance", "taxation", "management"],
    arts: ["english", "eng", "history", "hist", "political", "civics", "sociology", "psychology", "philosophy", "geography", "hindi", "literature"]
  };

  marks.forEach((mark) => {
    const subjectName = (mark.curriculum_subjects?.name || mark.subject_name || mark.subject_id || "").toLowerCase().trim();
    if (!subjectName) return;
    const percentage = mark.percentage || (mark.marks_obtained && mark.total_marks ? (mark.marks_obtained / mark.total_marks) * 100 : 0);
    if (percentage > 0) {
      if (!subjectScores[subjectName] || subjectScores[subjectName] < percentage) subjectScores[subjectName] = percentage;
      Object.entries(streamMap).forEach(([stream, subjects]) => {
        if (subjects.some((s) => subjectName.includes(s))) streamScores[stream].push(percentage);
      });
    }
  });

  const streamAffinity = {};
  Object.entries(streamScores).forEach(([stream, scores]) => {
    streamAffinity[stream] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  });

  const sortedSubjects = Object.entries(subjectScores).sort((a, b) => b[1] - a[1]);
  const topSubjects = sortedSubjects.slice(0, 5).map(([name, score]) => ({ name, score: Math.round(score) }));
  const allScores = Object.values(subjectScores);
  const academicStrength = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const dominantStream = Object.entries(streamAffinity).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

  return { hasData: true, subjectScores, streamAffinity, academicStrength, topSubjects, dominantStream };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3: SKILL SIGNATURE EXTRACTOR (Project Analysis)
// ═══════════════════════════════════════════════════════════════════════════════

const extractSkillSignature = (projects) => {
  if (!projects || projects.length === 0) {
    return { hasData: false, domains: [], technologies: [], complexityScore: 0, practicalExperience: 0 };
  }

  const domainCounts = {};
  const technologies = new Set();
  let totalComplexity = 0;

  const domainPatterns = {
    technology: /\b(software|app|web|mobile|python|java|react|node|database|api|machine learning|ai|ml|backend|frontend|fullstack|coding|programming)\b/gi,
    business: /\b(startup|entrepreneur|business|marketing|sales|strategy|consulting|venture|product|growth)\b/gi,
    research: /\b(research|experiment|scientific|hypothesis|thesis|publication|analysis|survey|data)\b/gi,
    creative: /\b(design|art|creative|content|media|video|graphic|animation|ui|ux|visual|brand)\b/gi,
    social: /\b(ngo|volunteer|community|social|charity|nonprofit|humanitarian|awareness)\b/gi,
    finance: /\b(investment|stock|trading|portfolio|fintech|banking|financial|accounting|budget|audit)\b/gi,
    healthcare: /\b(medical|clinical|patient|healthcare|diagnosis|treatment|pharma|health|hospital)\b/gi
  };

  const techPatterns = /\b(python|java|javascript|react|node|angular|vue|sql|mongodb|aws|azure|docker|tensorflow|pytorch|pandas|excel|tableau|figma|photoshop)\b/gi;

  projects.forEach((project) => {
    const text = `${project.title || ""} ${project.description || ""}`.toLowerCase();
    let projectComplexity = 0;

    Object.entries(domainPatterns).forEach(([domain, pattern]) => {
      const matches = (text.match(pattern) || []).length;
      if (matches > 0) {
        domainCounts[domain] = (domainCounts[domain] || 0) + matches;
        projectComplexity += matches;
      }
    });

    const techMatches = text.match(techPatterns) || [];
    techMatches.forEach((tech) => technologies.add(tech.toLowerCase()));
    if (project.tech_stack && Array.isArray(project.tech_stack)) {
      project.tech_stack.forEach((tech) => technologies.add(tech.toLowerCase()));
    }
    totalComplexity += Math.min(projectComplexity, 20);
  });

  const domains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).map(([domain]) => domain);
  const complexityScore = Math.min(100, (totalComplexity / projects.length) * 12);
  const practicalExperience = Math.min(100, projects.length * 18 + complexityScore * 0.4);

  return { hasData: true, domains, technologies: Array.from(technologies), complexityScore, practicalExperience, projectCount: projects.length, primaryDomain: domains[0] || null };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 4: EXPERIENCE PATTERN RECOGNIZER
// ═══════════════════════════════════════════════════════════════════════════════

const recognizeExperiencePatterns = (experiences) => {
  if (!experiences || experiences.length === 0) {
    return { hasData: false, experienceTypes: [], verifiedCount: 0, professionalReadiness: 0, careerSignals: [] };
  }

  const typeCounts = {};
  let verifiedCount = 0;
  let totalMonths = 0;
  const careerSignals = new Set();

  const typePatterns = {
    technology: /\b(tech|software|it|developer|engineer|programmer|data|analyst|web|app)\b/gi,
    business: /\b(business|marketing|sales|management|executive|consultant|strategy)\b/gi,
    research: /\b(research|lab|scientist|analyst|academic|university)\b/gi,
    creative: /\b(design|content|media|writer|editor|creative|artist|video)\b/gi,
    social: /\b(volunteer|ngo|social|community|teaching|tutor|nonprofit)\b/gi,
    finance: /\b(finance|bank|accounting|audit|investment|ca|chartered)\b/gi,
    healthcare: /\b(hospital|clinic|medical|health|pharma|doctor|nurse)\b/gi,
    legal: /\b(legal|law|court|advocate|paralegal|lawyer)\b/gi
  };

  experiences.forEach((exp) => {
    const text = `${exp.organization || ""} ${exp.role || ""} ${exp.description || ""}`.toLowerCase();
    Object.entries(typePatterns).forEach(([type, pattern]) => {
      const matches = (text.match(pattern) || []).length;
      if (matches > 0) typeCounts[type] = (typeCounts[type] || 0) + matches;
    });
    if (exp.verified) verifiedCount++;
    if (exp.duration) {
      const monthMatch = exp.duration.match(/(\d+)\s*(month|mon)/i);
      const yearMatch = exp.duration.match(/(\d+)\s*(year|yr)/i);
      if (monthMatch) totalMonths += parseInt(monthMatch[1]);
      if (yearMatch) totalMonths += parseInt(yearMatch[1]) * 12;
    }
    if (text.match(/intern/i)) careerSignals.add("internship");
    if (text.match(/lead|manager|head/i)) careerSignals.add("leadership");
    if (text.match(/founder|startup/i)) careerSignals.add("entrepreneurial");
  });

  const professionalReadiness = Math.min(100, experiences.length * 12 + verifiedCount * 18 + totalMonths * 2 + careerSignals.size * 12);
  return { hasData: true, experienceTypes: Object.keys(typeCounts), verifiedCount, professionalReadiness, careerSignals: Array.from(careerSignals), primaryType: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 5: CROSS-DOMAIN SYNERGY DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

const detectCrossDomainSynergy = (interestDNA, academicProfile, skillSignature, experiencePattern, courseProfile) => {
  let synergyScore = 0;
  const synergyFactors = [];

  // Check if multiple factors align with the course
  const alignmentCount = [
    interestDNA.hasData && interestDNA.dominantTypes.some(t => courseProfile.riasec.primary.includes(t)),
    academicProfile.hasData && academicProfile.dominantStream === courseProfile.stream,
    skillSignature.hasData && skillSignature.domains.some(d => courseProfile.keywords.high.some(k => d.includes(k) || k.includes(d))),
    experiencePattern.hasData && experiencePattern.experienceTypes.some(t => courseProfile.stream === 'science' ? ['technology', 'research'].includes(t) : courseProfile.stream === 'commerce' ? ['business', 'finance'].includes(t) : ['creative', 'social'].includes(t))
  ].filter(Boolean).length;

  if (alignmentCount >= 3) {
    synergyScore = 15;
    synergyFactors.push("Strong multi-dimensional alignment");
  } else if (alignmentCount >= 2) {
    synergyScore = 10;
    synergyFactors.push("Good cross-factor alignment");
  } else if (alignmentCount >= 1) {
    synergyScore = 5;
  }

  // Bonus for verified experience in relevant field
  if (experiencePattern.verifiedCount > 0 && experiencePattern.experienceTypes.length > 0) {
    synergyScore += 5;
    synergyFactors.push("Verified practical experience");
  }

  // Bonus for tech skills in tech-related courses
  if (['bca', 'engineering'].includes(courseProfile.name?.toLowerCase()) && skillSignature.technologies.length >= 3) {
    synergyScore += 5;
    synergyFactors.push(`Tech stack: ${skillSignature.technologies.slice(0, 3).join(', ')}`);
  }

  return { synergyScore: Math.min(20, synergyScore), synergyFactors };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 6: FUTURE POTENTIAL PREDICTOR
// ═══════════════════════════════════════════════════════════════════════════════

const predictFuturePotential = (courseProfile, skillSignature, academicProfile) => {
  let futureScore = 0;
  const futureFactors = [];

  // Base future relevance from course profile
  futureScore += (courseProfile.futureRelevance || 0.7) * 10;

  // Bonus for emerging tech skills
  const emergingTech = ['ai', 'ml', 'machine learning', 'python', 'data', 'cloud', 'react', 'node'];
  const hasEmergingTech = skillSignature.technologies.some(t => emergingTech.some(e => t.includes(e)));
  if (hasEmergingTech) {
    futureScore += 5;
    futureFactors.push("Emerging technology skills");
  }

  // Bonus for strong academics in high-demand fields
  if (academicProfile.academicStrength >= 75 && ['science', 'commerce'].includes(courseProfile.stream)) {
    futureScore += 3;
    futureFactors.push("Strong academic foundation");
  }

  // High-growth field bonus
  if (['bca', 'dm', 'engineering'].includes(courseProfile.name?.toLowerCase()?.split(' ')[0])) {
    futureScore += 3;
    futureFactors.push("High-growth industry");
  }

  return { futureScore: Math.min(15, futureScore), futureFactors };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCORING ENGINE - Calculates comprehensive match scores
// ═══════════════════════════════════════════════════════════════════════════════

const calculateDetailedScore = (courseId, courseProfile, interestDNA, academicProfile, skillSignature, experiencePattern) => {
  let totalScore = 0;
  const matchReasons = [];
  const scoreBreakdown = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEREST ALIGNMENT SCORE (Base: 20%, Max: 30%)
  // ═══════════════════════════════════════════════════════════════════════════
  let interestScore = 0;
  if (interestDNA.hasData) {
    const primaryMatch = interestDNA.dominantTypes.filter(t => courseProfile.riasec.primary.includes(t)).length;
    const secondaryMatch = interestDNA.dominantTypes.filter(t => courseProfile.riasec.secondary.includes(t)).length;
    
    interestScore = primaryMatch * 12 + secondaryMatch * 6;
    interestScore = Math.min(30, interestScore * (1 + interestDNA.strengthLevel / 200));
    
    if (primaryMatch > 0) {
      const matchedTypes = interestDNA.dominantTypes.filter(t => courseProfile.riasec.primary.includes(t));
      matchReasons.push(`Strong ${matchedTypes.join(', ')} interests align perfectly`);
    }
  }
  scoreBreakdown.interest = Math.round(interestScore);
  totalScore += interestScore;

  // ═══════════════════════════════════════════════════════════════════════════
  // ACADEMIC PERFORMANCE SCORE (Base: 25%, Max: 35%)
  // ═══════════════════════════════════════════════════════════════════════════
  let academicScore = 0;
  if (academicProfile.hasData) {
    // Stream alignment bonus
    if (academicProfile.dominantStream === courseProfile.stream) {
      academicScore += 15;
      matchReasons.push(`Excellent ${courseProfile.stream} stream performance`);
    }

    // Subject-specific scoring
    let subjectMatchScore = 0;
    let matchedSubjects = [];
    Object.entries(courseProfile.subjects.core).forEach(([subject, weight]) => {
      const aliases = [subject, ...(courseProfile.subjects.aliases || [])];
      Object.entries(academicProfile.subjectScores).forEach(([studentSubject, score]) => {
        if (aliases.some(a => studentSubject.includes(a))) {
          const contribution = (score / 100) * weight * 20;
          subjectMatchScore += contribution;
          if (score >= 70) matchedSubjects.push({ name: studentSubject, score: Math.round(score) });
        }
      });
    });
    academicScore += Math.min(20, subjectMatchScore);

    if (matchedSubjects.length > 0) {
      const topSubject = matchedSubjects.sort((a, b) => b.score - a.score)[0];
      matchReasons.push(`Strong in ${topSubject.name} (${topSubject.score}%)`);
    }

    // Overall academic strength bonus
    if (academicProfile.academicStrength >= 80) academicScore += 5;
    else if (academicProfile.academicStrength >= 70) academicScore += 3;
  }
  scoreBreakdown.academic = Math.round(Math.min(35, academicScore));
  totalScore += scoreBreakdown.academic;

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT PORTFOLIO SCORE (Base: 20%, Max: 25%)
  // ═══════════════════════════════════════════════════════════════════════════
  let projectScore = 0;
  if (skillSignature.hasData) {
    // Domain relevance
    const relevantDomains = skillSignature.domains.filter(d => {
      const keywords = [...(courseProfile.keywords.high || []), ...(courseProfile.keywords.medium || [])];
      return keywords.some(k => d.includes(k) || k.includes(d));
    });

    if (relevantDomains.length > 0) {
      projectScore += relevantDomains.length * 8;
      matchReasons.push(`Relevant projects in ${relevantDomains.slice(0, 2).join(', ')}`);
    }

    // Complexity and practical experience bonus
    projectScore += (skillSignature.complexityScore / 100) * 8;
    projectScore += (skillSignature.practicalExperience / 100) * 5;

    // Tech stack bonus for tech courses
    if (['bca', 'engineering'].includes(courseId) && skillSignature.technologies.length >= 2) {
      projectScore += Math.min(5, skillSignature.technologies.length * 1.5);
      if (skillSignature.technologies.length >= 3) {
        matchReasons.push(`Tech skills: ${skillSignature.technologies.slice(0, 3).join(', ')}`);
      }
    }
  } else if (skillSignature.projectCount > 0) {
    projectScore = Math.min(10, skillSignature.projectCount * 4);
    matchReasons.push(`${skillSignature.projectCount} project(s) showing initiative`);
  }
  scoreBreakdown.projects = Math.round(Math.min(25, projectScore));
  totalScore += scoreBreakdown.projects;

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPERIENCE RELEVANCE SCORE (Base: 15%, Max: 20%)
  // ═══════════════════════════════════════════════════════════════════════════
  let experienceScore = 0;
  if (experiencePattern.hasData) {
    // Type relevance mapping
    const streamTypeMap = {
      science: ['technology', 'research', 'healthcare'],
      commerce: ['business', 'finance', 'creative'],
      arts: ['creative', 'social', 'legal']
    };
    const relevantTypes = experiencePattern.experienceTypes.filter(t => 
      (streamTypeMap[courseProfile.stream] || []).includes(t)
    );

    if (relevantTypes.length > 0) {
      experienceScore += relevantTypes.length * 6;
      const expLabel = experiencePattern.verifiedCount > 0 ? 'Verified' : 'Relevant';
      matchReasons.push(`${expLabel} experience in ${relevantTypes[0]}`);
    }

    // Professional readiness bonus
    experienceScore += (experiencePattern.professionalReadiness / 100) * 8;

    // Career signals bonus
    if (experiencePattern.careerSignals.includes('leadership')) experienceScore += 3;
    if (experiencePattern.careerSignals.includes('entrepreneurial') && ['bba', 'dm'].includes(courseId)) experienceScore += 3;
  }
  scoreBreakdown.experience = Math.round(Math.min(20, experienceScore));
  totalScore += scoreBreakdown.experience;

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-DOMAIN SYNERGY BONUS (Max: 15%)
  // ═══════════════════════════════════════════════════════════════════════════
  const synergy = detectCrossDomainSynergy(interestDNA, academicProfile, skillSignature, experiencePattern, courseProfile);
  scoreBreakdown.synergy = synergy.synergyScore;
  totalScore += synergy.synergyScore;
  synergy.synergyFactors.forEach(f => matchReasons.push(f));

  // ═══════════════════════════════════════════════════════════════════════════
  // FUTURE POTENTIAL BONUS (Max: 10%)
  // ═══════════════════════════════════════════════════════════════════════════
  const future = predictFuturePotential(courseProfile, skillSignature, academicProfile);
  scoreBreakdown.future = future.futureScore;
  totalScore += future.futureScore;
  if (future.futureFactors.length > 0 && totalScore >= 60) {
    matchReasons.push(future.futureFactors[0]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL SCORE CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Log the score breakdown for debugging
  console.log(`📊 Score Breakdown for ${courseProfile.name}:`, {
    interest: scoreBreakdown.interest || 0,
    academic: scoreBreakdown.academic || 0,
    projects: scoreBreakdown.projects || 0,
    experience: scoreBreakdown.experience || 0,
    synergy: scoreBreakdown.synergy || 0,
    future: scoreBreakdown.future || 0,
    total: totalScore
  });
  
  // Remove minimum threshold to show accurate scores
  const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));
  
  // Determine match level with more granularity
  let matchLevel = 'Low';
  let matchEmoji = '📊';
  if (finalScore >= 90) { matchLevel = 'Exceptional'; matchEmoji = '🌟'; }
  else if (finalScore >= 80) { matchLevel = 'Excellent'; matchEmoji = '⭐'; }
  else if (finalScore >= 70) { matchLevel = 'Very Good'; matchEmoji = '✨'; }
  else if (finalScore >= 60) { matchLevel = 'Good'; matchEmoji = '👍'; }
  else if (finalScore >= 50) { matchLevel = 'Moderate'; matchEmoji = '📈'; }
  else if (finalScore >= 40) { matchLevel = 'Fair'; matchEmoji = '📊'; }
  else if (finalScore >= 25) { matchLevel = 'Low'; matchEmoji = '📉'; }
  else { matchLevel = 'Very Low'; matchEmoji = '⚠️'; }

  // Add career paths for good matches
  if (finalScore >= 65 && courseProfile.careerPaths) {
    const topCareers = courseProfile.careerPaths.slice(0, 2).map(c => c.role).join(', ');
    matchReasons.push(`Careers: ${topCareers}`);
  }

  return {
    matchScore: finalScore,
    matchLevel,
    matchEmoji,
    reasons: matchReasons.slice(0, 4), // Top 4 reasons
    scoreBreakdown,
    careerPaths: courseProfile.careerPaths?.map(c => c.role) || []
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: calculateCourseMatchScores
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main function: Calculate comprehensive match scores for course recommendations
 * Uses multi-layer AI-like analysis for accurate, personalized recommendations
 * 
 * @param {Array} courseRecommendations - List of courses to score
 * @param {Object} riasecScores - RIASEC scores {R, I, A, S, E, C}
 * @param {Object} academicData - {subjectMarks, projects, experiences, education, studentStream}
 * @param {String} studentStream - Optional: Filter by student's stream (science/commerce/arts)
 * @returns {Array} Sorted courses with match scores, reasons, and career paths
 */
export const calculateCourseMatchScores = (courseRecommendations, riasecScores, academicData = {}, studentStream = null) => {
  console.log('🚀 calculateCourseMatchScores called with:', {
    courseCount: courseRecommendations?.length,
    hasRiasec: !!riasecScores && Object.keys(riasecScores).length > 0,
    studentStream: studentStream,
    streamType: typeof studentStream
  });
  
  if (!courseRecommendations || courseRecommendations.length === 0) return courseRecommendations || [];

  const { subjectMarks = [], projects = [], experiences = [], education = [], _assessmentResults } = academicData;
  
  // STREAM FILTERING: If student has a specific stream (from after10 assessment), filter courses
  let filteredCourses = courseRecommendations;
  if (studentStream) {
    const normalizedStream = studentStream.toLowerCase().trim();
    
    // Skip filtering if stream is invalid/placeholder
    if (normalizedStream === 'n/a' || normalizedStream === '—' || normalizedStream === '') {
      console.log('⚠️ Invalid stream value, skipping filter:', studentStream);
    } else {
      console.log(`🎯 Filtering programs by student stream: ${normalizedStream}`);
      
      filteredCourses = courseRecommendations.filter(course => {
        const courseId = course.courseId?.toLowerCase() || '';
        const courseProfile = COURSE_KNOWLEDGE_BASE[courseId];
        
        if (!courseProfile) return true; // Keep unknown courses
        
        const courseStream = courseProfile.stream?.toLowerCase();
        const matches = courseStream === normalizedStream;
        
        if (!matches) {
          console.log(`   ❌ Filtered out: ${course.courseName} (${courseStream} ≠ ${normalizedStream})`);
        }
        
        return matches;
      });
      
      console.log(`   ✅ Filtered from ${courseRecommendations.length} to ${filteredCourses.length} programs`);
      
      // If no courses match the stream, return empty array
      if (filteredCourses.length === 0) {
        console.log('   ⚠️ No programs match student stream - returning empty array');
        return [];
      }
    }
  } else {
    console.log('⚠️ No studentStream provided - showing all programs');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Deep Profile Analysis (All Layers)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ENHANCED: Prioritize assessment results if profile data is missing
  const hasAssessmentResults = _assessmentResults?.riasec?.scores && Object.keys(_assessmentResults.riasec.scores).length > 0;
  
  // Use assessment RIASEC scores if no riasecScores parameter provided
  const effectiveRiasecScores = (riasecScores && Object.keys(riasecScores).length > 0) 
    ? riasecScores 
    : (hasAssessmentResults ? _assessmentResults.riasec.scores : {});
  
  // Check if we have ANY valid RIASEC data (non-zero scores)
  const hasValidRiasecData = effectiveRiasecScores && Object.values(effectiveRiasecScores).some(score => score > 0);
  
  // If no valid RIASEC data, return empty array - don't show fallback recommendations
  if (!hasValidRiasecData) {
    console.log('⚠️ No valid RIASEC data - skipping course recommendations');
    console.log('   RIASEC scores:', effectiveRiasecScores);
    return [];
  }
  
  const interestDNA = analyzeInterestDNA(effectiveRiasecScores);
  const academicProfile = profileAcademicIntelligence(subjectMarks);
  const skillSignature = extractSkillSignature(projects);
  const experiencePattern = recognizeExperiencePatterns(experiences);

  // ENHANCED: Use assessment aptitude/knowledge for academic profile if missing
  const enhancedAcademicProfile = academicProfile.hasData ? academicProfile : 
    (hasAssessmentResults && _assessmentResults.aptitude ? {
      hasData: true,
      dominantStream: _assessmentResults.knowledge?.dominantArea || 'general',
      // Combine aptitude overall score with knowledge score for better accuracy
      academicStrength: _assessmentResults.knowledge?.score 
        ? Math.round((_assessmentResults.aptitude.overallScore + _assessmentResults.knowledge.score) / 2)
        : _assessmentResults.aptitude.overallScore || 50,
      // Convert aptitude scores to subject scores for matching
      subjectScores: _assessmentResults.aptitude.scores ? {
        // Map aptitude categories to subject names
        mathematics: _assessmentResults.aptitude.scores.numerical?.percentage || 0,
        maths: _assessmentResults.aptitude.scores.numerical?.percentage || 0,
        numerical: _assessmentResults.aptitude.scores.numerical?.percentage || 0,
        english: _assessmentResults.aptitude.scores.verbal?.percentage || 0,
        verbal: _assessmentResults.aptitude.scores.verbal?.percentage || 0,
        logical: _assessmentResults.aptitude.scores.logical?.percentage || 0,
        reasoning: _assessmentResults.aptitude.scores.logical?.percentage || 0,
        spatial: _assessmentResults.aptitude.scores.spatial?.percentage || 0,
        // Estimate science subjects from logical/numerical + knowledge score boost
        physics: Math.round(
          (_assessmentResults.aptitude.scores.logical?.percentage || 0) * 0.6 + 
          (_assessmentResults.aptitude.scores.numerical?.percentage || 0) * 0.3 +
          (_assessmentResults.knowledge?.score || 0) * 0.1
        ),
        chemistry: Math.round(
          (_assessmentResults.aptitude.scores.logical?.percentage || 0) * 0.5 + 
          (_assessmentResults.aptitude.scores.numerical?.percentage || 0) * 0.4 +
          (_assessmentResults.knowledge?.score || 0) * 0.1
        ),
        biology: Math.round(
          (_assessmentResults.aptitude.scores.verbal?.percentage || 0) * 0.4 + 
          (_assessmentResults.aptitude.scores.logical?.percentage || 0) * 0.4 +
          (_assessmentResults.knowledge?.score || 0) * 0.2
        ),
        // Add stream knowledge as a subject score
        'stream_knowledge': _assessmentResults.knowledge?.score || 0
      } : {},
      streamAffinity: {
        // Boost stream affinity with knowledge score
        science: Math.round(
          ((_assessmentResults.aptitude.scores?.numerical?.percentage || 0) + 
           (_assessmentResults.aptitude.scores?.logical?.percentage || 0)) / 2 * 0.7 +
          (_assessmentResults.knowledge?.score || 0) * 0.3
        ),
        commerce: Math.round(
          ((_assessmentResults.aptitude.scores?.numerical?.percentage || 0) + 
           (_assessmentResults.aptitude.scores?.verbal?.percentage || 0)) / 2 * 0.7 +
          (_assessmentResults.knowledge?.score || 0) * 0.3
        ),
        arts: Math.round(
          ((_assessmentResults.aptitude.scores?.verbal?.percentage || 0) + 
           (_assessmentResults.aptitude.scores?.spatial?.percentage || 0)) / 2 * 0.7 +
          (_assessmentResults.knowledge?.score || 0) * 0.3
        )
      },
      topSubjects: _assessmentResults.aptitude.topStrengths?.map((strength, idx) => ({
        name: strength,
        score: _assessmentResults.aptitude.scores?.[strength]?.percentage || 0
      })) || [],
      consistencyScore: 70,
      // Add knowledge score info for logging
      knowledgeScore: _assessmentResults.knowledge?.score || 0
    } : academicProfile);

  // Log analysis summary for debugging
  console.log('🧠 AI Course Matching Engine v2.0');
  console.log('├─ RIASEC Scores:', effectiveRiasecScores);
  console.log('├─ Interest DNA:', interestDNA.hasData ? `${interestDNA.dominantTypes.join('-')} (strength: ${Math.round(interestDNA.strengthLevel)}%)` : 'No data');
  console.log('├─ Academic Profile:', enhancedAcademicProfile.hasData ? `${enhancedAcademicProfile.dominantStream} stream (${enhancedAcademicProfile.academicStrength}% avg)` : 'No data');
  if (enhancedAcademicProfile.knowledgeScore) {
    console.log('│  └─ Stream Knowledge Score:', enhancedAcademicProfile.knowledgeScore + '%');
  }
  console.log('├─ Skill Signature:', skillSignature.hasData ? `${skillSignature.projectCount} projects, ${skillSignature.technologies.length} techs` : 'No data');
  console.log('└─ Experience Pattern:', experiencePattern.hasData ? `${experiencePattern.experienceTypes.length} types, ${experiencePattern.verifiedCount} verified` : 'No data');
  
  if (hasAssessmentResults) {
    console.log('✅ Using assessment results as data source - RIASEC scores:', Object.keys(_assessmentResults.riasec.scores || {}).length);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Calculate Scores for Each Course
  // ═══════════════════════════════════════════════════════════════════════════
  const scoredCourses = filteredCourses.map(course => {
    const courseId = course.courseId?.toLowerCase() || '';
    const courseProfile = COURSE_KNOWLEDGE_BASE[courseId];
    
    if (!courseProfile) {
      // Fallback for unknown courses
      return {
        ...course,
        matchScore: 45,
        matchLevel: 'Unknown',
        matchEmoji: '❓',
        reasons: ['Course profile not found in knowledge base'],
        careerPaths: []
      };
    }

    const result = calculateDetailedScore(
      courseId,
      courseProfile,
      interestDNA,  // Use the correctly initialized interest DNA
      enhancedAcademicProfile,  // Use enhanced academic profile
      skillSignature,
      experiencePattern
    );

    return {
      ...course,
      matchScore: result.matchScore,
      matchLevel: result.matchLevel,
      matchEmoji: result.matchEmoji,
      reasons: result.reasons,
      scoreBreakdown: result.scoreBreakdown,
      careerPaths: result.careerPaths
    };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Sort by Match Score and Return
  // ═══════════════════════════════════════════════════════════════════════════
  const sortedCourses = scoredCourses.sort((a, b) => b.matchScore - a.matchScore);
  
  console.log('📊 Course Match Results:');
  sortedCourses.slice(0, 5).forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.courseName || c.courseId}: ${c.matchScore}% (${c.matchLevel})`);
  });

  return sortedCourses;
};

export default calculateCourseMatchScores;

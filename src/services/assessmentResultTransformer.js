/**
 * Assessment Result Transformer Service
 * Transforms database result structure to PDF-compatible format
 * 
 * Fixes:
 * 1. Aptitude data structure mismatch
 * 2. Gemini analysis flattening
 * 3. Career recommendations enrichment
 * 4. Missing field handling
 */

/**
 * Transform aptitude scores from database format to PDF format
 * Database: {taskType: {ease, enjoyment}}
 * PDF: {testType: {percentage, raw}}
 */
export const transformAptitudeScores = (dbAptitude) => {
  if (!dbAptitude || typeof dbAptitude !== 'object') {
    return null;
  }

  // Check if data is already in the correct format (test-based scores)
  // Format: { verbal: { total: 1, correct: 1, percentage: 100 }, ... }
  const hasTestBasedFormat = Object.keys(dbAptitude).some(key => 
    ['verbal', 'numerical', 'abstract', 'spatial', 'clerical'].includes(key.toLowerCase())
  );

  if (hasTestBasedFormat) {
    console.log('✅ Aptitude data already in test-based format, using directly');
    
    // Calculate top strengths
    const topStrengths = Object.entries(dbAptitude)
      .filter(([_, scores]) => scores && typeof scores === 'object' && scores.percentage > 0)
      .sort((a, b) => (b[1].percentage || 0) - (a[1].percentage || 0))
      .slice(0, 3)
      .map(([testType]) => {
        // Capitalize first letter
        return testType.charAt(0).toUpperCase() + testType.slice(1);
      });

    // Calculate overall score
    const validScores = Object.values(dbAptitude)
      .filter(scores => scores && typeof scores === 'object' && scores.percentage > 0);
    const overallScore = validScores.length > 0
      ? Math.round(validScores.reduce((sum, s) => sum + (s.percentage || 0), 0) / validScores.length)
      : null;

    return {
      scores: dbAptitude,
      topStrengths,
      overallScore
    };
  }

  // Legacy format: task-based scores (Analytical, Creative, etc.)
  // Mapping between task types (DB) and test types (PDF)
  const taskToTestMapping = {
    'Analytical': 'numerical',
    'Creative': 'abstract',
    'Technical': 'spatial',
    'Social': 'verbal',
    'Practical': 'clerical'
  };

  const transformed = {};
  let totalScore = 0;
  let count = 0;

  Object.entries(dbAptitude).forEach(([taskType, scores]) => {
    if (!scores || typeof scores !== 'object') return;

    const testType = taskToTestMapping[taskType];
    if (!testType) return;

    const ease = scores.ease || 0;
    const enjoyment = scores.enjoyment || 0;
    
    // Calculate average and convert to percentage (assuming 1-5 scale)
    const average = (ease + enjoyment) / 2;
    const percentage = Math.round((average / 5) * 100);
    const raw = Math.round(average * 4); // Convert to 0-20 scale

    transformed[testType] = {
      percentage,
      raw,
      ease,
      enjoyment
    };

    totalScore += percentage;
    count++;
  });

  // Calculate top strengths
  const topStrengths = Object.entries(transformed)
    .sort((a, b) => b[1].percentage - a[1].percentage)
    .slice(0, 3)
    .map(([testType]) => {
      // Capitalize first letter
      return testType.charAt(0).toUpperCase() + testType.slice(1);
    });

  return {
    scores: transformed,
    topStrengths,
    overallScore: count > 0 ? Math.round(totalScore / count) : null
  };
};

/**
 * Transform Gemini analysis from nested structure to flattened format
 * Database: {gemini_analysis: {analysis: {...}, career_recommendations: [...], ...}}
 * PDF: {overallSummary, careerFit, skillGap, roadmap}
 */
export const transformGeminiAnalysis = (geminiAnalysis) => {
  if (!geminiAnalysis || typeof geminiAnalysis !== 'object') {
    return {
      overallSummary: null,
      careerFit: null,
      skillGap: null,
      roadmap: null
    };
  }

  // Extract overall summary
  const overallSummary = geminiAnalysis.analysis?.interest_summary || 
                        geminiAnalysis.analysis?.summary ||
                        geminiAnalysis.summary ||
                        null;

  // Transform career recommendations to careerFit format
  const careerFit = geminiAnalysis.career_recommendations ? {
    clusters: geminiAnalysis.career_recommendations.map((rec, index) => ({
      title: rec.title || rec.name || 'Career Path',
      matchScore: rec.match_score || rec.matchScore || 80,
      description: rec.reasoning || rec.description || '',
      roles: rec.roles || [],
      skills: rec.skills || rec.required_skills || [],
      salary: rec.salary || null,
      growthPotential: rec.growth_potential || rec.growthPotential || 'Medium',
      education: rec.education || rec.required_education || null,
      index
    }))
  } : null;

  // Transform skill development to skillGap format
  const skillGap = geminiAnalysis.skill_development ? {
    gaps: geminiAnalysis.skill_development.map(skill => {
      if (typeof skill === 'string') {
        return {
          skill,
          importance: 'High',
          developmentPath: `Focus on developing ${skill} through courses, practice, and real-world projects.`,
          resources: []
        };
      }
      return {
        skill: skill.name || skill.skill,
        importance: skill.importance || 'Medium',
        developmentPath: skill.developmentPath || skill.development_path || `Develop ${skill.name || skill.skill}`,
        resources: skill.resources || []
      };
    })
  } : null;

  // Transform next steps to roadmap format
  const roadmap = geminiAnalysis.next_steps ? {
    steps: geminiAnalysis.next_steps.map((step, index) => {
      if (typeof step === 'string') {
        return {
          title: step,
          description: step,
          timeline: index === 0 ? 'Immediate' : index === 1 ? 'Short-term (1-3 months)' : 'Medium-term (3-6 months)',
          priority: index === 0 ? 'High' : 'Medium'
        };
      }
      return {
        title: step.title || step.name,
        description: step.description || step.details,
        timeline: step.timeline || 'Short-term',
        priority: step.priority || 'Medium'
      };
    })
  } : null;

  return {
    overallSummary,
    careerFit,
    skillGap,
    roadmap
  };
};

/**
 * Enrich career recommendations with additional data
 * Database: ["Software Engineer", "Data Scientist"]
 * PDF: [{title, matchScore, roles, skills, salary, ...}]
 */
export const enrichCareerRecommendations = (simpleArray, riasecScores = {}) => {
  if (!Array.isArray(simpleArray) || simpleArray.length === 0) {
    return [];
  }

  // Career database with roles, skills, and salary info
  const CAREER_DATABASE = {
    'Software Engineer': {
      roles: ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer'],
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'SQL'],
      salary: { min: 8, max: 25, currency: 'LPA' },
      growthPotential: 'Excellent',
      education: 'Bachelor\'s in Computer Science or related field',
      riasecMatch: ['I', 'R', 'C']
    },
    'Data Scientist': {
      roles: ['Data Analyst', 'ML Engineer', 'Business Intelligence Analyst', 'Research Scientist'],
      skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Data Visualization'],
      salary: { min: 10, max: 30, currency: 'LPA' },
      growthPotential: 'Excellent',
      education: 'Bachelor\'s/Master\'s in Data Science, Statistics, or Computer Science',
      riasecMatch: ['I', 'C', 'R']
    },
    'UX Designer': {
      roles: ['UI Designer', 'Product Designer', 'Interaction Designer', 'UX Researcher'],
      skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Wireframing', 'Design Thinking'],
      salary: { min: 6, max: 20, currency: 'LPA' },
      growthPotential: 'High',
      education: 'Bachelor\'s in Design, HCI, or related field',
      riasecMatch: ['A', 'I', 'E']
    },
    'Marketing Manager': {
      roles: ['Digital Marketing Manager', 'Brand Manager', 'Content Strategist', 'SEO Specialist'],
      skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Social Media', 'Communication'],
      salary: { min: 7, max: 22, currency: 'LPA' },
      growthPotential: 'High',
      education: 'Bachelor\'s in Marketing, Business, or Communications',
      riasecMatch: ['E', 'A', 'S']
    },
    'Financial Analyst': {
      roles: ['Investment Analyst', 'Risk Analyst', 'Budget Analyst', 'Portfolio Manager'],
      skills: ['Financial Modeling', 'Excel', 'SQL', 'Data Analysis', 'Accounting', 'Economics'],
      salary: { min: 8, max: 25, currency: 'LPA' },
      growthPotential: 'High',
      education: 'Bachelor\'s in Finance, Economics, or Accounting',
      riasecMatch: ['C', 'E', 'I']
    },
    'Teacher': {
      roles: ['School Teacher', 'College Professor', 'Curriculum Developer', 'Education Consultant'],
      skills: ['Communication', 'Curriculum Design', 'Classroom Management', 'Subject Expertise', 'Patience'],
      salary: { min: 4, max: 15, currency: 'LPA' },
      growthPotential: 'Medium',
      education: 'Bachelor\'s in Education or subject-specific degree with B.Ed',
      riasecMatch: ['S', 'A', 'I']
    },
    'Mechanical Engineer': {
      roles: ['Design Engineer', 'Manufacturing Engineer', 'Quality Engineer', 'Project Engineer'],
      skills: ['CAD', 'SolidWorks', 'Manufacturing', 'Thermodynamics', 'Materials Science', 'Problem Solving'],
      salary: { min: 6, max: 18, currency: 'LPA' },
      growthPotential: 'High',
      education: 'Bachelor\'s in Mechanical Engineering',
      riasecMatch: ['R', 'I', 'C']
    },
    'Nurse': {
      roles: ['Registered Nurse', 'Clinical Nurse', 'Nurse Practitioner', 'Nursing Supervisor'],
      skills: ['Patient Care', 'Medical Knowledge', 'Communication', 'Empathy', 'Critical Thinking'],
      salary: { min: 3, max: 12, currency: 'LPA' },
      growthPotential: 'Medium',
      education: 'Bachelor\'s in Nursing (B.Sc Nursing)',
      riasecMatch: ['S', 'I', 'R']
    }
  };

  // Calculate match score based on RIASEC alignment
  const calculateMatchScore = (careerRiasec, studentRiasec) => {
    if (!careerRiasec || !studentRiasec || Object.keys(studentRiasec).length === 0) {
      return 80; // Default score
    }

    let matchScore = 0;
    careerRiasec.forEach((code, index) => {
      const studentScore = studentRiasec[code] || 0;
      const weight = 3 - index; // First match gets weight 3, second gets 2, third gets 1
      matchScore += studentScore * weight;
    });

    // Normalize to 0-100 scale
    const maxPossible = 20 * 6; // Assuming max score of 20 per RIASEC code
    return Math.min(100, Math.round((matchScore / maxPossible) * 100) + 50);
  };

  return simpleArray.map((title, index) => {
    const careerData = CAREER_DATABASE[title] || {
      roles: [],
      skills: [],
      salary: null,
      growthPotential: 'Medium',
      education: 'Relevant degree required',
      riasecMatch: []
    };

    const matchScore = calculateMatchScore(careerData.riasecMatch, riasecScores);

    return {
      title,
      matchScore: matchScore - (index * 5), // Slight decrease for lower ranked careers
      description: `${title} role aligns with your interests and skills.`,
      roles: careerData.roles,
      skills: careerData.skills,
      salary: careerData.salary,
      growthPotential: careerData.growthPotential,
      education: careerData.education,
      index
    };
  });
};

/**
 * Transform enriched degree programs
 * Uses new degree_programs column if available, otherwise enriches from career_fit
 */
export const transformDegreePrograms = (dbResults) => {
  // ✅ NEW: Check if enriched degree_programs column exists
  if (dbResults.degree_programs && Array.isArray(dbResults.degree_programs)) {
    console.log('✅ Using enriched degree_programs from database');
    return dbResults.degree_programs;
  }

  // Fallback: Extract from career_fit or gemini_results
  const careerFit = dbResults.career_fit || dbResults.gemini_results?.careerFit;
  if (careerFit?.degreePrograms && Array.isArray(careerFit.degreePrograms)) {
    console.log('✅ Using degreePrograms from career_fit');
    return careerFit.degreePrograms;
  }

  console.log('⚠️ No degree programs found');
  return null;
};

/**
 * Transform enriched skill gaps
 * Uses new skill_gap_enriched column if available, otherwise transforms from skill_gap
 */
export const transformSkillGapEnriched = (dbResults) => {
  // ✅ NEW: Check if enriched skill_gap_enriched column exists
  if (dbResults.skill_gap_enriched && dbResults.skill_gap_enriched.gaps) {
    console.log('✅ Using enriched skill_gap_enriched from database');
    return dbResults.skill_gap_enriched;
  }

  // Fallback: Transform from simple skill_gap array
  const skillGap = dbResults.skill_gap;
  if (Array.isArray(skillGap) && skillGap.length > 0) {
    console.log('⚠️ Transforming simple skill_gap array to enriched format');
    return {
      gaps: skillGap.map(skill => {
        if (typeof skill === 'string') {
          return {
            skill,
            importance: 'High',
            developmentPath: `Focus on developing ${skill} through courses, practice, and real-world projects.`,
            resources: []
          };
        }
        return {
          skill: skill.skill || skill.name,
          importance: skill.importance || 'Medium',
          developmentPath: skill.developmentPath || skill.development_path || `Develop ${skill.skill || skill.name}`,
          resources: skill.resources || []
        };
      })
    };
  }

  console.log('⚠️ No skill gap data found');
  return null;
};

/**
 * Transform enriched roadmap
 * Uses new roadmap_enriched column if available, otherwise transforms from roadmap
 */
export const transformRoadmapEnriched = (dbResults) => {
  // ✅ NEW: Check if enriched roadmap_enriched column exists
  if (dbResults.roadmap_enriched && dbResults.roadmap_enriched.steps) {
    console.log('✅ Using enriched roadmap_enriched from database');
    return dbResults.roadmap_enriched;
  }

  // Fallback: Transform from simple roadmap array
  const roadmap = dbResults.roadmap;
  if (Array.isArray(roadmap) && roadmap.length > 0) {
    console.log('⚠️ Transforming simple roadmap array to enriched format');
    return {
      steps: roadmap.map((step, index) => {
        if (typeof step === 'string') {
          return {
            title: step,
            description: step,
            timeline: index === 0 ? 'Immediate' : index === 1 ? 'Short-term (1-3 months)' : 'Medium-term (3-6 months)',
            priority: index === 0 ? 'High' : 'Medium',
            resources: []
          };
        }
        return {
          title: step.title || step.name,
          description: step.description || step.details,
          timeline: step.timeline || 'Short-term',
          priority: step.priority || 'Medium',
          resources: step.resources || []
        };
      })
    };
  }

  console.log('⚠️ No roadmap data found');
  return null;
};

/**
 * Transform enriched course recommendations
 * Uses new course_recommendations_enriched column if available
 */
export const transformCourseRecommendationsEnriched = (dbResults) => {
  // ✅ NEW: Check if enriched course_recommendations_enriched column exists
  if (dbResults.course_recommendations_enriched && Array.isArray(dbResults.course_recommendations_enriched)) {
    console.log('✅ Using enriched course_recommendations_enriched from database');
    return dbResults.course_recommendations_enriched;
  }

  // Fallback: Combine data from skill_gap_courses, platform_courses, courses_by_type
  const courses = [];
  
  if (dbResults.skill_gap_courses && Array.isArray(dbResults.skill_gap_courses)) {
    courses.push(...dbResults.skill_gap_courses.map(course => ({
      courseName: course.title || course.name || course.courseName,
      provider: course.provider || 'Unknown',
      duration: course.duration || 'Self-paced',
      level: course.level || 'Intermediate',
      url: course.url || course.link || '#',
      rating: course.rating || null,
      skills: course.skills || [],
      description: course.description || '',
      price: course.price || 'Contact provider',
      category: 'Skill Gap'
    })));
  }

  if (dbResults.platform_courses && Array.isArray(dbResults.platform_courses)) {
    courses.push(...dbResults.platform_courses.map(course => ({
      courseName: course.title || course.name || course.courseName,
      provider: course.provider || 'Platform',
      duration: course.duration || 'Self-paced',
      level: course.level || 'Beginner',
      url: course.url || course.link || '#',
      rating: course.rating || null,
      skills: course.skills || [],
      description: course.description || '',
      price: course.price || 'Free',
      category: 'Platform'
    })));
  }

  if (courses.length > 0) {
    console.log(`⚠️ Transformed ${courses.length} courses from existing columns`);
    return courses;
  }

  console.log('⚠️ No course recommendations found');
  return null;
};

/**
 * Main transformation function
 * Transforms complete database result to PDF-compatible format
 */
export const transformAssessmentResults = (dbResults) => {
  if (!dbResults || typeof dbResults !== 'object') {
    return null;
  }

  // ✅ Handle both gemini_analysis and gemini_results field names
  const geminiData = dbResults.gemini_analysis || dbResults.gemini_results;
  
  console.log('🔄 transformAssessmentResults input:', {
    hasGeminiAnalysis: !!dbResults.gemini_analysis,
    hasGeminiResults: !!dbResults.gemini_results,
    usingField: dbResults.gemini_analysis ? 'gemini_analysis' : dbResults.gemini_results ? 'gemini_results' : 'none',
    geminiDataKeys: geminiData && typeof geminiData === 'object' ? Object.keys(geminiData) : null,
    geminiDataType: typeof geminiData,
    geminiDataSample: geminiData ? JSON.stringify(geminiData).substring(0, 200) : null,
    hasRiasecScores: !!dbResults.riasec_scores,
    hasTopInterests: !!dbResults.top_interests,
    hasCareerRecommendations: !!dbResults.career_recommendations
  });

  // ✅ NEW: Check if gemini_results contains the actual assessment data (not AI analysis)
  // This happens when the assessment data is stored in gemini_results as a complete object
  if (geminiData && typeof geminiData === 'object' && geminiData.riasec && geminiData.riasec.scores) {
    console.log('✅ gemini_results contains complete assessment data - using directly');
    console.log('   Data structure:', {
      hasRiasec: !!geminiData.riasec,
      hasAptitude: !!geminiData.aptitude,
      hasCareerFit: !!geminiData.careerFit,
      riasecScores: geminiData.riasec?.scores
    });
    
    // The data is already in the correct format, just mark it as transformed
    return {
      ...geminiData,
      _original: dbResults,
      _transformed: true,
      _source: 'gemini_results_complete'
    };
  }

  // ✅ Check if data is in individual columns (not in gemini_analysis/gemini_results)
  // This happens when data is stored directly in the table columns
  const hasIndividualColumns = dbResults.riasec_scores && !geminiData;
  
  if (hasIndividualColumns) {
    console.log('✅ Data found in individual columns (not in gemini_analysis field)');
    console.log('   Building result from column data...');
    
    // Build the result directly from individual columns
    const transformed = {
      // RIASEC from columns
      riasec: {
        scores: dbResults.riasec_scores || {},
        topThree: dbResults.top_interests || [],
        maxScore: 20
      },
      
      // Strengths from columns
      strengths: {
        scores: dbResults.strengths_scores || {},
        top: dbResults.top_strengths || []
      },

      // Transform aptitude if exists
      aptitude: transformAptitudeScores(dbResults.aptitude_scores),

      // Big Five personality
      bigFive: dbResults.personality_scores || null,

      // Work values
      workValues: dbResults.work_values_scores || null,

      // Knowledge test
      knowledge: dbResults.knowledge_score !== undefined ? {
        score: dbResults.knowledge_score,
        percentage: dbResults.knowledge_percentage,
        totalQuestions: dbResults.knowledge_score && dbResults.knowledge_percentage 
          ? Math.round(dbResults.knowledge_score / (dbResults.knowledge_percentage / 100))
          : null
      } : null,

      // Employability
      employability: dbResults.employability_score !== undefined ? {
        score: dbResults.employability_score,
        level: dbResults.employability_score >= 80 ? 'High' : 
               dbResults.employability_score >= 60 ? 'Medium' : 'Developing'
      } : null,

      // AI Analysis fields - may be null if not generated yet
      overallSummary: null,
      careerFit: null,
      skillGap: null,
      roadmap: null,

      // Enrich career recommendations if available
      ...(dbResults.career_recommendations && dbResults.career_recommendations.length > 0 ? {
        careerFit: {
          clusters: enrichCareerRecommendations(
            dbResults.career_recommendations,
            dbResults.riasec_scores
          )
        }
      } : {}),

      // Additional fields
      learningStyles: dbResults.learning_styles || [],
      workPreferences: dbResults.work_preferences || [],

      // Metadata
      generatedAt: dbResults.generated_at,
      attemptId: dbResults.attempt_id,
      gradeLevel: dbResults.grade_level,

      // Keep original for debugging
      _original: dbResults,
      _transformed: true,
      _source: 'individual_columns'
    };

    console.log('✅ Transformed from individual columns:', {
      hasRiasec: !!transformed.riasec?.scores,
      hasAptitude: !!transformed.aptitude,
      hasCareerFit: !!transformed.careerFit,
      riasecScores: transformed.riasec?.scores
    });

    return transformed;
  }

  // Extract and transform Gemini analysis first
  const geminiTransformed = transformGeminiAnalysis(geminiData);

  // Transform aptitude scores
  const aptitudeTransformed = transformAptitudeScores(dbResults.aptitude_scores);

  // Enrich career recommendations
  const enrichedCareers = enrichCareerRecommendations(
    dbResults.career_recommendations,
    dbResults.riasec_scores
  );

  // Build transformed result object with ALL database columns
  const transformed = {
    // ===== CORE IDENTIFICATION =====
    id: dbResults.id,
    attemptId: dbResults.attempt_id,
    studentId: dbResults.student_id,
    streamId: dbResults.stream_id,
    gradeLevel: dbResults.grade_level,
    status: dbResults.status,
    
    // ===== TIMESTAMPS =====
    createdAt: dbResults.created_at,
    updatedAt: dbResults.updated_at,
    generatedAt: dbResults.generated_at,

    // ===== RIASEC (Interest Profile) =====
    riasec: {
      scores: dbResults.riasec_scores || {},
      code: dbResults.riasec_code || null,
      topThree: dbResults.top_interests || [],
      maxScore: 20
    },
    
    // ===== STRENGTHS =====
    strengths: {
      scores: dbResults.strengths_scores || {},
      top: dbResults.top_strengths || []
    },

    // ===== APTITUDE =====
    aptitude: aptitudeTransformed,
    aptitudeOverall: dbResults.aptitude_overall || null,

    // ===== BIG FIVE PERSONALITY =====
    bigFive: dbResults.bigfive_scores || null,

    // ===== WORK VALUES =====
    workValues: dbResults.work_values_scores || null,

    // ===== KNOWLEDGE TEST =====
    knowledge: dbResults.knowledge_score !== undefined ? {
      score: dbResults.knowledge_score,
      percentage: dbResults.knowledge_percentage,
      details: dbResults.knowledge_details || null,
      totalQuestions: dbResults.knowledge_score && dbResults.knowledge_percentage 
        ? Math.round(dbResults.knowledge_score / (dbResults.knowledge_percentage / 100))
        : null
    } : null,

    // ===== EMPLOYABILITY =====
    employability: {
      scores: dbResults.employability_scores || null,
      readiness: dbResults.employability_readiness || null,
      level: dbResults.employability_readiness || 
             (dbResults.employability_score >= 80 ? 'High' : 
              dbResults.employability_score >= 60 ? 'Medium' : 'Developing')
    },

    // ===== AI ANALYSIS & SUMMARY =====
    overallSummary: dbResults.overall_summary || geminiTransformed.overallSummary,
    geminiResults: dbResults.gemini_results || null,

    // ===== CAREER FIT =====
    careerFit: dbResults.career_fit || geminiTransformed.careerFit || 
               (enrichedCareers.length > 0 ? { clusters: enrichedCareers } : null),

    // ===== SKILL GAP =====
    skillGap: dbResults.skill_gap || geminiTransformed.skillGap,

    // ===== ROADMAP =====
    roadmap: dbResults.roadmap || geminiTransformed.roadmap,

    // ===== PROFILE SNAPSHOT =====
    profileSnapshot: dbResults.profile_snapshot || null,

    // ===== TIMING ANALYSIS =====
    timingAnalysis: dbResults.timing_analysis || null,

    // ===== FINAL NOTE =====
    finalNote: dbResults.final_note || null,

    // ===== COURSE RECOMMENDATIONS =====
    skillGapCourses: dbResults.skill_gap_courses || [],
    platformCourses: dbResults.platform_courses || [],
    coursesByType: dbResults.courses_by_type || null,

    // ===== ADDITIONAL FIELDS =====
    learningStyles: dbResults.learning_styles || [],
    workPreferences: dbResults.work_preferences || [],

    // ===== KEEP ORIGINAL FOR DEBUGGING =====
    _original: dbResults,
    _transformed: true,
    _allColumnsExtracted: true
  };

  return transformed;
};

/**
 * Validate transformed results
 * Checks if all required fields are present
 */
export const validateTransformedResults = (transformed) => {
  const warnings = [];
  const errors = [];

  if (!transformed) {
    errors.push('Transformed results is null or undefined');
    return { isValid: false, warnings, errors };
  }

  // Check required fields
  if (!transformed.riasec || !transformed.riasec.scores) {
    errors.push('Missing RIASEC scores');
  }

  if (!transformed.strengths || !transformed.strengths.scores) {
    warnings.push('Missing strengths scores');
  }

  if (!transformed.overallSummary) {
    warnings.push('Missing overall summary from AI analysis');
  }

  if (!transformed.careerFit || !transformed.careerFit.clusters || transformed.careerFit.clusters.length === 0) {
    warnings.push('Missing career recommendations');
  }

  // Check grade-specific fields
  if (transformed.gradeLevel === 'after12' || transformed.gradeLevel === 'college') {
    if (!transformed.bigFive) {
      warnings.push('Missing Big Five personality scores for college/after12 student');
    }
    if (!transformed.knowledge) {
      warnings.push('Missing knowledge test scores for college/after12 student');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    completeness: calculateCompleteness(transformed)
  };
};

/**
 * Calculate completeness percentage
 */
const calculateCompleteness = (transformed) => {
  const fields = [
    'riasec',
    'strengths',
    'aptitude',
    'bigFive',
    'workValues',
    'knowledge',
    'employability',
    'overallSummary',
    'careerFit',
    'skillGap',
    'roadmap'
  ];

  const presentFields = fields.filter(field => {
    const value = transformed[field];
    if (value === null || value === undefined) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  return Math.round((presentFields.length / fields.length) * 100);
};

export default {
  transformAssessmentResults,
  transformAptitudeScores,
  transformGeminiAnalysis,
  enrichCareerRecommendations,
  validateTransformedResults,
  transformDegreePrograms,
  transformSkillGapEnriched,
  transformRoadmapEnriched,
  transformCourseRecommendationsEnriched
};

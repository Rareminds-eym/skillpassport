/**
 * Assessment Context Builder - RAG Context Generation
 *
 * Builds rich, interpretive context from assessment data ONLY.
 * No occupation matching, no hardcoding, purely interpretation-based.
 *
 * Input: Raw assessment data from personal_assessment_results
 * Output: Semantic-rich text document suitable for embedding
 *
 * Philosophy: Convert raw scores into meaningful capability/personality descriptions.
 * Let embedding naturally match learner to occupations without forced logic.
 */

interface AssessmentData {
  // Basic info
  stream_id: string;
  grade_level: string;
  riasec_code: string;

  // RIASEC
  riasec_scores?: Record<string, number>;

  // Aptitude - stream level
  aptitude_overall?: number;
  stream_aptitude_score?: number;
  stream_aptitude_details?: {
    score: number;
    byDifficulty?: Record<string, { percentage: number }>;
    aptitudeInsights?: {
      pattern: string;
      strengths: string[];
      weaknesses: string[];
    };
    correctCount?: number;
    totalQuestions?: number;
  };

  // Aptitude - detailed
  aptitude_scores?: {
    overallAccuracy: number;
    accuracyBySubtag?: Record<string, { total: number; correct: number; accuracy: number }>;
    accuracyByDifficulty?: Record<string, { accuracy: number }>;
  };

  // Personality
  bigfive_scores?: Record<string, number>;

  // Work values
  work_values_scores?: Record<string, number>;

  // Knowledge
  knowledge_score?: number;
  knowledge_details?: {
    strongTopics?: string[];
    weakTopics?: string[];
    recommendation?: string;
  };

  // Employability
  employability_scores?: Record<string, number>;
  employability_readiness?: string;

  // Student context
  strength_scores?: Array<{ dimension: string; average: number }>;
  learning_preferences?: Record<string, any>;
}

interface StudentContext {
  stream?: string;
  degreeLevel?: string;
}

// ============================================================================
// NO HARDCODED FILTERS
// All assessment signals pass through without threshold filtering.
// Context builder interprets all available data, RAG determines relevance.
// ============================================================================

// ============================================================================
// INTERPRETATION HELPERS
// ============================================================================

/**
 * Interpret RIASEC code into work style and career orientation
 * Enhanced with keyword extraction for better RAG semantic matching
 */
function interpretRIASEC(code: string, scores?: Record<string, number>): string {
  const riasecMeaning: Record<string, string> = {
    R: 'hands-on, practical, working with tools and systems, mechanical, engineering, building',
    I: 'analytical, research-oriented, problem-solving and inquiry, investigation, technical depth, systems thinking',
    A: 'creative, self-expression, working with ideas and design, innovation, artistic vision, aesthetic',
    S: 'helping, collaborating with people, social impact, teamwork, mentoring, communication',
    E: 'leadership, persuasion, business strategy and influence, entrepreneurship, management, initiative',
    C: 'organized, systematic, detail-focused processes, compliance, data-driven, structured',
  };

  const topTypes = code.split('').slice(0, 3);
  const meanings = topTypes.map(t => riasecMeaning[t] || '').filter(Boolean);

  // Extract dominant types for keyword extraction
  const dominant = topTypes.join('');
  let domainKeywords = '';
  if (dominant.includes('A')) {
    domainKeywords = 'creative design innovation artistic UX product vision';
  }
  if (dominant.includes('I')) {
    domainKeywords += ' analytical research investigation technical depth systems';
  }
  if (dominant.includes('R')) {
    domainKeywords += ' hands-on practical engineering building implementation';
  }
  if (dominant.includes('S')) {
    domainKeywords += ' collaboration people teamwork communication mentoring';
  }
  if (dominant.includes('E')) {
    domainKeywords += ' leadership entrepreneurship business strategy management';
  }
  if (dominant.includes('C')) {
    domainKeywords += ' organization systems data compliance processes';
  }

  return `CAREER INTERESTS & WORK ORIENTATION (RIASEC: ${code}):
Primary interests: ${meanings.join('; ')}.
Career focus: ${domainKeywords.trim()}.
Career fit: Seeks roles combining these elements in ways that align with their interest profile.`.trim();
}

/**
 * Interpret aptitude data - focus on high-signal areas only
 */
function interpretAptitudes(
  aptitudeScores?: Record<string, any>,
  streamDetails?: Record<string, any>
): string {
  const lines: string[] = [];

  if (!aptitudeScores || !aptitudeScores.accuracyBySubtag) {
    return '';
  }

  const subtags = aptitudeScores.accuracyBySubtag as Record<
    string,
    { total: number; accuracy: number }
  >;

  // No thresholds — include all aptitude data
  const allAptitudes: Array<[string, number]> = [];

  Object.entries(subtags).forEach(([name, data]) => {
    const total = data.total as number;
    const accuracy = data.accuracy as number;

    if (total > 0) {
      allAptitudes.push([name.replace(/_/g, ' '), accuracy]);
    }
  });

  // Sort by accuracy (highest first)
  allAptitudes.sort((a, b) => b[1] - a[1]);

  lines.push('COGNITIVE CAPABILITIES:');

  // Categorize by performance level (no threshold filtering)
  const strengths = allAptitudes.filter(([, acc]) => acc >= 70);
  const moderate = allAptitudes.filter(([, acc]) => 50 <= acc && acc < 70);
  const weaknesses = allAptitudes.filter(([, acc]) => acc < 50);

  if (strengths.length > 0) {
    const strengthDescriptions = strengths
      .map(([name, acc]) => {
        const capability =
          {
            'spatial reasoning': 'Can visualize complex system architectures and spatial relationships',
            'numerical reasoning': 'Capable of quantitative analysis and mathematical thinking',
            'logical reasoning': 'Strong analytical and systematic problem-solving',
            'pattern recognition': 'Able to identify trends and recurring patterns',
            'verbal reasoning': 'Clear communicator of complex ideas',
            'data interpretation': 'Can analyze and derive insights from data',
          }[name] || `Strong at ${name}`;

        return `${name} (${acc.toFixed(1)}%): ${capability}`;
      })
      .join('; ');

    lines.push(`✓ Strengths: ${strengthDescriptions}`);
  }

  if (moderate.length > 0) {
    const moderateDescriptions = moderate
      .map(([name, acc]) => `${name} (${acc.toFixed(1)}%)`)
      .join(', ');
    lines.push(`~ Moderate capability: ${moderateDescriptions}`);
  }

  if (weaknesses.length > 0) {
    const weaknessDescriptions = weaknesses
      .map(([name, acc]) => `${name} (${acc.toFixed(1)}%)`)
      .join(', ');
    lines.push(`⚠️ Development areas: ${weaknessDescriptions}`);
  }

  // Add learning pattern from stream details
  if (streamDetails?.aptitudeInsights) {
    const { pattern, strengths: strengthAreas, weaknesses: weaknessAreas } =
      streamDetails.aptitudeInsights;

    lines.push(`\nLearning Pattern: ${pattern}`);

    if (strengthAreas && strengthAreas.length > 0) {
      lines.push(
        `Excels at: ${strengthAreas.map((s: string) => s.replace(/_/g, ' ')).join(', ')}`
      );
    }
    if (weaknessAreas && weaknessAreas.length > 0) {
      lines.push(
        `Struggles with: ${weaknessAreas.map((s: string) => s.replace(/_/g, ' ')).join(', ')}`
      );
    }
  }

  return lines.join('\n');
}

/**
 * Interpret Big Five personality traits - top 3 only
 */
function interpretBigFive(scores?: Record<string, number>): string {
  if (!scores) return '';

  const traits: Record<string, string> = {
    conscientiousness: 'Systematic, detail-focused, organized execution',
    agreeableness: 'Team-oriented, collaborative work style',
    neuroticism: 'Stress-sensitive, needs supportive environment',
    openness: 'Intellectually curious, embraces new technologies',
    extraversion: 'Energetic, thrives in interactive settings',
  };

  // Get top 3 traits only
  const allTraits: Array<[string, number]> = [];
  Object.entries(scores).forEach(([name, score]) => {
    allTraits.push([name, score]);
  });

  if (allTraits.length === 0) {
    return '';
  }

  allTraits.sort((a, b) => b[1] - a[1]);
  const topTraits = allTraits.slice(0, 2); // Top 2 instead of 3

  if (topTraits.length === 0) return '';

  const lines: string[] = [];
  lines.push('PERSONALITY & WORK STYLE:');

  topTraits.forEach(([name, score]) => {
    const desc = traits[name];
    if (desc) {
      lines.push(`${name.charAt(0).toUpperCase() + name.slice(1)}: ${desc}`);
    }
  });

  return lines.join('\n');
}

/**
 * Interpret work values - high-signal only (≥3.5)
 */
function interpretWorkValues(scores?: Record<string, number>): string {
  if (!scores) return '';

  const valueDescriptions: Record<string, string> = {
    Impact: 'meaningful work with measurable outcomes',
    Creativity: 'innovation and novel technical solutions',
    Autonomy: 'independent decision-making authority',
    Security: 'stable, predictable work conditions',
    Financial: 'competitive compensation structure',
    Status: 'recognition and professional prestige',
    Leadership: 'team influence and strategic direction',
    Lifestyle: 'work-life balance and scheduling flexibility',
  };

  // No thresholds — include all work values
  const allValues: Array<[string, number]> = [];

  Object.entries(scores).forEach(([name, score]) => {
    allValues.push([name, score]);
  });

  if (allValues.length === 0) {
    return '';
  }

  allValues.sort((a, b) => b[1] - a[1]);

  const lines: string[] = ['CAREER VALUES & DRIVERS:'];

  // Top values only
  const topValues = allValues.slice(0, 3);
  if (topValues.length > 0) {
    const topDesc = topValues.map(([name]) => valueDescriptions[name] || name).join(', ');
    lines.push(`Priorities: ${topDesc}`);
  }

  return lines.join('\n');
}

/**
 * Interpret knowledge domain - strong topics with career context
 * Filters generic topics and focuses on actual technical/domain expertise
 */
function interpretKnowledge(
  score?: number,
  details?: Record<string, any>,
  stream?: string
): string {
  if (!score || !details) return '';

  // Filter out generic/non-domain topics
  const genericTopics = ['abbreviation', 'acronym', 'definition', 'overview', 'introduction'];
  let strong = (details.strongTopics as string[]) || [];
  strong = strong.filter(t => !genericTopics.some(g => t.toLowerCase().includes(g)));

  if (strong.length === 0) return '';

  const lines: string[] = [];

  // Core domain expertise
  lines.push(`DOMAIN EXPERTISE (${Math.round(score)}% mastery):`);
  lines.push(`Competencies: ${strong.join(', ')}`);

  // Map expertise to career applications (used by RAG for matching)
  const expertise = strong.map(t => t.toLowerCase()).join(' ');

  if (expertise.includes('algorithm') || expertise.includes('data structure') || expertise.includes('architecture')) {
    lines.push(`Technical focus: Systems design, algorithms, computational problem-solving`);
  }
  if (expertise.includes('database') || expertise.includes('data model') || expertise.includes('sql')) {
    lines.push(`Technical focus: Database design, data management, query optimization`);
  }
  if (expertise.includes('financial') || expertise.includes('strategy') || expertise.includes('operations')) {
    lines.push(`Business focus: Financial analysis, strategic planning, operations management`);
  }
  if (expertise.includes('programming') || expertise.includes('development') || expertise.includes('software')) {
    lines.push(`Technical focus: Software development, implementation, coding practices`);
  }
  if (expertise.includes('web') || expertise.includes('frontend') || expertise.includes('backend')) {
    lines.push(`Technical focus: Web technologies, full-stack development, user interfaces`);
  }

  return lines.join('\n');
}

/**
 * Interpret employability - strong skills only (≥75)
 */
function interpretEmployability(scores?: Record<string, number>, readiness?: string): string {
  if (!scores) return '';

  const allScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const strengths = allScores.filter(([, score]) => score >= 75);

  if (strengths.length === 0) return '';

  const skillNames = strengths.map(([skill]) => skill).join(', ');
  return `WORKPLACE READINESS: Strong in ${skillNames}`;
}


// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Build RAG context from student profile assessment data
 * Maps StudentProfile fields to AssessmentData format for interpretation
 * No occupation matching, purely interpretation-based
 */
export function buildAssessmentRagContext(
  student: any, // StudentProfile (flexible typing for compatibility)
  studentContext?: StudentContext,
  occupationContextData?: any // Optional: occupation profiles for matching
): string {
  const sections: string[] = [];

  // Header
  const stream = student.stream ? student.stream.toUpperCase() : 'Student Program';
  const degree = studentContext?.degreeLevel || student.degreeLevel || 'college';

  sections.push(`LEARNER CAREER PROFILE
Program: ${stream} | Education Level: ${degree}
`);

  // RIASEC FIRST (Career orientation — primary matching signal for RAG)
  // Put this FIRST so embedding prioritizes interest matching over competency matching
  if (student.riasec_code && student.riasec_scores) {
    sections.push(interpretRIASEC(student.riasec_code, student.riasec_scores));
  }

  // DOMAIN EXPERTISE (Knowledge strengths + gaps)
  // Map StudentProfile knowledge fields to AssessmentData format
  if (student.knowledge_score) {
    const knowledgeDetails = {
      strongTopics: student.knowledge_strengths || [],
      weakTopics: student.knowledge_weaknesses || [],
    };
    if (knowledgeDetails.strongTopics.length > 0 || knowledgeDetails.weakTopics.length > 0) {
      sections.push(interpretKnowledge(student.knowledge_score, knowledgeDetails, stream));
    }
  }

  // Cognitive Strengths & Aptitudes
  // Map StudentProfile accuracy_by_subtag to aptitude_scores format
  if (student.accuracy_by_subtag || student.aptitude_scores) {
    const aptitudeScores = student.aptitude_scores || {
      overallAccuracy: student.aptitude_overall || 0,
      accuracyBySubtag: Object.entries(student.accuracy_by_subtag || {}).reduce(
        (acc: any, [key, val]: [string, any]) => {
          acc[key] = {
            total: 100,
            correct: typeof val === 'number' ? val : 0,
            accuracy: typeof val === 'number' ? val : 0,
          };
          return acc;
        },
        {}
      ),
    };
    sections.push(interpretAptitudes(aptitudeScores, student.stream_aptitude_details));
  }

  // Personality & Work Style
  if (student.big_five_scores) {
    sections.push(interpretBigFive(student.big_five_scores));
  }

  // Career Drivers & Values
  // Map StudentProfile work_values to work_values_scores format
  if (student.work_values) {
    sections.push(interpretWorkValues(student.work_values));
  }

  // Professional Competencies
  if (student.employability_scores) {
    sections.push(interpretEmployability(student.employability_scores, student.employability_readiness));
  }

  // Win 1: Add observable_behaviours and work_style_demands summary if provided
  if (occupationContextData?.observable_behaviours) {
    sections.push(`BEHAVIORAL PATTERNS & WORK DEMANDS:
${occupationContextData.observable_behaviours}`);
  }

  // Win 3: Add top skills if provided
  if (occupationContextData?.top_skills) {
    sections.push(`KEY TECHNICAL & SOFT SKILLS:
${occupationContextData.top_skills}`);
  }

  // Join with blank lines between sections
  const context = sections.filter(Boolean).join('\n\n');

  console.log('[ASSESSMENT-CONTEXT] Generated RAG context:');
  console.log(`[ASSESSMENT-CONTEXT] Total length: ${context.length} characters`);
  console.log(`[ASSESSMENT-CONTEXT] Contains ${sections.length} sections`);

  return context;
}

// Win 4: Compare aptitude profiles
export function compareAptitudeProfiles(
  studentAptitudes?: Record<string, any>,
  occupationAptitudes?: Record<string, number>
): string {
  if (!studentAptitudes || !occupationAptitudes) return '';

  const studentScores = studentAptitudes.accuracyBySubtag || {};
  const gaps: string[] = [];

  Object.entries(studentScores).forEach(([skill, data]: [string, any]) => {
    const studentScore = data.accuracy || 0;
    const occupationScore = (occupationAptitudes[skill] || 50) as number;
    const gap = Math.abs(studentScore - occupationScore);

    if (gap > 15) {
      gaps.push(`${skill.replace(/_/g, ' ')} (student: ${studentScore}%, role: ${occupationScore}%)`);
    }
  });

  if (gaps.length === 0) {
    return 'Cognitive strengths align well with role requirements';
  } else if (gaps.length <= 2) {
    return `Minor skill gaps: ${gaps.join(', ')}`;
  } else {
    return `Significant skill gaps: ${gaps.join(', ')}`;
  }
}

// Win 5: Compare Big Five profiles
export function compareBigFiveProfiles(
  studentBigFive?: Record<string, number>,
  occupationBigFive?: Record<string, number>
): number {
  if (!studentBigFive || !occupationBigFive) return 0;

  let matchScore = 0;
  let count = 0;

  for (const trait of Object.keys(studentBigFive)) {
    const studentScore = studentBigFive[trait] || 3.0;
    const occupationScore = occupationBigFive[trait] || 3.0;
    const similarity = 1 - Math.abs(studentScore - occupationScore) / 5;
    matchScore += similarity;
    count++;
  }

  return count > 0 ? (matchScore / count) * 100 : 0;
}

// Win 6: Compare work values profiles
export function compareWorkValues(
  studentValues?: Record<string, number>,
  occupationValues?: Record<string, number>
): number {
  if (!studentValues || !occupationValues) return 0;

  const commonKeys = Object.keys(studentValues).filter(k => occupationValues?.[k] !== undefined);

  if (commonKeys.length === 0) return 0;

  const similarity = commonKeys
    .map(k => {
      const diff = Math.abs((studentValues[k] || 0) - (occupationValues?.[k] || 0));
      return 1 - diff / 5;
    })
    .reduce((a, b) => a + b, 0) / commonKeys.length;

  return similarity * 100;
}

export { AssessmentData, StudentContext };

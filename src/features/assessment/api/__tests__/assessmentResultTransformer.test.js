/**
 * Unit Tests for Assessment Result Transformer
 * Tests all transformation functions with various data scenarios
 */

import {
  transformAptitudeScores,
  transformGeminiAnalysis,
  enrichCareerRecommendations,
  transformAssessmentResults,
  validateTransformedResults
} from '../assessmentResultTransformer';

describe('transformAptitudeScores', () => {
  test('transforms valid aptitude data correctly', () => {
    const dbAptitude = {
      Analytical: { ease: 4, enjoyment: 5 },
      Creative: { ease: 3, enjoyment: 4 },
      Technical: { ease: 5, enjoyment: 4 },
      Social: { ease: 2, enjoyment: 3 }
    };

    const result = transformAptitudeScores(dbAptitude);

    expect(result).toBeDefined();
    expect(result.scores).toBeDefined();
    expect(result.scores.numerical).toBeDefined();
    expect(result.scores.numerical.percentage).toBe(90); // (4+5)/2/5*100
    expect(result.scores.numerical.ease).toBe(4);
    expect(result.scores.numerical.enjoyment).toBe(5);
    expect(result.topStrengths).toHaveLength(3);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  test('handles null aptitude data', () => {
    const result = transformAptitudeScores(null);
    expect(result).toBeNull();
  });

  test('handles empty aptitude object', () => {
    const result = transformAptitudeScores({});
    expect(result).toBeDefined();
    expect(result.scores).toEqual({});
    expect(result.topStrengths).toEqual([]);
    expect(result.overallScore).toBeNull();
  });

  test('handles partial aptitude data', () => {
    const dbAptitude = {
      Analytical: { ease: 4, enjoyment: 5 }
    };

    const result = transformAptitudeScores(dbAptitude);

    expect(result.scores.numerical).toBeDefined();
    expect(result.topStrengths).toHaveLength(1);
    expect(result.topStrengths[0]).toBe('Numerical');
  });

  test('calculates overall score correctly', () => {
    const dbAptitude = {
      Analytical: { ease: 4, enjoyment: 4 }, // 80%
      Creative: { ease: 3, enjoyment: 3 },   // 60%
      Technical: { ease: 5, enjoyment: 5 }   // 100%
    };

    const result = transformAptitudeScores(dbAptitude);

    expect(result.overallScore).toBe(80); // (80+60+100)/3
  });

  test('sorts top strengths by percentage', () => {
    const dbAptitude = {
      Analytical: { ease: 2, enjoyment: 2 }, // 40%
      Creative: { ease: 5, enjoyment: 5 },   // 100%
      Technical: { ease: 4, enjoyment: 4 }   // 80%
    };

    const result = transformAptitudeScores(dbAptitude);

    expect(result.topStrengths[0]).toBe('Abstract'); // Creative -> Abstract (100%)
    expect(result.topStrengths[1]).toBe('Spatial');  // Technical -> Spatial (80%)
    expect(result.topStrengths[2]).toBe('Numerical'); // Analytical -> Numerical (40%)
  });
});

describe('transformGeminiAnalysis', () => {
  test('transforms complete Gemini analysis', () => {
    const geminiAnalysis = {
      analysis: {
        interest_summary: 'Strong investigative interests',
        strength_summary: 'High curiosity and creativity',
        personality_insights: 'Openness to experience',
        learning_style: 'Visual and kinesthetic learner'
      },
      career_recommendations: [
        {
          title: 'Software Engineer',
          match_score: 92,
          reasoning: 'Aligns with investigative interests',
          roles: ['Backend Developer', 'Frontend Developer'],
          skills: ['JavaScript', 'Python'],
          salary: { min: 8, max: 25, currency: 'LPA' }
        },
        {
          title: 'Data Scientist',
          match_score: 88,
          reasoning: 'Strong analytical skills'
        }
      ],
      skill_development: [
        'Communication skills',
        'Project management',
        { name: 'Leadership', importance: 'High', developmentPath: 'Take leadership course' }
      ],
      next_steps: [
        'Explore internships',
        { title: 'Build portfolio', description: 'Create 3-5 projects', timeline: 'Short-term' }
      ]
    };

    const result = transformGeminiAnalysis(geminiAnalysis);

    expect(result.overallSummary).toBe('Strong investigative interests');
    expect(result.careerFit).toBeDefined();
    expect(result.careerFit.clusters).toHaveLength(2);
    expect(result.careerFit.clusters[0].title).toBe('Software Engineer');
    expect(result.careerFit.clusters[0].matchScore).toBe(92);
    expect(result.careerFit.clusters[0].roles).toEqual(['Backend Developer', 'Frontend Developer']);
    
    expect(result.skillGap).toBeDefined();
    expect(result.skillGap.gaps).toHaveLength(3);
    expect(result.skillGap.gaps[0].skill).toBe('Communication skills');
    expect(result.skillGap.gaps[2].skill).toBe('Leadership');
    expect(result.skillGap.gaps[2].importance).toBe('High');
    
    expect(result.roadmap).toBeDefined();
    expect(result.roadmap.steps).toHaveLength(2);
    expect(result.roadmap.steps[0].title).toBe('Explore internships');
    expect(result.roadmap.steps[1].timeline).toBe('Short-term');
  });

  test('handles null Gemini analysis', () => {
    const result = transformGeminiAnalysis(null);

    expect(result.overallSummary).toBeNull();
    expect(result.careerFit).toBeNull();
    expect(result.skillGap).toBeNull();
    expect(result.roadmap).toBeNull();
  });

  test('handles empty Gemini analysis', () => {
    const result = transformGeminiAnalysis({});

    expect(result.overallSummary).toBeNull();
    expect(result.careerFit).toBeNull();
    expect(result.skillGap).toBeNull();
    expect(result.roadmap).toBeNull();
  });

  test('handles partial Gemini analysis', () => {
    const geminiAnalysis = {
      analysis: {
        interest_summary: 'Test summary'
      }
    };

    const result = transformGeminiAnalysis(geminiAnalysis);

    expect(result.overallSummary).toBe('Test summary');
    expect(result.careerFit).toBeNull();
    expect(result.skillGap).toBeNull();
    expect(result.roadmap).toBeNull();
  });

  test('assigns default timelines to roadmap steps', () => {
    const geminiAnalysis = {
      next_steps: ['Step 1', 'Step 2', 'Step 3']
    };

    const result = transformGeminiAnalysis(geminiAnalysis);

    expect(result.roadmap.steps[0].timeline).toBe('Immediate');
    expect(result.roadmap.steps[1].timeline).toBe('Short-term (1-3 months)');
    expect(result.roadmap.steps[2].timeline).toBe('Medium-term (3-6 months)');
  });
});

describe('enrichCareerRecommendations', () => {
  test('enriches simple career array', () => {
    const simpleArray = ['Software Engineer', 'Data Scientist'];
    const riasecScores = { I: 18, R: 15, A: 8, S: 10, E: 7, C: 5 };

    const result = enrichCareerRecommendations(simpleArray, riasecScores);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Software Engineer');
    expect(result[0].roles).toBeDefined();
    expect(result[0].roles.length).toBeGreaterThan(0);
    expect(result[0].skills).toBeDefined();
    expect(result[0].skills.length).toBeGreaterThan(0);
    expect(result[0].salary).toBeDefined();
    expect(result[0].matchScore).toBeGreaterThan(0);
  });

  test('handles empty array', () => {
    const result = enrichCareerRecommendations([]);
    expect(result).toEqual([]);
  });

  test('handles null input', () => {
    const result = enrichCareerRecommendations(null);
    expect(result).toEqual([]);
  });

  test('handles unknown career titles', () => {
    const simpleArray = ['Unknown Career Title'];
    const result = enrichCareerRecommendations(simpleArray);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Unknown Career Title');
    expect(result[0].roles).toEqual([]);
    expect(result[0].skills).toEqual([]);
    expect(result[0].salary).toBeNull();
  });

  test('decreases match score for lower ranked careers', () => {
    const simpleArray = ['Software Engineer', 'Data Scientist', 'UX Designer'];
    const riasecScores = { I: 18, R: 15, A: 8, S: 10, E: 7, C: 5 };

    const result = enrichCareerRecommendations(simpleArray, riasecScores);

    expect(result[0].matchScore).toBeGreaterThan(result[1].matchScore);
    expect(result[1].matchScore).toBeGreaterThan(result[2].matchScore);
  });

  test('calculates match score based on RIASEC alignment', () => {
    const simpleArray = ['Software Engineer']; // RIASEC: I, R, C
    const highMatchScores = { I: 20, R: 18, C: 15, A: 5, S: 5, E: 5 };
    const lowMatchScores = { I: 5, R: 5, C: 5, A: 20, S: 18, E: 15 };

    const highResult = enrichCareerRecommendations(simpleArray, highMatchScores);
    const lowResult = enrichCareerRecommendations(simpleArray, lowMatchScores);

    expect(highResult[0].matchScore).toBeGreaterThan(lowResult[0].matchScore);
  });
});

describe('transformAssessmentResults', () => {
  test('transforms complete database results', () => {
    const dbResults = {
      attempt_id: 'test-attempt-123',
      student_id: 'student-456',
      grade_level: 'after12',
      
      riasec_scores: { R: 15, I: 18, A: 8, S: 10, E: 7, C: 5 },
      top_interests: ['I', 'R', 'S'],
      
      strengths_scores: {
        Curiosity: 4.2,
        Perseverance: 3.8,
        Creativity: 4.0
      },
      top_strengths: ['Curiosity', 'Creativity', 'Perseverance'],
      
      aptitude_scores: {
        Analytical: { ease: 4, enjoyment: 5 },
        Creative: { ease: 3, enjoyment: 4 }
      },
      
      personality_scores: {
        Openness: 4.1,
        Conscientiousness: 3.7,
        Extraversion: 3.2,
        Agreeableness: 3.9,
        Neuroticism: 2.8
      },
      
      work_values_scores: {
        Autonomy: 4.5,
        Creativity: 4.2,
        Impact: 4.0
      },
      
      knowledge_score: 42,
      knowledge_percentage: 84.0,
      
      employability_score: 78,
      
      gemini_analysis: {
        analysis: {
          interest_summary: 'Strong investigative interests'
        },
        career_recommendations: [
          { title: 'Software Engineer', match_score: 92 }
        ],
        skill_development: ['Communication'],
        next_steps: ['Build portfolio']
      },
      
      career_recommendations: ['Software Engineer', 'Data Scientist'],
      skill_gaps: ['Communication', 'Leadership'],
      
      learning_styles: ['Visual', 'Kinesthetic'],
      work_preferences: ['Remote Work', 'Flexible Hours'],
      
      generated_at: '2026-01-28T10:00:00Z'
    };

    const result = transformAssessmentResults(dbResults);

    expect(result).toBeDefined();
    expect(result._transformed).toBe(true);
    
    // Check RIASEC
    expect(result.riasec.scores).toEqual(dbResults.riasec_scores);
    expect(result.riasec.topThree).toEqual(dbResults.top_interests);
    expect(result.riasec.maxScore).toBe(20);
    
    // Check strengths
    expect(result.strengths.scores).toEqual(dbResults.strengths_scores);
    expect(result.strengths.top).toEqual(dbResults.top_strengths);
    
    // Check transformed aptitude
    expect(result.aptitude).toBeDefined();
    expect(result.aptitude.scores.numerical).toBeDefined();
    expect(result.aptitude.topStrengths).toBeDefined();
    expect(result.aptitude.overallScore).toBeDefined();
    
    // Check personality
    expect(result.bigFive).toEqual(dbResults.personality_scores);
    
    // Check work values
    expect(result.workValues).toEqual(dbResults.work_values_scores);
    
    // Check knowledge
    expect(result.knowledge.score).toBe(42);
    expect(result.knowledge.percentage).toBe(84.0);
    expect(result.knowledge.totalQuestions).toBe(50);
    
    // Check employability
    expect(result.employability.score).toBe(78);
    expect(result.employability.level).toBe('Medium');
    
    // Check transformed Gemini analysis
    expect(result.overallSummary).toBe('Strong investigative interests');
    expect(result.careerFit).toBeDefined();
    expect(result.skillGap).toBeDefined();
    expect(result.roadmap).toBeDefined();
    
    // Check additional fields
    expect(result.learningStyles).toEqual(['Visual', 'Kinesthetic']);
    expect(result.workPreferences).toEqual(['Remote Work', 'Flexible Hours']);
    
    // Check metadata
    expect(result.generatedAt).toBe('2026-01-28T10:00:00Z');
    expect(result.attemptId).toBe('test-attempt-123');
    expect(result.gradeLevel).toBe('after12');
    
    // Check original preserved
    expect(result._original).toEqual(dbResults);
  });

  test('handles null database results', () => {
    const result = transformAssessmentResults(null);
    expect(result).toBeNull();
  });

  test('handles minimal database results', () => {
    const dbResults = {
      riasec_scores: { R: 10, I: 12, A: 8, S: 9, E: 7, C: 6 },
      top_interests: ['I', 'R'],
      strengths_scores: { Curiosity: 4.0 },
      top_strengths: ['Curiosity']
    };

    const result = transformAssessmentResults(dbResults);

    expect(result).toBeDefined();
    expect(result.riasec).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.aptitude).toBeNull();
    expect(result.bigFive).toBeNull();
  });

  test('calculates employability level correctly', () => {
    const highEmployability = transformAssessmentResults({
      riasec_scores: {},
      top_interests: [],
      strengths_scores: {},
      top_strengths: [],
      employability_score: 85
    });

    const mediumEmployability = transformAssessmentResults({
      riasec_scores: {},
      top_interests: [],
      strengths_scores: {},
      top_strengths: [],
      employability_score: 70
    });

    const lowEmployability = transformAssessmentResults({
      riasec_scores: {},
      top_interests: [],
      strengths_scores: {},
      top_strengths: [],
      employability_score: 50
    });

    expect(highEmployability.employability.level).toBe('High');
    expect(mediumEmployability.employability.level).toBe('Medium');
    expect(lowEmployability.employability.level).toBe('Developing');
  });
});

describe('validateTransformedResults', () => {
  test('validates complete results as valid', () => {
    const transformed = {
      riasec: { scores: { R: 10 }, topThree: ['R'] },
      strengths: { scores: { Curiosity: 4 }, top: ['Curiosity'] },
      aptitude: { scores: {}, topStrengths: [] },
      bigFive: { Openness: 4 },
      workValues: { Autonomy: 4 },
      knowledge: { score: 40 },
      employability: { score: 75 },
      overallSummary: 'Test summary',
      careerFit: { clusters: [{ title: 'Test' }] },
      skillGap: { gaps: [] },
      roadmap: { steps: [] },
      gradeLevel: 'after12'
    };

    const validation = validateTransformedResults(transformed);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.completeness).toBe(100);
  });

  test('detects missing required fields', () => {
    const transformed = {
      strengths: { scores: {}, top: [] }
    };

    const validation = validateTransformedResults(transformed);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors[0]).toContain('RIASEC');
  });

  test('generates warnings for missing optional fields', () => {
    const transformed = {
      riasec: { scores: { R: 10 }, topThree: ['R'] },
      strengths: { scores: {}, top: [] },
      gradeLevel: 'after12'
    };

    const validation = validateTransformedResults(transformed);

    expect(validation.warnings.length).toBeGreaterThan(0);
  });

  test('checks grade-specific requirements', () => {
    const collegeResults = {
      riasec: { scores: { R: 10 }, topThree: ['R'] },
      strengths: { scores: {}, top: [] },
      gradeLevel: 'college'
    };

    const validation = validateTransformedResults(collegeResults);

    expect(validation.warnings).toContain('Missing Big Five personality scores for college/after12 student');
    expect(validation.warnings).toContain('Missing knowledge test scores for college/after12 student');
  });

  test('calculates completeness percentage', () => {
    const halfComplete = {
      riasec: { scores: { R: 10 }, topThree: ['R'] },
      strengths: { scores: {}, top: [] },
      aptitude: null,
      bigFive: null,
      workValues: null,
      knowledge: null,
      employability: null,
      overallSummary: null,
      careerFit: null,
      skillGap: null,
      roadmap: null
    };

    const validation = validateTransformedResults(halfComplete);

    expect(validation.completeness).toBeLessThan(50);
  });

  test('handles null input', () => {
    const validation = validateTransformedResults(null);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Transformed results is null or undefined');
  });
});

describe('Edge Cases and Error Handling', () => {
  test('handles malformed aptitude data', () => {
    const malformed = {
      Analytical: { ease: 'invalid', enjoyment: null }
    };

    const result = transformAptitudeScores(malformed);

    expect(result).toBeDefined();
    // Should handle gracefully without crashing
  });

  test('handles very large RIASEC scores', () => {
    const simpleArray = ['Software Engineer'];
    const largeScores = { I: 1000, R: 1000, C: 1000, A: 0, S: 0, E: 0 };

    const result = enrichCareerRecommendations(simpleArray, largeScores);

    expect(result[0].matchScore).toBeLessThanOrEqual(100);
  });

  test('handles special characters in career titles', () => {
    const simpleArray = ['Software Engineer & Developer'];
    const result = enrichCareerRecommendations(simpleArray);

    expect(result[0].title).toBe('Software Engineer & Developer');
  });

  test('handles empty strings in skill development', () => {
    const geminiAnalysis = {
      skill_development: ['', 'Valid Skill', '']
    };

    const result = transformGeminiAnalysis(geminiAnalysis);

    expect(result.skillGap.gaps).toHaveLength(3);
    expect(result.skillGap.gaps[1].skill).toBe('Valid Skill');
  });
});

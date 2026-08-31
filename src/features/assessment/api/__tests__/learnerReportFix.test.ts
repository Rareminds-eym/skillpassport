import { describe, test, expect } from 'vitest';
import { transformAssessmentResults } from '../assessmentResultTransformer';

describe('Learner f37a38ff-ee5f-4836-93e6-6fdc10116ad8 Report Transformation Fixes', () => {
  const dbData = {
    id: '45b1244b-7ff7-45bb-838d-cc6dbf309b19',
    attempt_id: '1413c546-ee83-4014-847c-22f417791ab1',
    learner_id: 'f37a38ff-ee5f-4836-93e6-6fdc10116ad8',
    grade_level: 'college',
    riasec_scores: {
      social: 34,
      artistic: 31,
      realistic: 33,
      conventional: 28,
      enterprising: 29,
      investigative: 31
    },
    riasec_code: 'SRI',
    aptitude_scores: {
      tier: 'H',
      difficulty: 2,
      totalCorrect: 35,
      aptitudeLevel: 4,
      confidenceTag: 'medium',
      totalQuestions: 50,
      overallAccuracy: 70,
      accuracyBySubtag: {
        logical_reasoning: { total: 6, correct: 3, accuracy: 50 },
        data_interpretation: { total: 8, correct: 5, accuracy: 62.5 },
        numerical_reasoning: { total: 27, correct: 20, accuracy: 74.07407407407408 },
        pattern_recognition: { total: 9, correct: 7, accuracy: 77.77777777777779 }
      },
      questionsAnswered: 50
    },
    bigfive_scores: {
      openness: 4.17,
      neuroticism: 3.33,
      extraversion: 4.5,
      agreeableness: 4.33,
      conscientiousness: 4
    },
    knowledge_score: null,
    knowledge_details: null
  };

  test('Issue 1 Fix: Aptitude subtag scores preserve correct and total questions', () => {
    const transformed = transformAssessmentResults(dbData);
    expect(transformed.aptitude).toBeDefined();
    expect(transformed.aptitude.scores['Logical Reasoning']).toEqual({
      percentage: 50,
      correct: 3,
      total: 6,
      accuracy: 50
    });
    expect(transformed.aptitude.scores['Data Interpretation']).toEqual({
      percentage: 63,
      correct: 5,
      total: 8,
      accuracy: 62.5
    });
    expect(transformed.aptitude.scores['Numerical Reasoning']).toEqual({
      percentage: 74,
      correct: 20,
      total: 27,
      accuracy: 74.07407407407408
    });
    expect(transformed.aptitude.scores['Pattern Recognition']).toEqual({
      percentage: 78,
      correct: 7,
      total: 9,
      accuracy: 77.77777777777779
    });
  });

  test('Issue 2 Fix: Big Five personality scores map O, C, E, A, N and full names', () => {
    const transformed = transformAssessmentResults(dbData);
    expect(transformed.bigFive).toBeDefined();
    expect(transformed.bigFive.O).toBe(4.17);
    expect(transformed.bigFive.openness).toBe(4.17);
    expect(transformed.bigFive.C).toBe(4);
    expect(transformed.bigFive.conscientiousness).toBe(4);
    expect(transformed.bigFive.E).toBe(4.5);
    expect(transformed.bigFive.extraversion).toBe(4.5);
    expect(transformed.bigFive.A).toBe(4.33);
    expect(transformed.bigFive.agreeableness).toBe(4.33);
    expect(transformed.bigFive.N).toBe(3.33);
    expect(transformed.bigFive.neuroticism).toBe(3.33);
  });

  test('Issue 3 Fix: RIASEC scores calculate maxScore as 40 when raw scores > 20', () => {
    const transformed = transformAssessmentResults(dbData);
    expect(transformed.riasec.maxScore).toBe(40);
    expect(Math.round((transformed.riasec.scores.social / transformed.riasec.maxScore) * 100)).toBe(85);
  });

  test('Issue 4 Fix: Knowledge score is null when learner has not taken knowledge assessment', () => {
    const transformed = transformAssessmentResults(dbData);
    expect(transformed.knowledge).toBeNull();
  });
});

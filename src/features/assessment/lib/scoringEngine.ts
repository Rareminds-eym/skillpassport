/**
 * Scoring Engine Service
 * Handles score calculations for assessment components
 *
 * @version 2.1.0
 */

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('scoring-engine');

/**
 * Calculate aptitude score from answers
 */
export const calculateAptitudeScore = (answers: any[]): Record<string, any> => {
  if (answers.length === 0) return { correct: 0, total: 0 };

  // Rating questions (high school)
  if (answers[0]?.rating !== undefined) {
    const avgRating = answers.reduce((sum: number, a: any) => sum + (a.rating || 0), 0) / answers.length;
    const percentage = (avgRating / 4) * 100;
    return {
      averageRating: avgRating,
      total: answers.length,
      percentage: Math.round(percentage)
    };
  }

  // MCQ questions (college/after10/after12)
  const correctCount = answers.filter((a: any) => a.isCorrect === true).length;
  const scoredCount = answers.filter((a: any) => a.isCorrect !== null && a.isCorrect !== undefined).length;

  if (scoredCount < answers.length) {
    logger.warn(`⚠️ ${answers.length - scoredCount} answers could not be scored (missing correct answer data)`, {
      unscored: answers.length - scoredCount,
      total: answers.length
    });
  }

  return {
    correct: correctCount,
    total: answers.length,
    scored: scoredCount,
    percentage: answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0
  };
};

/**
 * Calculate knowledge score from answers (legacy function)
 */
export const calculateKnowledgeWithGemini = async (
  answers: Record<string, any>,
  questions: any[]
): Promise<Record<string, any>> => {
  let correct = 0;
  let total = 0;
  const incorrectTopics: string[] = [];
  const correctTopics: string[] = [];

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('knowledge_')) {
      const questionId = key.replace('knowledge_', '');
      const question = questions.find((q: any) => q.id === questionId);

      if (question) {
        total++;
        if (value === question.correct) {
          correct++;
          correctTopics.push(question.text.substring(0, 50));
        } else {
          incorrectTopics.push(question.text.substring(0, 50));
        }
      }
    }
  });

  return {
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
    correctCount: correct,
    totalQuestions: total,
    strongTopics: correctTopics.slice(0, 3),
    weakTopics: incorrectTopics.slice(0, 3)
  };
};

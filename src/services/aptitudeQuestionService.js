import { supabase } from './supabaseClient';

/**
 * @deprecated Use `questionBankService` from `./questionBankService.ts` instead.
 * This file is kept for backward compatibility only.
 * The new service provides proper TypeScript types, dimension-to-subtag mapping,
 * grade-to-gradeLevel mapping, and subtag diversity reordering.
 */
export const aptitudeQuestionService = {
  /**
   * Get questions by grade and dimension
   */
  async getQuestionsByGradeAndDimension(grade, dimension, limit = 10) {
    const { data, error } = await supabase
      .from('aptitude_questions')
      .select('*')
      .eq('grade', grade)
      .eq('dimension', dimension)
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Get questions by difficulty rank
   */
  async getQuestionsByDifficulty(grade, dimension, difficultyRank, limit = 5) {
    const { data, error } = await supabase
      .from('aptitude_questions')
      .select('*')
      .eq('grade', grade)
      .eq('dimension', dimension)
      .eq('difficulty_rank', difficultyRank)
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Get a random question for adaptive testing
   */
  async getRandomQuestion(grade, dimension, difficultyRank) {
    const { data, error } = await supabase
      .from('aptitude_questions')
      .select('*')
      .eq('grade', grade)
      .eq('dimension', dimension)
      .eq('difficulty_rank', difficultyRank)
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Return a random question from the results
    return data[Math.floor(Math.random() * data.length)];
  },

  /**
   * Get question by ID
   */
  async getQuestionById(questionId) {
    const { data, error } = await supabase
      .from('aptitude_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Bulk insert questions from question bank
   */
  async bulkInsertQuestions(questions) {
    const { data, error } = await supabase
      .from('aptitude_questions')
      .insert(questions)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Get questions by batch ID
   */
  async getQuestionsByBatch(batchId) {
    const { data, error } = await supabase
      .from('aptitude_questions')
      .select('*')
      .eq('batch_id', batchId);

    if (error) throw error;
    return data;
  },

  /**
   * Get questions by template family
   */
  async getQuestionsByTemplate(templateFamily, limit = 10) {
    const { data, error } = await supabase
      .from('aptitude_questions')
      .select('*')
      .eq('template_family', templateFamily)
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Get adaptive question based on student performance
   */
  async getAdaptiveQuestion(grade, dimension, currentDifficulty, isCorrect) {
    // Adjust difficulty based on previous answer
    let nextDifficulty = currentDifficulty;
    if (isCorrect && currentDifficulty < 5) {
      nextDifficulty = currentDifficulty + 1;
    } else if (!isCorrect && currentDifficulty > 1) {
      nextDifficulty = currentDifficulty - 1;
    }

    return await this.getRandomQuestion(grade, dimension, nextDifficulty);
  }
};

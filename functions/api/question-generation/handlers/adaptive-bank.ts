/**
 * Adaptive Question Generation using CSV Question Bank
 * Replaces AI generation with pre-loaded questions from database
 */

import { PagesEnv } from '../../../../src/functions-lib/types';
import { GradeLevel, DifficultyLevel, Subtag, QuestionGenerationResult, Question } from '../adaptive-types';
import { reorderToPreventConsecutiveSubtags, generateQuestionId } from '../adaptive-utils';
import { ALL_SUBTAGS } from '../adaptive-constants';
import { createClient } from '@supabase/supabase-js';

/**
 * Map database dimension to frontend subtag
 */
const DIMENSION_TO_SUBTAG: Record<string, Subtag> = {
    'QR': 'numerical_reasoning',
    'LR': 'logical_reasoning',
    'SR': 'spatial_reasoning',
    'PAR': 'pattern_recognition',
    'DI': 'data_interpretation',
    'AA': 'pattern_recognition', // Abstract/Analytical maps to pattern recognition
};

/**
 * Generate questions from CSV question bank
 */
async function generateQuestionsFromBank(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    phase: string,
    subtags: Subtag[],
    difficulty: DifficultyLevel,
    count: number,
    excludeIds: Set<string>
): Promise<Question[]> {
    console.log(`🎯 [Question-Bank] Fetching questions`);
    console.log(`📋 Parameters:`, { gradeLevel, phase, difficulty, count, excludeCount: excludeIds.size });

    // Create Supabase client
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
    
    console.log(`🔑 [Question-Bank] Env check:`, { 
        hasSupabaseUrl: !!supabaseUrl, 
        hasSupabaseKey: !!supabaseKey,
        urlPrefix: supabaseUrl?.substring(0, 20)
    });
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ [Question-Bank] Missing Supabase credentials');
        throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Map grade level to numeric grade
    const gradeMap: Record<string, number> = {
        'grade6-8': 6,
        'middle_school': 6,
        'grade9-10': 9,
        'high_school': 9,
        'after10': 11,
        'higher_secondary': 11,
        'after12': 12,
        'college': 12,
        'postgraduate': 12
    };
    
    const grade = gradeMap[gradeLevel] || 6;
    
    // Map difficulty (1-5) to difficulty_rank (1-8)
    const minRank = Math.max(1, (difficulty - 1) * 2);
    const maxRank = Math.min(8, difficulty * 2);
    
    console.log(`🎓 Grade: ${grade}, Difficulty ranks: ${minRank}-${maxRank}`);

    // Build query
    const excludeArray = Array.from(excludeIds);
    let query = supabase
        .from('adaptive_question_bank')
        .select('*')
        .eq('grade', grade)
        .gte('difficulty_rank', minRank)
        .lte('difficulty_rank', maxRank)
        .eq('is_active', true);
    
    if (excludeArray.length > 0) {
        query = query.not('id', 'in', `(${excludeArray.join(',')})`);
    }
    
    const { data: questionsData, error } = await query.limit(count * 3);

    if (error) {
        console.error(`❌ Database error:`, error);
        throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    let questions = questionsData;

    if (!questions || questions.length === 0) {
        console.warn(`⚠️ No questions found with strict criteria, trying relaxed query...`);
        
        // Try without exclusions if we have too many excluded
        if (excludeArray.length > 50) {
            const relaxedQuery = supabase
                .from('adaptive_question_bank')
                .select('*')
                .eq('grade', grade)
                .gte('difficulty_rank', minRank)
                .lte('difficulty_rank', maxRank)
                .eq('is_active', true)
                .limit(count * 3);
            
            const { data: relaxedQuestions, error: relaxedError } = await relaxedQuery;
            
            if (!relaxedError && relaxedQuestions && relaxedQuestions.length > 0) {
                console.log(`✅ Found ${relaxedQuestions.length} questions with relaxed criteria`);
                // Filter out already used questions manually
                const filtered = relaxedQuestions.filter(q => !excludeIds.has(q.id));
                if (filtered.length > 0) {
                    questions = filtered;
                }
            }
        }
        
        // If still no questions, try expanding difficulty range
        if (!questions || questions.length === 0) {
            console.warn(`⚠️ Expanding difficulty range...`);
            const expandedQuery = supabase
                .from('adaptive_question_bank')
                .select('*')
                .eq('grade', grade)
                .gte('difficulty_rank', 1)
                .lte('difficulty_rank', 8)
                .eq('is_active', true)
                .limit(count * 5);
            
            const { data: expandedQuestions } = await expandedQuery;
            
            if (expandedQuestions && expandedQuestions.length > 0) {
                console.log(`✅ Found ${expandedQuestions.length} questions with expanded range`);
                // Filter out already used questions
                const filtered = expandedQuestions.filter(q => !excludeIds.has(q.id));
                if (filtered.length > 0) {
                    questions = filtered;
                }
            }
        }
        
        if (!questions || questions.length === 0) {
            console.warn(`⚠️ No more questions available - test should move to next phase`);
            // Return empty array to signal phase transition
            return [];
        }
    }

    console.log(`✅ Found ${questions.length} questions`);

    // Shuffle and select
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Transform to Question format
    const formattedQuestions: Question[] = selected.map((q, idx) => {
        // Use the actual dimension from the database and map it to subtag
        const subtag = DIMENSION_TO_SUBTAG[q.dimension] || 'logical_reasoning';
        
        return {
            id: q.id,
            text: q.question_text,
            options: {
                A: q.option_a,
                B: q.option_b,
                C: q.option_c,
                D: q.option_d
            },
            correctAnswer: q.correct_answer,
            explanation: q.explanation || `${q.explanation_step_1} ${q.explanation_step_2}`.trim(),
            difficulty: difficulty,
            subtag: subtag, // Now using actual dimension from database
            gradeLevel: gradeLevel,
            phase: phase as any,
            createdAt: new Date().toISOString()
        };
    });

    console.log(`✅ Formatted ${formattedQuestions.length} questions`);
    return formattedQuestions;
}

// ---- Handler Implementations ----

export async function generateDiagnosticScreenerQuestions(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = [],
    studentCourse?: string | null
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Diagnostic] Starting generation for ${gradeLevel}`);
    
    const count = 8;
    const difficulty = 3;
    const subtags = Array.from({ length: count }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);

    try {
        const questions = await generateQuestionsFromBank(
            env,
            gradeLevel,
            'diagnostic',
            subtags,
            difficulty,
            count,
            new Set(excludeQuestionIds)
        );

        const reordered = reorderToPreventConsecutiveSubtags(questions, 2);

        return {
            questions: reordered,
            fromCache: false,
            metadata: {
                phase: 'diagnostic_screener',
                difficulty,
                subtags,
                gradeLevel,
                totalQuestions: reordered.length,
                generatedAt: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error(`❌ [Diagnostic] Error:`, error);
        throw error;
    }
}

export async function generateAdaptiveCoreQuestions(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    difficulty: DifficultyLevel,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = [],
    studentCourse?: string | null
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Adaptive-Core] Starting generation`);
    
    const count = 15;
    const subtags = Array.from({ length: count }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);

    try {
        const questions = await generateQuestionsFromBank(
            env,
            gradeLevel,
            'adaptive_core',
            subtags,
            difficulty,
            count,
            new Set(excludeQuestionIds)
        );

        const reordered = reorderToPreventConsecutiveSubtags(questions, 2);

        return {
            questions: reordered,
            fromCache: false,
            metadata: {
                phase: 'adaptive_core',
                difficulty,
                subtags,
                gradeLevel,
                totalQuestions: reordered.length,
                generatedAt: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error(`❌ [Adaptive-Core] Error:`, error);
        throw error;
    }
}

export async function generateStabilityConfirmationQuestions(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    difficulty: DifficultyLevel,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = [],
    studentCourse?: string | null
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Stability] Starting generation`);
    
    const count = 5;
    const subtags = Array.from({ length: count }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);

    try {
        const questions = await generateQuestionsFromBank(
            env,
            gradeLevel,
            'stability_confirmation',
            subtags,
            difficulty,
            count,
            new Set(excludeQuestionIds)
        );

        const reordered = reorderToPreventConsecutiveSubtags(questions, 2);

        return {
            questions: reordered,
            fromCache: false,
            metadata: {
                phase: 'stability_confirmation',
                difficulty,
                subtags,
                gradeLevel,
                totalQuestions: reordered.length,
                generatedAt: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error(`❌ [Stability] Error:`, error);
        throw error;
    }
}

export async function generateSingleQuestion(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    phase: string,
    difficulty: DifficultyLevel,
    subtag: Subtag,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = [],
    studentCourse?: string | null
): Promise<Question> {
    console.log(`🎯 [Single-Question] Generating for ${subtag} in phase ${phase}`);

    try {
        const questions = await generateQuestionsFromBank(
            env,
            gradeLevel,
            phase,
            [subtag],
            difficulty,
            1,
            new Set(excludeQuestionIds)
        );

        if (questions.length === 0) {
            throw new Error('No question available');
        }

        return questions[0];
    } catch (error) {
        console.error(`❌ [Single-Question] Error:`, error);
        throw error;
    }
}

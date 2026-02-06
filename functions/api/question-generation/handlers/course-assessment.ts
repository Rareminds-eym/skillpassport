
import { createSupabaseClient } from '../../../../src/functions-lib/supabase';
import { PagesEnv } from '../../../../src/functions-lib/types';
import { SYSTEM_PROMPT } from '../prompts';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    generateUUID,
    getAPIKeys
} from '../../shared/ai-config';

// All utility functions are now imported from centralized ai-config.ts

/**
 * Course assessment generation handler with database caching
 * 
 * Features:
 * - Checks cache before generating (returns cached if exists)
 * - Validates and fixes questions (adds missing fields, shuffles options)
 * - Saves generated questions to database for future use
 */
export async function generateAssessment(
    env: PagesEnv,
    courseName: string,
    level: string,
    questionCount: number = 10
) {
    const supabase = createSupabaseClient(env);

    // Check cache first
    try {
        const { data: existing, error: cacheError } = await supabase
            .from('generated_external_assessment')
            .select('*')
            .eq('certificate_name', courseName)
            .eq('assessment_level', level)
            .single();

        if (!cacheError && existing) {
            console.log(`✅ Returning cached questions for: ${courseName} (${level})`);
            return {
                course: courseName,
                level: existing.assessment_level,
                total_questions: existing.total_questions,
                questions: existing.questions,
                cached: true
            };
        }
    } catch (dbError: any) {
        console.warn('⚠️ Database cache check failed, will generate new questions:', dbError.message);
    }

    console.log(`📝 Generating new questions for: ${courseName} (${level})`);

    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (!openRouterKey) {
        throw new Error('OpenRouter API key not configured');
    }

    const prompt = SYSTEM_PROMPT
        .replace(/\{\{COURSE_NAME\}\}/g, courseName)
        .replace(/\{\{LEVEL\}\}/g, level)
        .replace(/\{\{QUESTION_COUNT\}\}/g, questionCount.toString());

    const systemPrompt = `You are an expert assessment creator for ${courseName}. Generate EXACTLY ${questionCount} questions. Generate ONLY valid JSON.`;

    // Use OpenRouter with automatic retry and fallback
    console.log(`🔑 Using OpenRouter with retry for ${questionCount} questions`);

    const jsonText = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
    ]);

    const data = repairAndParseJSON(jsonText);
    let questions = data.questions || data;

    if (!Array.isArray(questions)) {
        throw new Error('Expected array of questions from AI response');
    }

    console.log(`✅ Generated ${questions.length} questions for ${courseName}`);

    // STRICT validation: Filter out invalid questions
    const validQuestions: any[] = [];
    let filteredCount = 0;
    
    for (let idx = 0; idx < questions.length; idx++) {
        const q = questions[idx];
        const questionText = q.question?.toLowerCase().trim() || q.text?.toLowerCase().trim() || '';
        
        // Check for image references
        const imageKeywords = ['graph', 'chart', 'table', 'diagram', 'image', 'picture', 'figure', 'shown below', 'shown above', 'visual', 'illustration'];
        if (imageKeywords.some(keyword => questionText.includes(keyword))) {
            console.warn(`⚠️ Question ${idx + 1} has image reference, filtering out`);
            filteredCount++;
            continue;
        }
        
        // Validate options if MCQ
        if (q.type === 'mcq' && q.options) {
            const optionValues = Array.isArray(q.options) 
                ? q.options.map((v: any) => String(v).toLowerCase().trim())
                : Object.values(q.options).map((v: any) => String(v).toLowerCase().trim());
            
            const uniqueOptions = new Set(optionValues);
            
            if (uniqueOptions.size < optionValues.length) {
                console.warn(`⚠️ Question ${idx + 1} has duplicate options, filtering out`);
                filteredCount++;
                continue;
            }
            
            if (optionValues.some(v => !v || v.length === 0)) {
                console.warn(`⚠️ Question ${idx + 1} has empty options, filtering out`);
                filteredCount++;
                continue;
            }
        }
        
        validQuestions.push(q);
    }
    
    console.log(`🔍 After validation: ${validQuestions.length}/${questions.length} valid questions (filtered: ${filteredCount})`);
    questions = validQuestions;

    // Validate and fix questions
    questions = questions.map((q: any, idx: number) => {
        // Add missing correct_answer (use first option as fallback)
        if (!q.correct_answer && q.options?.length > 0) {
            q.correct_answer = q.options[0];
            console.warn(`⚠️ Question ${idx + 1} missing correct_answer, using first option`);
        }

        // Add missing estimated_time based on difficulty
        if (!q.estimated_time) {
            q.estimated_time = q.difficulty === 'easy' ? 50 : q.difficulty === 'medium' ? 80 : 110;
        }

        // Shuffle MCQ options while preserving correct answer
        if (q.type === 'mcq' && q.options?.length > 0) {
            const correctAnswer = q.correct_answer;
            q.options = [...q.options].sort(() => Math.random() - 0.5);
            q.correct_answer = correctAnswer;
        }

        return {
            id: generateUUID(),
            ...q,
            course_name: courseName,
            level,
            created_at: new Date().toISOString()
        };
    });

    // Cache to database
    try {
        const { error: insertError } = await supabase
            .from('generated_external_assessment')
            .insert({
                certificate_name: courseName,
                assessment_level: level,
                total_questions: questionCount,
                questions: questions,
                generated_by: 'openrouter-ai'
            });

        if (insertError) {
            console.warn('⚠️ Could not cache assessment to database:', insertError.message);
        } else {
            console.log('✅ Assessment cached to database');
        }
    } catch (cacheError: any) {
        console.warn('⚠️ Database insert exception:', cacheError.message);
    }

    return {
        course: courseName,
        level: level,
        total_questions: questionCount,
        questions: questions,
        cached: false
    };
}

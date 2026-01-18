/**
 * Career Assessment - Aptitude Question Handler
 * Generates 50 aptitude questions for career assessment
 */

import type { Env, CareerQuestion } from '../../types';
import { jsonResponse, errorResponse } from '../../utils/response';
import { repairAndParseJSON } from '../../utils/jsonParser';
import { generateUUID } from '../../utils/uuid';
import { delay } from '../../utils/delay';
import { getReadClient } from '../../services/supabaseService';
import { callOpenRouterWithRetry } from '../../services/openRouterService';
import { callClaudeAPI } from '../../services/claudeService';
import { getCareerCachedQuestions, saveCareerQuestions } from '../../services/cacheService';
import { getCategories, getModuleTitles } from '../../config/aptitudeCategories';
import { getStreamContext } from '../../config/streamContexts';
import { buildAptitudePrompt } from '../../prompts/career/aptitude';
import { buildSchoolSubjectPrompt } from '../../prompts/career/schoolSubject';

interface AptitudeRequestBody {
  streamId: string;
  questionsPerCategory?: number;
  studentId?: string;
  attemptId?: string;
  gradeLevel?: string;
}

export async function handleAptitudeGeneration(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as AptitudeRequestBody;
    const { streamId, studentId, attemptId, gradeLevel } = body;

    if (!streamId) {
      return errorResponse('Stream ID is required', 400);
    }

    console.log('📚 Aptitude request:', { streamId, gradeLevel, studentId });

    // Check cache first
    if (studentId) {
      const cached = await getCareerCachedQuestions(env, studentId, streamId, 'aptitude');
      if (cached) {
        return jsonResponse({ questions: cached, cached: true });
      }
    }

    // Determine if after10 (school subjects) or after12/college (aptitude)
    const isAfter10 = gradeLevel === 'after10';
    console.log(`📝 Generating fresh aptitude questions in 2 batches for stream: ${streamId}, isAfter10: ${isAfter10}`);

    const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
    const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
    
    if (!openRouterKey && !claudeKey) {
      return errorResponse('No API key configured (OpenRouter or Claude)', 500);
    }

    const streamContext = getStreamContext(streamId);
    const categories = getCategories(isAfter10);
    const moduleTitles = getModuleTitles(isAfter10);

    // Generate questions in batches
    const batch1Categories = isAfter10 
      ? categories.filter(c => ['mathematics', 'science', 'english'].includes(c.id))
      : categories.filter(c => ['verbal', 'numerical', 'abstract'].includes(c.id));
    
    const batch2Categories = isAfter10
      ? categories.filter(c => ['social_studies', 'computer'].includes(c.id))
      : categories.filter(c => ['spatial', 'clerical'].includes(c.id));

    console.log('📦 Generating batch 1...');
    const batch1 = await generateBatch(1, batch1Categories, isAfter10, streamContext, claudeKey, openRouterKey);
    console.log(`✅ Batch 1 complete: ${batch1.length} questions`);

    console.log('⏳ Waiting 3s before batch 2...');
    await delay(3000);

    console.log('📦 Generating batch 2...');
    const batch2 = await generateBatch(2, batch2Categories, isAfter10, streamContext, claudeKey, openRouterKey);
    console.log(`✅ Batch 2 complete: ${batch2.length} questions`);

    // Combine and format questions
    const allQuestions = [...batch1, ...batch2].map((q: any, idx: number) => ({
      ...q,
      id: generateUUID(),
      originalIndex: idx + 1,
      subtype: q.category,
      subject: q.subject || q.category,
      moduleTitle: moduleTitles[q.category] || q.category
    }));

    console.log(`✅ Total aptitude questions generated: ${allQuestions.length}`);

    // Save to cache
    if (studentId) {
      await saveCareerQuestions(env, studentId, streamId, 'aptitude', allQuestions, attemptId, gradeLevel);
    }

    return jsonResponse({ questions: allQuestions, generated: true });
  } catch (error: any) {
    console.error('❌ Aptitude generation error:', error);
    return errorResponse(error.message || 'Failed to generate aptitude questions', 500);
  }
}

async function generateBatch(
  batchNum: number,
  batchCategories: any[],
  isAfter10: boolean,
  streamContext: any,
  claudeKey?: string,
  openRouterKey?: string
): Promise<any[]> {
  const categoriesText = batchCategories.map(c => `- ${c.name} (${c.count} questions): ${c.description}`).join('\n');
  const totalQuestions = batchCategories.reduce((sum, c) => sum + c.count, 0);
  
  const prompt = isAfter10
    ? buildSchoolSubjectPrompt(categoriesText, streamContext.name)
    : buildAptitudePrompt(categoriesText, streamContext);

  const systemPrompt = isAfter10 
    ? `You are an expert educational assessment creator for 10th grade students. Generate EXACTLY ${totalQuestions} questions total covering school subjects. Generate ONLY valid JSON.`
    : `You are an expert psychometric assessment creator. Generate EXACTLY ${totalQuestions} questions total. Generate ONLY valid JSON.`;

  let jsonText: string;

  if (claudeKey) {
    console.log(`🔑 Batch ${batchNum}: Using Claude API for ${totalQuestions} questions`);
    try {
      jsonText = await callClaudeAPI(claudeKey, {
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 6000,
        temperature: 0.7 + (batchNum * 0.05)
      });
    } catch (claudeError: any) {
      console.error('Claude error:', claudeError.message);
      if (openRouterKey) {
        console.log(`🔑 Batch ${batchNum}: Claude failed, trying OpenRouter`);
        jsonText = await callOpenRouterWithRetry(openRouterKey, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]);
      } else {
        throw claudeError;
      }
    }
  } else if (openRouterKey) {
    console.log(`🔑 Batch ${batchNum}: Using OpenRouter for ${totalQuestions} questions`);
    jsonText = await callOpenRouterWithRetry(openRouterKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);
  } else {
    throw new Error('No API key configured');
  }

  const result = repairAndParseJSON(jsonText);
  return result.questions || [];
}

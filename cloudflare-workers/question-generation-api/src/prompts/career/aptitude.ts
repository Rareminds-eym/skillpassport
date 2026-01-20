/**
 * Aptitude Question Prompts for Career Assessment
 */

import type { StreamContext } from '../../types';

export const APTITUDE_PROMPT = `You are an expert psychometric assessment creator. Generate aptitude test questions for {{STREAM_NAME}} stream career assessment.

Generate questions for these categories with EXACT counts:
{{CATEGORIES}}

CRITICAL REQUIREMENT - 100% STREAM-RELATED QUESTIONS:
This is for {{STREAM_NAME}} students. ALL questions MUST use {{STREAM_NAME}}-specific context, terminology, scenarios, and examples.

{{STREAM_CONTEXT}}

Question Requirements:
1. All questions must be MCQ with exactly 4 options (except Clerical which has 2 options: "Same" or "Different")
2. Each question must have exactly ONE correct answer
3. Mix difficulty levels: 40% easy, 40% medium, 20% hard
4. 100% of questions MUST be directly related to {{STREAM_NAME}} field - use domain-specific terminology, scenarios, and real-world examples from this field
5. NO generic questions - every question must have {{STREAM_NAME}} context
6. For Clerical Speed & Accuracy: Generate string comparison questions using {{STREAM_NAME}}-specific codes/IDs like "{{CLERICAL_EXAMPLE}}"

Output Format - Respond with ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "category": "verbal",
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["First option text", "Second option text", "Third option text", "Fourth option text"],
      "correct_answer": "Second option text",
      "skill_tag": "vocabulary",
      "estimated_time": 45
    }
  ]
}

CRITICAL: The "correct_answer" field MUST contain the EXACT TEXT of the correct option from the "options" array.
DO NOT use "Option A", "Option B", etc. - use the actual answer text.
Example: If the correct answer is the second option, and options[1] is "Photosynthesis", then correct_answer should be "Photosynthesis", NOT "Option B".

IMPORTANT: Use sequential numeric IDs (1, 2, 3, etc.) for each question.`;

export function buildAptitudePrompt(
  categoriesText: string,
  streamContext: StreamContext
): string {
  return APTITUDE_PROMPT
    .replace(/\{\{CATEGORIES\}\}/g, categoriesText)
    .replace(/\{\{STREAM_NAME\}\}/g, streamContext.name)
    .replace(/\{\{STREAM_CONTEXT\}\}/g, streamContext.context)
    .replace(/\{\{CLERICAL_EXAMPLE\}\}/g, streamContext.clericalExample);
}

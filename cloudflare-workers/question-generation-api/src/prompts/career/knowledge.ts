/**
 * Knowledge Question Prompts for Career Assessment
 */

export const KNOWLEDGE_PROMPT = `You are an expert assessment creator for {{STREAM_NAME}} education.

Generate {{QUESTION_COUNT}} knowledge assessment questions covering these topics:
{{TOPICS}}

Question Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. Difficulty distribution: 30% easy, 50% medium, 20% hard
4. Test practical understanding, not memorization
5. Questions should be relevant for students entering this field

Output Format - Respond with ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["First option text", "Second option text", "Third option text", "Fourth option text"],
      "correct_answer": "Second option text",
      "skill_tag": "topic name",
      "estimated_time": 60
    }
  ]
}

CRITICAL: The "correct_answer" field MUST contain the EXACT TEXT of the correct option from the "options" array.
DO NOT use "Option A", "Option B", etc. - use the actual answer text.
Example: If the correct answer is the second option, and options[1] is "Photosynthesis", then correct_answer should be "Photosynthesis", NOT "Option B".

IMPORTANT: Use sequential numeric IDs (1, 2, 3, etc.) for each question.`;

export function buildKnowledgePrompt(
  streamName: string,
  topics: string[],
  questionCount: number
): string {
  const topicsText = topics.map(t => `- ${t}`).join('\n');
  return KNOWLEDGE_PROMPT
    .replace(/\{\{STREAM_NAME\}\}/g, streamName)
    .replace(/\{\{QUESTION_COUNT\}\}/g, String(questionCount))
    .replace(/\{\{TOPICS\}\}/g, topicsText);
}

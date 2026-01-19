/**
 * Course Assessment Prompts
 */

export const COURSE_ASSESSMENT_PROMPT = `You are an expert assessment creator. Generate a skill assessment SPECIFICALLY for the course: {{COURSE_NAME}}

CRITICAL REQUIREMENTS:
1. ALL questions MUST be directly related to {{COURSE_NAME}}
2. Questions should test practical knowledge of {{COURSE_NAME}}
3. Generate EXACTLY {{QUESTION_COUNT}} questions with this distribution:
   - First 5 questions: EASY difficulty
   - Next 5 questions: MEDIUM difficulty  
   - Last 5 questions: HARD difficulty

Difficulty Guidelines:
- EASY (Q1-5): Fundamental concepts (45-60 seconds per question)
- MEDIUM (Q6-10): Complex application, debugging (75-90 seconds per question)
- HARD (Q11-15): Advanced optimization, edge cases (100-120 seconds per question)

Question Rules:
1. All questions must be MCQ with exactly 4 options
2. Each MCQ must have exactly ONE correct answer
3. Options should be plausible but clearly distinguishable
4. Test understanding, not memorization

Output Format:
- Respond with ONLY valid JSON
- NO markdown formatting
- NO explanatory text

Required JSON structure:
{
  "course": "{{COURSE_NAME}}",
  "level": "{{LEVEL}}",
  "total_questions": {{QUESTION_COUNT}},
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "skill_tag": "Skill being tested",
      "estimated_time": 45
    }
  ]
}`;

export function buildCourseAssessmentPrompt(
  courseName: string,
  level: string,
  questionCount: number
): string {
  return COURSE_ASSESSMENT_PROMPT
    .replace(/\{\{COURSE_NAME\}\}/g, courseName)
    .replace(/\{\{LEVEL\}\}/g, level)
    .replace(/\{\{QUESTION_COUNT\}\}/g, String(questionCount));
}

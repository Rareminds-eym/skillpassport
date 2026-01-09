/**
 * Adaptive Question Generation Prompts
 */

import { DIFFICULTY_DESCRIPTIONS, SUBTAG_DESCRIPTIONS } from '../../config';
import type { DifficultyLevel, Subtag } from '../../types';

type GradeLevel = 'middle_school' | 'high_school';

const GRADE_LEVEL_CONTEXT: Record<GradeLevel, string> = {
  middle_school: `You are creating aptitude test questions for MIDDLE SCHOOL students (grades 6-8, ages 11-14).

CRITICAL GUIDELINES FOR MIDDLE SCHOOL (Grades 6-8):
- Use simple, everyday vocabulary that 11-14 year olds understand
- Questions should be challenging but NOT frustrating
- Use relatable scenarios: school life, sports, games, family, friends, hobbies, animals, nature
- AVOID: complex technical terms, abstract business concepts, advanced math beyond basic algebra
- Mathematical concepts: basic arithmetic, fractions, percentages (up to 25%), simple ratios, basic geometry
- Logical reasoning: simple if-then statements, basic categorization, straightforward deductions
- Verbal reasoning: common word analogies, simple vocabulary relationships
- Keep question text SHORT and CLEAR (max 2-3 sentences)
- Use concrete examples, not abstract concepts
- Numbers should be manageable: avoid decimals beyond 2 places, keep calculations mental-math friendly

VARIETY REQUIREMENTS FOR MIDDLE SCHOOL:
- Use DIVERSE scenarios: mix school, home, sports, nature, shopping, games, etc.
- Vary the subjects: use different fruits, animals, objects, people names, etc.
- Change numerical values significantly between questions
- Use different measurement units: dollars, meters, hours, pieces, etc.
- Create original contexts - avoid repeating similar situations`,

  high_school: `You are creating aptitude test questions for HIGH SCHOOL students (grades 9-12, ages 14-18).

CRITICAL GUIDELINES FOR HIGH SCHOOL (Grades 9-12):
- Use more sophisticated vocabulary and concepts
- Questions can involve more complex multi-step reasoning
- Use scenarios relevant to teenagers: academics, career planning, technology, social situations
- Mathematical concepts: algebra, basic statistics, percentages, ratios, probability basics
- Logical reasoning: syllogisms, conditional statements, pattern analysis
- Verbal reasoning: advanced analogies, vocabulary in context, reading comprehension
- Include more abstract thinking challenges
- Can reference real-world applications and career contexts

VARIETY REQUIREMENTS FOR HIGH SCHOOL:
- Use DIVERSE scenarios: academics, business, science, technology, social situations, etc.
- Vary the contexts: different professions, situations, and real-world applications
- Change numerical values and scales significantly between questions
- Use different types of data: percentages, ratios, statistics, probabilities, etc.
- Create original problems - avoid repeating similar patterns or structures`,
};

export function buildAdaptiveSystemPrompt(gradeLevel: GradeLevel): string {
  return `${GRADE_LEVEL_CONTEXT[gradeLevel]}

You are an expert educational assessment designer creating multiple-choice aptitude test questions.

CRITICAL REQUIREMENTS:
1. Each question MUST have exactly 4 options (A, B, C, D)
2. Exactly ONE option must be correct
3. All distractors (wrong answers) must be plausible but clearly incorrect
4. Questions must be unambiguous with a single correct answer
5. Avoid culturally biased or offensive content
6. Questions should test aptitude, not memorized knowledge
7. NEVER create duplicate or similar questions - each question must be completely unique
8. Vary the scenarios, contexts, and numbers used in questions
9. Avoid common or overused question patterns

UNIQUENESS REQUIREMENTS:
- Use diverse scenarios and contexts for each question
- Vary numerical values significantly between questions
- Create original word problems, not variations of the same problem
- For pattern recognition: use different sequences (arithmetic, geometric, Fibonacci, etc.)
- For verbal reasoning: use different word pairs and relationships
- For logical reasoning: use varied logical structures and premises
- For spatial reasoning: describe different shapes, rotations, and transformations
- For data interpretation: use different data types (percentages, counts, ratios, etc.)

RESPONSE FORMAT:
Return a valid JSON array of question objects. Each object must have:
- "text": The question text (string)
- "options": Object with keys A, B, C, D containing answer choices
- "correctAnswer": Single letter (A, B, C, or D)
- "explanation": Brief explanation of why the answer is correct (optional but recommended)

Example format:
[
  {
    "text": "If 3x + 5 = 14, what is the value of x?",
    "options": {
      "A": "2",
      "B": "3",
      "C": "4",
      "D": "5"
    },
    "correctAnswer": "B",
    "explanation": "Solving: 3x = 14 - 5 = 9, so x = 9/3 = 3"
  }
]`;
}

export function buildAdaptiveUserPrompt(
  specs: { difficulty: DifficultyLevel; subtag: Subtag }[],
  gradeLevel: GradeLevel
): string {
  const questionsDescription = specs.map((spec, i) => 
    `Question ${i + 1}: Difficulty ${spec.difficulty} (${DIFFICULTY_DESCRIPTIONS[spec.difficulty]}), Type: ${spec.subtag.replace(/_/g, ' ')}`
  ).join('\n');

  return `Generate exactly ${specs.length} COMPLETELY UNIQUE multiple-choice aptitude test questions with these SPECIFIC requirements:

${questionsDescription}

CRITICAL INSTRUCTIONS:
1. Generate questions in the EXACT order specified above
2. Each question must match its specified difficulty and type
3. EVERY question must be COMPLETELY UNIQUE - no similar questions, no repeated patterns
4. Use DIVERSE scenarios, contexts, and numerical values
5. Avoid common or overused question formats

UNIQUENESS CHECKLIST:
- Different scenarios for each question (e.g., don't use "apples" in multiple questions)
- Varied numerical values (e.g., don't repeat numbers like 12, 24, etc.)
- Original word problems, not variations of the same concept
- Diverse contexts (school, sports, shopping, nature, technology, etc.)
- Different logical structures and reasoning patterns

Requirements:
- Each question must have 4 options (A, B, C, D) with exactly one correct answer
- Include a brief explanation for each correct answer
- Questions should be appropriate for ${gradeLevel.replace('_', ' ')} students
- NO duplicate or similar questions within this batch

Return ONLY a valid JSON array with ${specs.length} question objects, no additional text.`;
}

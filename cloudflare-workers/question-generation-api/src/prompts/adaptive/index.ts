/**
 * Adaptive Question Generation Prompts
 */

import { DIFFICULTY_DESCRIPTIONS, SUBTAG_DESCRIPTIONS } from '../../config';
import type { DifficultyLevel, Subtag } from '../../types';

type GradeLevel = 'middle_school' | 'high_school';
type TestPhase = 'diagnostic_screener' | 'adaptive_core' | 'stability_confirmation';

// Phase-specific context for question generation
const PHASE_CONTEXT: Record<TestPhase, string> = {
  diagnostic_screener: `PHASE: DIAGNOSTIC SCREENER (Baseline Assessment)
- This is the FIRST phase of the test - questions establish the student's baseline ability
- All questions should be at MEDIUM difficulty (Level 3) to calibrate the student
- Questions should be clear and straightforward to reduce test anxiety
- Focus on fundamental aptitude skills without tricks or unusual formats
- Goal: Accurately assess starting ability level`,

  adaptive_core: `PHASE: ADAPTIVE CORE (Main Assessment)
- This is the MAIN phase where difficulty ADAPTS based on student performance
- Questions MUST precisely match the specified difficulty level
- Higher difficulty = more complex reasoning, more steps, trickier distractors
- Lower difficulty = simpler concepts, fewer steps, more obvious wrong answers
- Goal: Find the student's true aptitude level through adaptive questioning`,

  stability_confirmation: `PHASE: STABILITY CONFIRMATION (Final Verification)
- This is the FINAL phase to confirm the student's assessed ability level
- Questions should be consistent with the student's demonstrated ability
- Focus on confirming accuracy, not surprising the student
- Goal: Verify the aptitude assessment is accurate and stable`,
};

// Detailed difficulty level specifications
const DIFFICULTY_SPECS: Record<DifficultyLevel, string> = {
  1: `DIFFICULTY LEVEL 1 (Very Easy):
- Single-step problems only
- Basic arithmetic (addition, subtraction, simple multiplication)
- Very obvious correct answer
- Distractors are clearly wrong (e.g., wrong operation, off by large amount)
- Simple vocabulary, short sentences
- Example: "If you have 5 apples and get 3 more, how many do you have?"`,

  2: `DIFFICULTY LEVEL 2 (Easy):
- 1-2 step problems
- Basic operations with slightly larger numbers
- Clear logical path to answer
- Distractors are plausible but distinguishable
- Straightforward word problems
- Example: "A book costs ₹120. If you have ₹500, how much change will you get?"`,

  3: `DIFFICULTY LEVEL 3 (Medium):
- 2-3 step problems
- Requires careful reading and thinking
- May involve percentages, ratios, or basic algebra
- Distractors are plausible and require checking
- Moderate complexity word problems
- Example: "If 30% of students in a class of 40 are girls, how many boys are there?"`,

  4: `DIFFICULTY LEVEL 4 (Hard):
- 3-4 step problems
- Complex reasoning with multiple variables
- May require working backwards or testing options
- Distractors are very plausible (common mistakes)
- Requires careful analysis
- Example: "A train travels 60 km at 40 km/h, then 80 km at 60 km/h. What is the average speed?"`,

  5: `DIFFICULTY LEVEL 5 (Very Hard):
- 4+ step problems
- Advanced reasoning, multiple concepts combined
- May have counter-intuitive answers
- Distractors represent sophisticated errors
- Requires deep analysis and verification
- Example: "In a sequence where each term is the sum of the previous two terms minus 1..."`,
};

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
- Numbers should be manageable: avoid decimals beyond 2 places, keep calculations mental-math friendly`,

  high_school: `You are creating aptitude test questions for HIGH SCHOOL students (grades 9-12, ages 14-18).

CRITICAL GUIDELINES FOR HIGH SCHOOL (Grades 9-12):
- Use more sophisticated vocabulary and concepts
- Questions can involve more complex multi-step reasoning
- Use scenarios relevant to teenagers: academics, career planning, technology, social situations
- Mathematical concepts: algebra, basic statistics, percentages, ratios, probability basics
- Logical reasoning: syllogisms, conditional statements, pattern analysis
- Verbal reasoning: advanced analogies, vocabulary in context, reading comprehension
- Include more abstract thinking challenges
- Can reference real-world applications and career contexts`,
};

// Lists of unique elements to encourage variety
const UNIQUENESS_POOLS = {
  names: ['Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Kavya', 'Aditya', 'Sneha', 'Rahul', 'Divya', 'Karan', 'Neha', 'Amit', 'Pooja', 'Sanjay', 'Riya', 'Varun', 'Ishita'],
  objects: ['books', 'pencils', 'marbles', 'coins', 'stamps', 'stickers', 'cards', 'toys', 'flowers', 'candies', 'badges', 'ribbons', 'shells', 'beads', 'buttons'],
  fruits: ['apples', 'oranges', 'bananas', 'mangoes', 'grapes', 'watermelons', 'papayas', 'guavas', 'pomegranates', 'pineapples', 'cherries', 'strawberries'],
  animals: ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'elephants', 'lions', 'tigers', 'monkeys', 'horses', 'cows', 'goats', 'deer', 'peacocks'],
  places: ['school', 'park', 'library', 'market', 'garden', 'playground', 'museum', 'zoo', 'beach', 'mountain', 'farm', 'village', 'city'],
  activities: ['reading', 'painting', 'cycling', 'swimming', 'running', 'dancing', 'singing', 'cooking', 'gardening', 'playing cricket', 'playing chess'],
};

export function buildAdaptiveSystemPrompt(gradeLevel: GradeLevel, phase?: TestPhase): string {
  const phaseContext = phase ? `\n\n${PHASE_CONTEXT[phase]}` : '';
  
  return `${GRADE_LEVEL_CONTEXT[gradeLevel]}${phaseContext}

You are an expert educational assessment designer creating multiple-choice aptitude test questions.

ABSOLUTE UNIQUENESS REQUIREMENTS (CRITICAL):
1. NEVER repeat names - use different Indian names for each question
2. NEVER repeat objects/items - if one question uses "books", others must use different items
3. NEVER repeat scenarios - each question must have a completely different context
4. NEVER repeat number patterns - vary all numerical values significantly
5. NEVER use the same fruits, animals, or places across questions
6. Each question must feel like it was written by a different person

SUGGESTED UNIQUE ELEMENTS TO USE:
- Names: ${UNIQUENESS_POOLS.names.slice(0, 10).join(', ')}...
- Objects: ${UNIQUENESS_POOLS.objects.slice(0, 8).join(', ')}...
- Fruits: ${UNIQUENESS_POOLS.fruits.slice(0, 6).join(', ')}...
- Animals: ${UNIQUENESS_POOLS.animals.slice(0, 6).join(', ')}...
- Places: ${UNIQUENESS_POOLS.places.slice(0, 6).join(', ')}...

CRITICAL REQUIREMENTS:
1. Each question MUST have exactly 4 options (A, B, C, D)
2. Exactly ONE option must be correct
3. All distractors (wrong answers) must be plausible but clearly incorrect
4. Questions must be unambiguous with a single correct answer
5. Avoid culturally biased or offensive content
6. Questions should test aptitude, not memorized knowledge
7. Match the EXACT difficulty level specified - this is crucial for adaptive testing

RESPONSE FORMAT:
Return a valid JSON array of question objects. Each object must have:
- "text": The question text (string)
- "options": Object with keys A, B, C, D containing answer choices
- "correctAnswer": Single letter (A, B, C, or D)
- "explanation": Brief explanation of why the answer is correct

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
  gradeLevel: GradeLevel,
  phase?: TestPhase
): string {
  const questionsDescription = specs.map((spec, i) => {
    const difficultySpec = DIFFICULTY_SPECS[spec.difficulty];
    return `
Question ${i + 1}:
- Difficulty: Level ${spec.difficulty} (${DIFFICULTY_DESCRIPTIONS[spec.difficulty]})
- Type: ${spec.subtag.replace(/_/g, ' ')} - ${SUBTAG_DESCRIPTIONS[spec.subtag]}
${difficultySpec}`;
  }).join('\n');

  const phaseInstruction = phase ? `
TEST PHASE: ${phase.replace(/_/g, ' ').toUpperCase()}
${PHASE_CONTEXT[phase]}
` : '';

  return `Generate exactly ${specs.length} COMPLETELY UNIQUE multiple-choice aptitude test questions.
${phaseInstruction}
QUESTION SPECIFICATIONS:
${questionsDescription}

MANDATORY UNIQUENESS RULES:
1. Use a DIFFERENT person's name in each question (e.g., Aarav, Priya, Rohan - never repeat)
2. Use DIFFERENT objects/items in each question (e.g., books in Q1, marbles in Q2, coins in Q3)
3. Use DIFFERENT scenarios/contexts (e.g., school in Q1, market in Q2, park in Q3)
4. Use DIFFERENT number ranges (e.g., small numbers in Q1, larger in Q2, fractions in Q3)
5. NEVER create two questions that feel similar or follow the same pattern

DIFFICULTY MATCHING (CRITICAL):
- Each question MUST precisely match its specified difficulty level
- Level 1-2: Simple, 1-2 steps, obvious answer path
- Level 3: Moderate, 2-3 steps, requires thinking
- Level 4-5: Complex, 3+ steps, requires careful analysis

QUALITY CHECKLIST:
✓ All ${specs.length} questions use different names
✓ All ${specs.length} questions use different objects/items
✓ All ${specs.length} questions have different contexts
✓ Each question matches its exact difficulty level
✓ Each question matches its specified type (${specs.map(s => s.subtag.replace(/_/g, ' ')).join(', ')})
✓ Questions are appropriate for ${gradeLevel.replace('_', ' ')} students

Return ONLY a valid JSON array with ${specs.length} question objects, no additional text.`;
}

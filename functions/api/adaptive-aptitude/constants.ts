/**
 * Constants for Adaptive Aptitude API
 * Includes subtags, prompts, difficulty descriptions, and fallback questions
 */

import type { Subtag, GradeLevel, Question, DifficultyLevel } from './types';

export const ALL_SUBTAGS: Subtag[] = [
  'numerical_reasoning',
  'logical_reasoning',
  'verbal_reasoning',
  'spatial_reasoning',
  'data_interpretation',
  'pattern_recognition',
];

export const SUBTAG_DESCRIPTIONS: Record<Subtag, string> = {
  numerical_reasoning: 'Questions involving numbers, calculations, percentages, ratios, and mathematical patterns',
  logical_reasoning: 'Questions testing deductive reasoning, syllogisms, and logical conclusions',
  verbal_reasoning: 'Questions involving word relationships, analogies, and language comprehension',
  spatial_reasoning: 'Questions about shapes, patterns, rotations, and visual-spatial relationships',
  data_interpretation: 'Questions requiring analysis of charts, graphs, tables, and data sets',
  pattern_recognition: 'Questions identifying sequences, patterns, and relationships in data',
};

export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  1: 'Very Easy - Basic concepts, straightforward questions, minimal steps required',
  2: 'Easy - Simple concepts with slight complexity, 1-2 steps to solve',
  3: 'Medium - Moderate complexity, requires careful thinking, 2-3 steps',
  4: 'Hard - Complex reasoning required, multiple steps, some tricky elements',
  5: 'Very Hard - Advanced concepts, multi-step reasoning, requires deep analysis',
};

export const GRADE_LEVEL_CONTEXT: Record<GradeLevel, string> = {
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

  higher_secondary: `You are creating aptitude test questions for HIGHER SECONDARY / COLLEGE students (grades 11-12+, ages 16-22).

CRITICAL GUIDELINES FOR HIGHER SECONDARY / COLLEGE:
- Use advanced vocabulary and complex sentence structures
- Questions should be intellectually challenging and require critical thinking
- Use scenarios relevant to young adults: college life, career planning, professional scenarios, advanced academics, research
- Mathematical concepts: advanced algebra, statistics, data analysis, probability, logical deduction, quantitative reasoning
- Logical reasoning: complex syllogisms, multi-step deductions, pattern recognition, analytical thinking
- Verbal reasoning: sophisticated analogies, contextual vocabulary, inference, comprehension of complex texts
- Include abstract reasoning and higher-order thinking skills
- Can reference professional aptitude test formats (similar to GRE, GMAT, CAT style questions)
- Questions should prepare students for competitive exams and professional assessments

VARIETY REQUIREMENTS FOR HIGHER SECONDARY / COLLEGE:
- Use DIVERSE scenarios: business analytics, scientific research, professional situations, academic contexts, etc.
- Vary the contexts: different industries, professional roles, academic disciplines, real-world applications
- Change numerical values, scales, and complexity significantly between questions
- Use different types of data: complex statistics, multi-variable problems, data interpretation, logical puzzles
- Create original, sophisticated problems - avoid repeating patterns or structures`,
};

export function buildSystemPrompt(gradeLevel: GradeLevel): string {
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

// AI Models to try in order of preference
export const AI_MODELS = [
  'google/gemini-2.0-flash-exp:free', // Google's Gemini 2.0 - free, fast, 1M context
  'google/gemini-flash-1.5-8b', // Gemini 1.5 Flash 8B - fast and efficient
  'anthropic/claude-3.5-sonnet', // Claude 3.5 Sonnet - best quality (paid)
  'xiaomi/mimo-v2-flash:free', // Fallback: Xiaomi's free model
];

// Fallback questions for middle school
export const MIDDLE_SCHOOL_FALLBACKS: Record<
  Subtag,
  { text: string; options: Question['options']; correctAnswer: Question['correctAnswer'] }[]
> = {
  numerical_reasoning: [
    {
      text: 'If you have 24 cookies and want to share them equally among 6 friends, how many cookies does each friend get?',
      options: { A: '3', B: '4', C: '5', D: '6' },
      correctAnswer: 'B',
    },
    {
      text: 'A pizza has 8 slices. If you eat 2 slices, what fraction of the pizza is left?',
      options: { A: '1/4', B: '1/2', C: '3/4', D: '2/3' },
      correctAnswer: 'C',
    },
    {
      text: 'If a book costs $12 and you have $50, how many books can you buy?',
      options: { A: '3', B: '4', C: '5', D: '6' },
      correctAnswer: 'B',
    },
    {
      text: 'A movie ticket costs $8. How much do 5 tickets cost?',
      options: { A: '$35', B: '$40', C: '$45', D: '$50' },
      correctAnswer: 'B',
    },
    {
      text: 'If you save $5 each week, how much will you have after 8 weeks?',
      options: { A: '$30', B: '$35', C: '$40', D: '$45' },
      correctAnswer: 'C',
    },
    {
      text: 'A bag has 15 marbles. If 1/3 are blue, how many blue marbles are there?',
      options: { A: '3', B: '4', C: '5', D: '6' },
      correctAnswer: 'C',
    },
    {
      text: 'What is 25% of 80?',
      options: { A: '15', B: '20', C: '25', D: '30' },
      correctAnswer: 'B',
    },
    {
      text: 'If 4 pencils cost $2, how much do 10 pencils cost?',
      options: { A: '$4', B: '$5', C: '$6', D: '$8' },
      correctAnswer: 'B',
    },
  ],
  logical_reasoning: [
    {
      text: 'All dogs are animals. Max is a dog. What can we conclude?',
      options: { A: 'Max is a cat', B: 'Max is an animal', C: 'All animals are dogs', D: 'Max is not a pet' },
      correctAnswer: 'B',
    },
    {
      text: 'If it rains, the grass gets wet. The grass is wet. What can we say?',
      options: { A: 'It definitely rained', B: 'It might have rained', C: 'It did not rain', D: 'The sun is out' },
      correctAnswer: 'B',
    },
    {
      text: 'All birds have feathers. A robin is a bird. What can we conclude?',
      options: {
        A: 'A robin can fly',
        B: 'A robin has feathers',
        C: 'All feathered things are birds',
        D: 'Robins are red',
      },
      correctAnswer: 'B',
    },
    {
      text: 'If today is Monday, what day was it 3 days ago?',
      options: { A: 'Thursday', B: 'Friday', C: 'Saturday', D: 'Sunday' },
      correctAnswer: 'B',
    },
    {
      text: 'All squares are rectangles. This shape is a square. What do we know?',
      options: { A: 'It has 3 sides', B: 'It is a rectangle', C: 'It is a circle', D: 'It has 5 corners' },
      correctAnswer: 'B',
    },
    {
      text: 'If A is taller than B, and B is taller than C, who is the shortest?',
      options: { A: 'A', B: 'B', C: 'C', D: 'Cannot tell' },
      correctAnswer: 'C',
    },
  ],
  verbal_reasoning: [
    {
      text: 'HOT is to COLD as DAY is to:',
      options: { A: 'Sun', B: 'Night', C: 'Light', D: 'Morning' },
      correctAnswer: 'B',
    },
    {
      text: 'BOOK is to READ as SONG is to:',
      options: { A: 'Dance', B: 'Write', C: 'Listen', D: 'Play' },
      correctAnswer: 'C',
    },
    {
      text: 'Which word means the OPPOSITE of "happy"?',
      options: { A: 'Joyful', B: 'Excited', C: 'Sad', D: 'Cheerful' },
      correctAnswer: 'C',
    },
    {
      text: 'FISH is to SWIM as BIRD is to:',
      options: { A: 'Nest', B: 'Fly', C: 'Feather', D: 'Egg' },
      correctAnswer: 'B',
    },
    {
      text: 'Which word means the SAME as "big"?',
      options: { A: 'Tiny', B: 'Small', C: 'Large', D: 'Short' },
      correctAnswer: 'C',
    },
    {
      text: 'TEACHER is to SCHOOL as DOCTOR is to:',
      options: { A: 'Medicine', B: 'Hospital', C: 'Patient', D: 'Nurse' },
      correctAnswer: 'B',
    },
    {
      text: 'UP is to DOWN as LEFT is to:',
      options: { A: 'Side', B: 'Right', C: 'Center', D: 'Forward' },
      correctAnswer: 'B',
    },
    {
      text: 'PENCIL is to WRITE as SCISSORS is to:',
      options: { A: 'Paper', B: 'Sharp', C: 'Cut', D: 'Draw' },
      correctAnswer: 'C',
    },
  ],
  spatial_reasoning: [
    {
      text: 'How many sides does a triangle have?',
      options: { A: '2', B: '3', C: '4', D: '5' },
      correctAnswer: 'B',
    },
    {
      text: 'If you fold a square piece of paper in half, what shape do you get?',
      options: { A: 'Triangle', B: 'Circle', C: 'Rectangle', D: 'Pentagon' },
      correctAnswer: 'C',
    },
    {
      text: 'How many corners does a rectangle have?',
      options: { A: '2', B: '3', C: '4', D: '5' },
      correctAnswer: 'C',
    },
    {
      text: 'Which shape has no corners?',
      options: { A: 'Square', B: 'Triangle', C: 'Circle', D: 'Rectangle' },
      correctAnswer: 'C',
    },
    {
      text: 'How many sides does a hexagon have?',
      options: { A: '4', B: '5', C: '6', D: '7' },
      correctAnswer: 'C',
    },
    {
      text: 'If you cut a square diagonally, what shapes do you get?',
      options: { A: 'Two squares', B: 'Two triangles', C: 'Two rectangles', D: 'Two circles' },
      correctAnswer: 'B',
    },
  ],
  data_interpretation: [
    {
      text: 'In a class of 20 students, 8 like soccer and 12 like basketball. How many more students like basketball than soccer?',
      options: { A: '2', B: '4', C: '6', D: '8' },
      correctAnswer: 'B',
    },
    {
      text: 'If a graph shows Monday: 5 books, Tuesday: 3 books, Wednesday: 7 books read, which day had the most books read?',
      options: { A: 'Monday', B: 'Tuesday', C: 'Wednesday', D: 'All equal' },
      correctAnswer: 'C',
    },
    {
      text: 'A survey shows 10 students like apples, 15 like oranges, 5 like bananas. What is the total?',
      options: { A: '25', B: '30', C: '35', D: '40' },
      correctAnswer: 'B',
    },
    {
      text: 'If a chart shows Team A scored 20 points and Team B scored 15 points, what is the difference?',
      options: { A: '3', B: '4', C: '5', D: '6' },
      correctAnswer: 'C',
    },
    {
      text: 'A table shows: Jan-10, Feb-15, Mar-20 sales. What is the total for all three months?',
      options: { A: '35', B: '40', C: '45', D: '50' },
      correctAnswer: 'C',
    },
    {
      text: 'In a group of 30 students, half are girls. How many boys are there?',
      options: { A: '10', B: '15', C: '20', D: '25' },
      correctAnswer: 'B',
    },
  ],
  pattern_recognition: [
    {
      text: 'What comes next: 2, 4, 6, 8, ?',
      options: { A: '9', B: '10', C: '11', D: '12' },
      correctAnswer: 'B',
    },
    {
      text: 'What comes next: A, B, C, D, ?',
      options: { A: 'F', B: 'E', C: 'G', D: 'A' },
      correctAnswer: 'B',
    },
    {
      text: 'What comes next: 1, 3, 5, 7, ?',
      options: { A: '8', B: '9', C: '10', D: '11' },
      correctAnswer: 'B',
    },
    {
      text: 'What comes next: 5, 10, 15, 20, ?',
      options: { A: '22', B: '23', C: '24', D: '25' },
      correctAnswer: 'D',
    },
    {
      text: 'What comes next: 3, 6, 9, 12, ?',
      options: { A: '13', B: '14', C: '15', D: '16' },
      correctAnswer: 'C',
    },
    {
      text: 'What comes next: 1, 2, 4, 8, ?',
      options: { A: '10', B: '12', C: '14', D: '16' },
      correctAnswer: 'D',
    },
    {
      text: 'What comes next: 100, 90, 80, 70, ?',
      options: { A: '50', B: '55', C: '60', D: '65' },
      correctAnswer: 'C',
    },
    {
      text: 'What comes next: Z, Y, X, W, ?',
      options: { A: 'U', B: 'V', C: 'T', D: 'S' },
      correctAnswer: 'B',
    },
  ],
};

// Fallback questions for high school (also used for higher_secondary)
export const HIGH_SCHOOL_FALLBACKS: Record<
  Subtag,
  { text: string; options: Question['options']; correctAnswer: Question['correctAnswer'] }[]
> = {
  numerical_reasoning: [
    {
      text: 'If a shirt costs $25 and is on sale for 20% off, what is the sale price?',
      options: { A: '$20', B: '$22', C: '$18', D: '$15' },
      correctAnswer: 'A',
    },
    {
      text: 'What is 15% of 80?',
      options: { A: '10', B: '12', C: '15', D: '8' },
      correctAnswer: 'B',
    },
    {
      text: 'If 3x + 7 = 22, what is x?',
      options: { A: '3', B: '4', C: '5', D: '6' },
      correctAnswer: 'C',
    },
    {
      text: 'A car travels 240 miles in 4 hours. What is its average speed?',
      options: { A: '50 mph', B: '55 mph', C: '60 mph', D: '65 mph' },
      correctAnswer: 'C',
    },
    {
      text: 'If the ratio of boys to girls is 3:2 and there are 30 students, how many boys are there?',
      options: { A: '12', B: '15', C: '18', D: '20' },
      correctAnswer: 'C',
    },
    {
      text: 'What is 2/5 expressed as a percentage?',
      options: { A: '25%', B: '30%', C: '35%', D: '40%' },
      correctAnswer: 'D',
    },
    {
      text: 'If a product costs $80 after a 20% discount, what was the original price?',
      options: { A: '$90', B: '$96', C: '$100', D: '$110' },
      correctAnswer: 'C',
    },
    {
      text: 'What is the value of 5² + 3²?',
      options: { A: '30', B: '32', C: '34', D: '36' },
      correctAnswer: 'C',
    },
  ],
  logical_reasoning: [
    {
      text: 'All roses are flowers. Some flowers fade quickly. Which conclusion is valid?',
      options: {
        A: 'All roses fade quickly',
        B: 'Some roses may fade quickly',
        C: 'No roses fade quickly',
        D: 'Roses never fade',
      },
      correctAnswer: 'B',
    },
    {
      text: 'If P implies Q, and Q is false, what can we conclude about P?',
      options: { A: 'P is true', B: 'P is false', C: 'P could be either', D: 'Cannot determine' },
      correctAnswer: 'B',
    },
    {
      text: 'All mammals are warm-blooded. Whales are mammals. Therefore:',
      options: {
        A: 'Whales live in water',
        B: 'Whales are warm-blooded',
        C: 'All warm-blooded animals are mammals',
        D: 'Whales are fish',
      },
      correctAnswer: 'B',
    },
    {
      text: 'If it is raining, then the ground is wet. The ground is not wet. What can we conclude?',
      options: { A: 'It is raining', B: 'It is not raining', C: 'The ground is dry', D: 'Both B and C' },
      correctAnswer: 'D',
    },
    {
      text: 'No reptiles are mammals. All snakes are reptiles. Therefore:',
      options: {
        A: 'Some snakes are mammals',
        B: 'No snakes are mammals',
        C: 'All reptiles are snakes',
        D: 'Some mammals are snakes',
      },
      correctAnswer: 'B',
    },
    {
      text: 'If A > B and B > C, which statement must be true?',
      options: { A: 'A = C', B: 'A < C', C: 'A > C', D: 'B = C' },
      correctAnswer: 'C',
    },
  ],
  verbal_reasoning: [
    {
      text: 'HAPPY is to SAD as LIGHT is to:',
      options: { A: 'Lamp', B: 'Dark', C: 'Bright', D: 'Sun' },
      correctAnswer: 'B',
    },
    {
      text: 'Choose the word most similar to "ABUNDANT":',
      options: { A: 'Scarce', B: 'Plentiful', C: 'Empty', D: 'Small' },
      correctAnswer: 'B',
    },
    {
      text: 'ARCHITECT is to BUILDING as AUTHOR is to:',
      options: { A: 'Library', B: 'Book', C: 'Reader', D: 'Publisher' },
      correctAnswer: 'B',
    },
    {
      text: 'Choose the word most opposite to "EXPAND":',
      options: { A: 'Grow', B: 'Contract', C: 'Extend', D: 'Increase' },
      correctAnswer: 'B',
    },
    {
      text: 'SYMPHONY is to COMPOSER as PAINTING is to:',
      options: { A: 'Museum', B: 'Canvas', C: 'Artist', D: 'Gallery' },
      correctAnswer: 'C',
    },
    {
      text: 'Which word is most similar to "METICULOUS"?',
      options: { A: 'Careless', B: 'Careful', C: 'Quick', D: 'Lazy' },
      correctAnswer: 'B',
    },
    {
      text: 'HYPOTHESIS is to THEORY as SKETCH is to:',
      options: { A: 'Drawing', B: 'Painting', C: 'Pencil', D: 'Paper' },
      correctAnswer: 'B',
    },
    {
      text: 'Choose the word most opposite to "VERBOSE":',
      options: { A: 'Wordy', B: 'Concise', C: 'Lengthy', D: 'Detailed' },
      correctAnswer: 'B',
    },
  ],
  spatial_reasoning: [
    {
      text: 'If you rotate a square 90 degrees clockwise, which corner moves to the top?',
      options: { A: 'Top-left', B: 'Top-right', C: 'Bottom-left', D: 'Bottom-right' },
      correctAnswer: 'C',
    },
    {
      text: 'How many faces does a cube have?',
      options: { A: '4', B: '6', C: '8', D: '12' },
      correctAnswer: 'B',
    },
    {
      text: 'How many edges does a cube have?',
      options: { A: '6', B: '8', C: '10', D: '12' },
      correctAnswer: 'D',
    },
    {
      text: 'If you unfold a cube, how many squares do you see?',
      options: { A: '4', B: '5', C: '6', D: '8' },
      correctAnswer: 'C',
    },
    {
      text: 'A mirror image of the letter "b" looks like:',
      options: { A: 'b', B: 'd', C: 'p', D: 'q' },
      correctAnswer: 'B',
    },
    {
      text: 'How many vertices does a triangular pyramid have?',
      options: { A: '3', B: '4', C: '5', D: '6' },
      correctAnswer: 'B',
    },
  ],
  data_interpretation: [
    {
      text: 'A bar chart shows sales of 100, 150, 200, 250 for Jan-Apr. What is the average monthly sales?',
      options: { A: '150', B: '175', C: '200', D: '225' },
      correctAnswer: 'B',
    },
    {
      text: 'If a pie chart shows 25% for Category A, what angle does it represent?',
      options: { A: '45°', B: '90°', C: '180°', D: '270°' },
      correctAnswer: 'B',
    },
    {
      text: 'A line graph shows values 10, 20, 15, 25. What is the range?',
      options: { A: '10', B: '15', C: '20', D: '25' },
      correctAnswer: 'B',
    },
    {
      text: 'If 40% of 200 students passed, how many failed?',
      options: { A: '80', B: '100', C: '120', D: '140' },
      correctAnswer: 'C',
    },
    {
      text: 'A table shows Q1: $500, Q2: $600, Q3: $700, Q4: $800. What is the total annual revenue?',
      options: { A: '$2,400', B: '$2,500', C: '$2,600', D: '$2,700' },
      correctAnswer: 'C',
    },
    {
      text: 'In a dataset of 5, 10, 15, 20, 25, what is the median?',
      options: { A: '10', B: '15', C: '17.5', D: '20' },
      correctAnswer: 'B',
    },
  ],
  pattern_recognition: [
    {
      text: 'What comes next: 2, 4, 8, 16, ?',
      options: { A: '24', B: '32', C: '20', D: '18' },
      correctAnswer: 'B',
    },
    {
      text: 'Complete the pattern: A, C, E, G, ?',
      options: { A: 'H', B: 'I', C: 'J', D: 'K' },
      correctAnswer: 'B',
    },
    {
      text: 'What comes next: 1, 1, 2, 3, 5, 8, ?',
      options: { A: '11', B: '12', C: '13', D: '14' },
      correctAnswer: 'C',
    },
    {
      text: 'What comes next: 3, 9, 27, 81, ?',
      options: { A: '162', B: '189', C: '216', D: '243' },
      correctAnswer: 'D',
    },
    {
      text: 'Complete the pattern: 1, 4, 9, 16, ?',
      options: { A: '20', B: '23', C: '25', D: '27' },
      correctAnswer: 'C',
    },
    {
      text: 'What comes next: 2, 6, 12, 20, ?',
      options: { A: '28', B: '30', C: '32', D: '36' },
      correctAnswer: 'B',
    },
    {
      text: 'Complete the pattern: 64, 32, 16, 8, ?',
      options: { A: '2', B: '4', C: '6', D: '0' },
      correctAnswer: 'B',
    },
    {
      text: 'What comes next: 1, 8, 27, 64, ?',
      options: { A: '100', B: '125', C: '150', D: '175' },
      correctAnswer: 'B',
    },
  ],
};

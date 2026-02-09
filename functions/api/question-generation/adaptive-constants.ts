/**
 * Constants for Adaptive Aptitude API
 * Includes subtags, prompts, difficulty descriptions, and AI model precedence
 */

import type { Subtag, GradeLevel, DifficultyLevel } from './adaptive-types';

/* ======================================================
   SUBTAGS
====================================================== */

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

/* ======================================================
   DIFFICULTY SCALE (RELATIVE TO GRADE)
====================================================== */

export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  1: 'Very Easy - Basic concepts, straightforward questions, minimal steps required. Foundation level for the grade.',
  2: 'Easy - Simple concepts with slight complexity, 1-2 steps to solve. Accessible to most students at this grade.',
  3: 'Medium - Moderate complexity, requires careful thinking, 2-3 steps. Grade-appropriate challenge level.',
  4: 'Hard - Complex reasoning required, multiple steps, some tricky elements. Above-average difficulty for the grade.',
  5: 'Very Hard - Advanced concepts, multi-step reasoning, requires deep analysis. Top-tier difficulty for the grade.',
};

/* ======================================================
   GRADE-SPECIFIC CONTEXTS (HIGH PRECISION)
====================================================== */

export const GRADE_LEVEL_CONTEXT: Record<GradeLevel, string> = {
  middle_school: `You are creating aptitude test questions for MIDDLE SCHOOL students (grades 6-8, ages 11-14).

⚠️ CRITICAL: This is for younger students (ages 11-14). Keep questions simple and age-appropriate.`,

  high_school: `You are creating aptitude test questions for HIGH SCHOOL students (grades 9-10, ages 14-16).

⚠️ CRITICAL: TEXT-ONLY QUESTIONS REQUIRED ⚠️
- DO NOT reference any visual elements (graphs, charts, tables, diagrams, images, shapes, patterns, figures)
- DO NOT write "The graph shows..." or "The diagram below..." or "Look at the figure..." or "The image depicts..."
- ALL information must be provided in TEXT FORM ONLY
- For data interpretation: Provide ALL data as text (e.g., "A shop's sales were: Monday: $500, Tuesday: $650, Wednesday: $800")
- For spatial reasoning: Describe transformations in words (e.g., "If you rotate a triangle 90 degrees clockwise, what shape does it form?")
- For pattern recognition: Describe sequences in text (e.g., "In the sequence 2, 4, 8, 16, what is the next number?")
- NEVER assume visual elements exist - the system does not support images
- Focus on verbal, numerical, and logical reasoning that can be expressed purely in text

🎯 COGNITIVE EXPECTATIONS FOR GRADES 9-10 (Ages 14-16):
- Transitioning from concrete to abstract thinking
- Can handle 2-4 step problems with some guidance
- Developing pattern recognition and logical deduction skills
- Building foundation for higher-order thinking
- Vocabulary: 8,000-12,000 words (everyday + some academic terms)

📚 CAREER CONTEXT - STREAM SELECTION AWARENESS:
- Students are exploring interests before choosing Science/Commerce/Arts stream
- Questions should help identify natural aptitudes for stream selection
- Focus on discovering abilities: analytical thinking, creative reasoning, verbal skills, numerical ability
- Build awareness of different career paths and skill requirements
- Questions should reveal strengths to guide "After 10th" stream selection decisions

🎓 DIFFICULTY DISCIPLINE (Relative to Grade 9-10):
- Level 1: Basic concepts, simple calculations, obvious patterns (accessible to all)
- Level 2: Multi-step problems, common relationships, straightforward logic
- Level 3: Moderate problem-solving, inference, pattern analysis (grade-appropriate challenge)
- Level 4: Complex reasoning, abstract thinking, multi-variable problems (above-average)
- Level 5: Advanced concepts, sophisticated logic, creative problem-solving (top-tier for grade)

CRITICAL GUIDELINES FOR GRADES 9-10:
- Use vocabulary appropriate for 14-16 year olds (not too simple, not too advanced)
- Questions should be challenging but NOT frustrating
- Use relatable scenarios: school life, sports, technology, social situations, simple real-world problems
- AVOID: highly technical terms, complex business concepts, advanced mathematics beyond basic algebra
- Keep question text CLEAR and CONCISE (2-4 sentences max)
- Use concrete examples with some abstract elements
- Numbers should be manageable: basic algebra, simple equations, mental-math friendly

📐 MATHEMATICAL CONCEPTS FOR NUMERICAL REASONING (Grades 9-10 Level - Use Diverse Topics):

**Arithmetic & Number System:**
- Integers, fractions, decimals (all operations)
- LCM & HCF (finding and applications)
- Divisibility rules and remainders
- Percentage (increase/decrease, applications)
- Ratio and proportion (direct, inverse)
- Profit, loss, discount (basic commercial math)
- Simple and compound interest (basic formulas)

**Basic Algebra:**
- Linear equations (one variable)
- Simple simultaneous equations (two variables)
- Basic algebraic expressions and simplification
- Simple identities: (a+b)², (a-b)², a²-b²
- Word problems leading to equations

**Time, Speed & Distance:**
- Average speed calculations
- Basic train problems (length, crossing)
- Simple relative motion
- Time-work problems (basic efficiency)

**Data Interpretation (Text-Based):**
- Mean, median, mode (ungrouped data described in text)
- Simple data analysis from text descriptions
- Basic probability (coins, dice, cards)
- Percentage calculations from data

**Geometry (Text-Based):**
- Basic properties of triangles, quadrilaterals
- Perimeter and area (simple shapes described in words)
- Volume and surface area (basic 3D shapes in text)
- Pythagoras theorem applications

**VARIETY REQUIREMENT:** Rotate through these topics to ensure diverse question types. Don't use the same topic more than twice in a row.

🧠 LOGICAL REASONING CONCEPTS (Grades 9-10 Level - Text-Based):

**Basic Logic:**
- Simple syllogisms (All A are B, Some B are C)
- Conditional statements (If-then)
- Basic deductive reasoning
- Simple analogies and relationships

**Pattern Recognition:**
- Number series (arithmetic, geometric, simple patterns)
- Letter series and basic coding
- Analogies (A:B::C:? with clear relationships)
- Classification (odd one out)

**Critical Thinking:**
- Drawing simple conclusions
- Identifying assumptions
- Cause and effect relationships
- Basic argument evaluation

**VARIETY REQUIREMENT:** Mix different types of logical reasoning. Alternate between deductive, pattern-based, and analytical reasoning.

📚 VERBAL REASONING CONCEPTS (Grades 9-10 Level):

**Vocabulary & Relationships:**
- Synonyms and antonyms (grade-appropriate vocabulary)
- Analogies (clear relationships: part-whole, cause-effect, etc.)
- Word associations
- Contextual vocabulary

**Reading & Comprehension:**
- Main idea identification
- Simple inference
- Fact vs opinion
- Supporting details

**VARIETY REQUIREMENT:** Mix vocabulary, analogies, and comprehension-based questions.

🔄 SUBTAG ROTATION ENFORCEMENT:
- NEVER use the same subtag consecutively
- Distribute subtags evenly across the question set
- Each subtag must appear at least once in every 6-question block
- Rotate through: numerical_reasoning → logical_reasoning → verbal_reasoning → spatial_reasoning → data_interpretation → pattern_recognition

🚫 REPETITION PREVENTION:
- NEVER reuse similar scenarios
- NEVER reuse similar numerical patterns
- NEVER reuse similar logical structures
- Change contexts completely between questions
- Vary numerical values by at least 50%
- Use different measurement units and subjects

VARIETY REQUIREMENTS FOR GRADES 9-10:
- Use DIVERSE scenarios: school, technology, sports, nature, social situations, simple real-world problems
- Use DIVERSE math topics: rotate through arithmetic, algebra, geometry, data interpretation, time-speed-distance
- Vary the subjects: different objects, people, situations, locations
- Change numerical values significantly between questions
- Use different measurement units and contexts
- Create original contexts - avoid repeating similar situations

📊 ANALYTICS-SAFE DIFFICULTY PATHS:
- Questions must have clear, unambiguous correct answers
- Difficulty progression should be measurable and consistent
- Each question must reliably discriminate between ability levels
- Avoid trick questions or ambiguous wording
- Ensure distractors are plausible but clearly incorrect

🎯 STREAM RECOMMENDATION READINESS:
- Questions should reveal aptitude patterns for Science/Commerce/Arts streams
- Numerical + Data Interpretation → Science/Commerce indicators
- Verbal + Logical → Arts/Humanities indicators
- Spatial + Pattern Recognition → Design/Engineering indicators
- Results should guide stream selection after 10th grade`,

  higher_secondary: `You are creating aptitude test questions for HIGHER SECONDARY students (grades 11-12, ages 16-18).

⚠️ CRITICAL: TEXT-ONLY QUESTIONS REQUIRED ⚠️
- DO NOT reference any visual elements (graphs, charts, tables, diagrams, images, shapes, patterns, figures)
- DO NOT write "The graph shows..." or "The diagram below..." or "Look at the figure..." or "The image depicts..."
- ALL information must be provided in TEXT FORM ONLY
- For data interpretation: Provide ALL data as text (e.g., "A shop's monthly sales were: Jan: $5,000, Feb: $6,500, Mar: $8,000")
- For spatial reasoning: Describe transformations in words (e.g., "If you rotate a triangle 90 degrees clockwise, what shape does it form?")
- For pattern recognition: Describe sequences in text (e.g., "In the sequence 2, 4, 8, 16, what is the next number?")
- NEVER assume visual elements exist - the system does not support images
- Focus on verbal, numerical, and logical reasoning that can be expressed purely in text

🎯 COGNITIVE EXPECTATIONS FOR GRADES 9-10 (Ages 14-16):
- Transitioning from concrete to abstract thinking
- Can handle 2-4 step problems with moderate guidance
- Developing pattern recognition and logical deduction skills
- Building foundation for higher-order thinking
- Vocabulary: 8,000-12,000 words (everyday + some academic terms)

📚 CAREER CONTEXT - STREAM SELECTION AWARENESS:
- Students are exploring interests before choosing Science/Commerce/Arts stream after 10th
- Questions should help identify natural aptitudes for stream selection
- Focus on discovering abilities: analytical thinking, creative reasoning, verbal skills, numerical ability
- Build awareness of different career paths and skill requirements
- Questions should reveal strengths to guide "After 10th" stream selection decisions
- NOT preparing for competitive exams yet - focus on aptitude discovery

🎓 DIFFICULTY DISCIPLINE (Relative to Grades 9-10):
- Level 1: Basic concepts, simple calculations, obvious patterns (accessible to all)
- Level 2: Multi-step problems, common relationships, straightforward logic
- Level 3: Moderate problem-solving, inference, pattern analysis (grade-appropriate challenge)
- Level 4: Complex reasoning, abstract thinking, multi-variable problems (above-average)
- Level 5: Advanced concepts, sophisticated logic, creative problem-solving (top-tier for grade)

CRITICAL GUIDELINES FOR GRADES 9-10:
- Use vocabulary appropriate for 14-16 year olds (not too simple, not too advanced)
- Questions should be challenging but NOT frustrating
- Use relatable scenarios: school life, sports, technology, social situations, simple real-world problems
- AVOID: highly technical terms, complex business concepts, advanced mathematics beyond basic algebra
- Keep question text CLEAR and CONCISE (2-4 sentences max)
- Use concrete examples with some abstract elements
- Numbers should be manageable: basic algebra, simple equations, mental-math friendly
- DO NOT reference competitive exams (JEE, NEET, etc.) - students are not at that level yet

📐 MATHEMATICAL CONCEPTS FOR NUMERICAL REASONING (Grades 9-10 Level - Use Diverse Topics):

**Arithmetic & Number System:**
- Integers, fractions, decimals (all operations)
- LCM & HCF (finding and applications)
- Divisibility rules and remainders
- Percentage (increase/decrease, applications)
- Ratio and proportion (direct, inverse)
- Profit, loss, discount (basic commercial math)
- Simple and compound interest (basic formulas)

**Basic Algebra:**
- Linear equations (one variable)
- Simple simultaneous equations (two variables)
- Basic algebraic expressions and simplification
- Simple identities: (a+b)², (a-b)², a²-b²
- Word problems leading to equations
- Basic quadratic equations (simple factorization)

**Time, Speed & Distance:**
- Average speed calculations
- Basic train problems (length, crossing)
- Simple relative motion
- Time-work problems (basic efficiency)

**Data Interpretation (Text-Based):**
- Mean, median, mode (ungrouped data described in text)
- Simple data analysis from text descriptions
- Basic probability (coins, dice, cards)
- Percentage calculations from data

**Geometry (Text-Based):**
- Basic properties of triangles, quadrilaterals
- Perimeter and area (simple shapes described in words)
- Volume and surface area (basic 3D shapes in text)
- Pythagoras theorem applications
- Basic coordinate geometry (distance, midpoint)

**VARIETY REQUIREMENT:** Rotate through these topics to ensure diverse question types. Don't use the same topic more than twice in a row.

🧠 LOGICAL REASONING CONCEPTS (Grades 9-10 Level - Text-Based):

**Basic Logic:**
- Simple syllogisms (All A are B, Some B are C)
- Conditional statements (If-then)
- Basic deductive reasoning
- Simple analogies and relationships

**Pattern Recognition:**
- Number series (arithmetic, geometric, simple patterns)
- Letter series and basic coding
- Analogies (A:B::C:? with clear relationships)
- Classification (odd one out)

**Critical Thinking:**
- Drawing simple conclusions
- Identifying assumptions
- Cause and effect relationships
- Basic argument evaluation

**VARIETY REQUIREMENT:** Mix different types of logical reasoning. Alternate between deductive, pattern-based, and analytical reasoning.

📚 VERBAL REASONING CONCEPTS (Grades 9-10 Level):

**Vocabulary & Relationships:**
- Synonyms and antonyms (grade-appropriate vocabulary)
- Analogies (clear relationships: part-whole, cause-effect, etc.)
- Word associations
- Contextual vocabulary

**Reading & Comprehension:**
- Main idea identification
- Simple inference
- Fact vs opinion
- Supporting details

**VARIETY REQUIREMENT:** Mix vocabulary, analogies, and comprehension-based questions.

🎨 SPATIAL REASONING CONCEPTS (High School Level - TEXT-ONLY):

**Mental Rotation (Described in Text):**
- 2D shape rotation described verbally (e.g., "If you rotate letter 'N' 180 degrees...")
- 3D object rotation described in words
- Mirror images and reflections described (e.g., "What does 'MATH' look like in a mirror?")
- Folding and unfolding described (e.g., "If you fold a square paper in half twice and cut a corner...")
- Perspective changes described verbally

**Spatial Visualization (Text-Based):**
- Paper folding and cutting patterns described in words
- Cube and dice problems described (e.g., "A cube has 1 opposite 6, 2 opposite 5, 3 opposite 4...")
- Hidden figures described verbally
- Figure completion described in text
- Block counting described (e.g., "A structure has 3 blocks in bottom row, 2 in middle, 1 on top...")
- Cross-sections described

**Geometric Reasoning (Verbal Description):**
- Shape properties and relationships
- Symmetry described (e.g., "Which letter has both horizontal and vertical symmetry?")
- Tessellations and patterns described
- Perspective and multiple views described
- Spatial transformations described in words
- Congruence and similarity

**Pattern Recognition (Visual Concepts in Text):**
- Visual sequences described verbally
- Shape series described in text
- Relationships described (e.g., "If triangle relates to 3 sides, what relates to 8 sides?")
- Odd one out described
- Analogies described verbally
- Rule-based transformations in text

**Coordinate Geometry (Spatial - Text-Based):**
- Distance and midpoint (e.g., "Point A is at (2,3) and B is at (5,7). What is the distance?")
- Slope and parallel/perpendicular lines
- Geometric shapes on coordinate plane described
- Transformations described verbally
- Symmetry on coordinate plane

**VARIETY REQUIREMENT:** Mix 2D and 3D problems. Alternate between rotation, visualization, and geometric reasoning. Always describe spatially.

📊 DATA INTERPRETATION CONCEPTS (High School Level - TEXT-ONLY):

**Statistical Analysis (Data in Text):**
- Mean, median, mode, range (data provided as text)
- Percentages and proportions (complex calculations)
- Ratios and comparisons (multiple data sets in text)
- Percentage change and growth rates
- Weighted averages and combined means
- Standard deviation (basic concept)

**Data Representation (Described in Text):**
- Tables described verbally (e.g., "Sales data: Product A: Q1=$10k, Q2=$15k, Q3=$12k...")
- Bar charts described (e.g., "In a survey, 30 chose A, 45 chose B, 25 chose C...")
- Line graphs described (e.g., "Temperature rose from 20°C at 6am to 35°C at 2pm...")
- Pie charts described (e.g., "Budget allocation: 40% salaries, 30% operations, 20% marketing, 10% other")
- Comparative data sets in text
- Mixed data formats described verbally

**Data Reasoning:**
- Trend identification from text descriptions
- Comparison and ranking (multiple criteria)
- Maximum/minimum values and extremes
- Data sufficiency (is given data adequate?)
- Logical deductions from data
- Interpolation and extrapolation

**Quantitative Comparison:**
- Comparing quantities (which is greater?)
- Estimating values (approximation)
- Order of magnitude
- Relative changes (absolute vs percentage)
- Proportional reasoning
- Rate of change

**Real-World Applications (Text-Based):**
- Business data described (sales, revenue, profit, market share)
- Scientific data described (experiments, observations, measurements)
- Survey results and demographics in text
- Economic indicators described (GDP, inflation, unemployment)
- Performance metrics (scores, ratings, rankings)
- Financial data described (investments, returns, interest)

**VARIETY REQUIREMENT:** Use diverse data contexts. Mix business, scientific, social, and economic data. Vary the complexity of calculations. Always provide data as text.

🔢 PATTERN RECOGNITION CONCEPTS (High School Level):

**Number Patterns:**
- Arithmetic sequences (linear, constant difference)
- Geometric sequences (exponential, constant ratio)
- Fibonacci-type sequences (sum of previous terms)
- Square/cube sequences (perfect squares, cubes)
- Prime number patterns
- Mixed operation patterns (add, multiply, alternate)
- Recursive patterns

**Algebraic Patterns:**
- Function patterns (linear, quadratic, exponential)
- Recursive relationships (f(n) = f(n-1) + ...)
- Polynomial patterns
- Exponential growth and decay
- Pattern generalization (finding nth term)
- Formula derivation

**Logical Patterns:**
- Alternating patterns (odd/even positions)
- Nested patterns (patterns within patterns)
- Multi-rule patterns (different rules for different positions)
- Position-based patterns (depends on index)
- Conditional patterns (if-then rules)
- Cyclic patterns (repeating cycles)

**Abstract Patterns:**
- Letter sequences (alphabetical, positional)
- Symbol patterns described in text
- Code patterns (substitution, transformation)
- Relationship patterns (between elements)
- Word patterns

**Problem-Solving Patterns:**
- Identifying underlying rules
- Extending sequences (finding next terms)
- Finding missing terms (in middle of sequence)
- Pattern prediction (future values)
- Rule formulation (expressing pattern as formula)
- Multiple pattern recognition (overlapping patterns)

**VARIETY REQUIREMENT:** Mix numerical, algebraic, and abstract patterns. Vary the complexity and number of terms given.

🔄 SUBTAG ROTATION ENFORCEMENT:
- NEVER use the same subtag consecutively
- Distribute subtags evenly across the question set
- Each subtag must appear at least once in every 6-question block
- Rotate through: numerical_reasoning → logical_reasoning → verbal_reasoning → spatial_reasoning → data_interpretation → pattern_recognition

🚫 REPETITION PREVENTION:
- NEVER reuse similar scenarios
- NEVER reuse similar numerical patterns
- NEVER reuse similar logical structures
- Change contexts completely between questions
- Vary numerical values by at least 50%
- Use different measurement units and subjects

VARIETY REQUIREMENTS FOR GRADES 9-10:
- Use DIVERSE scenarios: school, technology, sports, nature, social situations, simple real-world problems
- Use DIVERSE math topics: rotate through arithmetic, algebra, geometry, data interpretation, time-speed-distance
- Vary the subjects: different objects, people, situations, locations
- Change numerical values significantly between questions
- Use different measurement units and contexts
- Create original contexts - avoid repeating similar situations

📊 ANALYTICS-SAFE DIFFICULTY PATHS:
- Questions must have clear, unambiguous correct answers
- Difficulty progression should be measurable and consistent
- Each question must reliably discriminate between ability levels
- Avoid trick questions or ambiguous wording
- Ensure distractors are plausible but clearly incorrect

🎯 STREAM RECOMMENDATION READINESS:
- Questions should reveal aptitude patterns for Science/Commerce/Arts streams
- Numerical + Data Interpretation → Science/Commerce indicators
- Verbal + Logical → Arts/Humanities indicators
- Spatial + Pattern Recognition → Design/Engineering indicators
- Results should guide stream selection after 10th grade`,
};

/* ======================================================
   SYSTEM PROMPT (PHASE + BATCH AWARE)
====================================================== */

export function buildSystemPrompt(gradeLevel: GradeLevel, studentCourse?: string | null, phase?: string): string {
  const courseContext = studentCourse ? `

🎓 COURSE-SPECIFIC CONTEXT FOR ${studentCourse.toUpperCase()}:
- The student is studying ${studentCourse}
- Frame questions using scenarios, examples, and contexts relevant to this field
- Use terminology and situations that a ${studentCourse} student would encounter
- Questions should still test general aptitude, but contextualized to their field
- Examples: If studying B.COM, use business/finance scenarios; if B.Tech CSE, use tech/programming contexts
` : '';

  const phaseContext = phase ? `

🔄 CURRENT TEST PHASE: ${phase.toUpperCase()}
${phase === 'diagnostic' ? `- This is the DIAGNOSTIC SCREENER phase (8 questions)
- Questions should be at difficulty level 3 (medium) to establish baseline
- Focus on broad aptitude assessment across all subtags
- Questions should help classify student into Low/Medium/High tier
- Avoid extreme difficulty - aim for discriminative power at the median` : phase === 'core' ? `- This is the ADAPTIVE CORE phase (10 questions)
- Difficulty will adjust based on student performance
- Questions should progressively reveal true ability level
- Focus on precise ability estimation within the student's tier
- Each question should provide maximum information for adaptive algorithm` : phase === 'stability' ? `- This is the STABILITY CONFIRMATION phase (4 questions)
- Questions should confirm the provisional ability band
- Difficulty should be consistent with estimated ability level
- Focus on validating the adaptive core results
- Questions should have high reliability for final scoring` : ''}` : '';

  return `${GRADE_LEVEL_CONTEXT[gradeLevel]}${courseContext}${phaseContext}

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

🔄 SUBTAG ROTATION ENFORCEMENT (CRITICAL):
- You will receive a list of subtags to cover
- NEVER use the same subtag consecutively
- Distribute questions evenly across all provided subtags
- Each subtag should appear exactly once in the order provided
- This ensures comprehensive aptitude assessment and prevents cognitive fatigue

🚫 UNIQUENESS & REPETITION PREVENTION (CRITICAL):
- NEVER reuse scenarios, contexts, or problem structures from previous questions
- NEVER reuse similar numerical patterns or sequences
- NEVER reuse similar logical structures or argument forms
- Each question must be completely original in:
  * Context/scenario (e.g., don't use "shopping" twice)
  * Numerical values (vary by 50%+ between questions)
  * Logical structure (vary argument forms)
  * Vocabulary (use different words and phrases)
  * Measurement units (dollars, meters, hours, etc.)
- If you receive excluded question texts, ensure your questions are COMPLETELY DIFFERENT in both content and structure

📊 ANALYTICS-SAFE QUESTION DESIGN:
- Questions must have clear, unambiguous correct answers for accurate scoring
- Difficulty should be measurable and consistent with the specified level
- Each question must reliably discriminate between ability levels
- Avoid trick questions or ambiguous wording that could skew analytics
- Ensure distractors are plausible but clearly incorrect for proper IRT analysis
- Questions should support adaptive difficulty algorithms
- Enable accurate ability estimation for career matching

🎯 CAREER RECOMMENDATION READINESS:
- Questions should reveal aptitude patterns for stream/program recommendations
- Each subtag contributes to specific career aptitude indicators:
  * numerical_reasoning + data_interpretation → Quantitative careers (STEM, Finance, Analytics)
  * verbal_reasoning + logical_reasoning → Analytical careers (Law, Management, Humanities)
  * spatial_reasoning + pattern_recognition → Creative-Technical careers (Design, Engineering, CS)
- Balanced performance across subtags → Versatile career options
- Questions should help guide educational and career path decisions

RESPONSE FORMAT:
Return a valid JSON array of question objects. Each object must have:
- "text": The question text (string) - MUST be text-only, no references to visuals
- "options": Object with keys A, B, C, D containing answer choices
- "correctAnswer": Single UPPERCASE letter (A, B, C, or D) - MUST be one of these exact letters
- "explanation": Brief explanation of why the answer is correct (optional but recommended)

⚠️ CRITICAL: correctAnswer MUST be exactly "A", "B", "C", or "D" (uppercase letter only)

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
  },
  {
    "text": "In a survey, 30 students chose Basketball, 15 chose Tennis, 25 chose Soccer, and 20 chose Swimming. How many more students chose Basketball than Tennis?",
    "options": {
      "A": "5",
      "B": "10",
      "C": "15",
      "D": "20"
    },
    "correctAnswer": "C",
    "explanation": "Basketball has 30 students and Tennis has 15 students. 30 - 15 = 15"
  }
]

TEXT-ONLY QUESTION EXAMPLES:
- Data interpretation: "A company's sales were $50,000 in January, $65,000 in February, and $80,000 in March. What was the percentage increase from January to March?"
- Spatial reasoning: "If you rotate the letter 'N' 180 degrees, which letter does it resemble?"
- Pattern recognition: "In the sequence 3, 6, 12, 24, what is the next number?"
- Logical reasoning: "All roses are flowers. Some flowers are red. Which conclusion is valid?"

⚠️ CRITICAL REMINDERS:
- Follow the subtag order EXACTLY as provided in the user prompt
- NEVER repeat scenarios, contexts, or numerical patterns
- Ensure difficulty matches the specified level (1-5) relative to the grade level
- Questions must be analytics-safe with clear correct answers
- Support career recommendation algorithms with diverse aptitude assessment`;
}

/* ======================================================
   AI MODEL SELECTION
====================================================== */



// AI Models to try in order of preference
// These models will be tried sequentially if one fails
export const ADAPTIVE_AI_MODELS = [
  // Primary Models - Reliable and affordable
  'openai/gpt-3.5-turbo',                  // Reliable and affordable
  'openai/gpt-4o-mini',                    // Backup OpenAI model
  // Free Models - Fallback choices
  'google/gemini-2.0-flash-exp:free',      // FREE - Latest Gemini
  'meta-llama/llama-3.2-3b-instruct:free', // FREE - Smaller Llama
  'google/gemini-2.0-flash-001',           // Gemini Flash (paid)
  // Higher quality paid models (if needed)
  'anthropic/claude-3-haiku',              // Claude Haiku (cheap, reliable)
  'anthropic/claude-3.5-sonnet',           // Claude Sonnet (high quality)
] as const;

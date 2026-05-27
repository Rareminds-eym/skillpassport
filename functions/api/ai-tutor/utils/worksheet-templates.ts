/**
 * Worksheet Template Prompt Builders
 * 
 * Each template type has its own prompt builder function that generates
 * AI prompts tailored to that specific worksheet format.
 */

import type { WorksheetConfig, WorksheetTemplateType, DifficultyLevel } from '../types/worksheet';
import type { CourseContext } from './course-context';
import { formatCourseContextForPrompt } from './course-context';

// ==================== DIFFICULTY INSTRUCTIONS ====================

/**
 * Get difficulty-specific instructions for the AI
 */
function getDifficultyInstructions(difficulty: DifficultyLevel): string {
  const instructions: Record<DifficultyLevel, string> = {
    low: `
- Use simple, clear language
- Focus on basic concepts and fundamental understanding
- Avoid complex terminology
- Keep questions straightforward and concrete
- Include examples to illustrate concepts`,
    
    medium: `
- Use clear academic language
- Include subject-specific terminology with context
- Require moderate analytical thinking
- Balance recall with application questions
- Encourage critical thinking at an intermediate level`,
    
    high: `
- Use advanced academic language
- Include complex subject-specific terminology
- Require deep analytical and critical thinking
- Challenge students with multi-step reasoning
- Include questions that require synthesis and evaluation`,
  };
  
  return instructions[difficulty];
}

// ==================== TEMPLATE PROMPT BUILDERS ====================

/**
 * Comprehensive worksheet template (mixed question types)
 */
function buildComprehensivePrompt(config: WorksheetConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const difficultyInstructions = getDifficultyInstructions(config.difficulty);
  
  return `Create a comprehensive worksheet for "${context.courseTitle}".

${courseContextStr}

Think through your approach:
- Review the course material and identify key concepts
- Create ${config.questionCount} questions mixing multiple choice, short answer, and application
- Adjust complexity for ${config.difficulty} difficulty level
${difficultyInstructions}
- ${config.includeAnswerKey ? 'Prepare answers with explanations' : 'Focus on clear questions'}

Now create:

Title: [Engaging title]
Learning Objective: [What students will master]
Instructions: [Clear guidance for students]

Questions:
[${config.questionCount} varied questions testing different skills]

${config.includeAnswerKey ? 'Answer Key:\n[Answers with brief explanations]' : '**IMPORTANT: Do NOT include answers, solutions, or any indication of correct responses. The worksheet must be student-facing only.**'}
${config.includeRubric ? 'Grading Rubric:\n[Point distribution and criteria]' : ''}
${config.includeExtension ? 'Extension Activity:\n[Challenge for advanced students]' : ''}`;
}

/**
 * Multiple choice template
 */
function buildMultipleChoicePrompt(config: WorksheetConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const difficultyInstructions = getDifficultyInstructions(config.difficulty);
  
  return `Create a multiple-choice quiz for "${context.courseTitle}".

${courseContextStr}

Think through each question:
- Identify a key concept to test
- Write a clear question
- Create one correct answer
- Add three plausible but incorrect options
${difficultyInstructions}

Create ${config.questionCount} questions:

Title: [Engaging quiz title]
Learning Objective: [What this assesses]
Instructions: Choose the best answer.

Questions:
${config.includeAnswerKey ? `[${config.questionCount} questions with options A, B, C, D - you can mark correct answers]` : `[${config.questionCount} questions with options A, B, C, D - DO NOT indicate which answer is correct, DO NOT write "Correct Answer:", DO NOT mark the right answer in any way]`}

${config.includeAnswerKey ? `Answer Key:
[Separate section at the end with correct letter and explanation for each question]` : '**IMPORTANT: Do NOT include answers, solutions, or any indication of correct responses. The worksheet must be student-facing only.**'}`;
}

/**
 * Short answer template
 */
function buildShortAnswerPrompt(config: WorksheetConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const difficultyInstructions = getDifficultyInstructions(config.difficulty);
  
  return `Create short answer questions for "${context.courseTitle}".

${courseContextStr}

For each question, think:
- What concept needs deeper understanding?
- How can I ask for explanation, not just facts?
- What would a good 2-4 sentence answer include?
${difficultyInstructions}

Create ${config.questionCount} questions:

Title: [Engaging title]
Learning Objective: [Understanding being assessed]
Instructions: Answer each question in 2-4 complete sentences.

Questions:
[${config.questionCount} questions requiring explanation or analysis]

${config.includeRubric ? 'Grading Rubric:\n[Point values and what makes a complete answer]' : ''}
${config.includeAnswerKey ? 'Sample Answers:\n[Key points that should be included in each answer]' : '**IMPORTANT: Do NOT include answers, solutions, or any indication of correct responses. The worksheet must be student-facing only.**'}`;
}

/**
 * Fill in the blank template
 */
function buildFillInBlankPrompt(config: WorksheetConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const difficultyInstructions = getDifficultyInstructions(config.difficulty);
  
  return `You are creating a fill-in-the-blank worksheet for "${context.courseTitle}".

${courseContextStr}

First, think through your approach:
1. Identify ${config.questionCount} key concepts from the course material
2. For each concept, write a complete sentence that teaches it
3. Choose ONE important word in each sentence to remove
4. Replace that word with ___________
5. Collect all removed words for the word bank
${difficultyInstructions}

Now create the worksheet:

Title: [Engaging title about the topic]
Learning Objective: [What students will learn]
Instructions: Fill in each blank using words from the word bank.

Word Bank:
[${config.questionCount} words in alphabetical order]

Sentences:
**CRITICAL: You MUST number each sentence. Start with "1." and continue sequentially.**

1. [First complete sentence with one ___________ replacing a key term]
2. [Second complete sentence with one ___________ replacing a key term]
3. [Third complete sentence with one ___________ replacing a key term]
[Continue numbering through ${config.questionCount}]

**Example format:**
1. The process of photosynthesis produces ___________ as a byproduct.
2. Plants absorb ___________ through their roots.
3. ___________ is the green pigment found in leaves.

${config.includeAnswerKey ? `Answer Key:
1. [correct word]
2. [correct word]
3. [correct word]
[Continue through ${config.questionCount}]` : '**IMPORTANT: Do NOT include answers, solutions, or any indication of correct responses. The worksheet must be student-facing only.**'}

**CRITICAL FORMATTING RULES:**
- Every sentence MUST start with a number followed by a period (1., 2., 3., etc.)
- Number sentences sequentially from 1 to ${config.questionCount}
- Each sentence must be on its own line
- Do NOT use bullet points or dashes instead of numbers`;
}

/**
 * True/False template
 */
function buildTrueFalsePrompt(config: WorksheetConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const difficultyInstructions = getDifficultyInstructions(config.difficulty);
  
  return `Create true/false questions for "${context.courseTitle}".

${courseContextStr}

For each statement, think:
- Take a fact from the course material
- Either state it correctly (true) or modify it slightly (false)
- Make sure it's unambiguous
- Aim for roughly half true, half false
${difficultyInstructions}

Create ${config.questionCount} statements:

Title: [Engaging title]
Learning Objective: [What this tests]
Instructions: Write T for True or F for False.

Questions:
${config.includeAnswerKey ? `[${config.questionCount} clear statements - you can mark which are true/false]` : `[${config.questionCount} clear statements - DO NOT indicate which are true or false, DO NOT write "Answer: T" or "Answer: F"]`}

${config.includeAnswerKey ? `Answer Key:
[T or F with brief explanation for each]` : '**IMPORTANT: Do NOT include answers, solutions, or any indication of correct responses. The worksheet must be student-facing only.**'}`;
}

/**
 * Problem solving template
 */
function buildProblemSolvingPrompt(config: WorksheetConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const difficultyInstructions = getDifficultyInstructions(config.difficulty);
  
  return `Create problem-solving exercises for "${context.courseTitle}".

${courseContextStr}

For each problem, think:
- What concept can be applied practically?
- Create a realistic scenario
- Make it require multiple steps
${difficultyInstructions}

Create ${config.questionCount} problems:

Title: [Engaging title]
Learning Objective: [Skills being developed]
Instructions: Solve each problem. Show your work.

Problems:
[${config.questionCount} multi-step problems with space for work]

${config.includeRubric ? 'Grading Rubric:\n[Points for correct answer, method, and showing work]' : ''}
${config.includeAnswerKey ? 'Solutions:\n[Step-by-step solutions with final answers]' : '**IMPORTANT: Do NOT include answers, solutions, or any indication of correct responses. The worksheet must be student-facing only.**'}`;
}

// ==================== MAIN PROMPT BUILDER ====================

/**
 * Build worksheet prompt based on template type and configuration
 */
export function buildWorksheetPrompt(
  config: WorksheetConfig,
  context: CourseContext
): string {
  const builders: Record<WorksheetTemplateType, (config: WorksheetConfig, context: CourseContext) => string> = {
    comprehensive: buildComprehensivePrompt,
    multiple_choice: buildMultipleChoicePrompt,
    short_answer: buildShortAnswerPrompt,
    fill_in_blank: buildFillInBlankPrompt,
    true_false: buildTrueFalsePrompt,
    problem_solving: buildProblemSolvingPrompt,
  };
  
  const builder = builders[config.templateType];
  if (!builder) {
    throw new Error(`Unknown worksheet template type: ${config.templateType}`);
  }
  
  return builder(config, context);
}

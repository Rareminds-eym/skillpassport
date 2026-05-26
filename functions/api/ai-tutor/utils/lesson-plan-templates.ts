/**
 * Lesson Plan Template Prompt Builders (R-T-C-F + Chain-of-Thought)
 * 
 * Each template type has its own prompt builder function that generates
 * AI prompts using Role-Task-Context-Format + Chain-of-Thought reasoning.
 */

import type { LessonPlanConfig, LessonPlanTemplateType } from '../types/lesson-plan';
import type { CourseContext } from '../../ai-tutor/utils/course-context';
import { formatCourseContextForPrompt } from '../../ai-tutor/utils/course-context';

// ==================== HELPER FUNCTIONS ====================

/**
 * Build the thinking section (Chain-of-Thought) based on template type
 */
function buildThinkingSection(templateType: LessonPlanTemplateType): string {
  switch (templateType) {
    case 'standard':
      return `
**THINK THROUGH YOUR APPROACH:**
1. Hook: How will you grab attention in the first 3 minutes?
2. Core Concept: What's the ONE thing students must understand?
3. Practice: How will students move from guided to independent work?
4. Assessment: How will you know they learned it?
5. Differentiation: What support do different learners need?
`;
    
    case 'udl':
      return `
**THINK THROUGH UDL PRINCIPLES:**
1. Engagement: How will you provide multiple ways to motivate students?
2. Representation: How will you present information in multiple formats?
3. Action/Expression: How will students demonstrate learning in different ways?
4. Accessibility: What barriers might exist and how will you remove them?
`;
    
    case '5e':
      return `
**THINK THROUGH THE 5E CYCLE:**
1. Engage: What phenomenon or question will spark curiosity?
2. Explore: How will students investigate hands-on?
3. Explain: When will you formalize the science concepts?
4. Elaborate: How will students apply to new situations?
5. Evaluate: How will you assess understanding throughout?
`;
    
    case 'project_based':
      return `
**THINK THROUGH THE PROJECT:**
1. Driving Question: What authentic problem will students solve?
2. Real-World Connection: Why does this matter?
3. Student Voice: Where will students make choices?
4. Public Product: What will students create and share?
`;
    
    default:
      // This should never happen due to TypeScript type checking, but provides a fallback
      return `
**THINK THROUGH YOUR APPROACH:**
1. Hook: How will you grab attention in the first 3 minutes?
2. Core Concept: What's the ONE thing students must understand?
3. Practice: How will students move from guided to independent work?
4. Assessment: How will you know they learned it?
5. Differentiation: What support do different learners need?
`;
  }
}

/**
 * Build the format section based on config
 */
function buildFormatSection(config: LessonPlanConfig): string {
  let format = `
**CREATE THE LESSON PLAN:**

Title: [Engaging, specific title]
${config.includeTimestamps ? `Duration: ${config.duration} minutes (with timestamps for each section)` : `Duration: ${config.duration} minutes`}
`;

  if (config.includeLearningObjectives) {
    format += `\nLearning Objectives:\n[2-3 specific, measurable objectives using action verbs]`;
  }

  if (config.includeStandards) {
    format += `\nStandards Alignment:\n[Relevant curriculum standards]`;
  }

  if (config.includeMaterials) {
    format += `\nMaterials Needed:\n[Specific list with quantities]`;
  }

  if (config.includeWarmUp) {
    format += `\nWarm-Up (5 min):\n[Engaging hook activity that activates prior knowledge]`;
  }

  if (config.includeDirectInstruction) {
    format += `\nDirect Instruction (15 min):\n[Clear explanation with examples${config.includeTeacherNotes ? ', include teacher notes on common misconceptions' : ''}]`;
  }

  if (config.includeGuidedPractice) {
    format += `\nGuided Practice (15 min):\n[Collaborative activity with teacher support and scaffolding]`;
  }

  if (config.includeIndependentPractice) {
    format += `\nIndependent Practice (10 min):\n[Individual work to demonstrate mastery]`;
  }

  if (config.includeAssessment) {
    format += `\nAssessment:\n[Formative checks throughout + exit ticket]`;
  }

  if (config.includeDifferentiation) {
    format += `\nDifferentiation:\n- Struggling Learners: [Specific scaffolds and supports]\n- On-Level Learners: [Core activities]\n- Advanced Learners: [Extension activities and challenges]`;
  }

  if (config.includeHomework) {
    format += `\nHomework/Extension:\n[Assignment with clear purpose and expected time]`;
  }

  if (config.includeClosure) {
    format += `\nClosure (5 min):\n[Summary of key points + preview of next lesson]`;
  }

  format += `\n\n**IMPORTANT:** Be specific, not generic. Include actual activities and examples, not just descriptions.`;

  return format;
}

// ==================== STANDARD LESSON PLAN ====================

function buildStandardLessonPlan(config: LessonPlanConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const lessonTitle = context.currentLesson?.title ?? context.courseTitle;
  
  return `
**ROLE:** You are an experienced ${config.subject || context.courseTitle} educator with 10+ years of classroom experience.

**TASK:** Create a ${config.duration}-minute lesson plan for "${lessonTitle}".

**CONTEXT:**
${courseContextStr}
${config.subject ? `- Subject: ${config.subject}` : ''}
- Class Setting: Standard classroom (20-30 students)
- Prior Knowledge: Students have completed previous lessons in this course

${buildThinkingSection(config.templateType)}

${buildFormatSection(config)}
`;
}

// ==================== UDL (UNIVERSAL DESIGN FOR LEARNING) ====================

function buildUDLLessonPlan(config: LessonPlanConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const lessonTitle = context.currentLesson?.title ?? context.courseTitle;
  
  return `
**ROLE:** You are a UDL-certified educator specializing in inclusive classrooms.

**TASK:** Create a ${config.duration}-minute UDL lesson plan for "${lessonTitle}".

**CONTEXT:**
${courseContextStr}
- UDL Framework: Multiple means of Engagement, Representation, and Action/Expression

${buildThinkingSection(config.templateType)}

**CREATE THE UDL LESSON PLAN:**

Title: [Inclusive, engaging title]
Duration: ${config.duration} minutes

Learning Objectives: [2-3 objectives with multiple pathways to success]

## Multiple Means of ENGAGEMENT (Why Learn?)
- Interest: [How you'll hook different learners]
- Persistence: [How you'll sustain effort]
- Self-Regulation: [How students will monitor their learning]

## Multiple Means of REPRESENTATION (What to Learn?)
- Perception: [Visual, auditory, tactile options]
- Language: [Vocabulary support, translations]
- Comprehension: [Scaffolds, connections, patterns]

## Multiple Means of ACTION & EXPRESSION (How to Show Learning?)
- Physical Action: [Options for responding]
- Expression: [Multiple ways to demonstrate understanding]
- Executive Function: [Goal-setting, planning support]

Assessment: [Multiple ways to show mastery]
Materials: [Accessible materials list]
`;
}

// ==================== 5E MODEL (SCIENCE) ====================

function build5ELessonPlan(config: LessonPlanConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const lessonTitle = context.currentLesson?.title ?? context.courseTitle;
  
  return `
**ROLE:** You are a science educator experienced in inquiry-based learning.

**TASK:** Create a ${config.duration}-minute 5E lesson plan for "${lessonTitle}".

**CONTEXT:**
${courseContextStr}
- 5E Model: Engage → Explore → Explain → Elaborate → Evaluate

${buildThinkingSection(config.templateType)}

**CREATE THE 5E LESSON PLAN:**

Title: [Inquiry-focused title]
Duration: ${config.duration} minutes
Learning Objectives: [Science concepts and inquiry skills]

## ENGAGE (${Math.max(Math.round(config.duration * 0.15), 5)} min)
- Phenomenon: [Surprising or intriguing event]
- Driving Question: [Open-ended question to investigate]
- Prior Knowledge: [What students already know]

## EXPLORE (${Math.max(Math.round(config.duration * 0.30), 5)} min)
- Investigation: [Hands-on activity or experiment]
- Materials: [Equipment and supplies]
- Student Role: [What students do - observe, measure, record]
- Teacher Role: [Facilitate, ask probing questions]

## EXPLAIN (${Math.max(Math.round(config.duration * 0.25), 5)} min)
- Student Explanations: [Students share findings]
- Formalize Concepts: [Introduce scientific terminology]
- Connect to Evidence: [Link to exploration data]

## ELABORATE (${Math.max(Math.round(config.duration * 0.20), 5)} min)
- New Context: [Apply concept to different situation]
- Deepen Understanding: [More complex application]

## EVALUATE (${Math.max(Math.round(config.duration * 0.10), 5)} min)
- Formative: [Checks throughout each phase]
- Summative: [Final assessment of understanding]

Safety Considerations: [If applicable]
`;
}

// ==================== PROJECT-BASED LEARNING ====================

function buildProjectBasedLessonPlan(config: LessonPlanConfig, context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const lessonTitle = context.currentLesson?.title ?? context.courseTitle;
  
  return `
**ROLE:** You are an educator skilled in authentic, project-based learning.

**TASK:** Create a ${config.duration}-minute Project-Based Learning session for "${lessonTitle}".

**CONTEXT:**
${courseContextStr}
- Focus: Real-world problem-solving and inquiry

${buildThinkingSection(config.templateType)}

**CREATE THE PBL SESSION PLAN:**

Title: [Problem or challenge-focused title]
Duration: ${config.duration} minutes (one session of multi-day project)

## PROJECT OVERVIEW
- Driving Question: [Open-ended, meaningful question]
- Real-World Context: [Authentic connection]
- Final Product: [What students will create]
- Audience: [Who will see/use the product]

## TODAY'S SESSION (${config.duration} min)

### Launch/Mini-Lesson (15 min)
- Today's Focus: [Specific skill or content for this session]
- Connection to Project: [How this fits the bigger picture]
- Success Criteria: [What students should accomplish today]

### Work Time (${Math.max(config.duration - 30, 10)} min)
- Student Activities: [Research, create, collaborate]
- Teacher Role: [Conference, provide feedback, facilitate]
- Resources Available: [Materials, technology, experts]
- Checkpoints: [Progress monitoring]

### Share & Reflect (15 min)
- Progress Sharing: [Students present current work]
- Peer Feedback: [Constructive critique protocol]
- Reflection: [What worked, what's next]

Assessment: [Formative feedback on process and product]
Differentiation: [Multiple entry points and pathways]
`;
}

// ==================== TWO-PASS PROMPTING ====================

/**
 * Build the first pass prompt - generates an outline/plan
 */
export function buildLessonPlanOutlinePrompt(
  config: LessonPlanConfig,
  context: CourseContext
): string {
  // Input validation
  if (config.duration < 15) {
    throw new Error('Lesson duration must be at least 15 minutes');
  }
  if (!context.courseTitle || context.courseTitle.trim() === '') {
    throw new Error('Course title is required');
  }

  const courseContextStr = formatCourseContextForPrompt(context);
  const lessonTitle = context.currentLesson?.title ?? context.courseTitle;

  return `
**ROLE:** You are an expert lesson planning consultant.

**TASK:** Create a detailed outline for a ${config.duration}-minute ${config.templateType} lesson plan for "${lessonTitle}".

**CONTEXT:**
${courseContextStr}

${buildThinkingSection(config.templateType)}

**CREATE A STRUCTURED OUTLINE:**

Respond with ONLY a structured outline that includes:
1. Lesson title (engaging and specific)
2. Key learning objectives (2-3 measurable goals)
3. Main sections with time allocations
4. Key activities for each section
5. Assessment approach
6. Differentiation strategies

Keep it concise - this outline will guide the full lesson plan generation.
`;
}

/**
 * Build the second pass prompt - generates full lesson plan from outline
 */
export function buildLessonPlanFromOutlinePrompt(
  config: LessonPlanConfig,
  context: CourseContext,
  outline: string
): string {
  const builders: Record<LessonPlanTemplateType, (config: LessonPlanConfig, context: CourseContext) => string> = {
    standard: buildStandardLessonPlan,
    udl: buildUDLLessonPlan,
    '5e': build5ELessonPlan,
    project_based: buildProjectBasedLessonPlan,
  };
  
  const builder = builders[config.templateType];
  if (!builder) {
    throw new Error(`Unknown lesson plan template type: ${config.templateType}`);
  }
  
  const basePrompt = builder(config, context);
  
  return `${basePrompt}

**IMPORTANT - USE THIS OUTLINE AS YOUR GUIDE:**

${outline}

Expand this outline into a complete, detailed lesson plan following the format above. Be specific with activities, examples, and instructions. Do not deviate from the outline's structure.`;
}

// ==================== MAIN PROMPT BUILDER ====================

/**
 * Build lesson plan prompt based on template type and configuration
 * 
 * @param config - Lesson plan configuration
 * @param context - Course context
 * @param twoPass - If true, returns outline prompt for first pass. If false, returns full prompt.
 * @param outline - For second pass, provide the outline from first pass
 */
export function buildLessonPlanPrompt(
  config: LessonPlanConfig,
  context: CourseContext,
  twoPass: boolean = false,
  outline?: string
): string {
  // Input validation
  if (config.duration < 15) {
    throw new Error('Lesson duration must be at least 15 minutes');
  }
  if (!context.courseTitle || context.courseTitle.trim() === '') {
    throw new Error('Course title is required');
  }

  // Two-pass mode
  if (twoPass) {
    if (outline) {
      // Second pass: generate full lesson plan from outline
      return buildLessonPlanFromOutlinePrompt(config, context, outline);
    } else {
      // First pass: generate outline
      return buildLessonPlanOutlinePrompt(config, context);
    }
  }

  // Single-pass mode (legacy)
  const builders: Record<LessonPlanTemplateType, (config: LessonPlanConfig, context: CourseContext) => string> = {
    standard: buildStandardLessonPlan,
    udl: buildUDLLessonPlan,
    '5e': build5ELessonPlan,
    project_based: buildProjectBasedLessonPlan,
  };
  
  const builder = builders[config.templateType];
  if (!builder) {
    throw new Error(`Unknown lesson plan template type: ${config.templateType}`);
  }
  
  return builder(config, context);
}

/**
 * Course assessment validation schemas
 */

import { z } from 'zod';
import { CommonSchemas } from '../common.js';

export const AssessmentSchemas = {
  // Assessment creation
  createAssessment: z.object({
    course_id: CommonSchemas.id,
    title: CommonSchemas.shortText,
    description: CommonSchemas.mediumText.optional(),
    assessment_type: z.enum(['quiz', 'assignment', 'project', 'exam']),
    total_marks: z.number().int().positive(),
    passing_marks: z.number().int().positive(),
    duration: z.number().int().positive().optional(), // in minutes
    attempts_allowed: z.number().int().positive().default(1),
    is_published: CommonSchemas.boolean.default(false),
    due_date: CommonSchemas.dateString.optional(),
    instructions: CommonSchemas.longText.optional(),
    metadata: CommonSchemas.metadata
  }).refine(
    (data) => data.passing_marks <= data.total_marks,
    {
      message: "Passing marks cannot exceed total marks",
      path: ["passing_marks"]
    }
  ),
  
  // Question creation
  createQuestion: z.object({
    assessment_id: CommonSchemas.id,
    question_text: CommonSchemas.longText,
    question_type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay', 'code']),
    marks: z.number().int().positive(),
    order_index: z.number().int().min(0),
    options: z.array(z.object({
      text: CommonSchemas.mediumText,
      is_correct: CommonSchemas.boolean.default(false)
    })).max(10).optional(), // Limit options to prevent oversized requests
    correct_answer: CommonSchemas.mediumText.optional(),
    explanation: CommonSchemas.mediumText.optional(),
    metadata: CommonSchemas.metadata
  }).superRefine((data, ctx) => {
    // Conditional validation based on question type
    if (data.question_type === 'multiple_choice') {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: 'custom',
          message: "Multiple choice questions must have at least 2 options",
          path: ["options"]
        });
      }
      if (data.options && !data.options.some(opt => opt.is_correct)) {
        ctx.addIssue({
          code: 'custom',
          message: "Multiple choice questions must have at least one correct option",
          path: ["options"]
        });
      }
    }
    
    if (data.question_type === 'true_false') {
      if (!data.correct_answer) {
        ctx.addIssue({
          code: 'custom',
          message: "True/false questions must have a correct answer",
          path: ["correct_answer"]
        });
      }
      if (data.correct_answer && !['true', 'false'].includes(data.correct_answer.toLowerCase())) {
        ctx.addIssue({
          code: 'custom',
          message: "True/false questions must have 'true' or 'false' as correct answer",
          path: ["correct_answer"]
        });
      }
    }
    
    if (['short_answer', 'essay', 'code'].includes(data.question_type)) {
      if (!data.correct_answer) {
        ctx.addIssue({
          code: 'custom',
          message: `${data.question_type.replace('_', ' ')} questions should have a correct answer or sample answer`,
          path: ["correct_answer"]
        });
      }
    }
  }),
  
  // Assessment submission
  submitAssessment: z.object({
    assessment_id: CommonSchemas.id,
    answers: z.array(z.object({
      question_id: CommonSchemas.id,
      answer: z.union([
        CommonSchemas.shortText, // for text answers
        z.array(CommonSchemas.id), // for multiple choice - using consistent ID type
        CommonSchemas.boolean // for true/false
      ]),
      time_spent: z.number().int().min(0).optional() // in seconds
    })).min(1).max(100), // Prevent empty submissions and limit array size
    submitted_at: CommonSchemas.dateString.optional(),
    metadata: CommonSchemas.metadata
  }),
  
  // Assessment grading
  gradeAssessment: z.object({
    submission_id: CommonSchemas.id,
    grades: z.array(z.object({
      question_id: CommonSchemas.id,
      marks_awarded: z.number().int().min(0), // Enforce integer marks
      feedback: CommonSchemas.mediumText.optional()
    })).max(100), // Limit grades array size
    total_marks: z.number().int().min(0), // Ensure integer total marks
    feedback: CommonSchemas.longText.optional(),
    graded_by: CommonSchemas.id.optional()
  })
} as const;

export const {
  createAssessment,
  createQuestion,
  submitAssessment,
  gradeAssessment
} = AssessmentSchemas;
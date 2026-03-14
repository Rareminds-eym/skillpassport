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
  }),
  
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
    })).optional(),
    correct_answer: CommonSchemas.mediumText.optional(),
    explanation: CommonSchemas.mediumText.optional(),
    metadata: CommonSchemas.metadata
  }),
  
  // Assessment submission
  submitAssessment: z.object({
    assessment_id: CommonSchemas.id,
    answers: z.array(z.object({
      question_id: CommonSchemas.id,
      answer: z.union([
        CommonSchemas.shortText, // for text answers
        z.array(CommonSchemas.stringId), // for multiple choice
        CommonSchemas.boolean // for true/false
      ]),
      time_spent: z.number().int().min(0).optional() // in seconds
    })),
    submitted_at: CommonSchemas.dateString.optional(),
    metadata: CommonSchemas.metadata
  }),
  
  // Assessment grading
  gradeAssessment: z.object({
    submission_id: CommonSchemas.id,
    grades: z.array(z.object({
      question_id: CommonSchemas.id,
      marks_awarded: z.number().min(0),
      feedback: CommonSchemas.mediumText.optional()
    })),
    total_marks: z.number().min(0),
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
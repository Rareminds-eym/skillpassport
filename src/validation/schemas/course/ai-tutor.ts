/**
 * AI Tutor validation schemas for course API
 */

import { z } from 'zod';
import { CommonSchemas } from '../common.js';

export const AiTutorSchemas = {
  // AI Tutor Suggestions
  tutorSuggestions: z.object({
    lessonId: z.string().min(1) // Accept string IDs (UUIDs)
  }),
  
  // AI Tutor Chat
  tutorChat: z.object({
    courseId: z.string().min(1), // Accept string IDs (UUIDs)
    lessonId: z.string().min(1).optional(), // Accept string IDs (UUIDs)
    message: CommonSchemas.mediumText,
    conversationId: CommonSchemas.stringId.optional(),
    context: z.object({
      previousMessages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: CommonSchemas.mediumText,
        timestamp: CommonSchemas.dateString.optional()
      })).optional(),
      lessonContent: CommonSchemas.longText.optional(),
      studentProgress: z.number().min(0).max(100).optional()
    }).optional()
  }),
  
  // AI Tutor Feedback
  tutorFeedback: z.object({
    conversationId: CommonSchemas.stringId,
    messageIndex: z.number().int().min(0),
    rating: z.number().int().refine(val => val === 1 || val === -1, {
      message: "Rating must be 1 (thumbs up) or -1 (thumbs down)"
    }),
    feedbackText: CommonSchemas.mediumText.optional()
  }),
  
  // AI Tutor Progress (GET query params)
  tutorProgressQuery: z.object({
    courseId: z.string().min(1), // Accept string IDs (UUIDs)
    lessonId: z.string().min(1).optional(), // Accept string IDs (UUIDs)
    moduleId: z.string().min(1).optional(), // Accept string IDs (UUIDs)
    userId: z.string().min(1).optional() // Accept string IDs (UUIDs)
  }),
  
  // AI Tutor Progress (POST body)
  tutorProgressUpdate: z.object({
    courseId: z.string().min(1), // Accept string IDs (UUIDs)
    lessonId: z.string().min(1), // Accept string IDs (UUIDs)
    status: z.enum(['not_started', 'in_progress', 'completed']),
    timeSpent: z.number().int().min(0).optional(), // in seconds
    metadata: CommonSchemas.metadata.optional()
  }),
  
  // AI Video Summarizer
  videoSummarizer: z.object({
    videoUrl: CommonSchemas.url,
    lessonId: z.string().min(1).optional(), // Accept string IDs (UUIDs)
    courseId: z.string().min(1).optional(), // Accept string IDs (UUIDs)
    language: z.string().length(2).default('en'), // ISO 639-1 language code
    options: z.object({
      includeTranscript: CommonSchemas.boolean.default(true),
      summaryLength: z.enum(['short', 'medium', 'detailed']).default('medium'),
      extractKeyPoints: CommonSchemas.boolean.default(true),
      generateQuestions: CommonSchemas.boolean.default(false)
    }).optional()
  })
} as const;

// Path parameter schemas for course AI endpoints
export const AiTutorPathParams = {
  lessonId: z.object({
    lessonId: z.string().min(1) // Accept string IDs (UUIDs)
  }),
  
  conversationId: z.object({
    conversationId: CommonSchemas.stringId
  })
} as const;

// Export individual schemas
export const {
  tutorSuggestions,
  tutorChat,
  tutorFeedback,
  tutorProgressQuery,
  tutorProgressUpdate,
  videoSummarizer
} = AiTutorSchemas;
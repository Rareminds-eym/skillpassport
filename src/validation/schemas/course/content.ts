/**
 * Course content validation schemas
 */

import { z } from 'zod';
import { CommonSchemas } from '../common.js';

// Course creation and management schemas
export const CourseSchemas = {
  // Course creation
  createCourse: z.object({
    title: CommonSchemas.shortText,
    description: CommonSchemas.longText,
    category: CommonSchemas.shortText,
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    duration: z.number().int().positive(), // in minutes
    price: z.number().min(0).optional(),
    currency: z.string().length(3).default('USD'),
    tags: CommonSchemas.stringArray.optional(),
    prerequisites: CommonSchemas.stringArray.optional(),
    learning_outcomes: CommonSchemas.stringArray.min(1), // Ensure at least one learning outcome
    thumbnail_url: CommonSchemas.url.optional(),
    is_published: CommonSchemas.boolean.default(false),
    metadata: CommonSchemas.metadata
  }),
  
  // Course update
  updateCourse: z.object({
    id: CommonSchemas.id,
    title: CommonSchemas.shortText.optional(),
    description: CommonSchemas.longText.optional(),
    category: CommonSchemas.shortText.optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    duration: z.number().int().positive().optional(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    tags: CommonSchemas.stringArray.optional(),
    prerequisites: CommonSchemas.stringArray.optional(),
    learning_outcomes: CommonSchemas.stringArray.optional(),
    thumbnail_url: CommonSchemas.url.optional(),
    is_published: CommonSchemas.boolean.optional(),
    metadata: CommonSchemas.metadata
  }),
  
  // Course query parameters
  courseQuery: z.object({
    category: CommonSchemas.shortText.optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    is_published: CommonSchemas.boolean.optional(),
    tags: z.string().optional(), // comma-separated tags
    min_price: z.coerce.number().min(0).optional(),
    max_price: z.coerce.number().min(0).optional(),
    ...CommonSchemas.searchQuery.shape
  }).refine(
    (data) => !data.min_price || !data.max_price || data.min_price <= data.max_price,
    {
      message: "Minimum price cannot be greater than maximum price",
      path: ["min_price"]
    }
  ),
  
  // Module management
  createModule: z.object({
    course_id: CommonSchemas.id,
    title: CommonSchemas.shortText,
    description: CommonSchemas.mediumText.optional(),
    order_index: z.number().int().min(0),
    duration: z.number().int().positive().optional(),
    is_published: CommonSchemas.boolean.default(false),
    metadata: CommonSchemas.metadata
  }),
  
  updateModule: z.object({
    id: CommonSchemas.id,
    title: CommonSchemas.shortText.optional(),
    description: CommonSchemas.mediumText.optional(),
    order_index: z.number().int().min(0).optional(),
    duration: z.number().int().positive().optional(),
    is_published: CommonSchemas.boolean.optional(),
    metadata: CommonSchemas.metadata
  }),
  
  // Lesson management
  createLesson: z.object({
    module_id: CommonSchemas.id,
    title: CommonSchemas.shortText,
    content: CommonSchemas.longText,
    lesson_type: z.enum(['video', 'text', 'quiz', 'assignment', 'interactive']),
    order_index: z.number().int().min(0),
    duration: z.number().int().positive().optional(),
    video_url: CommonSchemas.url.optional(),
    resources: z.array(z.object({
      title: CommonSchemas.shortText,
      url: CommonSchemas.url,
      type: z.enum(['pdf', 'video', 'link', 'document'])
    })).max(50).optional(), // Limit resources array to prevent oversized payloads
    is_published: CommonSchemas.boolean.default(false),
    metadata: CommonSchemas.metadata
  }).superRefine((data, ctx) => {
    // Conditional validation: video lessons must have video_url
    if (data.lesson_type === 'video' && !data.video_url) {
      ctx.addIssue({
        code: 'custom',
        message: "Video lessons must have a video URL",
        path: ["video_url"]
      });
    }
  }),
  
  updateLesson: z.object({
    id: CommonSchemas.id,
    title: CommonSchemas.shortText.optional(),
    content: CommonSchemas.longText.optional(),
    lesson_type: z.enum(['video', 'text', 'quiz', 'assignment', 'interactive']).optional(),
    order_index: z.number().int().min(0).optional(),
    duration: z.number().int().positive().optional(),
    video_url: CommonSchemas.url.optional(),
    resources: z.array(z.object({
      title: CommonSchemas.shortText,
      url: CommonSchemas.url,
      type: z.enum(['pdf', 'video', 'link', 'document'])
    })).max(50).optional(), // Limit resources array to prevent oversized payloads
    is_published: CommonSchemas.boolean.optional(),
    metadata: CommonSchemas.metadata
  }).superRefine((data, ctx) => {
    // Conditional validation: video lessons must have video_url
    if (data.lesson_type === 'video' && !data.video_url) {
      ctx.addIssue({
        code: 'custom',
        message: "Video lessons must have a video URL",
        path: ["video_url"]
      });
    }
  }),
  
  // Course enrollment
  enrollCourse: z.object({
    course_id: CommonSchemas.id,
    user_id: CommonSchemas.id.optional(), // Optional if derived from auth
    enrollment_type: z.enum(['free', 'paid', 'trial']).default('free'),
    payment_reference: CommonSchemas.stringId.optional()
  }),
  
  // Progress tracking
  updateProgress: z.object({
    course_id: CommonSchemas.id,
    lesson_id: CommonSchemas.id,
    progress_percentage: z.number().min(0).max(100),
    completed: CommonSchemas.boolean.default(false),
    time_spent: z.number().int().min(0).optional(), // in seconds
    metadata: CommonSchemas.metadata
  }),
  
  // Course rating and review
  rateCourse: z.object({
    course_id: CommonSchemas.id,
    rating: z.number().int().min(1).max(5), // Ensure integer rating
    review: CommonSchemas.mediumText.optional(),
    is_anonymous: CommonSchemas.boolean.default(false)
  }),
  
  // Bulk operations
  bulkUpdateCourses: z.object({
    course_ids: z.array(CommonSchemas.id).min(1).max(100),
    updates: z.object({
      category: CommonSchemas.shortText.optional(),
      is_published: CommonSchemas.boolean.optional(),
      tags: CommonSchemas.stringArray.optional()
    })
  })
} as const;

// Path parameter schemas
export const CoursePathParams = {
  courseId: z.object({
    id: CommonSchemas.id
  }),
  
  moduleId: z.object({
    id: CommonSchemas.id,
    courseId: CommonSchemas.id.optional()
  }),
  
  lessonId: z.object({
    id: CommonSchemas.id,
    moduleId: CommonSchemas.id.optional(),
    courseId: CommonSchemas.id.optional()
  })
} as const;

// Export individual schemas for easier imports
export const {
  createCourse,
  updateCourse,
  courseQuery,
  createModule,
  updateModule,
  createLesson,
  updateLesson,
  enrollCourse,
  updateProgress,
  rateCourse,
  bulkUpdateCourses
} = CourseSchemas;
// ==================== PROMPT UTILITIES ====================
// Helper functions for building prompts

import type { CourseContext } from '../types.ts';

/**
 * Formats course context into a string for the system prompt
 */
export function formatCourseContextForPrompt(context: CourseContext): string {
  let prompt = `## Course Information
- **Course**: ${context.courseTitle} (${context.courseCode})
- **Description**: ${context.courseDescription}

## Course Structure
`;
  for (const moduleGroup of context.allLessons) {
    prompt += `### ${moduleGroup.title}\n`;
    for (const lesson of moduleGroup.lessons) {
      const isCompleted = context.studentProgress.completedLessons.includes(lesson.lessonId);
      const isCurrent = context.currentLesson?.lessonId === lesson.lessonId;
      const status = isCurrent ? '📍 Current' : isCompleted ? '✅' : '○';
      prompt += `  ${status} ${lesson.title}\n`;
    }
  }

  if (context.currentLesson) {
    prompt += `
## Current Lesson: ${context.currentLesson.title}
**Module**: ${context.currentLesson.moduleTitle}
**Description**: ${context.currentLesson.description || 'No description'}

### Lesson Content
${context.currentLesson.content || 'No content available'}
`;
    if (context.availableResources.length > 0) {
      prompt += `\n### Available Resources\n`;
      for (const resource of context.availableResources) {
        prompt += `- ${resource.name} (${resource.type})\n`;
      }
      
      const resourcesWithContent = context.availableResources.filter(r => r.content);
      if (resourcesWithContent.length > 0) {
        prompt += `\n### Resource Content (Extracted from PDFs/Documents)\n`;
        for (const resource of resourcesWithContent) {
          prompt += `\n#### ${resource.name}\n`;
          const truncatedContent = resource.content!.length > 50000 
            ? resource.content!.slice(0, 50000) + '\n... [content truncated]'
            : resource.content;
          prompt += `${truncatedContent}\n`;
        }
      }
    }
  }

  // Add video summary context if available
  if (context.videoSummary) {
    prompt += `
## Video Content Summary
**AI-Generated Summary:**
${context.videoSummary.summary}

**Key Points from Video:**
${context.videoSummary.keyPoints.map(p => `- ${p}`).join('\n')}

**Topics Covered:**
${context.videoSummary.topics.join(', ')}

**Video Transcript (for reference):**
${context.videoSummary.transcript.slice(0, 10000)}${context.videoSummary.transcript.length > 10000 ? '\n... [transcript truncated]' : ''}
`;
  }

  prompt += `
## Student Progress
- Completed: ${context.studentProgress.completedLessons.length}/${context.studentProgress.totalLessons} lessons (${context.studentProgress.completionPercentage}%)
`;
  return prompt;
}

/**
 * Generates a prompt for creating conversation titles
 */
export function generateConversationTitlePrompt(firstMessage: string, courseTitle: string): string {
  return `Generate a short, descriptive title (max 50 characters) for a tutoring conversation about "${courseTitle}" that starts with this student question:

"${firstMessage}"

Return ONLY the title text, no quotes or extra formatting.`;
}

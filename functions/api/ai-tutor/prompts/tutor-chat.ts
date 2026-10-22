import { PlatformPromptSchema, type PlatformPrompt, type TutorChatHistoryItem, type TutorCourseContext } from '@rareminds-eym/ai-protocol';
import { getConversationPhase, getPhaseInstructions, type ConversationPhase } from '../utils/conversation-phases';
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** SkillPassport-owned learner tutor wording. Reuses product phase instructions; worker model limits remain independent. */

type TutorConversationPhase = ConversationPhase;

/** Product course framing: capped lesson excerpt, key points and resource labels. */
export function formatTutorCourseContext(context: TutorCourseContext): string {
  let prompt = `## Course: ${context.courseTitle}\n`;

  if (context.currentLesson) {
    prompt += `## Current Lesson: ${context.currentLesson.title}\nModule: ${context.currentLesson.moduleTitle}\n\n`;

    if (context.currentLesson.content) {
      const truncatedContent =
        context.currentLesson.content.length > 500
          ? context.currentLesson.content.slice(0, 500) + "..."
          : context.currentLesson.content;
      prompt += `${truncatedContent}\n\n`;
    }

    if (context.videoSummary && context.videoSummary.keyPoints.length > 0) {
      prompt += `Key Points:\n${context.videoSummary.keyPoints.slice(0, 3).map((p) => `- ${p}`).join("\n")}\n\n`;
    }

    if (context.availableResources.length > 0) {
      prompt += `Resources: ${context.availableResources.map((r) => r.name).join(", ")}\n`;
    }
  } else {
    prompt += `${context.courseDescription.slice(0, 200)}...\n`;
  }

  return prompt;
}

function buildLearnerCourseChatPrompt(context: TutorCourseContext, phase: TutorConversationPhase): string {
  const courseContextStr = formatTutorCourseContext(context);

  return `You are a helpful course tutor for learners studying "${context.courseTitle}".

Your job:
- Help the learner understand the course content.
- Answer using the provided course material.
- Explain clearly and step by step.
- Ask guiding questions when useful.
- Do not generate educator-only resources such as worksheets, grading rubrics, lesson plans, or answer keys unless explicitly allowed.

Rules:
- Use the course content as your main source.
- If the course content does not contain enough information, say that clearly.
- Do not invent facts outside the provided material.
- Keep the tone friendly, simple, and educational.

${courseContextStr}

${getPhaseInstructions(phase)}`;
}

/**
 * Learner system prompt with source role defaulting (unknown roles fall back
 * to the learner prompt, exactly as `getCoursePromptByRole`). Educator roles
 * never reach here Ã¢â‚¬â€ the runner denies them (generation is future features;
 * Pages 403s educator chat today).
 */
export function buildTutorSystemPrompt(
  context: TutorCourseContext,
  phase: TutorConversationPhase,
  userRole = "learner",
): string {
  void userRole;
  return buildLearnerCourseChatPrompt(context, phase);
}

export interface TutorChatMessagesInput {
  course: TutorCourseContext;
  phase: TutorConversationPhase;
  userRole?: string;
  history: TutorChatHistoryItem[];
  message: string;
}

/**
 * Message assembly (source parity): system prompt, then at most the last 6
 * persisted turns, then the new user message.
 */
export function buildTutorChatMessages(input: TutorChatMessagesInput): ChatMessage[] {
  return [
    { role: "system", content: buildTutorSystemPrompt(input.course, input.phase, input.userRole) },
    ...input.history.slice(-6).map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    { role: "user", content: input.message } as ChatMessage,
  ];
}

export function buildTutorChatPrompt(input: { course: TutorCourseContext; history: TutorChatHistoryItem[]; message: string; userRole?: string }): PlatformPrompt {
  return PlatformPromptSchema.parse({ id: 'seniorEducator.tutor-chat', version: '1.0.0', system: buildTutorSystemPrompt(input.course, getConversationPhase(input.history.length), input.userRole), user: input.message });
}

import { PlatformPromptSchema, type PlatformPrompt, type TutorSuggestionsInput } from '@rareminds-eym/ai-protocol';

/**
 * SkillPassport-owned tutor-suggestions template.
 *
 * Verbatim template port of the prompt in SkillPassport
 * `functions/api/ai-tutor/handlers/ai-tutor-suggestions.ts`: single user
 * message asking for 3-5 learner questions as a JSON array. Lesson/module
 * resolution and the static `getDefaultQuestions` fallback stay in Pages.
 */
export function buildTutorSuggestionsMessages(input: TutorSuggestionsInput): Array<{ role: 'user'; content: string }> {
  const content = `Based on the following lesson, generate 3-5 helpful questions that a learner might want to ask to better understand the material.

## Lesson: ${input.lessonTitle}
## Module: ${input.moduleTitle}

### Content:
${input.lessonContent || "No content available"}

Generate questions that:
1. Help clarify key concepts from the lesson
2. Explore practical applications of the material
3. Connect this lesson to broader course themes
4. Address common points of confusion

Return ONLY a JSON array of question strings, like:
["Question 1?", "Question 2?", "Question 3?"]`;
  return [{ role: "user", content }];
}

export function buildTutorSuggestionsPrompt(input: TutorSuggestionsInput): PlatformPrompt {
  return PlatformPromptSchema.parse({ id: 'seniorEducator.suggest', version: '1.0.0', user: buildTutorSuggestionsMessages(input)[0].content });
}

import { DEFAULT_WORKSHEET_CONFIG, type WorksheetConfig } from '../types/worksheet';
import { DEFAULT_LESSON_PLAN_CONFIG, type LessonPlanConfig } from '../types/lesson-plan';
import { EDUCATOR_FACILITATOR_PROMPTS, resolveEducatorFacilitator } from './facilitator-prompts';

export const PERSONAS = EDUCATOR_FACILITATOR_PROMPTS;
export type Persona = keyof typeof PERSONAS;
export interface TeachingMessage {
  id: string;
  role?: string;
  content?: string;
  facilitator?: Persona;
  facilitatorMode?: Persona | 'auto';
  worksheetConfig?: WorksheetConfig;
  lessonPlanConfig?: LessonPlanConfig;
  worksheetVariants?: unknown[];
}
export function isPersona(value: unknown): value is Persona {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PERSONAS, value);
}

/** Conservative command routing: questions about resources do not regenerate them. */
export function routeTeachingMessage(message: string, history: TeachingMessage[], requested?: Persona | 'auto') {
  let text = message.toLowerCase();
  const materialWords = /\b(worksheet|quiz|question paper|questions|mcqs?|lesson plan)\b/;
  const requestWords = /\b(create|generate|draft|prepare|build|make|write|develop|give|need|want)\b/;
  // Resolve a clarification reply against the actual preceding user request.
  // Do not infer an assignable artifact from arbitrary assistant prose.
  const lastReply = [...history].reverse().find(item => item.role === 'assistant');
  const lastRequest = [...history].reverse().find(item => item.role === 'user');
  const awaitingDetails = lastReply && !lastReply.worksheetVariants?.length && !lastReply.lessonPlanConfig &&
    /\b(clarif\w*|specify|specific topics|do you want|what topic|which topic)\b/i.test(lastReply.content ?? '');
  if (awaitingDetails && lastRequest?.content && materialWords.test(lastRequest.content.toLowerCase()) &&
      requestWords.test(lastRequest.content.toLowerCase()) &&
      /\b(yes|general|go ahead|proceed|standard|any topic|both|beginner|intermediate|advanced)\b/.test(text) &&
      !/\b(no|don't|do not|cancel|stop|instead|explain)\b/.test(text)) {
    text = lastRequest.content.toLowerCase() + '\n' + text;
  }
  const previous = [...history].reverse();
  const savedMode = previous.find(m => m.facilitatorMode)?.facilitatorMode;
  let mode = requested ?? (savedMode === 'auto' || isPersona(savedMode) ? savedMode : 'auto');
  const namedRole = text.match(/\b(?:act as|switch to|use the) (?:an? |the )?(organizer|facilitator of learning|individualized support|resource provider|problem solver|mentor and guide)\b/);
  if (namedRole) mode = namedRole[1].replace(/ /g, '-') as Persona;
  if (/\b(?:switch to|use|return to) automatic(?: persona| selection| mode)?\b/.test(text)) mode = 'auto';
  const revision = /\b(revise|rewrite|regenerate|change|adapt|simplify|replace|update|make it|make that)\b/.test(text);
  const negated = /\b(don't|do not|how (?:do|can|should)|can (?:i|we))\b/.test(text);
  const create = requestWords.test(text) && !negated;
  const status = !create && !revision && /\b(results?|scores?|marks?|submissions?|submitted|assigned|completion|progress)\b/.test(text);
  const assignmentFollowup = /\d/.test(text) && /(?:\d{1,4}[/-]\d{1,2}|\d{1,2}[:.]\d{2})/.test(text) &&
    /\b(assignment|assign|publish|deadline|due date)\b/i.test(lastReply?.content ?? '');
  const assign = assignmentFollowup || !status && /\b(assign|send|publish|allocate)\b/.test(text) && !/\b(don't|do not|how|can i)\b/.test(text);
  const lastMaterial = previous.find(m => m.worksheetConfig || m.lessonPlanConfig);
  const revisesMaterial = revision && (/\b(worksheet|quiz|lesson plan|version|resource|material|questions|mcqs?)\b/.test(text) || /\b(it|that|this)\b/.test(text) && !/\b(explanation|learner|support|instruction|pacing|scaffold)\w*\b/.test(text));
  const supportRequirements = /\b(recommend|suggest|specify|requirements|specifications?|adjustments?)\b/.test(text) &&
    /\b(scaffold\w*|differentiat\w*|support|adapt\w*)\b/.test(text) &&
    !/\b(generate|produce|write)\b.{0,40}\b(worksheet|quiz|questions|question set)\b/.test(text);
  const feedbackRequest = /\b(give|provide|draft|write)\s+(?:(?:me|us|some|targeted|constructive|brief|detailed|specific|formative)\s+){0,4}feedback\b/.test(text) ||
    /\b(review|evaluate|explain)\b.{0,35}\b(response|submission|answer|feedback|results?|scores?)\b/.test(text);
  const shortQuestionCount = text.match(/\b(\d{1,2})[ -](?:(?:diagnostic|guided|verification)\s+)?questions?\b/);
  const resourceRequested = /\b(worksheet|quiz|question paper|question bank|mcqs?)\b/.test(text) || Number(shortQuestionCount?.[1]) >= 5;
  const diagnosticDiscussion = !resourceRequested && /\b(diagnostic|misconception|intervention|verification|hints?)\b/.test(text);
  const inquiryDiscussion = !resourceRequested && /\b(inquiry|discovery|investigation|phenomenon|guided questions|exploration)\b/.test(text);
  let worksheetConfig: WorksheetConfig | undefined;
  let lessonPlanConfig: LessonPlanConfig | undefined;
  if (!negated && !assign && !status && !supportRequirements && !feedbackRequest && !diagnosticDiscussion && !inquiryDiscussion && (create || revisesMaterial)) {
    if (/\blesson plan\b/.test(text) || (revisesMaterial && !/\b(worksheet|quiz|questions|question paper|mcqs?)\b/.test(text) && lastMaterial?.lessonPlanConfig)) {
      lessonPlanConfig = { ...(lastMaterial?.lessonPlanConfig ?? DEFAULT_LESSON_PLAN_CONFIG) };
      const minutes = text.match(/\b(\d{1,3})[ -]minutes?\b/);
      if (minutes) lessonPlanConfig.duration = Math.max(5, Math.min(180, Number(minutes[1])));
    } else if (/\b(worksheet|quiz|question paper|questions|mcqs?)\b/.test(text) || (revisesMaterial && lastMaterial?.worksheetConfig)) {
      worksheetConfig = { ...(lastMaterial?.worksheetConfig ?? DEFAULT_WORKSHEET_CONFIG) };
      const count = text.match(/\b(\d{1,2})[ -](?:(?:multiple[ -]choice|mcq)\s+)?(?:questions?|mcqs?)\b/);
      if (count) worksheetConfig.questionCount = Math.max(5, Math.min(30, Number(count[1])));
      if (/\b(multiple[ -]choice|mcqs?)\b/.test(text)) worksheetConfig.templateType = 'multiple_choice';
      const levels: Array<'low' | 'medium' | 'high'> = [];
      if (/\b(beginner|easy|simpler)\b/.test(text)) levels.push('low');
      if (/\b(intermediate|medium)\b/.test(text)) levels.push('medium');
      if (/\b(advanced|harder)\b/.test(text)) levels.push('high');
      const level = /\b(beginner|easy|simpler)\b/.test(text) ? 'low' : /\b(advanced|harder)\b/.test(text) ? 'high' : undefined;
      if (levels.length) { worksheetConfig.difficulty = levels[0]; worksheetConfig.difficultyLevels = levels; }
      else if (level) { worksheetConfig.difficulty = level; worksheetConfig.difficultyLevels = [level]; }
    }
  }
  const automatic: Persona = status || /\b(feedback|rubric|review|evaluate)\b/.test(text) ? 'mentor-and-guide'
    : supportRequirements ? 'individualized-support'
    : diagnosticDiscussion ? 'problem-solver'
    : inquiryDiscussion ? 'facilitator-of-learning'
    : /\b(misconception|confused|struggling|hint|problem|mistake|incorrect|error)\b/.test(text) ? 'problem-solver'
    : /\b(differentiat|scaffold|accessible|individual|adapt)\w*\b/.test(text) ? 'individualized-support'
    : lessonPlanConfig || /\b(plan|schedule|organize|timing)\b/.test(text) ? 'organizer'
    : worksheetConfig || assign ? 'resource-provider' : previous.find(m => isPersona(m.facilitator))?.facilitator ?? 'facilitator-of-learning';
  const facilitator = resolveEducatorFacilitator(mode === 'auto' ? automatic : mode, worksheetConfig ? 'worksheet' : lessonPlanConfig ? 'lesson-plan' : 'chat');
  return { assignmentReviewRequested: assign, mode, facilitator, worksheetConfig, lessonPlanConfig,
    assignmentSourceId: assign ? previous.find(m => m.worksheetVariants?.length)?.id : undefined };
}

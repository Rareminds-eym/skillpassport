import { formatAssessmentText } from './formatAssessmentText';

/** Hide a rubric that merely restates the answer; retain actual grading guidance. */
export function answerExplanation(rubric: string | undefined, acceptedAnswers: string[] = []): string {
  if (!rubric) return '';
  const normalize = (text: string) => formatAssessmentText(text)
    .replace(/[*`]/g, '')
    .replace(/^\s*(?:(?:the\s+)?correct\s+answer(?:\s+is)?|answer(?:\s+is)?)\s*:?\s*/i, '')
    .replace(/[\s*`$]+/g, '')
    .replace(/[.!]+$/, '')
    .toLowerCase();
  const explanation = normalize(rubric);
  return acceptedAnswers.some(answer => normalize(answer) === explanation)
    || (acceptedAnswers.length > 0 && normalize(acceptedAnswers.join('; ')) === explanation) ? '' : rubric;
}

const STUDENT = '<!-- STUDENT_WORKSHEET -->';
const PRIVATE = '<!-- PRIVATE_SOLUTIONS -->';
const END = '<!-- END_WORKSHEET -->';
export const WORKSHEET_ASSIGNMENT_FORMAT = `
Assignment format overrides conflicting formatting instructions above:
Start with ${STUDENT}, then the title, instructions and all student questions.
Never mark the correct choice, fill in blanks, or include answers/explanations in student questions.
Then write ${PRIVATE}, followed by all answer keys, sample answers, grading guidance and solutions (or leave empty if none requested).
Use Markdown headings: "## Questions" before the questions and "## Answer key" before private answers. Restart answer-key numbering at 1; answers are not additional questions.
For multiple-choice questions put the question on its own line, then each option A), B), C), D) on a separate indented line. Never place option A on the question line. Separate questions with a blank line.
Finish with ${END}. Use each marker exactly once, as a literal unescaped HTML comment on its own line. Do not put markers or the worksheet inside backticks or code fences. Keep student content and private content strictly separate.`;

export interface WorksheetSeparationOptions { templateType?: string; questionCount?: number; includeAnswerKey?: boolean }

function splitLegacyWorksheet(content: string, options?: WorksheetSeparationOptions) {
  // Older fill-in-the-blank worksheets have a verifiable question form and separate key.
  // Other legacy formats may mark correct options inline, so do not infer their safety.
  if (options?.templateType !== 'fill_in_blank' || !Number.isInteger(options.questionCount) || !options.questionCount) {
    throw new Error('Regenerate this worksheet to prepare separate learner questions and private answers automatically.');
  }
  const lines = content.split(/\r?\n/);
  const privateIndex = lines.findIndex(line => /^(?:answer key|sample answers|solutions|model answers|grading rubric|scoring guide)\s*:?$/i.test(line.replace(/^\s*#{1,6}\s*/, '').replace(/\*\*|__/g, '').trim()));
  if (privateIndex < 0 && options.includeAnswerKey !== false) throw new Error('The worksheet answer section could not be identified safely. Please regenerate it.');
  const studentContent = (privateIndex < 0 ? lines : lines.slice(0, privateIndex)).join('\n').trim();
  const normalized = studentContent.replace(/\*\*/g, '');
  const blanks = normalized.split('\n').filter(line => /^\s*\d+[.)]\s+.*_{2,}/.test(line));
  if (blanks.length !== options.questionCount || /\b(?:correct answer|answer|solution|explanation)\s*:\s*\S/i.test(normalized) || /[✓✔✅]/u.test(normalized)) {
    throw new Error('The learner questions could not be separated safely. Please regenerate this worksheet.');
  }
  return { studentContent, solutions: privateIndex < 0 ? '' : lines.slice(privateIndex).join('\n').trim() };
}

export function splitWorksheetContent(content: string, options?: WorksheetSeparationOptions): { studentContent: string; solutions: string } {
  // Models sometimes quote or HTML-escape delimiters. Normalize only known protocol markers.
  content = content.replace(/```(?:markdown|md|html|text)?[ \t]*\n([\s\S]*?)```/gi, (block, body: string) => /(?:STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)/.test(body) ? body : block)
    .replace(/`((?:\\?<!--|&lt;!--)\s*(?:STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)\s*--(?:\\?>|&gt;))`/gi, '$1')
    .replace(/(?:\\?<!--|&lt;!--)\s*(STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)\s*--(?:\\?>|&gt;)/gi, (_match, name: string) => `<!-- ${name.toUpperCase()} -->`);
  if (![STUDENT, PRIVATE, END].some(marker => content.includes(marker))) return splitLegacyWorksheet(content, options);
  const start = content.indexOf(STUDENT), middle = content.indexOf(PRIVATE), end = content.indexOf(END);
  if (start < 0 || middle <= start || end <= middle || [STUDENT, PRIVATE, END].some(marker => content.split(marker).length !== 2)) {
    throw new Error('Regenerate this worksheet to prepare separate learner questions and private answers automatically.');
  }
  const studentContent = content.slice(start + STUDENT.length, middle).trim();
  if (!studentContent) throw new Error('The generated learner worksheet is empty. Please regenerate it.');
  return { studentContent, solutions: content.slice(middle + PRIVATE.length, end).trim() };
}

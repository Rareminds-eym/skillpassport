import { describe, expect, it } from 'vitest';
import { stripWorksheetMarkers, formatWorksheetForDisplay } from '../worksheetPresentation';
import { parseMarkdownLines } from '../markdownParser';

describe('worksheet presentation markers', () => {
  it('separates a bare answer list from the questions without changing the saved source', () => {
    const source = '<!-- STUDENT_WORKSHEET -->\n1. First?\n2. Second?\n<!-- PRIVATE_SOLUTIONS -->\n1. C\n2. A\n<!-- END_WORKSHEET -->';
    expect(formatWorksheetForDisplay(source)).toContain('## Answer key and grading\n\n\n1. C');
    expect(stripWorksheetMarkers(source)).not.toContain('## Answer key');
    expect(source).toContain('<!-- PRIVATE_SOLUTIONS -->');
  });
  it('preserves existing private headings and does not invent an empty answer key', () => {
    expect(formatWorksheetForDisplay('<!-- PRIVATE_SOLUTIONS -->\n## Answer key\n1. B')).not.toContain('Answer key and grading');
    expect(formatWorksheetForDisplay('<!-- STUDENT_WORKSHEET -->\n1. Question\n<!-- PRIVATE_SOLUTIONS -->\n<!-- END_WORKSHEET -->')).not.toContain('Answer key');
  });
  it('places inline option A on a separate line only for protocol worksheets', () => {
    expect(formatWorksheetForDisplay('<!-- STUDENT_WORKSHEET -->\n1. What comes first? A) Plan\n   B) Delay')).toContain('1. What comes first?  \n   A) Plan');
    const conversation = '1. What comes first? A) Plan';
    expect(formatWorksheetForDisplay(conversation)).toBe(conversation);
  });
  it('compacts blank lines between options and aligns double-digit question options', () => {
    const formatted = formatWorksheetForDisplay('<!-- STUDENT_WORKSHEET -->\n10. Choose? A) Plan\n\n    B) Delay\n\n    C) Skip\n\n    D) Stop\n<!-- PRIVATE_SOLUTIONS -->\n1. A');
    expect(formatted).toContain('10. Choose?  \n    A) Plan  \n    B) Delay  \n    C) Skip  \n    D) Stop');
    expect(formatted).toContain('## Answer key and grading');
  });
  it.each([
    '<!-- STUDENT_WORKSHEET -->',
    '&lt;!-- STUDENT_WORKSHEET --&gt;',
    '\\<!-- STUDENT_WORKSHEET -->',
    '`<!-- STUDENT_WORKSHEET -->`',
  ])('removes delimiter %s while preserving teaching content', marker => {
    expect(stripWorksheetMarkers(`${marker}\n## Questions\n1. Set goals.\n<!-- PRIVATE_SOLUTIONS -->\nAnswers\n<!-- END_WORKSHEET -->`))
      .toBe('\n## Questions\n1. Set goals.\n\nAnswers\n');
  });
  it('unwraps a fenced worksheet but preserves ordinary code examples', () => {
    expect(stripWorksheetMarkers('```markdown\n<!-- STUDENT_WORKSHEET -->\n# Questions\n```')).toBe('\n# Questions\n');
    expect(stripWorksheetMarkers('```js\nconsole.log(1);\n```')).toBe('```js\nconsole.log(1);\n```');
  });
  it('suppresses incomplete delimiters while streaming', () => {
    expect(stripWorksheetMarkers('Questions\n<!-- STU', true)).toBe('Questions\n');
    expect(stripWorksheetMarkers('Questions\n&lt;!-- PRIVATE_SO', true)).toBe('Questions\n');
    expect(stripWorksheetMarkers('x <', false)).toBe('x <');
  });
  it('keeps protocol markers out of parsed Word document text', () => {
    expect(JSON.stringify(parseMarkdownLines('&lt;!-- STUDENT_WORKSHEET --&gt;\nQuestions\n`<!-- END_WORKSHEET -->`'))).not.toContain('WORKSHEET');
  });
});

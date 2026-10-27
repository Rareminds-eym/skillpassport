import { describe, expect, it } from 'vitest';
import { stripWorksheetMarkers } from '../worksheetPresentation';
import { parseMarkdownLines } from '../markdownParser';

describe('worksheet presentation markers', () => {
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

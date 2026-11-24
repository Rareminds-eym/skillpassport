const NAMES = ['STUDENT_WORKSHEET', 'PRIVATE_SOLUTIONS', 'END_WORKSHEET'];
const MARKER = /(?:\\?<!--|&lt;!--)\s*(?:STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)\s*--(?:\\?>|&gt;)/gi;

/** Presentation only: never apply this to saved generation/source data. */
export function stripWorksheetMarkers(content: string, streaming = false, separateSolutions = false): string {
  let text = content.replace(/```(?:markdown|md|html|text)?[ \t]*\n([\s\S]*?)```/gi, (block, body: string) => {
    return /(?:STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)/.test(body) ? body : block;
  });
  text = text.replace(/`((?:\\?<!--|&lt;!--)\s*(?:STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)\s*--(?:\\?>|&gt;))`/gi, '$1');
  text = text.replace(MARKER, (marker, offset: number) => {
    if (!separateSolutions || !marker.toUpperCase().includes('PRIVATE_SOLUTIONS')) return '';
    const remaining = text.slice(offset + marker.length).replace(MARKER, '').trim();
    if (!remaining) return '';
    // A real Markdown heading already breaks the list. Plain labels do not.
    return /^#{1,6}\s/.test(remaining) ? '\n\n' : '\n\n## Answer key and grading\n\n';
  });
  if (streaming) {
    // Hold incomplete delimiter tokens until their purpose is known; avoid flashing them in chat.
    for (const name of NAMES) {
      for (const token of [`<!-- ${name} -->`, `&lt;!-- ${name} --&gt;`, `\\<!-- ${name} -->`]) {
        const max = Math.min(text.length, token.length - 1);
        for (let size = max; size > 0; size--) {
          if (text.endsWith(token.slice(0, size))) { text = text.slice(0, -size); break; }
        }
      }
    }
  }
  return text.replace(/\n{4,}/g, '\n\n\n');
}

/** Preserve the protocol's section boundary without changing saved/assignable content. */
export function formatWorksheetForDisplay(content: string, streaming = false): string {
  const text = stripWorksheetMarkers(content, streaming, true);
  if (!/STUDENT_WORKSHEET/i.test(content)) return text;
  // Normalize only MCQ line layout. Markdown hard breaks keep options on their
  // own lines without white-space rules on list containers or their children.
  const lines = text.split('\n');
  const result: string[] = [];
  let indent = 3;
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) inCode = !inCode;
    if (inCode) { result.push(line); continue; }
    const inlineOption = line.match(/^(\s*\d+[.)]\s+[^\n]*?[?:])\s+([Aa][.)]\s+.+)$/);
    if (inlineOption) { line = inlineOption[1]; lines.splice(i + 1, 0, inlineOption[2]); }
    const question = line.match(/^(\s*\d+[.)]\s+)/);
    if (question) indent = question[1].length;
    const option = /^\s*[A-Da-d][.)]\s+/.test(line);
    const next = lines.slice(i + 1).find(value => value.trim());
    const nextIsOption = !!next && /^\s*[A-Da-d][.)]\s+/.test(next);
    if (!line.trim() && nextIsOption && result.length && result[result.length - 1].endsWith('  ')) continue;
    const formatted = option ? ' '.repeat(indent) + line.trim() : line;
    result.push((question || option) && nextIsOption ? formatted.trimEnd() + '  ' : formatted);
  }
  return result.join('\n');
}

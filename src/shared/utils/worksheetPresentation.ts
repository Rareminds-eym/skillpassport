const NAMES = ['STUDENT_WORKSHEET', 'PRIVATE_SOLUTIONS', 'END_WORKSHEET'];
const MARKER = /(?:\\?<!--|&lt;!--)\s*(?:STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)\s*--(?:\\?>|&gt;)/gi;

/** Presentation only: never apply this to saved generation/source data. */
export function stripWorksheetMarkers(content: string, streaming = false): string {
  let text = content.replace(/```(?:markdown|md|html|text)?[ \t]*\n([\s\S]*?)```/gi, (block, body: string) => {
    return /(?:STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)/.test(body) ? body : block;
  });
  text = text.replace(/`((?:\\?<!--|&lt;!--)\s*(?:STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET)\s*--(?:\\?>|&gt;))`/gi, '$1').replace(MARKER, '');
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

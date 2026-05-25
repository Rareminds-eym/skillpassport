/**
 * Shared markdown parser for export utilities
 * Provides a unified parsing interface for DOCX and PDF exports
 */

export type ParsedLine =
  | { type: 'blank' }
  | { type: 'separator' }
  | { type: 'answer_key' }
  | { type: 'blank_line'; raw: string }
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'bold'; segments: Array<{ text: string; bold: boolean }> }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; n: number; text: string }
  | { type: 'normal'; text: string };

/**
 * Parse markdown content into structured line objects
 */
export function parseMarkdownLines(content: string): ParsedLine[] {
  const lines = content.split('\n');
  const parsed: ParsedLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty lines
    if (!trimmed) {
      parsed.push({ type: 'blank' });
      continue;
    }

    // Skip standalone brand name lines (already shown as watermark)
    if ( trimmed === 'RareMinds') {
      continue;
    }

    // Separator lines
    if (trimmed === '• --' || trimmed === '---' || trimmed === '--') {
      parsed.push({ type: 'separator' });
      continue;
    }

    // Answer Key section marker
    if (trimmed === 'Answer Key:') {
      parsed.push({ type: 'answer_key' });
      continue;
    }

    // Blank answer lines (underscores)
    if (trimmed.includes('__________')) {
      parsed.push({ type: 'blank_line', raw: trimmed });
      continue;
    }

    // Heading level 3 (###)
    if (trimmed.startsWith('###')) {
      parsed.push({
        type: 'heading',
        level: 3,
        text: trimmed.replace(/^###\s*/, ''),
      });
      continue;
    }

    // Heading level 2 (##)
    if (trimmed.startsWith('##')) {
      parsed.push({
        type: 'heading',
        level: 2,
        text: trimmed.replace(/^##\s*/, ''),
      });
      continue;
    }

    // Heading level 1 (#)
    if (trimmed.startsWith('#')) {
      parsed.push({
        type: 'heading',
        level: 1,
        text: trimmed.replace(/^#\s*/, ''),
      });
      continue;
    }

    // Bold text (**text**)
    if (trimmed.includes('**')) {
      const parts = trimmed.split('**');
      const segments: Array<{ text: string; bold: boolean }> = [];

      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) {
          segments.push({
            text: parts[i],
            bold: i % 2 === 1, // Odd indexes are bold
          });
        }
      }

      parsed.push({ type: 'bold', segments });
      continue;
    }

    // Bullet points (- or *)
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      parsed.push({
        type: 'bullet',
        text: trimmed.replace(/^[-*]\s*/, ''),
      });
      continue;
    }

    // Numbered list (1. 2. 3.)
    const numberedMatch = /^(\d+)\.\s+(.*)$/.exec(trimmed);
    if (numberedMatch) {
      parsed.push({
        type: 'numbered',
        n: parseInt(numberedMatch[1], 10),
        text: numberedMatch[2],
      });
      continue;
    }

    // Normal text
    parsed.push({ type: 'normal', text: trimmed });
  }

  return parsed;
}

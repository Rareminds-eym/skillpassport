// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
vi.mock('../logoLoader', () => ({ loadLogo: vi.fn(async (source?: string) => {
  if (process.env.WORKSHEET_PDF_PREVIEW !== '1') return null;
  const { readFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const fullLogo = Boolean(source);
  const data = readFileSync(fullLogo ? 'public/RareMinds ISO Logo-01.png' : `${tmpdir()}/worksheet-watermark.png`);
  return { dataUrl: `data:image/png;base64,${data.toString('base64')}`, naturalWidth: fullLogo ? 4050 : 246, naturalHeight: fullLogo ? 1263 : 253 };
}) }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() }) }));
import { createWorksheetPDF } from '../exportToPDF';

describe('minimal worksheet PDF', () => {
  it('creates a printable document with wrapped questions, options and a rubric table', async () => {
    const questions = Array.from({ length: 18 }, (_, index) => `${index + 1}. ${index % 2 === 0
      ? 'Identify one important task for your week and explain how you would prioritize it alongside your existing commitments. Write a realistic reason for the priority you choose.\nA. Complete the most urgent task first\nB. Work without a plan\nC. Delay every decision\nD. Do every task at once'
      : 'A clear __________ helps you focus on the tasks that matter most.\n\nAnswer: ____________________________________________________________'}`).join('\n\n');
    const doc = await createWorksheetPDF({
      courseTitle: 'Time Management', lessonTitle: 'Intermediate worksheet',
      content: `Title: **Time management in practice**\n\nLearning Objective: Apply prioritization and planning to everyday study decisions.\n\nInstructions: Read each question carefully. Use examples from your own routine.\n\n## Questions\n\n${questions}\n\n## Scoring guide\n\n| Criterion | Points |\n| --- | --- |\n| Clear reasoning | 5 |\n| Relevant examples | 5 |`,
    });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    const pdf = doc.output('arraybuffer');
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-');
    if (process.env.WORKSHEET_PDF_PREVIEW === '1') {
      const { writeFileSync } = await import('node:fs');
      writeFileSync('doc/27102026_worksheet-template-preview.pdf', Buffer.from(pdf));
    }
  });
  it('wraps very long words and answer blanks instead of writing outside the page', async () => {
    const doc = await createWorksheetPDF({ courseTitle: 'Long content', lessonTitle: 'Worksheet', content: `1. ${'A'.repeat(500)}\n2. ${'_'.repeat(500)}` });
    expect(doc.getNumberOfPages()).toBeGreaterThan(0);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(500);
  });
  it('rejects empty content', async () => {
    await expect(createWorksheetPDF({ courseTitle: 'Course', lessonTitle: 'Worksheet', content: ' ' })).rejects.toThrow('Content is empty');
  });
});

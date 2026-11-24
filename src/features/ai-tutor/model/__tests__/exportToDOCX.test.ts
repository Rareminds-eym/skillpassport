// @vitest-environment node
import { expect, it, vi } from 'vitest';
import JSZip from 'jszip';

const mocks = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('file-saver', () => ({ saveAs: mocks.save }));
vi.mock('@/shared/config', () => ({ getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }));
vi.mock('../logoLoader', () => ({
  WATERMARK_CONFIG: { text: 'RareMinds' },
  loadLogo: async () => ({
    arrayBuffer: Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64')).buffer,
    naturalWidth: 400, naturalHeight: 160,
  }),
}));
import { exportToDOCX } from '../exportToDOCX';

it('exports a real Word archive with valid image dimensions and worksheet content', async () => {
  await exportToDOCX({ content: '1. Explain time management.\n\nAnswer: ______________________________', courseTitle: 'Time management', lessonTitle: 'Worksheet', filename: 'worksheet' });
  const [blob, filename] = mocks.save.mock.calls[0];
  expect(filename).toBe('worksheet.docx');
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  expect(zip.file('[Content_Types].xml')).not.toBeNull();
  const xml = await zip.file('word/document.xml')!.async('string');
  expect(xml).toContain('Explain time management.');
  expect(xml).not.toContain('RareMinds');
  expect(xml).not.toContain('w:framePr');
  expect(xml).not.toContain('w:headerReference');
  const extents = [...xml.matchAll(/<(?:wp:extent|a:ext)\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/g)];
  expect(extents.length).toBeGreaterThan(0);
  for (const [, width, height] of extents) {
    expect(Number(width)).toBeLessThanOrEqual(80 * 9525);
    expect(Number(height)).toBeLessThanOrEqual(32 * 9525);
    expect(Number(width)).toBeGreaterThan(0);
    expect(Number(height)).toBeGreaterThan(0);
  }
  expect(Object.keys(zip.files).some(path => path.startsWith('word/media/') && path.endsWith('.png'))).toBe(true);
});

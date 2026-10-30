// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { analyzeResource, cachedAnalysis, officeParts, RESOURCE_ANALYSIS_MODEL } from '../resource-analysis';
const resource = { resourceId: 'resource', name: 'Lesson.pdf', type: 'pdf', url: 'https://files.example.test/lesson.pdf', content: null };
const env = { OPENROUTER_API_KEY: 'test-key', CLOUDFLARE_R2_PUBLIC_URL: 'https://files.example.test' };
afterEach(() => vi.unstubAllGlobals());

describe('Gemini resource analysis', () => {
  it('sends native PDF input to Flash Lite and saves reusable evidence', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('%PDF-fixture')).mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: 'stop', message: { content: 'Page 1: Prioritize important tasks.' } }] }));
    vi.stubGlobal('fetch', fetcher);
    const result = await analyzeResource(resource, env);
    const payload = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(payload.model).toBe(RESOURCE_ANALYSIS_MODEL);
    expect(payload.plugins[0].pdf.engine).toBe('native');
    expect(payload.messages[1].content[1].file.file_data).toMatch(/^data:application\/pdf;base64,/);
    expect(cachedAnalysis({ ...resource, content: result.storedContent })).toBe(result.text);
    expect(cachedAnalysis({ ...resource, url: resource.url + '?v=2', content: result.storedContent })).toBeNull();
  });
  it('includes PPTX slide text, speaker notes and embedded images', () => {
    const parts = officeParts(zipSync({
      'ppt/slides/slide1.xml': strToU8('<a:t>Priority &amp; urgency</a:t>'),
      'ppt/notesSlides/notesSlide1.xml': strToU8('<a:t>Explain the matrix</a:t>'),
      'ppt/media/image1.png': new Uint8Array([1, 2, 3]),
    }));
    expect(JSON.stringify(parts)).toContain('Priority & urgency');
    expect(JSON.stringify(parts)).toContain('Explain the matrix');
    expect(parts.some(part => part.type === 'image_url')).toBe(true);
  });
  it('extracts DOCX text and tables without inventing page locations', () => {
    const parts = officeParts(zipSync({ 'word/document.xml': strToU8('<w:p><w:t>Objective</w:t></w:p><w:tbl><w:t>Table value</w:t></w:tbl>') }));
    expect(JSON.stringify(parts)).toContain('Objective');
    expect(JSON.stringify(parts)).toContain('Table value');
  });
  it('uses video input rather than pretending a URL is a transcript', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(new Uint8Array([1]))).mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: 'stop', message: { content: '00:03 Demonstration' } }] }));
    vi.stubGlobal('fetch', fetcher);
    await analyzeResource({ ...resource, url: 'https://files.example.test/clip.mp4' }, env);
    expect(JSON.parse(fetcher.mock.calls[1][1].body).messages[1].content[1].type).toBe('video_url');
  });
  it('rejects unapproved hosts, legacy formats and oversized files', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(analyzeResource({ ...resource, url: 'https://127.0.0.1/secret.pdf' }, env)).rejects.toThrow('host');
    await expect(analyzeResource({ ...resource, url: 'https://files.example.test/slides.ppt' }, env)).rejects.toThrow('conversion');
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockResolvedValue(new Response('large', { headers: { 'Content-Length': String(21 * 1024 * 1024) } }));
    await expect(analyzeResource(resource, env)).rejects.toThrow('20 MB');
  });
  it('does not cache empty or truncated provider output', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('pdf')).mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: 'length', message: { content: 'Partial' } }] })));
    await expect(analyzeResource(resource, env)).rejects.toThrow('did not complete');
  });
});

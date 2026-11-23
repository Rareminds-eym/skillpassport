import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import SubmissionPreview, { docxPreview } from '../SubmissionPreview';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('previews local text without uploading or evaluating it', async () => {
  const file = new File(['1. My answer'], 'answer.txt', { type: 'text/plain' });
  Object.defineProperty(file, 'text', { value: async () => '1. My answer' });
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  render(<SubmissionPreview file={file} />);
  fireEvent.click(screen.getByRole('button', { name: 'Preview document' }));
  expect(await screen.findByText('1. My answer')).toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
});
it('releases PDF object URLs when a selection is replaced or removed', () => {
  const create = vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second'), revoke = vi.fn();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
  const view = render(<SubmissionPreview file={new File(['%PDF-1.7'], 'one.pdf')} />);
  view.rerender(<SubmissionPreview file={new File(['%PDF-1.7'], 'two.pdf')} />);
  expect(revoke).toHaveBeenCalledWith('blob:first'); view.unmount();
  expect(revoke).toHaveBeenCalledWith('blob:second');
});
it('extracts Word preview paragraphs as text rather than rendering untrusted XML/HTML', () => {
  const archive = zipSync({ 'word/document.xml': strToU8('<w:document xmlns:w="urn:test"><w:p><w:r><w:t>Answer one</w:t></w:r></w:p><w:p><w:r><w:t>&lt;script&gt;</w:t></w:r></w:p></w:document>') });
  expect(docxPreview(archive)).toBe('Answer one\n<script>');
});

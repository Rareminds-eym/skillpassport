import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ pdf: vi.fn(), docx: vi.fn() }));
vi.mock('../exportToPDF', () => ({ exportToPDF: mocks.pdf }));
vi.mock('../exportToDOCX', () => ({ exportToDOCX: mocks.docx }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ error: vi.fn(), info: vi.fn() }) }));
import { useExport } from '../useExport';
describe('worksheet export outcome', () => {
  beforeEach(() => vi.clearAllMocks());
  it('rejects a failed PDF export so the caller cannot report success', async () => {
    mocks.pdf.mockRejectedValue(new Error('PDF failed'));
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useExport({ content: 'Questions', courseTitle: 'Course', lessonTitle: 'Beginner', onSuccess }));
    await act(async () => { await expect(result.current.exportAs('pdf')).rejects.toThrow('PDF failed'); });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.exportState.error).toBe('PDF failed');
    expect(result.current.isExporting).toBe(false);
  });
  it('exports the supplied student content as Word', async () => {
    mocks.docx.mockResolvedValue(undefined);
    const { result } = renderHook(() => useExport({ content: 'Student questions only', courseTitle: 'Course', lessonTitle: 'Advanced' }));
    await act(async () => { await result.current.exportAs('docx'); });
    expect(mocks.docx).toHaveBeenCalledWith(expect.objectContaining({ content: 'Student questions only' }));
    expect(mocks.pdf).not.toHaveBeenCalled();
  });
});

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ exportAs: vi.fn().mockResolvedValue(undefined), clearError: vi.fn() }));
vi.mock('../../model/useExport', () => ({ useExport: () => ({
  exportState: { error: null }, exportAs: mocks.exportAs, clearError: mocks.clearError, isExporting: false,
}) }));
import WorksheetExportButton from '../WorksheetExportButton';
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('document export menu', () => {
  it.each([['PDF', 'pdf'], ['DOCX', 'docx']])('exports %s using the selected action', async (label, format) => {
    render(<WorksheetExportButton content="Worksheet" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export content' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: `Export as ${label}` })); });
    expect(mocks.exportAs).toHaveBeenCalledWith(format);
  });
  it('disables export when no material exists', () => {
    render(<WorksheetExportButton content="" />);
    expect(screen.getByRole('button', { name: 'Export content' })).toBeDisabled();
  });
});

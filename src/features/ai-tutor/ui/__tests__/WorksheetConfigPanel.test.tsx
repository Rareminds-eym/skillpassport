import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WorksheetConfigPanel from '../WorksheetConfigPanel';
import { DEFAULT_WORKSHEET_CONFIG } from '../../types/worksheet';

afterEach(cleanup);
function Settings() {
  const [config, setConfig] = useState(DEFAULT_WORKSHEET_CONFIG);
  return <WorksheetConfigPanel config={config} onChange={setConfig} onGenerate={vi.fn()} isGenerating={false} />;
}
describe('worksheet difficulty selection', () => {
  it('selects multiple levels and applies the question count to each', () => {
    render(<Settings />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Beginner' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Advanced' }));
    expect(screen.getByRole('checkbox', { name: 'Intermediate' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Beginner' })).toBeChecked();
    expect(screen.getByText('15 questions × 3 levels = 45 total questions')).toBeInTheDocument();
  });
  it('requires at least one selected level', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Intermediate' }));
    expect(screen.getByRole('button', { name: 'Generate Worksheet' })).toBeDisabled();
    expect(screen.getByText('Select at least one difficulty level.')).toBeInTheDocument();
  });
});

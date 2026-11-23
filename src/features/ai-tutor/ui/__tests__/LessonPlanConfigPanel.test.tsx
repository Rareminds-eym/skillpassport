import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import LessonPlanConfigPanel from '../LessonPlanConfigPanel';
import { DEFAULT_LESSON_PLAN_CONFIG } from '../../types';

afterEach(cleanup);
it('allows changing the grade without losing lesson settings', () => {
  const onChange=vi.fn();
  const config={...DEFAULT_LESSON_PLAN_CONFIG,gradeLevel:'College/University'};
  render(<LessonPlanConfigPanel config={config} onChange={onChange} onGenerate={vi.fn()} isGenerating={false}/>);
  fireEvent.change(screen.getByRole('combobox',{name:'Grade / Level'}),{target:{value:'Grade 9'}});
  expect(onChange).toHaveBeenCalledWith({...config,gradeLevel:'Grade 9'});
});

it('renders availability loading without crashing and disables generation', () => {
  render(<LessonPlanConfigPanel config={{...DEFAULT_LESSON_PLAN_CONFIG,gradeLevel:'Grade 9'}} onChange={vi.fn()} onGenerate={vi.fn()} isGenerating={false} isUsageLoading/>);
  expect(screen.getByRole('status',{name:'Checking availability'})).toBeInTheDocument();
  expect(screen.getByRole('status',{name:'Checking availability'}).closest('button')).toBeDisabled();
});

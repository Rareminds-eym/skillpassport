import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, configure, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CollegeCoursesTab from './CollegeCoursesTab';
configure({ asyncUtilTimeout: 10000 });
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../../model/collegeCourses', () => ({ getLearnerCollegeCourses: mocks.get }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'learner' }) }));
const course = { id: 'curriculum', course_id: 'course', academic_year: '2026-2027', course: { id: 'course', course_code: 'M101', course_name: 'Engineering Mathematics', description: 'Published course description', credits: 3 }, units: [{ id: 'unit', name: 'Linear algebra', code: 'U1', description: 'Vectors and matrices', estimated_duration: 15, duration_unit: 'hours' }], outcomes: [{ id: 'outcome', unit_id: 'unit', outcome_text: 'Apply matrix operations', bloom_level: 'Apply' }] };
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><CollegeCoursesTab /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { vi.resetAllMocks(); mocks.get.mockResolvedValue({ courses: [course], enrollment: { program_name: 'Engineering', semester: 1, academic_year: '2026-2027' }, setupRequired: null }); });
afterEach(cleanup);
describe('learner college courses', () => {
  it('shows saved course metadata and links to the full course page', async () => {
    mount(); const link = await screen.findByRole('link', { name: 'Explore course: Engineering Mathematics' });
    expect(link).toHaveAttribute('href', '/learner/my-class/courses/curriculum');
    expect(screen.getByText('1 unit')).toBeInTheDocument();
    expect(screen.getByText('1 learning outcome')).toBeInTheDocument();
    expect(screen.getByText('3 credits')).toBeInTheDocument();
    expect(screen.getByText('Published course description')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: /Refresh/ })).toBeNull();
  });
  it('filters courses and provides a no-match message', async () => {
    mount(); await screen.findByText('Engineering Mathematics');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Chemistry' } });
    expect(screen.getByRole('status')).toHaveTextContent('No courses match');
    expect(screen.queryByRole('link', { name: /Explore course:/ })).toBeNull();
  });
  it('distinguishes unpublished courses from missing enrollment', async () => {
    mocks.get.mockResolvedValue({ courses: [], enrollment: { semester: 1, academic_year: '2026-2027' }, setupRequired: null });
    mount(); expect(await screen.findByText('No published courses yet')).toBeInTheDocument();
  });
  it('explains how to fix an unknown academic year', async () => {
    mocks.get.mockResolvedValue({ courses: [], enrollment: null, setupRequired: 'Please ask your administrator to set the academic year.' });
    mount(); expect(await screen.findByText(/Please ask your administrator/)).toBeInTheDocument();
    expect(screen.queryByText('No published courses yet')).toBeNull();
  });
  it('shows loading then permits retry after an API failure', async () => {
    mocks.get.mockRejectedValueOnce(new Error('Unavailable'));
    mount(); expect(screen.getByRole('status')).toHaveTextContent('Loading your courses');
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Engineering Mathematics')).toBeInTheDocument();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CollegeCourseReader from './CollegeCourseReader';
configure({ asyncUtilTimeout: 10000 });
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../model/collegeCourses', () => ({ getLearnerCollegeCourses: mocks.get }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'learner' }) }));
const course = { id: 'curriculum', course_id: 'course', academic_year: '2026-2027', course: { course_code: 'M101', course_name: 'Engineering Mathematics', description: 'Saved course description', credits: 3 }, units: [
  { id: 'one', name: 'Linear algebra', code: 'U1', description: 'Saved unit description', estimated_duration: 15, duration_unit: 'hours' },
  { id: 'two', name: 'Calculus', code: 'U2', description: '', estimated_duration: null },
], outcomes: [{ id: 'outcome', unit_id: 'one', outcome_text: 'Apply matrix operations', bloom_level: 'Apply' }, { id: 'second', unit_id: 'two', outcome_text: 'Calculate a derivative', bloom_level: null }] };
function mount(path = '/learner/my-class/courses/curriculum') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path="/learner/my-class/courses/:curriculumId" element={<CollegeCourseReader />} /><Route path="/learner/my-class" element={<p>Returned to course list</p>} /></Routes></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('scrollTo', vi.fn());
  mocks.get.mockResolvedValue({ courses: [course], enrollment: { semester: 1, academic_year: '2026-2027' }, setupRequired: null });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('full-page learner course reader', () => {
  it('shows saved fields on a full page and navigates between units', async () => {
    mount();
    expect(await screen.findByRole('heading', { name: 'Engineering Mathematics' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Saved unit description')).toBeInTheDocument();
    expect(screen.getByText('Apply matrix operations')).toBeInTheDocument();
    expect(screen.queryByText('Calculate a derivative')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Next unit.*Calculus/ }));
    expect(screen.getByRole('heading', { name: 'Calculus' })).toBeInTheDocument();
    expect(screen.getByText('Calculate a derivative')).toBeInTheDocument();
    expect(screen.queryByText('Apply matrix operations')).toBeNull();
    expect(screen.queryByRole('button', { name: /Next unit/ })).toBeNull();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Calculus' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: /Previous unit.*Linear algebra/ }));
    expect(screen.getByText('Apply matrix operations')).toBeInTheDocument();
  });
  it('opens a linked unit and returns to the courses tab URL', async () => {
    mount('/learner/my-class/courses/curriculum?unit=two');
    expect(await screen.findByText('Calculate a derivative')).toBeInTheDocument();
    const back = screen.getByRole('link', { name: 'Back to courses' });
    expect(back).toHaveAttribute('href', '/learner/my-class?tab=courses');
    fireEvent.click(back);
    expect(screen.getByText('Returned to course list')).toBeInTheDocument();
  });
  it('falls back to the first unit when the requested unit does not exist', async () => {
    mount('/learner/my-class/courses/curriculum?unit=removed');
    expect(await screen.findByText('Apply matrix operations')).toBeInTheDocument();
  });
  it('does not show another course when a course URL is unavailable', async () => {
    mount('/learner/my-class/courses/not-assigned');
    expect(await screen.findByRole('heading', { name: 'Course not available' })).toBeInTheDocument();
    expect(screen.queryByText('Saved course description')).toBeNull();
  });
  it('handles a published course without units', async () => {
    mocks.get.mockResolvedValue({ courses: [{ ...course, units: [], outcomes: [] }], enrollment: { semester: 1 } });
    mount();
    expect(await screen.findByText('No units have been published for this course yet.')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Previous and next units' })).toBeNull();
  });
});

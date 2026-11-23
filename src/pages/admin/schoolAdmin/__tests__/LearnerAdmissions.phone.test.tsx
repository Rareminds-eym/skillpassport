import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import type {Dispatch} from 'react';

const fixture = vi.hoisted(() => ({learners: [] as Array<Record<string, unknown>>}));
vi.mock('@/entities/learner/model/useAdminLearners', () => ({useLearners: () => ({learners: fixture.learners, loading: false, error: null, totalCount: fixture.learners.length})}));
vi.mock('@/shared/ui', () => ({SearchBar: ({value, onChange, onDebouncedChange}: {value: string; onChange: Dispatch<string>; onDebouncedChange: Dispatch<string>}) => <input aria-label="Search learners" value={value} onChange={event => {onChange(event.target.value); onDebouncedChange(event.target.value);}}/>, Pagination: () => null}));
vi.mock('@/features/learner-profile', () => ({LearnerProfileDrawer: () => null, SchoolAdmissionNoteModal: () => null}));
vi.mock('@/features/college-admin', () => ({AddLearnerModal: () => null}));
vi.mock('@/features/assessment', () => ({AssessmentReportDrawer: () => null, getLatestResult: vi.fn()}));
vi.mock('@/shared/config/logging', () => ({getLogger: () => ({info: vi.fn(), warn: vi.fn(), error: vi.fn()})}));
import LearnerAdmissions from '../LearnerAdmissions';

afterEach(cleanup);
it.each([
  {phone: '+919000000001', expected: '+919000000001'},
  {phone: undefined, expected: 'Missing'},
])('displays the resolved canonical phone or $expected', ({phone, expected}) => {
  fixture.learners = [{id: 'qa-phone', name: 'QA Canonical learner', email: 'qa@example.invalid', phone, profile: {contact_number: '9000000002'}, subjects: [], skills: [], class: '9-A', grade: '9', section: 'A', admission_status: 'approved'}];
  render(<LearnerAdmissions/>);
  expect(screen.getByText(expected)).toBeInTheDocument();
  expect(screen.queryByText('9000000002')).not.toBeInTheDocument();
});

it.each([
  {query: '9000000001', visible: true},
  {query: '9000000002', visible: false},
])('searches canonical phone with active class filters: $query', ({query, visible}) => {
  fixture.learners = [{id: 'qa-phone', name: 'QA Canonical learner', email: 'qa@example.invalid', phone: '+919000000001', contact_number: '9000000002', profile: {contact_number: '9000000002'}, subjects: [], skills: [], class: '9-A', grade: '9', section: 'A', admission_status: 'approved'}];
  render(<LearnerAdmissions/>);
  fireEvent.click(screen.getAllByRole('button', {name: /^Filters/})[0]);
  fireEvent.click(screen.getByRole('checkbox', {name: /9-a/i}));
  fireEvent.change(screen.getAllByRole('textbox', {name: 'Search learners'})[0], {target: {value: query}});
  expect(Boolean(screen.queryByText('QA Canonical learner'))).toBe(visible);
});

import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { it, expect, vi } from 'vitest';
vi.mock('@/shared/model', () => ({ useUser: () => ({ id: 'user' }) }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: async () => ({ data: [{ id: 'one', lesson_id: 'lesson', resource_id: null, version: 1, status: 'ready' }] }) }));
import CourseIndexStatus from '../CourseIndexStatus';
it('shows source readiness without web indexing controls', async () => {
  render(<QueryClientProvider client={new QueryClient()}><CourseIndexStatus courseId="course" /></QueryClientProvider>);
  expect(await screen.findByText('1/1 sources ready')).toBeInTheDocument();
  expect(screen.getByText('Course knowledge')).toBeInTheDocument();
  expect(screen.queryByText(/course:index/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Index course', hidden: true })).not.toBeInTheDocument();
});

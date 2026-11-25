import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddLearnerModal from '../AddLearnerModal';

const f = vi.hoisted(() => ({
  post: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  parse: vi.fn(),
  queue: vi.fn(),
}));

vi.mock('@/shared/api/apiClient', () => ({ apiPost: f.post }));
vi.mock('@/shared/api/storageApiService', () => ({ uploadFile: vi.fn() }));
vi.mock('@/entities/user/api/userApiService', () => ({
  default: { createLearner: f.create, updatelearnerDocuments: f.update },
}));
vi.mock('@/shared/model/authStore', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'admin', email: 'admin@example.test', role: 'college_admin' } }) },
}));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: {} }));
vi.mock('@/features/college-admin/api/learnerAdmissionService', () => ({
  learnerAdmissionService: { queueBulkUpload: f.queue },
}));
vi.mock('papaparse', async () => {
  const actual = await vi.importActual<{ default: typeof import('papaparse') }>('papaparse');
  return { default: { ...actual.default, parse: f.parse } };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

it('shows seat limit banner and disables manual Add Learner when 0 seats remain', () => {
  render(
    <AddLearnerModal
      isOpen
      onClose={() => {}}
      seatAvailability={{ limited: true, used: 10, limit: 10, remaining: 0 }}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Manual Entry' }));
  expect(screen.getByRole('status')).toHaveTextContent('10 / 10');
  expect(screen.getByRole('status')).toHaveTextContent('0 remaining');
  expect(screen.getByRole('button', { name: 'Add Learner' })).toBeDisabled();
});

it('shows error and disables CSV Import when valid CSV rows exceed remaining seats', async () => {
  f.post.mockResolvedValue({
    data: {
      id: 'college-1',
      organization_type: 'college',
      seat_availability: { limited: true, used: 9, limit: 10, remaining: 1 },
    },
  });
  f.parse.mockImplementation((_file: File, options: { complete: (result: unknown) => Promise<void> }) => {
    void options.complete({
      errors: [],
      data: [
        { name: 'Learner One', email: 'one@example.test', contactnumber: '9876543210' },
        { name: 'Learner Two', email: 'two@example.test', contactnumber: '9876543211' },
      ],
    });
  });

  const { container } = render(<AddLearnerModal isOpen onClose={() => {}} />);
  const input = container.querySelector('input[accept=".csv"]')!;
  fireEvent.change(input, { target: { files: [new File(['csv'], 'learners.csv', { type: 'text/csv' })] } });

  await waitFor(() => {
    expect(screen.getByText('Seat limit reached (1 of 10 seats remaining). Please upgrade or purchase additional seats.')).toBeVisible();
  });
  expect(screen.getByRole('button', { name: 'Import 2 Valid Learners' })).toBeDisabled();
  expect(f.queue).not.toHaveBeenCalled();
});

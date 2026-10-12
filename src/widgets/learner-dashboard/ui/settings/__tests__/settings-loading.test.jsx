import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import MainSettings from '../MainSettings';
import { apiPost } from '@/shared/api/apiClient';

const mocks = vi.hoisted(() => ({
  notifications: vi.fn(), activities: vi.fn(),
  learner: { id: 'learner-1', email: 'learner@example.test', name: 'Learner', school_id: 'school-1' },
  profileLoading: false, collectionsLoading: false,
  updateProfile: vi.fn(),
}));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: vi.fn() }));
vi.mock('@/shared/model/authStore', () => ({
  useUser: () => ({ id: 'user-1', email: 'learner@example.test' }),
  useAuthActions: () => ({ logout: vi.fn() }),
}));
vi.mock('@/entities/learner/model/useLearnerRealtimeActivities', () => ({ useLearnerRealtimeActivities: mocks.activities }));
vi.mock('@/entities/learner', () => ({
  useLearnerSettings: () => ({ learnerData: mocks.learner, loading: mocks.profileLoading, updateProfile: mocks.updateProfile }),
  useLearnerDataByEmail: () => ({ learnerData: {}, loading: mocks.collectionsLoading }),
  useLearnerCertificates: () => ({ certificates: [] }),
  useLearnerProjects: () => ({ projects: [] }),
  useLearnerExperience: () => ({ experience: [] }),
  useLearnerEducation: () => ({ education: [] }),
  useLearnerTechnicalSkills: () => ({ skills: [] }),
  useLearnerSoftSkills: () => ({ skills: [] }),
  useLearnerMessageNotifications: mocks.notifications,
  useLearnerUnreadCount: vi.fn(),
}));
let client;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.profileLoading = false;
  mocks.collectionsLoading = false;
  mocks.updateProfile.mockResolvedValue({ success: true });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  apiPost.mockResolvedValue({ data: {} });
});
afterEach(() => { cleanup(); client.clear(); });
function mount(state) {
  return render(<QueryClientProvider client={client}>
    <MemoryRouter initialEntries={[{ pathname: '/learner/settings', state }]}><MainSettings /></MemoryRouter>
  </QueryClientProvider>);
}

it('shows the personal form while unrelated profile collections are still loading', async () => {
  mocks.collectionsLoading = true;
  mount();
  expect(screen.getByText('Personal Information')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Academic Details/ }));
  expect(await screen.findByRole('status', { name: 'Loading section' })).toBeInTheDocument();
  expect(screen.queryByText('No education added yet')).not.toBeInTheDocument();
});

it('does not fetch institution options or subscribe to activities on initial load or typing', () => {
  mount();
  const callback = mocks.notifications.mock.lastCall[0].onMessageReceived;
  fireEvent.change(screen.getByPlaceholderText('Enter your full name'), { target: { value: 'Changed name' } });
  expect(mocks.notifications.mock.lastCall[0].onMessageReceived).toBe(callback);
  expect(apiPost).not.toHaveBeenCalled();
  expect(mocks.activities).not.toHaveBeenCalled();
});

it('loads institutions on demand and retains the request result when switching tabs', async () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: /Institution Details/ }));
  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
  expect(apiPost).toHaveBeenCalledWith('/learner-profile/actions', { action: 'get-institutions' });
  await screen.findByRole('heading', { name: 'Institution Details' });
  fireEvent.click(screen.getByRole('button', { name: /Personal Info/ }));
  fireEvent.click(screen.getByRole('button', { name: /Institution Details/ }));
  await screen.findByRole('heading', { name: 'Institution Details' });
  expect(apiPost).toHaveBeenCalledTimes(1);
});

it('opens a deep link directly on Guardian Info through the lazy boundary', async () => {
  mount({ activeTab: 'profile', activeSubTab: 'guardian' });
  expect(await screen.findByText('Guardian Information')).toBeInTheDocument();
});

it('invalidates inactive activity data after a message without fetching an unused feed', async () => {
  client.setQueryData(['learner', 'activities', 'realtime', 'learner-1'], []);
  mount();
  mocks.notifications.mock.lastCall[0].onMessageReceived();
  await waitFor(() => expect(client.getQueryState(['learner', 'activities', 'realtime', 'learner-1']).isInvalidated).toBe(true));
  expect(mocks.activities).not.toHaveBeenCalled();
});


it('saves the latest personal value and preserves drafts across profile tabs', async () => {
  mount();
  fireEvent.change(screen.getByPlaceholderText('Enter your full name'), { target: { value: 'Updated learner' } });
  fireEvent.click(screen.getByRole('button', { name: /Guardian Info/ }));
  await screen.findByText('Guardian Information');
  fireEvent.click(screen.getByRole('button', { name: /Personal Info/ }));
  expect(screen.getByPlaceholderText('Enter your full name')).toHaveValue('Updated learner');
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated learner' })));
});

it('retries failed institution requests without discarding the personal draft', async () => {
  apiPost.mockRejectedValue(new Error('Offline'));
  mount();
  fireEvent.change(screen.getByPlaceholderText('Enter your full name'), { target: { value: 'Unsaved draft' } });
  fireEvent.click(screen.getByRole('button', { name: /Institution Details/ }));
  expect(await screen.findByRole('alert', {}, { timeout: 4000 })).toHaveTextContent('Unable to load institutions');
  apiPost.mockResolvedValue({ data: {} });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByRole('heading', { name: 'Institution Details' });
  fireEvent.click(screen.getByRole('button', { name: /Personal Info/ }));
  expect(screen.getByPlaceholderText('Enter your full name')).toHaveValue('Unsaved draft');
});

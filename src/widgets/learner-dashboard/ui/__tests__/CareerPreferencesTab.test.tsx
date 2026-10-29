import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { emptyCareerPreferences } from '../../../../../shared/contracts/career-preferences';
const f = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiGet: (...args: any[]) => f.get(...args), apiPut: (...args: any[]) => f.put(...args) }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'actor', orgId: 'org' }) }));
import CareerPreferencesTab from '../settings/CareerPreferencesTab';
beforeEach(() => { vi.clearAllMocks(); f.get.mockResolvedValue({ data: { learnerId: 'learner', preferences: emptyCareerPreferences(), preferencesRevision: null } }); f.put.mockImplementation(async (_path, body) => { const data = { learnerId: body.learnerId, preferences: body.preferences, inputRevision: '2', preferencesRevision: '33333333-3333-4333-8333-333333333333' }; f.get.mockResolvedValue({ data }); return { data }; }); });
const show = () => { const client = new QueryClient(); const rendered = render(React.createElement(QueryClientProvider, { client }, React.createElement(CareerPreferencesTab))); return { ...rendered, client }; };
it('does not repopulate a cleared account cache when a detached save finishes', async () => {
  let complete!: (value: any) => void;
  f.put.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const { unmount, client } = show();
  await screen.findByRole('textbox', { name: 'Target roles' });
  fireEvent.click(screen.getByRole('button', { name: 'Save career preferences' }));
  await waitFor(() => expect(f.put).toHaveBeenCalledOnce());
  unmount(); client.clear();
  await act(async () => complete({ data: { learnerId: 'learner', preferences: emptyCareerPreferences(), preferencesRevision: '33333333-3333-4333-8333-333333333333' } }));
  expect(client.getQueryData(['career-preferences', 'actor', 'org'])).toBeUndefined();
});
it('adopts an external opt-out in a clean form before saving an unrelated edit', async () => {
  f.get.mockResolvedValueOnce({ data: { learnerId: 'learner', preferences: { ...emptyCareerPreferences(), useVerifiedLearning: true }, preferencesRevision: '11111111-1111-4111-8111-111111111111' } });
  const { unmount, client } = show();
  try {
    const checkbox = await screen.findByRole('checkbox', { name: /Use my evaluated LTE/ });
    expect((checkbox as HTMLInputElement).checked).toBe(true);
    f.get.mockResolvedValue({ data: { learnerId: 'learner', preferences: { ...emptyCareerPreferences(), useVerifiedLearning: false }, preferencesRevision: '22222222-2222-4222-8222-222222222222' } });
    await act(async () => { await client.invalidateQueries({ queryKey: ['career-preferences'] }); });
    await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(false));
    fireEvent.change(screen.getByRole('textbox', { name: 'Target roles' }), { target: { value: 'Python developer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save career preferences' }));
    await waitFor(() => expect(f.put).toHaveBeenCalledOnce());
    expect(f.put.mock.calls[0][1]).toMatchObject({ expectedRevision: '22222222-2222-4222-8222-222222222222', preferences: { useVerifiedLearning: false } });
  } finally { unmount(); client.clear(); }
});

it('preserves a dirty draft but blocks overwriting an externally changed preference', async () => {
  const { unmount, client } = show();
  try {
    const roles = await screen.findByRole('textbox', { name: 'Target roles' });
    fireEvent.change(roles, { target: { value: 'Ocean engineer' } });
    f.get.mockResolvedValue({ data: { learnerId: 'learner', preferences: { ...emptyCareerPreferences(), useVerifiedLearning: false }, preferencesRevision: '22222222-2222-4222-8222-222222222222' } });
    await act(async () => { await client.invalidateQueries({ queryKey: ['career-preferences'] }); });
    expect((roles as HTMLInputElement).value).toBe('Ocean engineer');
    await waitFor(() => expect((screen.getByRole('button', { name: 'Save career preferences' }) as HTMLButtonElement).disabled).toBe(true));
    expect(f.put).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Reload latest preferences' }));
    await waitFor(() => expect((roles as HTMLInputElement).value).toBe(''));
  } finally { unmount(); client.clear(); }
});
it('handles an unseen server-side conflict without retrying or reversing an opt-out', async () => {
  f.get.mockResolvedValueOnce({ data: { learnerId: 'learner', preferences: { ...emptyCareerPreferences(), useVerifiedLearning: true }, preferencesRevision: '11111111-1111-4111-8111-111111111111' } });
  const { unmount, client } = show();
  try {
    const roles = await screen.findByRole('textbox', { name: 'Target roles' });
    fireEvent.change(roles, { target: { value: 'Ocean engineer' } });
    f.get.mockResolvedValue({ data: { learnerId: 'learner', preferences: { ...emptyCareerPreferences(), useVerifiedLearning: false }, preferencesRevision: '22222222-2222-4222-8222-222222222222' } });
    f.put.mockRejectedValueOnce(Object.assign(new Error('Preferences changed'), { status: 409 }));
    fireEvent.click(screen.getByRole('button', { name: 'Save career preferences' }));
    await screen.findByRole('button', { name: 'Reload latest preferences' });
    expect(f.put).toHaveBeenCalledOnce(); expect((roles as HTMLInputElement).value).toBe('Ocean engineer');
    await waitFor(() => expect(client.getQueryData<any>(['career-preferences', 'actor', 'org']).preferencesRevision).toBe('22222222-2222-4222-8222-222222222222'));
    fireEvent.click(screen.getByRole('button', { name: 'Reload latest preferences' }));
    await waitFor(() => expect((screen.getByRole('checkbox', { name: /Use my evaluated LTE/ }) as HTMLInputElement).checked).toBe(false));
  } finally { unmount(); client.clear(); }
});
it('saves structured choices and emits only the acknowledged learner scope', async () => {
  const event = vi.fn(); window.addEventListener('learner-profile-updated', event);
  const { unmount, client } = show();
  try {
    const roles = await screen.findByRole('textbox', { name: 'Target roles' });
    fireEvent.change(roles, { target: { value: 'Python developer, Ocean engineer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save career preferences' }));
    await screen.findByRole('status');
    await waitFor(() => expect(event).toHaveBeenCalledOnce());
    expect(f.put.mock.calls[0][1]).toMatchObject({ learnerId: 'learner', preferences: { targetRoles: ['Python developer', 'Ocean engineer'], willingToRelocate: null } });
    expect(event.mock.calls[0][0].detail).toEqual({ learnerId: 'learner' });
  } finally { window.removeEventListener('learner-profile-updated', event); unmount(); client.clear(); }
});
it('does not write an empty required preference or lose the draft after failure', async () => {
  const { unmount, client } = show();
  try {
    await screen.findByRole('textbox', { name: 'Target roles' });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Require a matching location' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save career preferences' }));
    expect(await screen.findByRole('alert')).toBeTruthy(); expect(f.put).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Require a matching location' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Target roles' }), { target: { value: 'Ocean engineer' } });
    f.put.mockRejectedValueOnce(new Error('Save unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'Save career preferences' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Save unavailable'));
    expect((screen.getByRole('textbox', { name: 'Target roles' }) as HTMLInputElement).value).toBe('Ocean engineer');
  } finally { unmount(); client.clear(); }
});

it('checks both additional context options by default', async () => {
  const { unmount, client } = show();
  try {
    expect(await screen.findByRole('checkbox', { name: /Use career suggestions/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Use my evaluated LTE/ })).toBeChecked();
  } finally { unmount(); client.clear(); }
});
it('preserves both saved opt-outs and sends them on an unrelated save', async () => {
  f.get.mockResolvedValueOnce({ data: { learnerId: 'learner', preferences: { ...emptyCareerPreferences(), useAssessmentRecommendations: false, useVerifiedLearning: false }, preferencesRevision: null } });
  const { unmount, client } = show();
  try {
    expect(await screen.findByRole('checkbox', { name: /Use career suggestions/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Use my evaluated LTE/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Save career preferences' }));
    await waitFor(() => expect(f.put).toHaveBeenCalledOnce());
    expect(f.put.mock.calls[0][1].preferences).toMatchObject({ useAssessmentRecommendations: false, useVerifiedLearning: false });
  } finally { unmount(); client.clear(); }
});

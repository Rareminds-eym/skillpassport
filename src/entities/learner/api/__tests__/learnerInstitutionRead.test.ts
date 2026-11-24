import { expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: f.fetch } }));
vi.mock('@/shared/model/authStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'owner' } }) } }));
import { getlearnerByEmail, getLearnerByUserId } from '../learnerService';
it('preserves saved custom school and program fields in the opportunities profile', async () => {
  f.fetch.mockResolvedValue(new Response(JSON.stringify({ success: true, data: {
    id: 'learner', email: 'learner@example.test', learner_type: 'school', school_id: null,
    school_name: 'Custom School', program_id: 'program', course_name: 'BCA',
  } })));
  const result = await getlearnerByEmail('learner@example.test');
  expect(result).toMatchObject({ success: true, data: { school_id: null, school_name: 'Custom School', program_id: 'program', course_name: 'BCA' } });
});

it('preserves a saved dropdown school ID for opportunity validation', async () => {
  f.fetch.mockResolvedValue(new Response(JSON.stringify({ success: true, data: {
    id: 'learner', email: 'learner@example.test', learner_type: 'school', school_id: 'saved-school', school_name: null,
  } })));
  const result = await getlearnerByEmail('learner@example.test');
  expect(result).toMatchObject({ success: true, data: { school_id: 'saved-school', school_name: null } });
});

it('reads the actual learner API envelope for a user-ID lookup', async () => {
  f.fetch.mockResolvedValue(new Response(JSON.stringify({ success: true, data: { learner: { id: 'learner', email: 'learner@example.test', name: 'Learner' } } })));
  expect(await getLearnerByUserId('user-id')).toMatchObject({ success: true, data: { id: 'learner' } });
});
it('rejects an empty learner response without claiming a profile exists', async () => {
  f.fetch.mockResolvedValue(new Response(JSON.stringify({ success: true, data: { learner: null } })));
  expect(await getLearnerByUserId('user-id')).toMatchObject({ success: false, data: null });
});
it('preserves the backend error message on a failed profile read', async () => {
  f.fetch.mockResolvedValue(new Response(JSON.stringify({ success: false, error: { code: 'PROFILE_UNAVAILABLE', message: 'Profile temporarily unavailable' } }), { status: 503 }));
  expect(await getlearnerByEmail('learner@example.test')).toMatchObject({ success: false, error: 'Profile temporarily unavailable' });
});
it('uses nested transformed defaults and legacy camel-case values when canonical columns are missing', async () => {
  f.fetch.mockResolvedValue(Response.json({ success: true, data: { id: 'learner', dateOfBirth: '2000-01-01', contactNumber: '9876543210' } }));
  const result = await getlearnerByEmail('learner@example.test');
  expect(result).toMatchObject({ success: true, data: {
    email: 'learner@example.test', name: 'Learner', date_of_birth: '2000-01-01', contact_number: '+91 9876543210',
    university: '', branch_field: '', college_school_name: '', github_link: '', linkedin_link: '',
    twitter_link: '', facebook_link: '', instagram_link: '', portfolio_link: '', youtube_link: '',
  } });
  expect(result).toMatchObject({ data: { age: expect.any(Number) } });
});
it('preserves canonical values ahead of the transformed profile', async () => {
  f.fetch.mockResolvedValue(Response.json({ success: true, data: {
    id: 'learner', email: 'saved@example.test', name: 'Saved Name', date_of_birth: '2001-02-03', dateOfBirth: '2000-01-01',
    contact_number: '1234567890', contactNumber: '9876543210', university: 'Saved University', branch_field: 'Saved Department',
    college_school_name: 'Saved College', youtube_link: 'https://example.test/channel',
  } }));
  const result = await getlearnerByEmail('lookup@example.test');
  expect(result).toMatchObject({ success: true, data: { email: 'saved@example.test', name: 'Saved Name', date_of_birth: '2001-02-03',
    contact_number: '1234567890', university: 'Saved University', branch_field: 'Saved Department', college_school_name: 'Saved College',
    youtube_link: 'https://example.test/channel', profile: { youtube_link: 'https://example.test/channel' },
  } });
});

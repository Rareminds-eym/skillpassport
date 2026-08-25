import { describe, expect, it } from 'vitest';
import { resolveRouteRole } from '../roleBasedRouter';

describe('resolveRouteRole', () => {
  it('routes a pure learner to the learner dashboard', () => {
    expect(resolveRouteRole(['learner'])).toBe('learner');
  });

  it('treats owner+learner (self-signup artifact) as learner', () => {
    // signup_user grants Google learners BOTH roles; owner must not win.
    expect(resolveRouteRole(['owner', 'learner'])).toBe('learner');
    expect(resolveRouteRole(['learner', 'owner'])).toBe('learner');
  });

  it('maps a standalone org-owner to the recruiter flow', () => {
    expect(resolveRouteRole(['owner'])).toBe('recruiter');
    expect(resolveRouteRole(['owner', 'member'])).toBe('recruiter');
  });

  it('keeps admin roles ahead of learner', () => {
    expect(resolveRouteRole(['college_admin', 'learner'])).toBe('college_admin');
    expect(resolveRouteRole(['school_admin', 'owner', 'learner'])).toBe('school_admin');
  });

  it('falls back to learner for unknown or empty role lists', () => {
    expect(resolveRouteRole([])).toBe('learner');
    expect(resolveRouteRole(['mystery_role'])).toBe('learner');
  });

  it('routes invited recruiters to the recruiter flow', () => {
    expect(resolveRouteRole(['recruiter'])).toBe('recruiter');
    // 'hr' is itself a routable dashboard role.
    expect(resolveRouteRole(['hr', 'member'])).toBe('hr');
  });
});

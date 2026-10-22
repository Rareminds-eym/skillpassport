import { beforeEach, describe, expect, it } from 'vitest';
import { clearPendingTurn, loadPendingTurn, savePendingTurn } from '../pendingTurn';
const request = { turnId: '11111111-1111-4111-8111-111111111111', courseId: 'course', message: 'Explain cells' };
describe('pending tutor draft persistence', () => {
  beforeEach(() => sessionStorage.clear());
  it('restores the exact frozen identity across reloads only within the actor/course scope', () => {
    savePendingTurn(sessionStorage, 'actor', request, 1000);
    expect(loadPendingTurn(sessionStorage, 'actor', 'course', undefined, 1001)).toEqual(request);
    expect(loadPendingTurn(sessionStorage, 'other', 'course', undefined, 1001)).toBeNull();
    expect(loadPendingTurn(sessionStorage, 'actor', 'other', undefined, 1001)).toBeNull();
    clearPendingTurn(sessionStorage, 'actor', 'course');
    expect(loadPendingTurn(sessionStorage, 'actor', 'course', undefined, 1001)).toBeNull();
  });
  it('expires drafts, rejects future timestamps and removes corrupt snapshots', () => {
    savePendingTurn(sessionStorage, 'actor', request, 1000);
    expect(loadPendingTurn(sessionStorage, 'actor', 'course', undefined, 1000 + 86400000)).toBeNull();
    savePendingTurn(sessionStorage, 'actor', request, 1000);
    expect(loadPendingTurn(sessionStorage, 'actor', 'course', undefined, 999)).toBeNull();
    sessionStorage.setItem('tutor-pending:1:actor:course:', '{broken');
    expect(loadPendingTurn(sessionStorage, 'actor', 'course', undefined, 1001)).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
});

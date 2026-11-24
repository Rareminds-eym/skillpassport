// @vitest-environment node
import { expect, it } from 'vitest';
import { mapLearnerProfileToColumns } from '../lib/sync-service';
it('accepts the canonical manual admission membership profile at the projection boundary', () => {
  expect(mapLearnerProfileToColumns({ contactNumber: '1234567890', enrollmentNumber: 'EN-1', grade: '10', section: 'A', roll_number: '12', district_name: 'District', dateOfBirth: '2005-01-02', guardianName: 'Guardian' }))
    .toMatchObject({ contactNumber: '1234567890', enrollmentNumber: 'EN-1', grade: '10', section: 'A', roll_number: '12', district_name: 'District', dateOfBirth: '2005-01-02', guardianName: 'Guardian' });
});
it('keeps organization and identity fields outside the projected profile metadata', () => {
  const columns = mapLearnerProfileToColumns({ school_id: 'foreign', college_id: 'foreign', user_id: 'foreign', role: 'super_admin', grade: '10' });
  expect(columns).toEqual({ grade: '10' });
});

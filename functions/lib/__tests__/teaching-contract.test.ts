import { describe, expect, it } from 'vitest';
import { parseTeachingRequest, teachingFailure } from '../teaching-contract';
const id='00000000-0000-4000-8000-000000000001';
describe('teaching contracts', () => {
  it('strips spoofed actor/history and requires explicit exact class mapping', () => {
    const parsed=parseTeachingRequest({action:'map',payload:{staffId:id,collegeId:id,sectionId:id,courseIds:[id],startDate:'2026-10-13',actor:'someone',instructor_changes:['spoof']}});
    expect(parsed.payload).not.toHaveProperty('actor'); expect(parsed.payload).not.toHaveProperty('instructor_changes');
    expect(()=>parseTeachingRequest({action:'map',payload:{staffId:id,collegeId:id,courseIds:[id],startDate:'2026-10-13'}})).toThrow();
  });
  it('requires reasons, both versions and grants for swaps', () => {
    expect(()=>parseTeachingRequest({action:'swap',payload:{sessionId:id,version:1,otherSessionId:id,otherVersion:1,reason:'cover'}})).toThrow();
  });
  it('rejects unknown operations and missing learner statuses', () => {
    expect(()=>parseTeachingRequest({action:'db-update',payload:{}})).toThrow();
    expect(()=>parseTeachingRequest({action:'mark_learners',payload:{sessionId:id,version:1,attendanceRevision:0,records:[{learnerId:id}]}})).toThrow();
  });
  it('does not leak raw SQL/PII errors',()=>{
    expect(teachingFailure({code:'P0001',message:'private identity data'}).message).not.toContain('private');
    expect(teachingFailure({code:'40001'}).status).toBe(409);
    expect(teachingFailure({code:'PGRST202'}).status).toBe(503);
  });
  it('rejects all removed Phase 6 operations',()=>{for(const action of ['assignments','my_assignments','create_assignment','publish_assignment','assignment_recipients','assignment_files','grade','submit','return_submission','handover'])expect(()=>parseTeachingRequest({action,payload:{}})).toThrow('Unknown teaching action');});
});

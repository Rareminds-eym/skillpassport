import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('@/shared/api/ssoClient',()=>({ssoClient:{fetch:mocks.fetch}}));
import {startAssessment} from '../assessmentApiService';
const sections=[{id:'interest',questions:[{id:'q1'},{id:'q2'}]}];
const response=(reused=false)=>({success:true,attemptId:'owned',isResumed:reused,attempt:{id:'owned',status:'in_progress',grade_level:'after12',stream_id:null},sections});
const resume=()=>({success:true,hasInProgress:true,attemptId:'owned',gradeLevel:'after12',streamId:null,sections,answers:{q1:'A'},currentQuestionIndex:1,elapsedTime:91,timerRemaining:0});
beforeEach(()=>vi.resetAllMocks());
describe('public start contract',()=>{
 it('exposes server canonical grade and nullable stream for fresh starts',async()=>{
  mocks.fetch.mockResolvedValueOnce(Response.json(response()));
  expect(await startAssessment({gradeLevel:'college',streamId:'bca'})).toMatchObject({success:true,isResumed:false,attempt:{grade_level:'after12',stream_id:null}});
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
 });
 it('loads and validates the matching resume snapshot including zero timing',async()=>{
  mocks.fetch.mockResolvedValueOnce(Response.json(response(true))).mockResolvedValueOnce(Response.json(resume()));
  expect(await startAssessment({gradeLevel:'college',streamId:'bca'})).toMatchObject({success:true,isResumed:true,resume:{answers:{q1:'A'},currentQuestionIndex:1,elapsedTime:91,timerRemaining:0}});
  expect(mocks.fetch.mock.calls[1][0]).toContain('check-in-progress');
 });
 it.each([{attemptId:'other'},{gradeLevel:'college'},{streamId:'other'},{hasInProgress:false},{currentSectionIndex:99}])('rejects unavailable or changed reuse: %j',async change=>{
  mocks.fetch.mockResolvedValueOnce(Response.json(response(true))).mockResolvedValueOnce(Response.json({...resume(),...change}));
  expect(await startAssessment({gradeLevel:'college'})).toMatchObject({success:false});
 });
 it('does not treat a malformed start as a fresh attempt',async()=>{
  mocks.fetch.mockResolvedValueOnce(Response.json({...response(),attempt:undefined}));
  expect(await startAssessment({gradeLevel:'college'})).toMatchObject({success:false});
 });
});

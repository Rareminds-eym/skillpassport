// @vitest-environment node
import {beforeEach, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({rpc: vi.fn(), fetch: vi.fn(), from: vi.fn()}));
vi.mock('@/shared/api/ssoClient', () => ({ssoClient: {fetch: mocks.fetch}}));
vi.mock('@/shared/api/supabaseClient', () => ({supabase: {from: mocks.from}}));
vi.mock('../assessmentApiService', () => ({retryClusterGeneration: vi.fn()}));
vi.mock('../../../../../functions/lib/supabase', () => ({getServiceClient: () => ({rpc: mocks.rpc})}));
import {handleAssessmentProgress} from '../../../../../functions/lib/assessment-progress';
import {saveResponseHandler} from '../../../../../functions/api/assessment/handlers/save-response';
import {handleAttemptCreate} from '../../../../../functions/lib/assessment-start';
import {updateAttemptProgress, saveResponse,createAttempt} from '../assessmentService';
const owner = '10000000-0000-4000-8000-000000000001';
const attempt = '20000000-0000-4000-8000-000000000001';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockImplementation(() => {throw new Error('Anonymous access forbidden');});
  mocks.rpc.mockResolvedValue({data: {id: attempt}, error: null});
  mocks.fetch.mockImplementation((url: string, init: RequestInit) => (url.endsWith('/assessment-attempts')?handleAttemptCreate:url.endsWith('/save-response') ? saveResponseHandler : handleAssessmentProgress)({
    request: new Request(`https://fixture.invalid${url}`, init), env: {}, data: {user: {sub: owner}},
  } as any));
});
it('creates through the authenticated server without browser inserts or owner overrides',async()=>{
 const learner='30000000-0000-4000-8000-0000000000AA';
 const row={id:attempt,learner_id:learner.toLowerCase(),stream_id:'bca',grade_level:'after12',status:'in_progress'};
 mocks.rpc.mockResolvedValue({data:{attempt:row,created:true},error:null});
 expect(await createAttempt(learner,'bca','college')).toEqual(row);
 expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({reference:learner.toLowerCase(),streamId:'bca',gradeLevel:'college'});
 expect(mocks.from).not.toHaveBeenCalled();
});
it('requires explicit resume when legacy creation finds an existing attempt',async()=>{
 mocks.rpc.mockResolvedValue({data:null,error:{code:'P0001'}});
 await expect(createAttempt(owner,null,'college')).rejects.toMatchObject({status:409});
 expect(mocks.from).not.toHaveBeenCalled();
});
it.each([null, undefined, false, 0, [], {selected: 'A'}])('saves legacy raw answer %j through the authenticated handler without client correctness', async answer => {
  const question = '30000000-0000-4000-8000-000000000001';
  const receipt = {id: '40000000-0000-4000-8000-000000000001', attempt_id: attempt, question_id: question, is_correct: null};
  mocks.rpc.mockResolvedValue({data: receipt, error: null});
  expect(await saveResponse(attempt, question, answer, true)).toEqual(receipt);
  expect(mocks.rpc).toHaveBeenCalledWith('save_owned_assessment_response', {p_owner: owner, p_attempt: attempt,
    p_question: question, p_answer: answer == null ? '' : answer});
  expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).not.toHaveProperty('isCorrect');
  expect(mocks.from).not.toHaveBeenCalled();
});
it.each([409, 503])('does not hide response failure HTTP %s', async status => {
  mocks.rpc.mockResolvedValue({data: null, error: {code: status === 409 ? 'P0001' : 'PGRST202'}});
  await expect(saveResponse(attempt, '30000000-0000-4000-8000-000000000001', 1)).rejects.toMatchObject({status});
});
it('carries legacy default nulls through the real transport and handler without erasing stored fields', async () => {
  expect(await updateAttemptProgress(attempt, {sectionIndex: 0, questionIndex: 1, sectionTimings: {},
    timerRemaining: null, elapsedTime: null, allResponses: null, aptitudeQuestionTimer: null})).toEqual({id: attempt});
  expect(mocks.rpc).toHaveBeenCalledWith('patch_owned_assessment_progress', {p_owner: owner, p_attempt: attempt,
    p_action: 'progress', p_patch: {current_section_index: 0, current_question_index: 1,
      section_timings: {}, timer_remaining: null, aptitude_question_timer: null}});
  expect(mocks.from).not.toHaveBeenCalled();
});
it('still rejects malformed maps across the caller-to-handler boundary', async () => {
  await expect(updateAttemptProgress(attempt, {allResponses: []})).rejects.toMatchObject({status: 400});
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it('normalizes mixed-case IDs through the real response transport and handler',async()=>{
 const attemptId='20000000-0000-4000-8000-0000000000AA';const questionId='30000000-0000-4000-8000-0000000000Bb';
 const receipt={id:'40000000-0000-4000-8000-000000000001',attempt_id:attemptId.toLowerCase(),question_id:questionId.toLowerCase(),is_correct:null};
 mocks.rpc.mockResolvedValue({data:receipt,error:null});
 expect(await saveResponse(attemptId,questionId,1)).toEqual(receipt);
 expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toMatchObject({attemptId:attemptId.toLowerCase(),questionId:questionId.toLowerCase()});
});
it('normalizes mixed-case attempt IDs through the progress transport and handler',async()=>{
 const id='20000000-0000-4000-8000-0000000000AA';mocks.rpc.mockResolvedValue({data:{id:id.toLowerCase()},error:null});
 expect(await updateAttemptProgress(id,{allResponses:{q:1}})).toEqual({id:id.toLowerCase()});
});

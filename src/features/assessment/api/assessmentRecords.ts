import {apiGet, apiPost} from '@/shared/api/apiClient';

type SingleMode = 'attempt' | 'latest' | 'latest-date' | 'in-progress';
type RecordData = Record<string, any>;
export async function createOwnAssessmentAttempt(reference:string,streamId:string|null,gradeLevel:string){
  if(!reference)throw new Error('Learner reference is required');
  const response=await apiPost<{attempt:RecordData;created:boolean}>('/assessment-attempts',{
    reference:reference.toLowerCase(),streamId:streamId??null,gradeLevel,
  });
  if(response.created!==true||!response.attempt||typeof response.attempt.id!=='string'||response.attempt.status!=='in_progress'
    ||response.attempt.stream_id!==(streamId??null))throw new Error('Assessment start confirmation unavailable');
  return response.attempt;
}
export async function saveOwnAssessmentResponse(attemptId: string, questionId: string, answer: unknown) {
  if (!attemptId || !questionId) throw new Error('Attempt ID and question ID are required');
  attemptId = attemptId.toLowerCase();
  questionId = questionId.toLowerCase();
  const result = await apiPost<{success: boolean; response: RecordData}>('/assessment/save-response', {attemptId, questionId, answer});
  if (result.success !== true || !result.response || typeof result.response.id !== 'string'
    || result.response.attempt_id !== attemptId || result.response.question_id !== questionId
    || result.response.is_correct !== null) throw new Error('Assessment response confirmation unavailable');
  return result.response;
}
interface RecordsResponse {data: RecordData | RecordData[] | null; nextCursor?: string | null}

export function fetchOwnAssessmentRecord(mode: 'attempt', reference?: string, attemptId?: string): Promise<RecordData>;
export function fetchOwnAssessmentRecord(mode: 'latest' | 'latest-date' | 'in-progress', reference?: string, attemptId?: string): Promise<RecordData | null>;
export async function fetchOwnAssessmentRecord(mode: SingleMode, reference?: string, attemptId?: string): Promise<RecordData | null> {
  const params = new URLSearchParams({mode});
  if (reference !== undefined) params.set('reference', reference);
  if (attemptId !== undefined) params.set('attemptId', attemptId);
  const response = await apiGet<RecordsResponse>(`/assessment-records?${params}`);
  if (!Object.prototype.hasOwnProperty.call(response, 'data') || Array.isArray(response.data)
    || (response.data !== null && typeof response.data !== 'object')
    || (mode === 'attempt' && response.data === null)) throw new Error('Assessment records unavailable');
  return response.data;
}

export async function patchOwnAssessment(attemptId: string, progress: Record<string, unknown> = {}, action: 'progress' | 'abandon' = 'progress') {
  if (!attemptId) throw new Error('Attempt ID is required');
  attemptId = attemptId.toLowerCase();
  const response = await apiPost<{success: boolean; attempt: RecordData}>('/assessment-progress', {
    ...progress, attemptId, action,
  });
  if (response.success !== true || !response.attempt || response.attempt.id !== attemptId) {
    throw new Error('Assessment progress confirmation unavailable');
  }
  return response.attempt;
}

export async function fetchOwnAssessmentPages(mode: 'history' | 'responses', reference?: string, attemptId?: string) {
  const params = new URLSearchParams({mode});
  if (reference !== undefined) params.set('reference', reference);
  if (attemptId !== undefined) params.set('attemptId', attemptId);
  const rows: RecordData[] = [];
  const seen = new Set<string>();
  // A bounded client must fail visibly rather than silently return truncated history.
  for (let page = 0; page < 100; page++) {
    const response = await apiGet<RecordsResponse>(`/assessment-records?${params}`);
    if (!Array.isArray(response.data) || !Object.prototype.hasOwnProperty.call(response, 'nextCursor')) {
      throw new Error('Assessment page unavailable');
    }
    rows.push(...response.data);
    if (response.nextCursor === null) return rows;
    if (typeof response.nextCursor !== 'string' || !response.nextCursor || seen.has(response.nextCursor)) {
      throw new Error('Assessment pagination did not progress');
    }
    seen.add(response.nextCursor);
    params.set('cursor', response.nextCursor);
  }
  throw new Error('Assessment pagination limit exceeded');
}

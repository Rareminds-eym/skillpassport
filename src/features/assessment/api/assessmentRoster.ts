import {apiPost} from '@/shared/api/apiClient';

export interface AssessmentRosterFilters {
 schoolId?: string;
 collegeId?: string;
 classIds?: string[];
 grade?: string;
 section?: string;
}
export interface AssessmentRosterLearner {
 id:string; name:string; email:string; roll_number?:string; admission_number?:string;
 grade?:string; section?:string; school_id?:string; college_id?:string;
}
/** Exhaust bounded keyset pages; never silently return an incomplete roster. */
export async function fetchAssessmentRoster(filters:AssessmentRosterFilters):Promise<AssessmentRosterLearner[]>{
 const rows:AssessmentRosterLearner[]=[];const seen=new Set<string>();let cursor:string|undefined;
 for(let page=0;page<100;page++){
  const result=await apiPost<{data:{learners:AssessmentRosterLearner[];nextCursor:string|null}}>('/assessment-roster',{...filters,...(cursor?{cursor}:{})});
  if(!result.data||!Array.isArray(result.data.learners))throw new Error('Invalid roster response');
  rows.push(...result.data.learners);
  const next=result.data.nextCursor;
  if(next===null)return rows.sort((a,b)=>(a.roll_number??'').localeCompare(b.roll_number??''));
  if(typeof next!=='string'||!next||seen.has(next))throw new Error('Roster pagination did not progress');
  seen.add(next);cursor=next;
 }
 throw new Error('Roster exceeds the supported page limit');
}

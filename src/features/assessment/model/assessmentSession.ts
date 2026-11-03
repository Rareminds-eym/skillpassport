import type {AssessmentSection} from './assessmentStore';
import type {CheckInProgressResponse} from '../api/assessmentApiService';

export interface AssessmentSessionSnapshot {
  attemptId:string; gradeLevel:string; streamId:string|null; sections:AssessmentSection[];
  answers:Record<string,any>; currentSectionIndex:number; currentQuestionIndex:number;
  elapsedTime:number; timerRemaining:number|null; sectionTimings:Record<string,number>;
  adaptiveSessionId:string|null; adaptiveTestComplete:boolean;
}
// This validates restoration shape; server-side ownership remains authoritative.
const object=(v:unknown):v is Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
export const assessmentGrades=['middle','highschool','higher_secondary','after10','after12','college'];

export function validateAssessmentSnapshot(snapshot:AssessmentSessionSnapshot):AssessmentSessionSnapshot {
  if(!snapshot||typeof snapshot.attemptId!=='string'||!snapshot.attemptId||!assessmentGrades.includes(snapshot.gradeLevel)
    ||(snapshot.streamId!==null&&typeof snapshot.streamId!=='string')||!Array.isArray(snapshot.sections)||!snapshot.sections.length
    ||snapshot.sections.some(section=>!section||!Array.isArray(section.questions))||!object(snapshot.answers)
    ||!integer(snapshot.currentSectionIndex)||snapshot.currentSectionIndex>=snapshot.sections.length||!integer(snapshot.currentQuestionIndex)
    ||!integer(snapshot.elapsedTime)||(snapshot.timerRemaining!==null&&!integer(snapshot.timerRemaining))
    ||!object(snapshot.sectionTimings)||Object.values(snapshot.sectionTimings).some(value=>typeof value!=='number'||!Number.isFinite(value)||value<0)
    ||(snapshot.adaptiveSessionId!==null&&(typeof snapshot.adaptiveSessionId!=='string'||!snapshot.adaptiveSessionId))
    ||typeof snapshot.adaptiveTestComplete!=='boolean')throw new Error('Assessment resume unavailable');
  return {...snapshot,answers:{...snapshot.answers},sectionTimings:{...snapshot.sectionTimings}};
}

export function resumeAssessmentSnapshot(data:CheckInProgressResponse):AssessmentSessionSnapshot {
  if(!data.success||!data.hasInProgress||!data.attemptId||!data.gradeLevel)throw new Error('Assessment resume unavailable');
  const session=data.adaptiveSession;
  if(session&&(!session.sessionId||!['in_progress','completed'].includes(session.status)))throw new Error('Adaptive resume unavailable');
  return validateAssessmentSnapshot({attemptId:data.attemptId,gradeLevel:data.gradeLevel,
    streamId:data.streamId??data.stream_id??null,sections:data.sections??[],answers:data.answers??data.all_responses??{},
    currentSectionIndex:data.currentSectionIndex??0,currentQuestionIndex:data.currentQuestionIndex??0,
    elapsedTime:data.elapsedTime??0,timerRemaining:data.timerRemaining??null,sectionTimings:data.sectionTimings??{},
    adaptiveSessionId:session?.sessionId??null,adaptiveTestComplete:session?.status==='completed'});
}

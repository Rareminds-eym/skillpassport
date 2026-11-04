import {beforeEach,describe,it,expect} from 'vitest';
import {useAssessmentStore as store} from '../assessmentStore';
import {resumeAssessmentSnapshot} from '../assessmentSession';
const sections=[{id:'interest',name:'interest',questions:[{id:'q1'},{id:'q2'}]}] as any;
const resume=()=>resumeAssessmentSnapshot({success:true,hasInProgress:true,attemptId:'owned',gradeLevel:'after12',streamId:null,sections,answers:{q1:'B'},currentSectionIndex:0,currentQuestionIndex:1,elapsedTime:91,timerRemaining:0,sectionTimings:{interest:20}});
beforeEach(()=>store.getState().reset());
describe('assessment session boundaries',()=>{
 it('resets all attempt state for a fresh start using canonical context',()=>{
  store.getState().initializeAssessment(sections,'old','college','bca');
  store.getState().saveAnswer('q1','A');store.getState().setCurrentQuestion(0,1);
  store.setState({adaptiveSessionId:'old-adaptive',adaptiveTestComplete:true,resultId:'old-result',analysisRetryCount:3,elapsedTime:80,timerRemaining:0,sectionTimings:{interest:50}});
  const generation=store.getState().generation;
  store.getState().initializeAssessment(sections,'new','after12',null);
  expect(store.getState()).toMatchObject({attemptId:'new',gradeLevel:'after12',streamId:null,answers:{},currentQuestionIndex:0,adaptiveSessionId:null,adaptiveTestComplete:false,resultId:null,analysisRetryCount:0,elapsedTime:0,timerRemaining:null,sectionTimings:{},generation:generation+1});
 });
 it('hydrates saved position, answers and expired timer atomically',()=>{
  const changes:any[]=[];const stop=store.subscribe(state=>changes.push(state));
  store.getState().hydrateAssessment(resume());stop();
  expect(changes).toHaveLength(1);
  expect(changes[0]).toMatchObject({attemptId:'owned',gradeLevel:'after12',streamId:null,answers:{q1:'B'},currentQuestionIndex:1,elapsedTime:91,timerRemaining:0,sectionTimings:{interest:20}});
 });
 it('accepts existing fractional section timings without rounding them',()=>{
  store.getState().hydrateAssessment({...resume(),sectionTimings:{interest:1.5}});
  expect(store.getState().sectionTimings).toEqual({interest:1.5});
 });
 it('does not partially mutate on an invalid resume',()=>{
  const before=store.getState();
  expect(()=>store.getState().hydrateAssessment({...resume(),currentSectionIndex:5})).toThrow('resume unavailable');
  expect(store.getState()).toBe(before);
 });
 it('fences owner changes including switching back to the first owner',()=>{
  store.getState().bindOwner('A');store.getState().hydrateAssessment(resume());
  const generation=store.getState().generation;
  store.getState().bindOwner('A');expect(store.getState().generation).toBe(generation);
  store.getState().bindOwner('B');store.getState().bindOwner('A');
  expect(store.getState()).toMatchObject({ownerId:'A',answers:{},attemptId:null,generation:generation+2});
 });
 it('restores owned adaptive linkage without retaining old results',()=>{
  store.setState({adaptiveResults:{sessionId:'old'} as any});
  const snapshot=resumeAssessmentSnapshot({success:true,hasInProgress:true,attemptId:'owned',gradeLevel:'after12',sections,adaptiveSession:{sessionId:'adaptive',status:'completed'} as any});
  store.getState().hydrateAssessment(snapshot);
  expect(store.getState()).toMatchObject({adaptiveSessionId:'adaptive',adaptiveTestComplete:true,adaptiveResults:null});
 });
});

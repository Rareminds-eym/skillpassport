// @vitest-environment node
import { expect, it } from 'vitest';
import { planCourseEvidence, selectSlideEvidence } from '../course-evidence';
import { chunkCourseText } from '../course-index';
it('reads imported bracketed slides and their notes without the next slide',()=>{
 const text='[Slide 51]\nPrevious case\n[Slide 52]\nHydraulic power = 1962 W\n[Speaker notes for slide 52]\nElectrical power = 3.354 kW\n[Slide 53]\nNext case';
 const chunks=chunkCourseText(text,100,20).map((chunk,i)=>({...chunk,id:`c${i}`,analysis_id:'a'}));
 const selected=selectSlideEvidence(chunks,52);
 expect(selected).toHaveLength(1);
 expect(selected[0].content).toContain('Hydraulic power = 1962 W');
 expect(selected[0].content).toContain('Electrical power = 3.354 kW');
 expect(selected[0].content).not.toContain('Previous case');expect(selected[0].content).not.toContain('Next case');
});
it('resolves numbered PDF Markdown headings without adjacent pages',()=>{
 for(const heading of ['## Page 10: Discharge','**Slide 10**','### Original PDF Page 10']) {
  const selected=selectSlideEvidence([{id:'c',analysis_id:'a',chunk_index:0,source_location:{},content:`## Page 9\nEarlier\n${heading}\nQ = A v\n## Page 11\nLater`}],10);
  expect(selected).toHaveLength(1);expect(selected[0].content).toContain('Q = A v');
  expect(selected[0].content).not.toContain('Earlier');expect(selected[0].content).not.toContain('Later');
 }
});
it('does not infer page contents from incidental mentions or ambiguous page ranges',()=>{
 for(const content of ['Refer to slide 10 for details.','## Page 10-11\nCombined evidence']) {
  expect(selectSlideEvidence([{id:'c',analysis_id:'a',chunk_index:0,source_location:{},content}],10)).toEqual([]);
 }
});
it('routes a numbered slide to exact evidence scoped to the current lesson',()=>{
 expect(planCourseEvidence({question:'Just explain slide 10.',history:[],lessonId:'lesson'})).toMatchObject({mode:'slide',slide:10,lessonIds:['lesson']});
 expect(planCourseEvidence({question:'Explain slide number 10',history:[]})).toMatchObject({mode:'slide',slide:10});
});
it('finds the whole numbered source section across chunk boundaries without adjacent slide text',()=>{
 const text='[Source section: ppt/slides/slide9.xml]\nEarlier topic\n[Source section: ppt/slides/slide10.xml]\n'+ 'Discharge equals area times velocity. '.repeat(25)+'\n[Source section: ppt/slides/slide11.xml]\nDifferent topic';
 const chunks=chunkCourseText(text,200,40).map((chunk,i)=>({...chunk,id:`c${i}`,analysis_id:'a'}));
 const selected=selectSlideEvidence(chunks,10);
 expect(selected).toHaveLength(1);
 expect(selected[0].content).toContain('Discharge equals area times velocity.');
 expect(selected[0].content).not.toContain('Earlier topic');expect(selected[0].content).not.toContain('Different topic');
 expect(selected[0].content.split('Discharge equals area times velocity.')).toHaveLength(26);
});
it('does not confuse slide 10 with slide 100, another slide, or an unlabeled passage',()=>{
 const chunks=[{id:'c',analysis_id:'a',chunk_index:0,source_location:{},content:'[Source section: ppt/slides/slide100.xml]\nRelated hydraulics'}];
 expect(selectSlideEvidence(chunks,10)).toEqual([]);
});

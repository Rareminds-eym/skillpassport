import { describe, expect, it } from 'vitest';
import { parseCollegeCourseRequest } from '../college-course-request';
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const payload = () => ({ departmentId:id,programId:id,semester:1,academicYear:'2026-27',courses:[{ code:'CS101',title:'Computing',credits:3,description:'',units:[{ code:'U1',name:'Algorithms',description:'',credits:1,duration:6,order:0,outcomes:[] }] }] });
describe('college course request boundary', () => {
  it('accepts a new unit and outcomes without requiring an existing curriculum', () => {
    expect(parseCollegeCourseRequest({ action:'propose-add',payload:{ courseId:id,programId:id,academicYear:'2026-27',entityType:'unit',name:'Algebra',code:'U1',outcomes:['Solve equations'] } }).action).toBe('propose-add');
  });
  it('rejects incomplete additions and spoofed ownership', () => {
    const value={ courseId:id,programId:id,academicYear:'2026-27',entityType:'unit',name:'Algebra' };
    expect(() => parseCollegeCourseRequest({ action:'propose-add',payload:value })).toThrow();
    expect(() => parseCollegeCourseRequest({ action:'propose-add',payload:{ ...value,code:'U1',actor:id } })).toThrow();
    expect(() => parseCollegeCourseRequest({ action:'propose-add',payload:{ courseId:id,programId:id,academicYear:'2026-27',entityType:'outcome',outcome_text:'Solve equations' } })).toThrow();
  });
  it('validates an import', () => { expect(parseCollegeCourseRequest({ action:'import',payload:payload() }).action).toBe('import'); });
  it('rejects actor spoofing', () => { expect(() => parseCollegeCourseRequest({ action:'courses',payload:{ actor:id } })).toThrow(); });
  it('rejects duplicate course codes in direct API calls', () => { const value=payload();value.courses.push(value.courses[0]);expect(() => parseCollegeCourseRequest({ action:'import',payload:value })).toThrow('Duplicate course codes'); });
  it('rejects unsupported permission values', () => { expect(() => parseCollegeCourseRequest({ action:'set-access',payload:{ mappingId:id,access:'admin' } })).toThrow(); });
  it('rejects entity mismatches and changes to protected columns', () => {
    expect(() => parseCollegeCourseRequest({ action:'propose',payload:{ curriculumId:id,entityType:'unit',entityId:id,changes:{ outcome_text:'Test' } } })).toThrow('Changes do not match entity');
    expect(() => parseCollegeCourseRequest({ action:'propose',payload:{ curriculumId:id,entityType:'unit',entityId:id,changes:{ name:'Test',description:'',curriculum_id:id } } })).toThrow();
  });
});

it('preserves structured faculty outcome details and rejects invalid weights', () => {
  const value = { courseId:id,programId:id,academicYear:'2026-2027',curriculumId:id,unitId:id,entityType:'outcome',outcome_text:'Solve equations',bloom_level:'Apply',assessment_mappings:[{assessmentType:'Quiz',weightage:25}] };
  expect(parseCollegeCourseRequest({action:'propose-add',payload:value})).toMatchObject({payload:value});
  expect(() => parseCollegeCourseRequest({action:'propose-add',payload:{...value,assessment_mappings:[{assessmentType:'Quiz',weightage:101}]}})).toThrow();
});

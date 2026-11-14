import { describe, expect, it } from 'vitest';
import { parseCurriculumRows } from '../curriculumWorkbook';
const workbook = () => ({
  Courses: [{ 'Course Code':'CS101','Course Name':'Computing',Credits:3,Description:'Fundamentals' }],
  Units: [{ 'Course Code':'CS101','Unit Code':'U1','Unit Name':'Algorithms',Description:'Learn algorithms',Credits:1,'Duration Hours':6 }],
  Outcomes: [{ 'Course Code':'CS101','Unit Code':'U1','Learning Outcome':'Explain algorithms','Bloom Level':'Understand','Assessment Type':'Quiz',Weightage:100 }],
});
describe('curriculum workbook validation', () => {
  it('connects units and outcomes by course and unit code', () => {
    expect(parseCurriculumRows(workbook())[0]).toMatchObject({ code:'CS101',title:'Computing',units:[{ name:'Algorithms',order:0,outcomes:[{ text:'Explain algorithms',assessments:[{ assessmentType:'Quiz',weightage:100 }] }] }] });
  });
  it('identifies the worksheet and row of invalid values', () => {
    const rows=workbook();rows.Units[0]['Duration Hours']=-1;
    expect(() => parseCurriculumRows(rows)).toThrow('Units, row 2: Duration Hours');
  });
  it('rejects duplicate course codes', () => { const rows=workbook();rows.Courses.push(rows.Courses[0]);expect(() => parseCurriculumRows(rows)).toThrow('duplicate course code'); });
  it('rejects duplicate units within a course', () => { const rows=workbook();rows.Units.push(rows.Units[0]);expect(() => parseCurriculumRows(rows)).toThrow('duplicate unit code'); });
  it('rejects outcomes referring to a different course or unit', () => { const rows=workbook();rows.Outcomes[0]['Unit Code']='missing';expect(() => parseCurriculumRows(rows)).toThrow('unknown course/unit'); });
  it('rejects missing sheets and courses without units', () => {
    expect(() => parseCurriculumRows({})).toThrow('Missing worksheet: Courses');
    const rows=workbook();rows.Units=[];rows.Outcomes=[];expect(() => parseCurriculumRows(rows)).toThrow('include between 1 and 100 units');
  });
  it('accepts a workbook without outcomes', () => { const rows=workbook();rows.Outcomes=[];expect(parseCurriculumRows(rows)[0].units[0].outcomes).toEqual([]); });
  it('limits workbook rows before parsing', () => { const rows=workbook();rows.Units=Array(2001).fill(rows.Units[0]);expect(() => parseCurriculumRows(rows)).toThrow('at most 2000 rows'); });
});

import { z } from 'zod';
import type { ImportCourse, ImportUnit } from '../model/types';

export const WORKBOOK_LIMIT_BYTES = 5 * 1024 * 1024;
export const WORKBOOK_MAX_ROWS = 2000;
const text = z.string().trim().min(1);
const optionalText = z.string().max(10000).optional().default('');
const number = z.coerce.number().min(0).max(99);
const courseSchema = z.object({ 'Course Code': text.max(20), 'Course Name': text.max(255), Credits: number.positive().multipleOf(0.1), Description: optionalText });
const unitSchema = z.object({ 'Course Code': text.max(20), 'Unit Code': text.max(50), 'Unit Name': text.max(255), Description: optionalText, Credits: number, 'Duration Hours': z.coerce.number().int().min(0).max(10000) });
const outcomeSchema = z.object({ 'Course Code': text.max(20), 'Unit Code': text.max(50), 'Learning Outcome': text.max(10000), 'Bloom Level': z.string().max(20).optional(), 'Assessment Type': z.string().max(100).optional(), Weightage: z.union([z.literal(''),z.coerce.number().min(0).max(100)]).optional() });
export type WorkbookRows = Record<string, Record<string,unknown>[]>;

export function parseCurriculumRows(sheets: WorkbookRows): ImportCourse[] {
  for (const name of ['Courses','Units','Outcomes']) if (!Array.isArray(sheets[name])) throw new Error(`Missing worksheet: ${name}`);
  if (Object.values(sheets).reduce((sum,rows) => sum+rows.length,0)>WORKBOOK_MAX_ROWS) throw new Error(`Use at most ${WORKBOOK_MAX_ROWS} rows per workbook.`);
  const courses = new Map<string,ImportCourse>();
  const units = new Map<string,ImportUnit>();
  const parse = <T extends z.ZodTypeAny>(schema: T, row: Record<string,unknown>, sheet: string, index: number): z.output<T> => {
    const result = schema.safeParse(row);
    if (!result.success) throw new Error(`${sheet}, row ${index+2}: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    return result.data;
  };
  sheets.Courses.forEach((row,i) => {
    const value = parse(courseSchema,row,'Courses',i);
    const code = value['Course Code'];
    if (courses.has(code)) throw new Error(`Courses, row ${i+2}: duplicate course code ${code}`);
    courses.set(code,{ code,title: value['Course Name'],credits: value.Credits,description: value.Description,units: [] });
  });
  if (!courses.size || courses.size>100) throw new Error('Include between 1 and 100 courses.');
  sheets.Units.forEach((row,i) => {
    const value = parse(unitSchema,row,'Units',i);
    const course = courses.get(value['Course Code']);
    if (!course) throw new Error(`Units, row ${i+2}: unknown course ${value['Course Code']}`);
    const key = JSON.stringify([value['Course Code'],value['Unit Code']]);
    if (units.has(key)) throw new Error(`Units, row ${i+2}: duplicate unit code ${value['Unit Code']}`);
    const unit: ImportUnit = { code: value['Unit Code'],name: value['Unit Name'],description: value.Description,credits: value.Credits,duration: value['Duration Hours'],order: course.units.length,outcomes: [] };
    units.set(key,unit); course.units.push(unit);
  });
  sheets.Outcomes.forEach((row,i) => {
    const value = parse(outcomeSchema,row,'Outcomes',i);
    const unit = units.get(JSON.stringify([value['Course Code'],value['Unit Code']]));
    if (!unit) throw new Error(`Outcomes, row ${i+2}: unknown course/unit combination`);
    unit.outcomes.push({ text: value['Learning Outcome'],bloomLevel: value['Bloom Level'],assessments: value['Assessment Type'] ? [{ assessmentType: value['Assessment Type'],...(typeof value.Weightage === 'number' ? { weightage: value.Weightage } : {}) }] : [] });
  });
  for (const course of courses.values()) {
    if (!course.units.length || course.units.length>100) throw new Error(`${course.code}: include between 1 and 100 units.`);
    if (course.units.some(u => u.outcomes.length>100)) throw new Error(`${course.code}: use at most 100 outcomes per unit.`);
  }
  return [...courses.values()];
}

export async function readCurriculumWorkbook(file: File): Promise<ImportCourse[]> {
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Choose an .xlsx workbook downloaded from this template.');
  if (file.size>WORKBOOK_LIMIT_BYTES) throw new Error('Workbook must be 5 MB or smaller.');
  const XLSX = await import('xlsx');
  const book = XLSX.read(await file.arrayBuffer(),{ type: 'array',sheetRows: WORKBOOK_MAX_ROWS+2 });
  const rows: WorkbookRows = {};
  for (const name of ['Courses','Units','Outcomes']) {
    if (!book.Sheets[name]) throw new Error(`Missing worksheet: ${name}`);
    rows[name] = XLSX.utils.sheet_to_json(book.Sheets[name],{ defval: '' });
  }
  return parseCurriculumRows(rows);
}

export async function downloadCurriculumTemplate() {
  const XLSX = await import('xlsx');
  const book = XLSX.utils.book_new();
  const sheets = {
    Instructions: [ ['Select department, program, semester and academic year in the builder before importing.'],['Replace the sample data. Keep the sheet names and column headers.'],['Use a unique Course Code in Courses and a unique Unit Code within each course.'],['Import creates draft curricula and core course mappings. Assign faculty in Course Mapping.'],['Existing curricula are never overwritten. A conflict cancels the entire import.'],['Limit: 5 MB, 100 courses and 2000 rows. Outcomes may be empty.'] ],
    Courses: [['Course Code','Course Name','Credits','Description'],['CS101','Introduction to Computing',3,'Computing fundamentals']],
    Units: [['Course Code','Unit Code','Unit Name','Description','Credits','Duration Hours'],['CS101','U1','Fundamentals','Introduction to algorithms',1,6]],
    Outcomes: [['Course Code','Unit Code','Learning Outcome','Bloom Level','Assessment Type','Weightage'],['CS101','U1','Explain basic algorithms','Understand','Quiz',100]],
  };
  for (const [name,rows] of Object.entries(sheets)) XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(rows),name);
  XLSX.writeFile(book,'college-curriculum-template.xlsx');
}

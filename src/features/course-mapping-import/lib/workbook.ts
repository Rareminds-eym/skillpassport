import { z } from 'zod';

export const headers = ['Course Code', 'Course Name', 'Credits', 'Offering Type', 'Faculty Email', 'Capacity'];
const optionalNumber = z.preprocess(value => value === '' || value == null ? undefined : value, z.coerce.number().int().positive().max(100000).optional());
const schema = z.object({
  'Course Code': z.string().trim().min(1).max(20),
  'Course Name': z.string().trim().min(1).max(255),
  Credits: z.coerce.number().positive().max(99),
  'Offering Type': z.enum(['core', 'dept_elective', 'open_elective']),
  'Faculty Email': z.union([z.literal(''), z.string().trim().email()]),
  Capacity: optionalNumber,
}).superRefine((row, ctx) => {
  if (row['Offering Type'] !== 'core' && !row.Capacity) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['Capacity'], message: 'Capacity is required for electives' });
  if (row['Offering Type'] === 'core' && row.Capacity) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['Capacity'], message: 'Leave capacity blank for core courses' });
});
export type MappingRow = z.infer<typeof schema>;

export function parseMappingRows(rows: Record<string, unknown>[]): MappingRow[] {
  if (!rows.length || rows.length > 100) throw new Error('Upload between 1 and 100 course rows.');
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const result = schema.safeParse(row);
    if (!result.success) throw new Error(`Row ${index + 2}: ${result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
    const code = result.data['Course Code'].toLowerCase();
    if (seen.has(code)) throw new Error(`Row ${index + 2}: duplicate course code ${result.data['Course Code']}`);
    seen.add(code);
    return result.data;
  });
}

export async function readMappingWorkbook(file: File) {
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Choose an .xlsx file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('The workbook must be smaller than 5 MB.');
  const XLSX = await import('xlsx');
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  if (!book.Sheets.Mappings) throw new Error('Keep the Mappings sheet from the template.');
  return parseMappingRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets.Mappings, { defval: '' }));
}

export async function downloadMappingTemplate() {
  const XLSX = await import('xlsx');
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
    ['Fill the Mappings sheet. Keep the headers. Maximum 100 courses and 5 MB.'],
    ['Mappings are added to the department, program and semester selected on the page.'],
    ['Offering Type: core, dept_elective, or open_elective. Electives require a positive Capacity.'],
    ['Faculty Email is optional. Use the email of a faculty member in the selected department.'],
    ['Existing course codes use the catalog course; name and credits are not overwritten.'],
    ['New course codes create catalog courses. Existing mappings are rejected.'],
    ['Replace the example row before uploading. Successful rows are saved individually.'],
  ]), 'Instructions');
  const sheet = XLSX.utils.aoa_to_sheet([headers, ['CS101', 'Introduction to Computing', 3, 'core', '', '']]);
  sheet['!cols'] = headers.map(() => ({ wch: 28 }));
  XLSX.utils.book_append_sheet(book, sheet, 'Mappings');
  XLSX.writeFile(book, 'course-mapping-template.xlsx');
}

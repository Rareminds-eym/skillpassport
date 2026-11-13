import { describe, expect, it } from 'vitest';
import { parseMappingRows } from './workbook';

const core = { 'Course Code': 'CS101', 'Course Name': 'Computing', Credits: 3, 'Offering Type': 'core', 'Faculty Email': '', Capacity: '' };
describe('course mapping workbook validation', () => {
  it('accepts core courses without faculty or capacity', () => {
    expect(parseMappingRows([core])[0].Capacity).toBeUndefined();
  });
  it('rejects duplicate codes regardless of case', () => {
    expect(() => parseMappingRows([core, { ...core, 'Course Code': 'cs101' }])).toThrow('Row 3: duplicate');
  });
  it('requires positive elective capacity and a valid optional faculty email', () => {
    expect(() => parseMappingRows([{ ...core, 'Offering Type': 'dept_elective' }])).toThrow('Capacity');
    expect(() => parseMappingRows([{ ...core, 'Faculty Email': 'unknown' }])).toThrow('Faculty Email');
    expect(parseMappingRows([{ ...core, 'Offering Type': 'open_elective', Capacity: '30' }])[0].Capacity).toBe(30);
  });
  it('rejects empty workbooks, invalid types, credits, and core capacity', () => {
    expect(() => parseMappingRows([])).toThrow('1 and 100');
    expect(() => parseMappingRows([{ ...core, 'Offering Type': 'invalid' }])).toThrow('Offering Type');
    expect(() => parseMappingRows([{ ...core, Credits: 0 }])).toThrow('Credits');
    expect(() => parseMappingRows([{ ...core, Capacity: 30 }])).toThrow('Leave capacity blank');
  });
});

import { describe, expect, it } from 'vitest';
import { getMissingInstitutionFields } from '../institutionDetails';

describe('missing institution fields', () => {
  it('identifies college fields without requiring a grade', () => {
    expect(getMissingInstitutionFields({ learner_type: ' College ' }))
      .toEqual(['College name', 'Program / course name']);
  });

  it('only lists the missing program for a named college', () => {
    expect(getMissingInstitutionFields({ learner_type: 'College', college_school_name: 'SEA College' }))
      .toEqual(['Program / course name']);
  });

  it('only lists the missing college when the program is filled', () => {
    expect(getMissingInstitutionFields({ learner_type: 'college', branch_field: 'Computer Science' }))
      .toEqual(['College name']);
  });

  it.each(['college_id', 'collegeId', 'university_college_id', 'universityCollegeId'])(
    'accepts the institution ID alias %s', (field) => {
      expect(getMissingInstitutionFields({ [field]: 'college-id', program_id: 'program-id' })).toEqual([]);
    });

  it('asks school learners only for their missing school', () => {
    expect(getMissingInstitutionFields({ learner_type: 'school' })).toEqual(['School name']);
    expect(getMissingInstitutionFields({ learner_type: 'school', school_id: 'school-id' })).toEqual([]);
    expect(getMissingInstitutionFields({ learner_type: 'school', college: 'Custom School' })).toEqual([]);
  });

  it('accepts custom college and program names without optional semester or section', () => {
    expect(getMissingInstitutionFields({ learner_type: 'college', college: 'Custom College', branch: 'BSc' })).toEqual([]);
  });

  it('treats whitespace as missing', () => {
    expect(getMissingInstitutionFields({ learner_type: 'college', college_school_name: ' ', branch_field: '\t' }))
      .toEqual(['College name', 'Program / course name']);
  });

  it('does not invent institution requirements for independent or loading learners', () => {
    expect(getMissingInstitutionFields({ learner_type: 'professional' })).toEqual([]);
    expect(getMissingInstitutionFields(null)).toEqual([]);
    expect(getMissingInstitutionFields(undefined)).toEqual([]);
  });
});

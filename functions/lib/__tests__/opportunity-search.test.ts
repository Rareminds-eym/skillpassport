import { describe, expect, it } from 'vitest';
import {
  opportunitySearchPredicate,
  parseSalaryBound,
  skillsPredicate,
  workModeVariants,
} from '../opportunity-search';

describe('opportunity search predicates', () => {
  it('includes location and safely quotes grammar punctuation and wildcard characters', () => {
    const result = opportunitySearchPredicate('Delhi, (North) "100%"');
    expect(result).toContain('location.ilike.');
    expect(result).toContain('job_title.ilike.');
    expect(result).toContain(JSON.stringify('%Delhi, (North) "100\\%"%'));
  });
  it('matches legacy on-site variants and preserves remote filtering', () => {
    expect(workModeVariants('On-site')).toEqual(
      expect.arrayContaining(['on-site', 'On-site', 'Onsite']),
    );
    expect(workModeVariants('Remote')).not.toContain('on-site');
  });
  it('uses any-selected JSONB membership, including case variants', () => {
    expect(skillsPredicate(['React', 'SQL'])).toContain(
      'skills_required.cs.["React"]',
    );
    expect(skillsPredicate(['React', 'SQL'])).toContain(
      'skills_required.cs.["sql"]',
    );
  });
  it.each(['-1', '1.5', '1e3', '100garbage', '9007199254740992'])(
    'rejects invalid salary %s',
    (value) => expect(() => parseSalaryBound(value)).toThrow(),
  );
  it('distinguishes zero from an unset salary', () => {
    expect(parseSalaryBound('0')).toBe(0);
    expect(parseSalaryBound(null)).toBeUndefined();
  });
});

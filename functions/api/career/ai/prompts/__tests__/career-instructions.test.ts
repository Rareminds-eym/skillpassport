import { describe, expect, it } from 'vitest';
import { buildCareerInstructions } from '../career-instructions';
import { getGradeConfig } from '../grade-levels';
import type { GradeLevel } from '../grade-levels/types';

describe('Career policy separated from private facts', () => {
  it.each<GradeLevel>(['middle', 'highschool', 'after10', 'higher_secondary', 'after12', 'college'])('preserves %s grade constraints and subject policy', gradeLevel => {
    const config = getGradeConfig(gradeLevel);
    const prompt = buildCareerInstructions({ gradeLevel, phase: 'opening', intent: 'career-guidance' });
    expect(prompt.length).toBeLessThanOrEqual(12000);
    expect(prompt).toContain('</career_instructions>');
    expect(prompt).toContain(config.role);
    for (const constraint of config.constraints) expect(prompt).toContain(constraint);
    expect(prompt).toContain(config.subjectGuidance.recommendations);
    for (const guardrail of config.guardrails) expect(prompt).toContain(guardrail.rule);
    expect(prompt).not.toContain('<opportunities count=');
    expect(prompt).not.toContain('<learner_skills>');
  });
  it('distinguishes missing evidence from an empty database and keeps follow-up continuity', () => {
    const prompt = buildCareerInstructions({ gradeLevel: 'college', phase: 'follow_up', intent: 'find-jobs' });
    expect(prompt).toContain('not proof that the database is empty');
    expect(prompt).toContain('opportunities.recommended');
    expect(prompt).toContain('without repeating the greeting');
    expect(prompt).toContain('Do not show match percentages');
    expect(prompt).toContain('never as verified private evidence');
  });
});

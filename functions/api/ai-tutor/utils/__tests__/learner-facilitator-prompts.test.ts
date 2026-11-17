import { describe, expect, it } from 'vitest';
import { buildLearnerFacilitatorPrompt, LEARNER_FACILITATOR_PROMPTS } from '../learner-facilitator-prompts';
describe('learner facilitator prompts', () => {
  it.each(Object.keys(LEARNER_FACILITATOR_PROMPTS) as (keyof typeof LEARNER_FACILITATOR_PROMPTS)[])('separates %s from educator instructions', role => {
    const prompt = buildLearnerFacilitatorPrompt(role, 'Authorized course evidence');
    expect(prompt).toContain(LEARNER_FACILITATOR_PROMPTS[role]);
    expect(prompt).toContain('Authorized course evidence');
    expect(prompt).toContain('protected answer keys');
    expect(prompt).toContain('Saved results are not automatically loaded');
    expect(prompt).not.toContain('for educators.');
  });
});
